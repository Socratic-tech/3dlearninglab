/**
 * 3D Design Academy — Google Apps Script API (Pages edition).
 *
 * The interface lives on GitHub Pages. This script is the only thing that touches student data:
 * it verifies the caller's Google ID token, checks their role, and reads/writes the bound Google Sheet
 * (and Drive for uploads). Students never get access to the Sheet itself.
 *
 * One workbook per TEACHER: all of a teacher's classes live in it (Classes + Enrollments tabs).
 * Deploy: Extensions → Apps Script in the teacher's Sheet, paste dist/*.js + appsscript.json (or use clasp),
 * run setup() once, then Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 * ("Anyone" is required so the Pages site can call it; every request is still authenticated by Google ID token.)
 *
 * Globals provided by the other files: Lib (scoring/mastery, bundled from src/lib), CONTENT (answer keys etc.).
 */

const API_VERSION = "1";
// Filled in by scripts/build-pages.ts: the public site, its Google sign-in client ID, and this script's version.
const BUILD = { version: "dev", site: "", clientId: "" }; // @build

const TABLES = {
  Config: ["key", "value", "notes"],
  Classes: ["classId", "name", "section", "pathId", "tinkercadUrl", "unlockAll", "googleCourseId", "status", "createdAt"],
  Users: ["email", "name", "role", "sub", "status", "createdAt", "lastSeen"],
  Enrollments: ["email", "classId", "status", "source", "createdAt"],
  Progress: ["email", "lessonId", "status", "blockState", "startedAt", "completedAt", "updatedAt"],
  Attempts: ["at", "email", "lessonId", "blockId", "competencyId", "correct", "misconceptionId", "response"],
  Levels: ["email", "competencyId", "computed", "override", "overrideAt", "overrideBy", "overrideComment", "updatedAt"],
  History: ["at", "email", "competencyId", "from", "to", "reason", "actor"],
  Evidence: ["id", "email", "lessonId", "blockId", "competencyIds", "type", "url", "fileId", "fileName", "text", "status", "rating", "comment", "reviewedBy", "reviewedAt", "createdAt"],
  Journals: ["email", "projectKey", "entries", "updatedAt"],
  Summary: ["email", "xp", "days", "seen", "byLesson", "updatedAt"],
  Prints: ["id", "email", "classId", "lessonId", "evidenceId", "fileId", "fileName", "status", "note", "teacherNote", "createdAt", "updatedAt"],
};

const DEFAULT_CONFIG = [
  ["CLIENT_ID", "", "Leave blank to use the website's built-in sign-in ID. Only fill in if you run your own copy of the site."],
  ["ALLOWED_DOMAINS", "", "Comma-separated email domains allowed to sign in, e.g. district.org,students.district.org"],
  ["TEACHER_EMAILS", "", "Comma-separated teacher emails (the script owner is always a teacher)."],
  ["ADMIN_EMAILS", "", "Administrators (principal, district or RESA staff): open every lesson and every class dashboard. Comma-separated."],
  ["AUTO_ENROLL", "FALSE", "TRUE = an allowed-domain student who opens a class link joins that class on first sign-in. FALSE = only students on a class roster."],
  ["MAX_UPLOAD_MB", "10", "Largest screenshot/STL a student may upload."],
];

// ───────────────────────── HTTP ─────────────────────────

function doGet() {
  return json_({ ok: true, data: { name: "3D Design Academy API", version: API_VERSION } });
}

function doPost(e) {
  let req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: "Bad request." });
  }
  return json_(handle_(req));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// The site sends `lang` with every request; student-facing messages come back in that language.
var REQ_LANG_ = "en";
const ES_ERRORS = {
  "Ask your teacher to add you to TEACHER_EMAILS.": "Pídele a tu maestro o maestra que te agregue a TEACHER_EMAILS.",
  "Choose a file to upload.": "Elige un archivo para subir.",
  "Choose one of your uploaded STL files.": "Elige uno de los archivos STL que subiste.",
  "Describe your test result or add a photo.": "Describe el resultado de tu prueba o agrega una foto.",
  "Lots of people are saving at once. Please try again in a moment.": "Mucha gente está guardando a la vez. Vuelve a intentarlo en un momento.",
  "Paste the whole link, starting with https://": "Pega el enlace completo, empezando con https://",
  "Please sign in with your school Google account.": "Inicia sesión con tu cuenta de Google de la escuela.",
  "Please sign in.": "Inicia sesión.",
  "That activity doesn't take answers.": "Esa actividad no acepta respuestas.",
  "That activity doesn't take submissions.": "Esa actividad no acepta entregas.",
  "That answer couldn't be read. Try again.": "No pudimos leer esa respuesta. Inténtalo de nuevo.",
  "That file is empty.": "Ese archivo está vacío.",
  "That image file looks damaged. Try taking the screenshot again.": "Esa imagen parece dañada. Vuelve a tomar la captura de pantalla.",
  "That isn't a reflection.": "Eso no es una reflexión.",
  "That mission doesn't exist.": "Esa misión no existe.",
  "This activity doesn't accept that kind of submission.": "Esta actividad no acepta ese tipo de entrega.",
  "This class isn't set up for this website yet (CLIENT_ID).": "Esta clase todavía no está conectada con este sitio web (CLIENT_ID).",
  "Unknown journal entry.": "Entrada de diario desconocida.",
  "Unknown request.": "Solicitud desconocida.",
  "You don't have access to that.": "No tienes acceso a eso.",
  "You're not in an active class.": "No estás en una clase activa.",
  "You're not on this class roster yet. Ask your teacher to add you.": "Todavía no estás en la lista de esta clase. Pídele a tu maestro o maestra que te agregue.",
  "Your Google account needs a verified email.": "Tu cuenta de Google necesita un correo verificado.",
  "Your account is no longer active in these classes.": "Tu cuenta ya no está activa en estas clases.",
  "Your sign-in expired. Please sign in again.": "Tu sesión expiró. Vuelve a iniciar sesión.",
  "Something went wrong. Your work is safe — please try again.": "Algo salió mal. Tu trabajo está a salvo: inténtalo de nuevo.",
};
const ES_ERROR_PATTERNS = [
  [/^Write at least (\d+) words — you have (\d+)\.$/, "Escribe al menos $1 palabras; tienes $2."],
  [/^Almost there — 1 required activity is still open\.$/, "¡Ya casi! Te falta 1 actividad obligatoria."],
  [/^Almost there — (\d+) required activities are still open\.$/, "¡Ya casi! Te faltan $1 actividades obligatorias."],
  [/^That file is larger than (\d+) MB\.$/, "Ese archivo pesa más de $1 MB."],
  [/^That file type isn't allowed here\. Use (.*)\.$/, "Ese tipo de archivo no se permite aquí. Usa $1."],
];
function localizeMessage_(message) {
  if (REQ_LANG_ !== "es") return message;
  if (ES_ERRORS[message]) return ES_ERRORS[message];
  for (let i = 0; i < ES_ERROR_PATTERNS.length; i++) if (ES_ERROR_PATTERNS[i][0].test(message)) return message.replace(ES_ERROR_PATTERNS[i][0], ES_ERROR_PATTERNS[i][1]);
  return message;
}

function userError_(message) {
  const e = new Error(message);
  e.userMessage = localizeMessage_(message);
  return e;
}

function handle_(req) {
  MEMO_ = {};
  LOCK_MEMO_ = {};
  STUDENT_HELD_ = {};
  REQ_LANG_ = req && req.args && req.args.lang === "es" ? "es" : "en";
  try {
    const action = ACTIONS[req && req.action];
    if (!action) throw userError_("Unknown request.");
    ensureClasses_();
    const user = authenticate_(req.token, (req.args || {}).classId);
    if (action.role === "teacher" && user.role !== "teacher") throw userError_("You don't have access to that.");
    // Retries from the site reuse the same requestId: return the first answer instead of doing the work twice.
    const cache = CacheService.getScriptCache();
    const rid = typeof req.requestId === "string" && /^[\w-]{8,64}$/.test(req.requestId) ? "rid_" + user.email + "_" + req.requestId : null;
    if (rid) {
      const prior = cache.get(rid);
      if (prior) return JSON.parse(prior);
    }
    const out = { ok: true, data: action.run(user, req.args || {}) };
    if (rid) {
      const json = JSON.stringify(out);
      if (json.length < 90000) cache.put(rid, json, 600);
    }
    return out;
  } catch (err) {
    if (err && err.userMessage) return { ok: false, error: err.userMessage };
    console.error(err && err.stack ? err.stack : err);
    return { ok: false, error: localizeMessage_("Something went wrong. Your work is safe — please try again."), details: String((err && err.message) || err).slice(0, 300) };
  }
}

// ───────────────────────── Auth ─────────────────────────

/** Verifies a Google ID token (from Sign in with Google on the Pages site) and resolves the user. */
function authenticate_(token, classId) {
  if (!token || typeof token !== "string") throw userError_("Please sign in.");
  const cfg = config_();
  const cache = CacheService.getScriptCache();
  const key = "tok_" + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  let claims = null;
  const hit = cache.get(key);
  if (hit) claims = JSON.parse(hit);
  else {
    const res = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw userError_("Your sign-in expired. Please sign in again.");
    claims = JSON.parse(res.getContentText());
    cache.put(key, JSON.stringify(claims), 600);
  }
  const clientId = String(cfg.CLIENT_ID || BUILD.clientId || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!clientId || claims.aud !== clientId) throw userError_("This class isn't set up for this website yet (CLIENT_ID).");
  if (Number(claims.exp) * 1000 < Date.now()) throw userError_("Your sign-in expired. Please sign in again.");
  if (String(claims.email_verified) !== "true") throw userError_("Your Google account needs a verified email.");
  const email = String(claims.email).toLowerCase();
  const domain = email.split("@")[1];
  const allowed = list_(cfg.ALLOWED_DOMAINS);
  // Teachers and admins are "staff": every lesson is open to them, at any time, and they see class dashboards.
  const admins = list_(cfg.ADMIN_EMAILS);
  const teachers = list_(cfg.TEACHER_EMAILS).concat([String(Session.getEffectiveUser().getEmail()).toLowerCase()], admins);
  if (allowed.length && allowed.indexOf(domain) < 0 && teachers.indexOf(email) < 0) throw userError_("Please sign in with your school Google account.");

  if (teachers.indexOf(email) >= 0) return { email: email, name: claims.name || email, role: "teacher", admin: admins.indexOf(email) >= 0, sub: claims.sub };

  const users = table_("Users");
  let row = users.find(function (r) { return r.email === email; });
  const enrolled = row ? activeEnrollments_(email) : [];
  const linkClass = classId ? classById_(classId) : null;
  const autoEnroll = String(cfg.AUTO_ENROLL).toUpperCase() === "TRUE";
  const inLinkClass = linkClass && enrolled.some(function (e) { return e.classId === linkClass.classId; });
  if (!row || !enrolled.length || (autoEnroll && linkClass && !inLinkClass)) {
    // Joining through a class link is allowed only when AUTO_ENROLL is on and the class exists.
    const cls = linkClass;
    if (!autoEnroll || !cls) {
      if (row && enrolled.length) return { email: email, name: row.name || claims.name || email, role: "student", sub: claims.sub };
      throw userError_("You're not on this class roster yet. Ask your teacher to add you.");
    }
    withLock_(function () {
      if (!row) row = users.upsert(function (r) { return r.email === email; }, { email: email, name: claims.name || email, role: "student", sub: claims.sub, status: "active", createdAt: now_(), lastSeen: now_() });
      enroll_(email, cls.classId, "link");
    });
  }
  if (row.status === "archived") throw userError_("Your account is no longer active in these classes.");
  if (row.role !== "student") throw userError_("Ask your teacher to add you to TEACHER_EMAILS.");
  return { email: email, name: row.name || claims.name || email, role: "student", sub: claims.sub };
}

// ───────────────────────── Classes ─────────────────────────

function classById_(classId) {
  return table_("Classes").find(function (c) { return c.classId === classId && c.status !== "archived"; });
}

function activeClasses_() {
  return table_("Classes").filter(function (c) { return c.status !== "archived"; });
}

function activeEnrollments_(email) {
  const live = {};
  activeClasses_().forEach(function (c) { live[c.classId] = true; });
  return table_("Enrollments").filter(function (e) { return e.email === email && e.status !== "archived" && live[e.classId]; });
}

/** Call inside withLock_. Idempotent. */
function enroll_(email, classId, source) {
  table_("Enrollments").upsert(function (e) { return e.email === email && e.classId === classId; }, { email: email, classId: classId, status: "active", source: source || "manual", createdAt: now_() });
}

function classOut_(c) {
  return {
    id: c.classId, name: c.name, section: c.section || "", pathId: c.pathId === "9-week" ? "9-week" : "18-week",
    tinkercadUrl: c.tinkercadUrl || null, unlockAll: String(c.unlockAll).toUpperCase() === "TRUE", googleCourseId: c.googleCourseId || null,
  };
}

/** The class a request is about: the requested one if the user may see it, otherwise their first. */
function classFor_(user, classId) {
  if (user.role === "teacher") {
    const all = activeClasses_();
    const c = all.filter(function (x) { return x.classId === classId; })[0] || all[0];
    if (!c) throw userError_("Create your first class to get started.");
    return c;
  }
  const mine = activeEnrollments_(user.email).map(function (e) { return e.classId; });
  const id = mine.indexOf(classId) >= 0 ? classId : mine[0];
  const c = id ? classById_(id) : null;
  if (!c) throw userError_("You're not in an active class.");
  return c;
}

/**
 * Upgrades a single-class workbook (Config CLASS_NAME/PATH_ID/...) to the multi-class layout once:
 * creates one class from those values and enrolls every existing student in it.
 */
function ensureClasses_() {
  const sh = sheet_("Classes");
  if (sh.getLastRow() > 1) return;
  const legacy = config_();
  if (!legacy.CLASS_NAME && !table_("Users").rows.length) return;
  withLock_(function () {
    if (sheet_("Classes").getLastRow() > 1) return;
    const id = "c" + Utilities.getUuid().slice(0, 8);
    table_("Classes").append({ classId: id, name: legacy.CLASS_NAME || "3D Design", section: "", pathId: legacy.PATH_ID || "18-week", tinkercadUrl: legacy.TINKERCAD_URL || "", unlockAll: legacy.UNLOCK_ALL || "FALSE", status: "active", createdAt: now_() });
    table_("Users").filter(function (u) { return u.role === "student"; }).forEach(function (u) { enroll_(u.email, id, "migrated"); });
  });
}

// ───────────────────────── Sheets as tables ─────────────────────────

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SHEET_ID"));
}

function sheet_(name) {
  const book = ss_();
  let sh = book.getSheetByName(name);
  if (!sh) {
    sh = book.insertSheet(name);
    sh.getRange(1, 1, 1, TABLES[name].length).setValues([TABLES[name]]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

// Each request reads a tab at most once (MEMO_). Inside a lock the first read of a tab is fresh and then reused
// (LOCK_MEMO_), so one save reads Progress/Summary/Levels once each instead of several times.
var MEMO_ = {};
var LOCK_MEMO_ = {};
var FRESH_ = 0; // > 0 while holding the class lock or a student lock
var SCRIPT_DEPTH_ = 0;
var STUDENT_HELD_ = {};

/** Minimal table API over a sheet: rows as objects keyed by header. */
function table_(name, forceFresh) {
  const inLock = FRESH_ > 0;
  if (!forceFresh) {
    if (inLock && LOCK_MEMO_[name]) return LOCK_MEMO_[name];
    if (!inLock && MEMO_[name]) return MEMO_[name];
  }
  const sh = sheet_(name);
  const headers = TABLES[name];
  const values = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues() : [];
  const rows = values.map(function (v, i) {
    const o = { _row: i + 2 };
    headers.forEach(function (h, j) { o[h] = v[j] === "" ? "" : v[j]; });
    return o;
  });
  const toValues = function (obj) { return headers.map(function (h) { return obj[h] === undefined || obj[h] === null ? "" : obj[h]; }); };
  const t = {
    rows: rows,
    find: function (pred) { for (let i = 0; i < rows.length; i++) if (pred(rows[i])) return rows[i]; return null; },
    filter: function (pred) { return rows.filter(pred); },
    append: function (obj) {
      sh.appendRow(toValues(obj)); // atomic, safe while other students write too
      delete MEMO_[name];
      rows.push(Object.assign({ _row: null }, obj)); // row number unknown (others may append at the same moment)
      return obj;
    },
    /** Insert or merge-update the first row matching pred. Call inside withLock_. */
    upsert: function (pred, obj) {
      // inside a lock this table was read fresh; otherwise re-read so concurrent writers don't overwrite each other
      const fresh = inLock ? t : table_(name, true);
      const memoRow = fresh.find(pred);
      let existing = memoRow;
      if (existing && !existing._row) existing = table_(name, true).find(pred) || existing; // just appended this request: find its real row
      if (memoRow && memoRow !== existing) Object.assign(memoRow, obj, { _row: existing._row });
      delete MEMO_[name];
      if (existing && existing._row) {
        const merged = Object.assign({}, existing, obj);
        sh.getRange(existing._row, 1, 1, headers.length).setValues([toValues(merged)]);
        Object.assign(existing, obj);
        return merged;
      }
      return fresh.append(obj);
    },
  };
  if (inLock) LOCK_MEMO_[name] = t;
  else MEMO_[name] = t;
  return t;
}

/** Class-wide lock: only for class structure (classes, rosters, settings). Student saves use withStudentLock_. */
function withLock_(fn) {
  if (SCRIPT_DEPTH_ > 0) return fn(); // already holding the lock
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) throw userError_("Lots of people are saving at once. Please try again in a moment.");
  SCRIPT_DEPTH_++;
  if (FRESH_++ === 0) LOCK_MEMO_ = {};
  try {
    return fn();
  } finally {
    FRESH_--;
    SCRIPT_DEPTH_--;
    lock.releaseLock();
  }
}

/**
 * One student's saves never wait for another student's. Rows are never deleted, so each student's rows keep their
 * position and different students can update their own rows at the same time; new rows use appendRow (atomic).
 * This lock only keeps two requests from the SAME student (two tabs, a retry) from interleaving.
 */
function withStudentLock_(email, fn) {
  if (STUDENT_HELD_[email]) return fn();
  const cache = CacheService.getScriptCache();
  const key = "slk_" + email;
  const mine = Utilities.getUuid();
  const until = Date.now() + 8000;
  for (;;) {
    if (!cache.get(key)) {
      cache.put(key, mine, 20);
      if (cache.get(key) === mine) break;
    }
    if (Date.now() > until) break; // never block a student's save for long; worst case two of their own saves overlap
    Utilities.sleep(60 + Math.floor(Math.random() * 90));
  }
  STUDENT_HELD_[email] = true;
  if (FRESH_++ === 0) LOCK_MEMO_ = {};
  try {
    return fn();
  } finally {
    FRESH_--;
    delete STUDENT_HELD_[email];
    if (cache.get(key) === mine) cache.remove(key);
  }
}

function config_() {
  const sh = sheet_("Config");
  const out = {};
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { out[String(r[0]).trim()] = String(r[1]).trim(); });
  return out;
}

function list_(s) {
  return String(s || "").toLowerCase().split(",").map(function (x) { return x.trim(); }).filter(String);
}

function now_() {
  return new Date().toISOString();
}

function parse_(s, fallback) {
  if (s === "" || s === null || s === undefined) return fallback;
  try { return JSON.parse(s); } catch (e) { return fallback; }
}

// ───────────────────────── Learning logic ─────────────────────────

function lessonOf_(lessonId) {
  const l = CONTENT.lessons[lessonId];
  if (!l) throw userError_("That mission doesn't exist.");
  return l;
}

function progressRow_(email, lessonId) {
  return table_("Progress").find(function (r) { return r.email === email && r.lessonId === lessonId; });
}

function saveBlockEntry_(email, lessonId, blockId, entry) {
  return withStudentLock_(email, function () {
    const t = table_("Progress");
    const row = t.find(function (r) { return r.email === email && r.lessonId === lessonId; });
    const state = row ? parse_(row.blockState, {}) : {};
    entry.updatedAt = now_();
    state[blockId] = Object.assign({}, state[blockId] || {}, entry);
    t.upsert(function (r) { return r.email === email && r.lessonId === lessonId; }, {
      email: email,
      lessonId: lessonId,
      status: row && row.status === "completed" ? "completed" : "in_progress",
      blockState: JSON.stringify(state),
      startedAt: (row && row.startedAt) || now_(),
      completedAt: (row && row.completedAt) || "",
      updatedAt: now_(),
    });
    return state;
  });
}

function levelRows_(email) {
  return table_("Levels").filter(function (r) { return !email || r.email === email; });
}

function effective_(row) {
  return Lib.effectiveLevel({ computedLevel: row.computed || "not_attempted", overrideLevel: row.override || null });
}

/** Best level wins; history recorded when the effective level changes. */
function recordLevel_(email, competencyId, level, reason, actor) {
  if (!level || level === "not_attempted") return;
  withStudentLock_(email, function () {
    const t = table_("Levels");
    const row = t.find(function (r) { return r.email === email && r.competencyId === competencyId; });
    const before = row ? effective_(row) : "not_attempted";
    const computed = Lib.maxLevel(row ? row.computed : null, level);
    const merged = t.upsert(function (r) { return r.email === email && r.competencyId === competencyId; }, {
      email: email, competencyId: competencyId, computed: computed, override: row ? row.override : "", updatedAt: now_(),
    });
    const after = effective_(merged);
    if (after !== before) table_("History").append({ at: now_(), email: email, competencyId: competencyId, from: before, to: after, reason: reason, actor: actor || "" });
  });
}

function tz_() {
  try { return Session.getScriptTimeZone() || "America/Detroit"; } catch (e) { return "America/Detroit"; }
}

/** One-time rebuild of a student's XP from history (used the first time we see them after upgrading). */
function xpEventsFromHistory_(email) {
  const events = [];
  const truthy = function (v) { return v === true || String(v).toUpperCase() === "TRUE"; };
  table_("Attempts").filter(function (r) { return r.email === email; }).forEach(function (r) {
    events.push({ kind: "attempt", at: r.at, lessonId: r.lessonId, blockId: r.blockId, correct: r.correct === "" ? null : truthy(r.correct) });
  });
  table_("Evidence").filter(function (r) { return r.email === email; }).forEach(function (r) {
    events.push({ kind: "work", at: r.createdAt, lessonId: r.lessonId, blockId: r.blockId });
  });
  table_("Progress").filter(function (r) { return r.email === email && r.completedAt; }).forEach(function (r) {
    events.push({ kind: "lesson", at: r.completedAt, lessonId: r.lessonId });
  });
  return events;
}

function summaryOf_(row) {
  return { xp: Number(row.xp) || 0, days: parse_(row.days, {}), seen: parse_(row.seen, []), byLesson: parse_(row.byLesson, {}) };
}

/** Add XP events to the student's running summary (the Summary tab), so nobody has to re-read every answer. */
function addXp_(email, events) {
  return withStudentLock_(email, function () {
    const t = table_("Summary");
    const row = t.find(function (r) { return r.email === email; });
    const base = row ? summaryOf_(row) : Lib.applyEvents(Lib.emptySummary(), xpEventsFromHistory_(email), tz_());
    const next = Lib.applyEvents(base, row ? events : [], tz_());
    t.upsert(function (r) { return r.email === email; }, { email: email, xp: next.xp, days: JSON.stringify(next.days), seen: JSON.stringify(next.seen), byLesson: JSON.stringify(next.byLesson), updatedAt: now_() });
    return next;
  });
}

/** XP, streak and daily goal (see src/lib/streaks.ts). */
function stats_(email) {
  const row = table_("Summary").find(function (r) { return r.email === email; });
  const sum = row ? summaryOf_(row) : addXp_(email, []);
  return Lib.statsFromSummary(sum, { timeZone: tz_() });
}

/**
 * "Who needs me right now" — built from the Progress tab only (no full read of Attempts):
 * stuck = 3+ tries and still not right; quiet = mid-mission but no answer for 10+ minutes today;
 * missed = the questions the most students currently have wrong.
 */
function liveView_(progressRows) {
  const now = Date.now();
  const today = Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd");
  const stuck = [];
  const wrong = {};
  const last = {};
  progressRows.forEach(function (r) {
    const t = new Date(r.updatedAt).getTime();
    if (t && (!last[r.email] || t > last[r.email].t)) last[r.email] = { t: t, lessonId: r.lessonId, status: r.status };
    const st = parse_(r.blockState, {});
    Object.keys(st).forEach(function (bid) {
      const e = st[bid];
      if (!e || !e.attempts || e.correct !== false || (e.result && e.result.locked)) return;
      const k = r.lessonId + "|" + bid;
      (wrong[k] = wrong[k] || { lessonId: r.lessonId, blockId: bid, students: [] }).students.push(r.email);
      if (e.attempts >= 3) stuck.push({ email: r.email, lessonId: r.lessonId, blockId: bid, attempts: e.attempts, since: e.updatedAt || r.updatedAt, solved: false });
    });
  });
  const quiet = Object.keys(last).filter(function (email) {
    const l = last[email];
    const mins = (now - l.t) / 60000;
    return l.status !== "completed" && mins >= 10 && mins <= 180 && Utilities.formatDate(new Date(l.t), tz_(), "yyyy-MM-dd") === today;
  }).map(function (email) { return { email: email, lessonId: last[email].lessonId, minutes: Math.round((now - last[email].t) / 60000) }; });
  const missed = Object.keys(wrong).map(function (k) {
    const w = wrong[k];
    const b = (CONTENT.lessons[w.lessonId] || { blocks: {} }).blocks[w.blockId] || {};
    return { lessonId: w.lessonId, blockId: w.blockId, prompt: String(b.prompt || "").replace(/[*_`#]/g, "").slice(0, 140), count: w.students.length, students: w.students };
  }).sort(function (a, b) { return b.count - a.count; }).slice(0, 5);
  const activeToday = Object.keys(last).filter(function (email) { return Utilities.formatDate(new Date(last[email].t), tz_(), "yyyy-MM-dd") === today; }).length;
  stuck.sort(function (a, b) { return String(b.since).localeCompare(String(a.since)); });
  return { stuck: stuck, quiet: quiet, missed: missed, activeToday: activeToday, at: now_() };
}

// ───────────────────────── Print queue ─────────────────────────

const PRINT_STATUSES = ["requested", "approved", "printing", "done", "failed", "cancelled"];

function printOut_(r) {
  return {
    id: r.id, email: r.email, classId: r.classId, lessonId: r.lessonId, evidenceId: r.evidenceId, fileName: r.fileName || null,
    fileUrl: r.fileId ? "https://drive.google.com/file/d/" + r.fileId + "/view" : null,
    status: r.status || "requested", note: r.note || "", teacherNote: r.teacherNote || "", createdAt: r.createdAt, updatedAt: r.updatedAt,
  };
}

function newPrint_(user, classId, ev, note) {
  const cls = classFor_(user, classId);
  return withStudentLock_(user.email, function () {
    const t = table_("Prints");
    const open = t.find(function (r) { return r.evidenceId === ev.id && ["requested", "approved", "printing"].indexOf(r.status) >= 0; });
    if (open) return printOut_(open);
    const row = { id: "p" + Utilities.getUuid().slice(0, 8), email: user.email, classId: cls.classId, lessonId: ev.lessonId, evidenceId: ev.id, fileId: ev.fileId, fileName: ev.fileName, status: "requested", note: String(note || "").slice(0, 500), teacherNote: "", createdAt: now_(), updatedAt: now_() };
    t.append(row);
    return printOut_(row);
  });
}

// ───────────────────────── Actions ─────────────────────────

const ACTIONS = {
  /** Everything the student app needs on load. */
  me: {
    run: function (user, a) {
      const hasClass = user.role === "student" || activeClasses_().length > 0;
      const cls = hasClass ? classFor_(user, a.classId) : null;
      const classes = user.role === "teacher" ? activeClasses_() : activeEnrollments_(user.email).map(function (e) { return classById_(e.classId); }).filter(Boolean);
      if (user.role === "student") {
        withStudentLock_(user.email, function () { table_("Users").upsert(function (r) { return r.email === user.email; }, { lastSeen: now_() }); });
      }
      const progress = {};
      table_("Progress").filter(function (r) { return r.email === user.email; }).forEach(function (r) {
        progress[r.lessonId] = { status: r.status, blockState: parse_(r.blockState, {}), startedAt: r.startedAt };
      });
      const levels = {};
      levelRows_(user.email).forEach(function (r) { levels[r.competencyId] = effective_(r); });
      const evidence = table_("Evidence").filter(function (r) { return r.email === user.email; }).map(evidenceOut_);
      const journals = {};
      table_("Journals").filter(function (r) { return r.email === user.email; }).forEach(function (r) { journals[r.projectKey] = parse_(r.entries, {}); });
      return {
        user: { email: user.email, name: user.name, role: user.role, admin: !!user.admin },
        cls: cls ? classOut_(cls) : null,
        classes: classes.map(classOut_),
        progress: progress,
        levels: levels,
        evidence: evidence,
        journals: journals,
        stats: user.role === "student" ? stats_(user.email) : null,
        prints: table_("Prints").filter(function (r) { return r.email === user.email; }).map(printOut_),
        app: user.role === "teacher" ? { version: BUILD.version, owner: String(Session.getEffectiveUser().getEmail() || "").toLowerCase() } : null,
      };
    },
  },

  /** One-click update from the teacher dashboard (same as the sidebar's Update now). Runs as the Sheet's owner. */
  updateApp: {
    role: "teacher",
    run: function () {
      return sidebarUpdate();
    },
  },

  answerBlock: {
    run: function (user, a) {
      const lesson = lessonOf_(a.lessonId);
      const block = lesson.blocks[a.blockId];
      if (!block || !Lib.isScorable(block)) throw userError_("That activity doesn't take answers.");
      // one student lock for the whole save: each tab is read once, and other students never wait on this
      return withStudentLock_(user.email, function () {
      const row = progressRow_(user.email, a.lessonId);
      const prev = (row ? parse_(row.blockState, {}) : {})[a.blockId] || {};
      if (prev.result && prev.result.locked) return prev.result;
      // feedback, explanations and headlines in the student's language (Spanish text lives only here, like the answer keys)
      const shown = REQ_LANG_ === "es" && CONTENT.es && CONTENT.es[a.lessonId] ? Lib.localizeBlock(block, CONTENT.es[a.lessonId]) : block;
      let score;
      try { score = Lib.scoreBlock(shown, a.response, REQ_LANG_); } catch (e) { throw userError_("That answer couldn't be read. Try again."); }
      const attempts = (prev.attempts || 0) + 1;
      const result = Lib.toClientResult(shown, score, attempts);
      table_("Attempts").append({ at: now_(), email: user.email, lessonId: a.lessonId, blockId: a.blockId, competencyId: block.competencyId || "", correct: score.correct === null ? "" : score.correct, misconceptionId: score.misconceptionId || "", response: JSON.stringify(a.response).slice(0, 2000) });
      saveBlockEntry_(user.email, a.lessonId, a.blockId, { response: a.response, correct: score.correct === null ? undefined : score.correct, attempts: attempts, done: true, result: result });
      addXp_(user.email, [{ kind: "attempt", at: now_(), lessonId: a.lessonId, blockId: a.blockId, correct: score.correct }]);
      if (block.competencyId && block.check) {
        recordLevel_(user.email, block.competencyId, Lib.autoLevel({ correct: score.correct === true, check: block.check, autoAssessable: !!CONTENT.autoAssessable[block.competencyId] }), (block.check === "skill" ? "Skill check" : "Practice") + " in " + lesson.title, "");
      }
      return result;
      });
    },
  },

  saveDraft: {
    run: function (user, a) {
      const block = lessonOf_(a.lessonId).blocks[a.blockId];
      if (!block || block.type !== "reflection") throw userError_("Only reflections autosave.");
      saveBlockEntry_(user.email, a.lessonId, a.blockId, { response: { draft: String(a.text || "").slice(0, 10000) } });
      return { savedAt: now_() };
    },
  },

  submitReflection: {
    run: function (user, a) {
      const lesson = lessonOf_(a.lessonId);
      const block = lesson.blocks[a.blockId];
      if (!block || block.type !== "reflection") throw userError_("That isn't a reflection.");
      const text = String(a.text || "").trim().slice(0, 10000);
      const words = text.split(/\s+/).filter(String).length;
      if (words < block.minWords) throw userError_("Write at least " + block.minWords + " words — you have " + words + ".");
      return withStudentLock_(user.email, function () {
        const ev = newEvidence_(user, a.lessonId, a.blockId, block.competencyIds || [], "written", { text: text });
        saveBlockEntry_(user.email, a.lessonId, a.blockId, { response: { text: text, evidenceId: ev.id }, done: true });
        addXp_(user.email, [{ kind: "work", at: now_(), lessonId: a.lessonId, blockId: a.blockId }]);
        return { evidenceId: ev.id };
      });
    },
  },

  submitEvidence: {
    run: function (user, a) {
      const lesson = lessonOf_(a.lessonId);
      const block = lesson.blocks[a.blockId];
      if (!block || block.type !== "uploadEvidence") throw userError_("That activity doesn't take submissions.");
      if (block.accepts.indexOf(a.kind) < 0) throw userError_("This activity doesn't accept that kind of submission.");
      const extra = { text: String(a.note || "").slice(0, 4000) };
      if (a.kind === "design_url") {
        if (!/^https:\/\/\S+$/.test(String(a.url || ""))) throw userError_("Paste the whole link, starting with https://");
        extra.url = String(a.url);
      }
      if (a.file) extra.file = saveUpload_(user, a.kind, a.file);
      else if (a.kind === "screenshot" || a.kind === "stl" || a.kind === "obj") throw userError_("Choose a file to upload.");
      if (a.kind === "physical_test" && !extra.text && !a.file) throw userError_("Describe your test result or add a photo.");
      const ev = newEvidence_(user, a.lessonId, a.blockId, block.competencyIds, a.kind, extra);
      saveBlockEntry_(user.email, a.lessonId, a.blockId, { done: true });
      addXp_(user.email, [{ kind: "work", at: now_(), lessonId: a.lessonId, blockId: a.blockId }]);
      if (a.requestPrint && a.kind === "stl" && ev.fileId) newPrint_(user, a.classId, ev, String(a.note || ""));
      return { id: ev.id, type: ev.type, fileName: ev.fileName || null, url: ev.url || null, createdAt: ev.createdAt };
    },
  },

  saveJournal: {
    run: function (user, a) {
      if (!/^[a-z0-9-]{1,40}$/.test(String(a.projectKey)) || CONTENT.journalPrompts.indexOf(a.promptId) < 0) throw userError_("Unknown journal entry.");
      return withStudentLock_(user.email, function () {
        const t = table_("Journals");
        const row = t.find(function (r) { return r.email === user.email && r.projectKey === a.projectKey; });
        const entries = row ? parse_(row.entries, {}) : {};
        entries[a.promptId] = String(a.text || "").slice(0, 20000);
        t.upsert(function (r) { return r.email === user.email && r.projectKey === a.projectKey; }, { email: user.email, projectKey: a.projectKey, entries: JSON.stringify(entries), updatedAt: now_() });
        return { savedAt: now_() };
      });
    },
  },

  completeLesson: {
    run: function (user, a) {
      const lesson = lessonOf_(a.lessonId);
      const row = progressRow_(user.email, a.lessonId);
      const state = row ? parse_(row.blockState, {}) : {};
      const evBlocks = table_("Evidence").filter(function (r) { return r.email === user.email && r.lessonId === a.lessonId; }).map(function (r) { return r.blockId; });
      const missing = lesson.required.filter(function (id) { return !(state[id] && state[id].done) && evBlocks.indexOf(id) < 0; });
      if (missing.length) throw userError_("Almost there — " + missing.length + " required activit" + (missing.length === 1 ? "y is" : "ies are") + " still open.");
      withStudentLock_(user.email, function () {
        table_("Progress").upsert(function (r) { return r.email === user.email && r.lessonId === a.lessonId; }, { status: "completed", completedAt: (row && row.completedAt) || now_(), updatedAt: now_() });
      });
      addXp_(user.email, [{ kind: "lesson", at: now_(), lessonId: a.lessonId }]);
      const path = CONTENT.paths[classOut_(classFor_(user, a.classId)).pathId];
      const i = path.indexOf(a.lessonId);
      const next = i >= 0 && i < path.length - 1 ? path[i + 1] : null;
      const unlocked = path.filter(function (id) { return (CONTENT.lessons[id].prerequisites || []).indexOf(a.lessonId) >= 0; });
      return { nextLessonId: next, unlocked: unlocked, stats: stats_(user.email) };
    },
  },

  heartbeat: { run: function () { return null; } },

  // ───── Teacher ─────

  classData: {
    role: "teacher",
    run: function (user, a) {
      const cls = classFor_(user, a.classId);
      const inClass = {};
      table_("Enrollments").filter(function (e) { return e.classId === cls.classId && e.status !== "archived"; }).forEach(function (e) { inClass[e.email] = true; });
      const students = table_("Users").filter(function (r) { return r.role === "student" && inClass[r.email]; }).map(function (r) {
        return { email: r.email, name: r.name, status: r.status || "active", lastSeen: r.lastSeen || null };
      });
      const mine = function (r) { return inClass[r.email]; };
      const progressRows = table_("Progress").rows.filter(mine);
      const progress = progressRows.map(function (r) { return { email: r.email, lessonId: r.lessonId, status: r.status, updatedAt: r.updatedAt }; });
      const levels = {};
      table_("Levels").rows.filter(mine).forEach(function (r) { (levels[r.email] = levels[r.email] || {})[r.competencyId] = effective_(r); });
      const evidence = table_("Evidence").rows.filter(mine).map(evidenceOut_);
      const live = liveView_(progressRows);
      return {
        live: live,
        prints: table_("Prints").rows.filter(function (r) { return r.classId === cls.classId; }).map(printOut_),
        cls: classOut_(cls),
        classes: activeClasses_().map(classOut_),
        students: students,
        progress: progress,
        levels: levels,
        evidence: evidence,
        struggles: live.stuck,
      };
    },
  },

  requestPrint: {
    run: function (user, a) {
      const ev = table_("Evidence").find(function (r) { return r.id === a.evidenceId && r.email === user.email; });
      if (!ev || ev.type !== "stl" || !ev.fileId) throw userError_("Choose one of your uploaded STL files.");
      return newPrint_(user, a.classId, ev, a.note);
    },
  },

  updatePrint: {
    role: "teacher",
    run: function (user, a) {
      if (a.status && PRINT_STATUSES.indexOf(a.status) < 0) throw userError_("Unknown print status.");
      return withLock_(function () {
        const t = table_("Prints");
        const row = t.find(function (r) { return r.id === a.printId; });
        if (!row) throw userError_("That print request no longer exists.");
        const patch = { updatedAt: now_() };
        if (a.status) patch.status = a.status;
        if (a.teacherNote !== undefined) patch.teacherNote = String(a.teacherNote).slice(0, 500);
        return printOut_(t.upsert(function (r) { return r.id === a.printId; }, patch));
      });
    },
  },

  review: {
    role: "teacher",
    run: function (user, a) {
      const t = table_("Evidence");
      const ev = t.find(function (r) { return r.id === a.evidenceId; });
      if (!ev) throw userError_("That submission no longer exists.");
      const rating = a.rating ? Math.max(1, Math.min(3, Number(a.rating))) : "";
      withLock_(function () {
        t.upsert(function (r) { return r.id === a.evidenceId; }, { rating: rating, comment: String(a.comment || "").slice(0, 2000), status: a.needsRevision ? "needs_revision" : "reviewed", reviewedBy: user.email, reviewedAt: now_() });
      });
      if (rating) parse_(ev.competencyIds, []).forEach(function (c) { recordLevel_(ev.email, c, Lib.levelFromRating(rating), "Teacher reviewed " + ev.type + " in " + lessonOf_(ev.lessonId).title, user.email); });
      return { ok: true };
    },
  },

  override: {
    role: "teacher",
    run: function (user, a) {
      if (Lib.LEVELS.indexOf(a.level) < 0 || !CONTENT.competencyIds[a.competencyId]) throw userError_("Choose a competency and level.");
      withStudentLock_(a.email, function () {
        const t = table_("Levels");
        const row = t.find(function (r) { return r.email === a.email && r.competencyId === a.competencyId; });
        const before = row ? effective_(row) : "not_attempted";
        // override starts a new evidence window: effective = max(override, evidence since override)
        t.upsert(function (r) { return r.email === a.email && r.competencyId === a.competencyId; }, { email: a.email, competencyId: a.competencyId, computed: "not_attempted", override: a.level, overrideAt: now_(), overrideBy: user.email, overrideComment: String(a.comment || "").slice(0, 500), updatedAt: now_() });
        table_("History").append({ at: now_(), email: a.email, competencyId: a.competencyId, from: before, to: a.level, reason: "Teacher override" + (a.comment ? ": " + a.comment : ""), actor: user.email });
      });
      return { ok: true };
    },
  },

  addStudents: {
    role: "teacher",
    run: function (user, a) {
      const cls = classFor_(user, a.classId);
      const rows = (a.students || []).slice(0, 300);
      let added = 0;
      withLock_(function () {
        const t = table_("Users");
        const enr = table_("Enrollments");
        rows.forEach(function (s) {
          const email = String(s.email || "").trim().toLowerCase();
          if (!/^[^@\s]+@[^@\s]+$/.test(email)) return;
          if (!t.find(function (r) { return r.email === email; })) t.append({ email: email, name: s.name || email.split("@")[0], role: "student", status: "active", createdAt: now_() });
          const e = enr.find(function (r) { return r.email === email && r.classId === cls.classId; });
          if (!e || e.status === "archived") { enroll_(email, cls.classId, a.source || "manual"); added++; }
        });
      });
      return { added: added, classId: cls.classId };
    },
  },

  createClass: {
    role: "teacher",
    run: function (user, a) {
      const name = String(a.name || "").trim().slice(0, 120);
      if (!name) throw userError_("Give the class a name.");
      const c = { classId: "c" + Utilities.getUuid().slice(0, 8), name: name, section: String(a.section || "").slice(0, 60), pathId: a.pathId === "9-week" ? "9-week" : "18-week", tinkercadUrl: "", unlockAll: "FALSE", googleCourseId: a.googleCourseId || "", status: "active", createdAt: now_() };
      withLock_(function () { table_("Classes").append(c); });
      return classOut_(c);
    },
  },

  updateClass: {
    role: "teacher",
    run: function (user, a) {
      const c = classFor_(user, a.classId);
      if (a.tinkercadUrl && !/^https:\/\/(www\.)?tinkercad\.com\//.test(String(a.tinkercadUrl))) throw userError_("Use a https://www.tinkercad.com link.");
      const patch = {};
      if (a.name !== undefined) patch.name = String(a.name).trim().slice(0, 120) || c.name;
      if (a.section !== undefined) patch.section = String(a.section).slice(0, 60);
      if (a.pathId !== undefined) patch.pathId = a.pathId === "9-week" ? "9-week" : "18-week";
      if (a.tinkercadUrl !== undefined) patch.tinkercadUrl = String(a.tinkercadUrl || "");
      if (a.unlockAll !== undefined) patch.unlockAll = a.unlockAll ? "TRUE" : "FALSE";
      if (a.archived !== undefined) patch.status = a.archived ? "archived" : "active";
      let out;
      withLock_(function () { out = table_("Classes").upsert(function (r) { return r.classId === c.classId; }, patch); });
      return classOut_(out);
    },
  },

  /** Remove a student from one class. Their work stays in the workbook. */
  removeStudent: {
    role: "teacher",
    run: function (user, a) {
      const c = classFor_(user, a.classId);
      withLock_(function () { table_("Enrollments").upsert(function (r) { return r.email === a.email && r.classId === c.classId; }, { status: "archived" }); });
      return { ok: true };
    },
  },

  classroomCourses: {
    role: "teacher",
    run: function () {
      const res = Classroom.Courses.list({ teacherId: "me", courseStates: ["ACTIVE"] });
      return (res.courses || []).map(function (c) { return { id: c.id, name: c.name, section: c.section || "" }; });
    },
  },

  /** Import a Google Classroom roster into Users (idempotent; never removes anyone). */
  importClassroom: {
    role: "teacher",
    run: function (user, a) {
      const students = [];
      let pageToken;
      do {
        const res = Classroom.Courses.Students.list(String(a.courseId), { pageSize: 100, pageToken: pageToken });
        (res.students || []).forEach(function (s) { students.push({ email: s.profile.emailAddress, name: s.profile.name.fullName }); });
        pageToken = res.nextPageToken;
      } while (pageToken);
      let classId = a.classId;
      const linked = table_("Classes").find(function (c) { return String(c.googleCourseId) === String(a.courseId) && c.status !== "archived"; });
      if (linked) classId = linked.classId;
      else if (a.asNewClass || !classId) {
        const course = Classroom.Courses.get(String(a.courseId));
        classId = ACTIONS.createClass.run(user, { name: course.name, section: course.section || "", pathId: a.pathId, googleCourseId: String(a.courseId) }).id;
      }
      return ACTIONS.addStudents.run(user, { classId: classId, students: students, source: "classroom" });
    },
  },
};

function newEvidence_(user, lessonId, blockId, competencyIds, type, extra) {
  const ev = {
    id: Utilities.getUuid(),
    email: user.email,
    lessonId: lessonId,
    blockId: blockId,
    competencyIds: JSON.stringify(competencyIds),
    type: type,
    url: extra.url || "",
    fileId: extra.file ? extra.file.id : "",
    fileName: extra.file ? extra.file.name : "",
    text: extra.text || "",
    status: "submitted",
    createdAt: now_(),
  };
  table_("Evidence").append(ev); // appendRow is atomic
  return ev;
}

function evidenceOut_(r) {
  return {
    id: r.id, email: r.email, lessonId: r.lessonId, blockId: r.blockId, competencyIds: parse_(r.competencyIds, []), type: r.type,
    url: r.url || (r.fileId ? "https://drive.google.com/file/d/" + r.fileId + "/view" : null), fileName: r.fileName || null, text: r.text || null,
    status: r.status || "submitted", rating: r.rating || null, comment: r.comment || null, createdAt: r.createdAt,
  };
}

/**
 * Uploads go to a private Drive folder owned by the teacher (the script owner).
 * Uses the Drive API (advanced service) so the script only needs access to files it creates (drive.file),
 * not the teacher's whole Drive — DriveApp would require full Drive access.
 */
function saveUpload_(user, kind, file) {
  const maxMb = Number(config_().MAX_UPLOAD_MB || 10);
  const bytes = Utilities.base64Decode(String(file.base64 || ""));
  if (!bytes.length) throw userError_("That file is empty.");
  if (bytes.length > maxMb * 1024 * 1024) throw userError_("That file is larger than " + maxMb + " MB.");
  const name = String(file.name || "upload").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
  const ext = (name.split(".").pop() || "").toLowerCase();
  const images = ["png", "jpg", "jpeg", "webp", "gif", "heic", "heif"];
  const okExt = { screenshot: images, physical_test: images, stl: ["stl"], obj: ["obj"] }[kind] || [];
  if (okExt.indexOf(ext) < 0) throw userError_("That file type isn't allowed here. Use " + okExt.join(", ").toUpperCase() + ".");
  const isImg = okExt === images;
  let mime = "application/octet-stream";
  if (isImg) {
    const b = bytes; // signed bytes in Apps Script
    const ascii = function (from, to) { return String.fromCharCode.apply(null, b.slice(from, to).map(function (x) { return x & 255; })); };
    if (b[0] === -119 && b[1] === 80) mime = "image/png";
    else if (b[0] === -1 && b[1] === -40) mime = "image/jpeg";
    else if (b[0] === 71 && b[1] === 73) mime = "image/gif";
    else if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") mime = "image/webp";
    else if (ascii(4, 8) === "ftyp") mime = "image/heic"; // iPhone / iPad photos
    else throw userError_("That image file looks damaged. Try taking the screenshot again.");
  }
  const folderId = uploadFolder_(user.email);
  const blob = Utilities.newBlob(bytes, mime, new Date().toISOString().slice(0, 10) + "-" + name);
  const f = Drive.Files.create({ name: blob.getName(), parents: [folderId] }, blob);
  return { id: f.id, name: name };
}

function driveFolderOk_(id) {
  if (!id) return false;
  try {
    const f = Drive.Files.get(id, { fields: "id,trashed" });
    return !!f && !f.trashed;
  } catch (e) {
    return false;
  }
}

function newDriveFolder_(name, parentId) {
  const meta = { name: name, mimeType: "application/vnd.google-apps.folder" };
  if (parentId) meta.parents = [parentId];
  return Drive.Files.create(meta).id;
}

/** One folder for the whole workbook, one sub-folder per student. Ids are remembered in script properties. */
function uploadFolder_(email) {
  const props = PropertiesService.getScriptProperties();
  let rootId = props.getProperty("UPLOAD_FOLDER_ID");
  if (!driveFolderOk_(rootId)) {
    rootId = newDriveFolder_("3D Design Academy uploads (" + ss_().getName() + ")");
    props.setProperty("UPLOAD_FOLDER_ID", rootId);
  }
  const key = "UF_" + email;
  let id = props.getProperty(key);
  if (!id || !driveFolderOk_(id)) {
    id = newDriveFolder_(email, rootId);
    props.setProperty(key, id);
  }
  return id;
}

// ───────────────────────── Setup (menu + sidebar in the teacher's Sheet) ─────────────────────────

function onOpen() {
  SpreadsheetApp.getUi().createMenu("3D Design Academy").addItem("Set up & class links", "showSidebar").addToUi();
}

function showSidebar() {
  // Loaded by the loader: the panel's HTML travels inside the bundle. Pasted copies have a Sidebar file.
  const html = typeof SIDEBAR_HTML !== "undefined" ? HtmlService.createHtmlOutput(SIDEBAR_HTML) : HtmlService.createHtmlOutputFromFile("Sidebar");
  SpreadsheetApp.getUi().showSidebar(html.setTitle("3D Design Academy"));
}

/** Creates tabs and settings. Safe to run again. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  const owner = String(Session.getEffectiveUser().getEmail() || "").toLowerCase();
  // A copied template carries the original owner's script properties — start clean for the new teacher.
  if (owner && props.getProperty("OWNER") && props.getProperty("OWNER") !== owner) props.deleteAllProperties();
  if (owner) props.setProperty("OWNER", owner);
  Object.keys(TABLES).forEach(sheet_);
  const sh = sheet_("Config");
  const existing = config_();
  DEFAULT_CONFIG.forEach(function (row) {
    if (!(row[0] in existing)) sh.appendRow(row);
  });
  if (!existing.ALLOWED_DOMAINS && owner && owner.indexOf("@gmail.com") < 0) setConfig_("ALLOWED_DOMAINS", owner.split("@")[1]);
  sh.autoResizeColumns(1, 3);
  ensureClasses_();
  return "Ready. Open the menu 3D Design Academy → Set up & class links.";
}

function setConfig_(key, value) {
  const sh = sheet_("Config");
  const last = sh.getLastRow();
  const keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues() : [];
  for (let i = 0; i < keys.length; i++) {
    if (String(keys[i][0]).trim() === key) { sh.getRange(i + 2, 2, 1, 1).setValues([[value]]); return; }
  }
  sh.appendRow([key, value, ""]);
}

/** The web app's public address (normalized so it works for students on any domain), or null if not deployed yet. */
function webAppUrl_() {
  let url = null;
  try { url = ScriptApp.getService().getUrl(); } catch (e) { url = null; }
  if (!url || /\/dev$/.test(url)) return null;
  return url.replace(/\/a\/macros\/[^/]+\/s\//, "/macros/s/");
}

/** True when this copy runs through the loader (it keeps itself up to date). */
function viaLoader_() {
  return typeof ACADEMY_LOADER !== "undefined" && typeof academyRefresh_ === "function";
}

function latestVersion_() {
  if (!BUILD.site) return null;
  const cache = CacheService.getScriptCache();
  const hit = cache.get("latest_version");
  if (hit) return JSON.parse(hit);
  try {
    const r = UrlFetchApp.fetch(BUILD.site + "apps-script/version.json?t=" + Date.now(), { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return null;
    const v = JSON.parse(r.getContentText());
    cache.put("latest_version", JSON.stringify(v), 1800);
    return v;
  } catch (e) {
    return null;
  }
}

/** Everything the setup sidebar shows. */
function sidebarState() {
  MEMO_ = {};
  const ready = !!ss_().getSheetByName("Config") && !!ss_().getSheetByName("Classes");
  const cfg = ready ? config_() : {};
  const url = webAppUrl_();
  const clientId = cfg.CLIENT_ID || BUILD.clientId;
  const link = function (extra) {
    if (!url || !BUILD.site) return null;
    return BUILD.site + "?api=" + encodeURIComponent(url) + (clientId ? "&cid=" + encodeURIComponent(clientId) : "") + (extra || "");
  };
  const classes = ready ? activeClasses_().map(classOut_) : [];
  return {
    ready: ready,
    owner: Session.getEffectiveUser().getEmail(),
    url: url,
    site: BUILD.site,
    hasClientId: !!clientId,
    domains: cfg.ALLOWED_DOMAINS || "",
    teacherEmails: cfg.TEACHER_EMAILS || "",
    adminEmails: cfg.ADMIN_EMAILS || "",
    autoEnroll: String(cfg.AUTO_ENROLL).toUpperCase() === "TRUE",
    teacherLink: link("#/teacher"),
    classes: classes.map(function (c) { return { id: c.id, name: c.name + (c.section ? " · " + c.section : ""), link: link("&class=" + encodeURIComponent(c.id)) }; }),
    version: BUILD.version,
    latest: latestVersion_(),
    autoUpdates: viaLoader_(),
    pasteUrl: BUILD.site ? BUILD.site + "apps-script/paste.html" : null,
    editorUrl: "https://script.google.com/d/" + ScriptApp.getScriptId() + "/edit",
  };
}

/** Runs right after the teacher allows permissions: prepares the Sheet. Turning on the web app is one manual Deploy. */
function sidebarAutoSetup() {
  setup();
  return sidebarState();
}

function sidebarPrepare() {
  return sidebarAutoSetup();
}

function sidebarSaveSettings(s) {
  const clean = function (v) { return String(v || "").toLowerCase().split(/[\s,]+/).filter(String).join(","); };
  setConfig_("ALLOWED_DOMAINS", clean(s.domains));
  setConfig_("TEACHER_EMAILS", clean(s.teacherEmails));
  setConfig_("ADMIN_EMAILS", clean(s.adminEmails));
  setConfig_("AUTO_ENROLL", s.autoEnroll ? "TRUE" : "FALSE");
  return sidebarState();
}

function sidebarCreateClass(c) {
  MEMO_ = {};
  ACTIONS.createClass.run({ email: String(Session.getEffectiveUser().getEmail()).toLowerCase(), role: "teacher" }, { name: c.name, section: c.section, pathId: c.pathId });
  return sidebarState();
}

/**
 * "Update now". Copies that run through the loader just fetch the newest code (no Google switches needed;
 * Google doesn't let Sheet copies use the Apps Script API). Older pasted copies need the loader pasted once.
 */
function sidebarUpdate() {
  if (viaLoader_()) {
    const version = academyRefresh_();
    CacheService.getScriptCache().remove("latest_version");
    return version ? { ok: true, version: version, redeployed: true } : { ok: false, error: "Couldn't reach the website. Try again in a minute." };
  }
  return { ok: false, needsPaste: true, pasteUrl: BUILD.site ? BUILD.site + "apps-script/paste.html" : null, error: "This copy needs a one-time update by copy and paste." };
}
