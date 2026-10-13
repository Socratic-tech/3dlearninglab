/**
 * 3D Design Academy — usage receiver (for the program owner only).
 *
 * Teacher copies send one small report a day: numbers only (classes, students, active this week, missions done,
 * which courses). No names, emails, answers or work. Each copy is a random ID.
 *
 * Setup (once):
 *  1. Make a new Google Sheet in your Drive, e.g. "3DA usage". Extensions → Apps Script. Paste this whole file as Code.gs.
 *  2. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone. Deploy, allow access.
 *  3. Copy the web app URL (ends in /exec) into apps-script/build.config.json → "usageUrl", then commit and push.
 * The Copies tab shows the latest numbers per copy; Daily keeps one line per copy per day for trends.
 * Only OWNER, signed in on the website's Tools page, can read the totals.
 */
const OWNER = "john.phillips@berrienresa.org";
const CLIENT_ID = "101963930275-47ppq2h1b2ad1lipviqjrjrfhd67sjvp.apps.googleusercontent.com";
const COPY_COLS = ["copyId", "firstSeen", "lastSeen", "version", "classes", "students", "activeWeek", "missionsWeek", "missionsTotal", "courses"];
const DAILY_COLS = ["date", "copyId", "classes", "students", "activeWeek", "missionsWeek", "missionsTotal"];

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: "Bad request." }); }
  if (req && req.action === "report") return out_(report_(req.data));
  if (req && req.action === "summary") return out_(summary_(req.token));
  return out_({ ok: false, error: "Unknown request." });
}
function doGet() { return out_({ ok: true, service: "3DA usage receiver" }); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function sheet_(name, cols) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sh = book.getSheetByName(name);
  if (!sh) {
    sh = book.insertSheet(name);
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}
const num_ = function (v) { return Math.max(0, Math.min(100000, Math.floor(Number(v) || 0))); };

function report_(d) {
  if (!d || typeof d.copyId !== "string" || !/^[a-f0-9-]{8,40}$/i.test(d.copyId)) return { ok: false };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false };
  try {
    const sh = sheet_("Copies", COPY_COLS);
    const last = sh.getLastRow();
    const ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
    const i = ids.indexOf(d.copyId);
    if (i < 0 && ids.length >= 5000) return { ok: false };
    const now = new Date().toISOString();
    const courses = {};
    Object.keys(d.courses || {}).slice(0, 20).forEach(function (k) { courses[String(k).slice(0, 40)] = num_(d.courses[k]); });
    const row = [d.copyId, i >= 0 ? sh.getRange(i + 2, 2).getValue() : now, now, String(d.version || "").slice(0, 40), num_(d.classes), num_(d.students), num_(d.activeWeek), num_(d.missionsWeek), num_(d.missionsTotal), JSON.stringify(courses)];
    if (i >= 0) sh.getRange(i + 2, 1, 1, COPY_COLS.length).setValues([row]);
    else sh.appendRow(row);
    sheet_("Daily", DAILY_COLS).appendRow([now.slice(0, 10), d.copyId, row[4], row[5], row[6], row[7], row[8]]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function summary_(token) {
  const res = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(String(token || "")), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return { ok: false, error: "Your sign-in expired. Reload the page." };
  const c = JSON.parse(res.getContentText());
  if (c.aud !== CLIENT_ID || String(c.email_verified) !== "true" || String(c.email).toLowerCase() !== OWNER) return { ok: false, error: "Only the program owner can see usage." };
  const iso = function (v) { return v instanceof Date ? v.toISOString() : String(v || ""); };
  const read = function (name, cols) { const sh = sheet_(name, cols); const last = sh.getLastRow(); return last > 1 ? sh.getRange(2, 1, last - 1, cols.length).getValues() : []; };
  const copies = read("Copies", COPY_COLS).map(function (r) {
    let courses = {};
    try { courses = JSON.parse(String(r[9] || "{}")); } catch (e) { courses = {}; }
    return { copyId: String(r[0]).slice(0, 8), firstSeen: iso(r[1]), lastSeen: iso(r[2]), version: String(r[3]), classes: Number(r[4]) || 0, students: Number(r[5]) || 0, activeWeek: Number(r[6]) || 0, missionsWeek: Number(r[7]) || 0, missionsTotal: Number(r[8]) || 0, courses: courses };
  });
  // weekly totals for the last 12 weeks: each copy's latest report in each week, summed
  const weeks = {};
  read("Daily", DAILY_COLS).forEach(function (r) {
    const day = new Date(iso(r[0]).slice(0, 10) + "T12:00:00Z");
    if (isNaN(day.getTime())) return;
    const monday = new Date(day.getTime() - ((day.getUTCDay() + 6) % 7) * 86400000).toISOString().slice(0, 10);
    (weeks[monday] = weeks[monday] || {})[String(r[1])] = { activeWeek: Number(r[4]) || 0, missionsWeek: Number(r[5]) || 0 };
  });
  const trend = Object.keys(weeks).sort().slice(-12).map(function (w) {
    const per = weeks[w];
    return { week: w, copies: Object.keys(per).length, active: Object.keys(per).reduce(function (n, k) { return n + per[k].activeWeek; }, 0), missions: Object.keys(per).reduce(function (n, k) { return n + per[k].missionsWeek; }, 0) };
  });
  return { ok: true, data: { copies: copies, trend: trend, at: new Date().toISOString() } };
}
