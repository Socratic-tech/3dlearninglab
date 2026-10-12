/**
 * 3D Design Academy — Google Apps Script API (Pages edition).
 *
 * The interface lives on GitHub Pages. This script is the only thing that touches student data:
 * it verifies the caller's Google ID token, checks their role, and reads/writes the bound Google Sheet
 * (and Drive for uploads). Students never get access to the Sheet itself.
 *
 * One workbook per TEACHER: all of a teacher's classes live in it (Classes + Enrollments tabs).
 * Deploy: Extensions → Apps Script in the teacher's Sheet, paste dist/Code.js + appsscript.json,
 * run setup() once, then Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 * ("Anyone" is required so the Pages site can call it; every request is still authenticated by Google ID token.)
 *
 * This engine is bundled with Lib, the sidebar and a fallback content feed on the website. The permanent
 * Code.gs in each Sheet is only the loader; see Loader.js and scripts/build-pages.ts.
 */

const API_VERSION = "1";
// Filled in by scripts/build-pages.ts: the public site, its Google sign-in client ID, and this script's version.
const BUILD = { version: "dev", site: "", clientId: "" }; // @build

const TABLES = {
  Config: ["key", "value", "notes"],
  Classes: ["classId", "name", "section", "pathId", "tinkercadUrl", "unlockAll", "googleCourseId", "status", "createdAt", "custom"],
  Users: ["email", "name", "role", "sub", "status", "createdAt", "lastSeen"],
  Enrollments: ["email", "classId", "status", "source", "createdAt"],
  Progress: ["email", "lessonId", "status", "blockState", "startedAt", "completedAt", "updatedAt"],
  Attempts: ["at", "email", "lessonId", "blockId", "competencyId", "correct", "misconceptionId", "response"],
  Levels: ["email", "competencyId", "computed", "override", "overrideAt", "overrideBy", "overrideComment", "updatedAt"],
  History: ["at", "email", "competencyId", "from", "to", "reason", "actor"],
  Evidence: ["id", "email", "lessonId", "blockId", "competencyIds", "type", "url", "fileId", "fileName", "text", "status", "rating", "comment", "reviewedBy", "reviewedAt", "createdAt"],
  Journals: ["email", "projectKey", "entries", "updatedAt"],
  Summary: ["email", "xp", "days", "seen", "byLesson", "updatedAt", "spentXp", "ownedLooks", "activeLook", "owned", "equipped", "lastSeen"],
  Gallery: ["id", "classId", "evidenceId", "email", "lessonId", "caption", "createdAt"],
  Rewards: ["id", "classId", "name", "description", "price", "active", "createdAt", "updatedAt"],
  Redemptions: ["id", "email", "classId", "rewardId", "rewardName", "price", "status", "teacherNote", "createdAt", "updatedAt"],
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
  CONTENT_MEMO_ = null;
  STUDENT_HELD_ = {};
  SCOPE_EMAIL_ = null;
  SLICE_MEMO_ = {};
  SLICE_GEN_ = null;
  SLICE_PREFETCH_ = null;
  SLICE_READY_ = {};
  CONFIG_MEMO_ = null;
  REQ_LANG_ = req && req.args && req.args.lang === "es" ? "es" : "en";
  const t0 = Date.now();
  TIMING_ = req && req.args && req.args.bench === true ? [] : null;
  try {
    const action = ACTIONS[req && req.action];
    if (!action) throw userError_("Unknown request.");
    ensureClasses_();
    let user = authenticate_(req.token, (req.args || {}).classId);
    // Student view: a teacher works as their own test student (a real student record, see previewStudent_).
    const staff = user.role === "teacher";
    // Classroom stress test: a teacher acts as one of the seeded test students ("loadtest-NNN+student@…").
    if (staff && req.args && typeof req.args.asLoad === "number") user = loadStudent_(req.args.asLoad, TIMING_);
    else if (staff && req.args && req.args.asStudent === true) user = previewStudent_(user, req.args.classId);
    if (action.role === "teacher" && user.role !== "teacher") throw userError_("You don't have access to that.");
    if (user.role === "student") SCOPE_EMAIL_ = String(user.email).toLowerCase(); // their own tabs come from their saved copy
    // Retries from the site reuse the same requestId: return the first answer instead of doing the work twice.
    const cache = CacheService.getScriptCache();
    const rid = typeof req.requestId === "string" && /^[\w-]{8,64}$/.test(req.requestId) ? "rid_" + user.email + "_" + req.requestId : null;
    if (rid) {
      const prior = cache.get(rid);
      if (prior) return JSON.parse(prior);
    }
    const out = { ok: true, data: action.run(user, req.args || {}) };
    if (TIMING_ && staff) out.timing = { ms: Date.now() - t0, reads: TIMING_ };
    if (rid) {
      const json = JSON.stringify(out);
      if (json.length < 90000) cache.put(rid, json, 600);
    }
    return out;
  } catch (err) {
    if (err && err.userMessage) return { ok: false, error: err.userMessage };
    console.error(err && err.stack ? err.stack : err);
    // retry: Google's own services sometimes fail when very busy; the website tries again with the same requestId.
    return { ok: false, retry: true, error: localizeMessage_("Something went wrong. Your work is safe — please try again."), details: String((err && err.message) || err).slice(0, 300) };
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
// ── Test student for teachers: "name+student@school" — Google never signs anyone in with a "+" address, so only the
// teacher (through Student view) can act as it. It is a normal student record: XP, store, avatar, rewards, review.
function previewEmail_(email) {
  const at = email.lastIndexOf("@");
  return email.slice(0, at) + "+student" + email.slice(at);
}
function previewStudent_(teacher, classId) {
  const email = previewEmail_(teacher.email);
  const cls = classFor_(teacher, classId);
  const name = String(teacher.name || teacher.email).split(/[\s@]/)[0] + " (test student)";
  const row = table_("Users").find(function (r) { return r.email === email; });
  const enrolled = row && activeEnrollments_(email).some(function (e) { return e.classId === cls.classId; });
  if (!row || row.status === "archived" || !enrolled) {
    withLock_(function () {
      table_("Users").upsert(function (r) { return r.email === email; }, { email: email, name: name, role: "student", sub: "", status: "active", createdAt: row ? row.createdAt : now_(), lastSeen: now_() });
      enroll_(email, cls.classId, "preview");
    });
  }
  return { email: email, name: (row && row.name) || name, role: "student", preview: true };
}

// ── Classroom stress test: seeded test students "loadtest-NNN+student@<owner domain>" in a "Stress test" class.
// "+" addresses can't sign in with Google, so only a teacher (through the stress test) can act as them.
const LOAD_PREFIX_ = "loadtest-";
const LOAD_CLASS_NAME_ = "Stress test (remove after testing)";
function loadEmail_(n) {
  const owner = String(Session.getEffectiveUser().getEmail() || "teacher@school.org").toLowerCase();
  return LOAD_PREFIX_ + ("00" + n).slice(-3) + "+student@" + owner.split("@")[1];
}
function loadStudent_(n, timing) {
  n = Math.floor(n);
  if (!(n >= 1 && n <= 300)) throw userError_("Unknown test student.");
  const email = loadEmail_(n);
  if (!table_("Users").find(function (r) { return r.email === email; })) throw userError_("Add test students first (Classroom stress test).");
  // A real student's first request each period also asks Google to check their sign-in; do the same so timings are honest.
  if (timing) {
    const t = Date.now();
    try { UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token=x", { muteHttpExceptions: true }); } catch (e) { /* timing only */ }
    timing.push({ tab: "Google sign-in check", rows: 0, ms: Date.now() - t, from: "google" });
  }
  return { email: email, name: "Test student " + n, role: "student", preview: true };
}
const LOREM_ = "My design changed after the first test because the walls were too thin and the hole did not fit, so I measured again with calipers and made the part stronger. ";
function loremOf_(n) { let s = ""; while (s.length < n) s += LOREM_; return s.slice(0, n); }
/** A completed-semester entry for one block, about the size real student answers and feedback take up. */
function fakeEntry_(block, at) {
  if (block.type === "reflection") return { response: { text: loremOf_(450) }, done: true, updatedAt: at };
  if (Lib.isScorable(block)) return { response: { type: block.type, optionId: "a" }, correct: true, attempts: 2, done: true, updatedAt: at, result: { correct: true, attempts: 2, headline: "Nice work!", explanation: loremOf_(220) } };
  return { done: true, updatedAt: at };
}
/** Appends many rows in one write per 2000 rows. Class lock only: run when students aren't working. */
function bulkAppend_(name, objs) {
  if (!objs.length) return;
  const sh = sheet_(name);
  const h = TABLES[name];
  const vals = objs.map(function (o) { return h.map(function (k) { return o[k] === undefined || o[k] === null ? "" : o[k]; }); });
  for (let i = 0; i < vals.length; i += 2000) {
    const part = vals.slice(i, i + 2000);
    sh.getRange(sh.getLastRow() + 1, 1, part.length, h.length).setValues(part);
  }
  delete MEMO_[name];
  delete LOCK_MEMO_[name];
  dropTableCache_(name);
  if (SLICED_[name]) bumpSliceGen_();
}

function enroll_(email, classId, source) {
  table_("Enrollments").upsert(function (e) { return e.email === email && e.classId === classId; }, { email: email, classId: classId, status: "active", source: source || "manual", createdAt: now_() });
}

function classOut_(c) {
  const custom = customOf_(c);
  return {
    id: c.classId, name: c.name, section: c.section || "", pathId: c.pathId === "custom" && custom ? "custom" : pathIdOf_(c.pathId),
    tinkercadUrl: c.tinkercadUrl || null, unlockAll: String(c.unlockAll).toUpperCase() === "TRUE", googleCourseId: c.googleCourseId || null,
    custom: custom,
  };
}

// ── Custom project paths: a teacher picks and orders existing lessons and ends with their own project mission.
// Stored as JSON in the class row. Only known lessons are kept; teacher text is plain and length-limited.
const CUSTOM_PROJECT_ID = "custom-project";
function cleanCustom_(x) {
  if (!x || typeof x !== "object") return null;
  const lessons = content_().lessons;
  const seen = {};
  const ids = (Array.isArray(x.lessonIds) ? x.lessonIds : []).map(String).filter(function (id) {
    if (id === CUSTOM_PROJECT_ID || !lessons[id] || seen[id]) return false;
    seen[id] = true;
    return true;
  }).slice(0, 40);
  if (!ids.length) return null;
  const text = function (v, n) { return String(v || "").replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, n); };
  const reqs = (Array.isArray(x.requirements) ? x.requirements : []).map(function (r) { return text(r, 200); }).filter(Boolean).slice(0, 8);
  const comps = {};
  ids.forEach(function (id) { (lessons[id].competencyIds || []).forEach(function (c) { if (content_().competencyIds[c]) comps[c] = true; }); });
  return { title: text(x.title, 80) || "Class project", brief: text(x.brief, 600), lessonIds: ids, requirements: reqs, competencyIds: Object.keys(comps) };
}
function customOf_(c) {
  if (!c || !c.custom) return null;
  try { return cleanCustom_(JSON.parse(String(c.custom))); } catch (e) { return null; }
}
/** Lesson order for a class: its custom path (plus the project mission) or a standard course. */
function classPath_(cls) {
  const custom = customOf_(cls);
  if (cls.pathId === "custom" && custom) return custom.lessonIds.concat([CUSTOM_PROJECT_ID]);
  const paths = content_().paths;
  return paths[pathIdOf_(cls.pathId)] || paths["18-week"];
}
/** Skills a submission counts toward: the project mission credits every skill in the class's custom path. */
function evidenceSkills_(user, a, block) {
  if (a.lessonId !== CUSTOM_PROJECT_ID) return block.competencyIds || [];
  let custom = null;
  try { custom = customOf_(classFor_(user, a.classId)); } catch (e) { custom = null; }
  return custom && custom.competencyIds.length ? custom.competencyIds : block.competencyIds || [];
}

/** The class a request is about: the requested one if the user may see it, otherwise their first. */
/** A course path the current lessons know (new paths can arrive with the lesson feed); anything else is the 18-week course. */
function pathIdOf_(id) {
  const paths = content_().paths || {};
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(paths, id) && Array.isArray(paths[id]) ? id : "18-week";
}

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
  if (table_("Classes").rows.length) return; // usually answered from the shared copy, no Sheet read
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
  } else if ((name === "Summary" || name === "Classes") && !headersChecked_(name)) {
    // Older class Sheets have fewer columns (Summary: store columns; Classes: custom project paths). Add the new
    // headers in place; existing rows and student work stay untouched.
    const headers = TABLES[name];
    const current = sh.getRange(1, 1, 1, headers.length).getValues()[0];
    if (headers.some(function (h, i) { return current[i] !== h; })) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    try { CacheService.getScriptCache().put("hdr3_" + name, "1", 21600); } catch (e) { /* ignore */ }
  }
  return sh;
}
function headersChecked_(name) {
  try { return !!CacheService.getScriptCache().get("hdr3_" + name); } catch (e) { return false; }
}

// Small, rarely changed tabs are shared between requests for up to 2 minutes (every write through table_ clears the
// copy). Saves 3–5 Sheet reads on every request. Hand edits in these tabs show up within 2 minutes.
const SHARED_TABLES_ = { Classes: 1, Enrollments: 1, Users: 1, Gallery: 1, Rewards: 1 };
function dropTableCache_(name) {
  if (!SHARED_TABLES_[name]) return;
  try { CacheService.getScriptCache().remove("tc3_" + name); } catch (e) { /* ignore */ }
}
function dropAllTableCaches_() {
  Object.keys(SHARED_TABLES_).forEach(dropTableCache_);
  try { CacheService.getScriptCache().remove("cfg2"); } catch (e) { /* ignore */ }
  bumpSliceGen_();
  MEMO_ = {};
  LOCK_MEMO_ = {};
}
var TIMING_ = null; // per-tab read timings when a teacher's request asks for them (stress test)

// Each request reads a tab at most once (MEMO_). Inside a lock the first read of a tab is fresh and then reused
// (LOCK_MEMO_), so one save reads Progress/Summary/Levels once each instead of several times.
var MEMO_ = {};
var LOCK_MEMO_ = {};
var FRESH_ = 0; // > 0 while holding the class lock or a student lock
var SCRIPT_DEPTH_ = 0;
var STUDENT_HELD_ = {};

/**
 * Minimal table API over a sheet: rows as objects keyed by header.
 * While a student's request runs, their own tabs come from their saved copy (see "Student copies" below).
 */
function table_(name, forceFresh) {
  if (SCOPE_EMAIL_ && SLICED_[name]) return sliceTable_(name, SCOPE_EMAIL_);
  return rawTable_(name, forceFresh);
}

/** The whole tab, read from the Sheet (once per request, fresh inside locks). */
function rawTable_(name, forceFresh) {
  const inLock = FRESH_ > 0;
  if (!forceFresh) {
    if (inLock && LOCK_MEMO_[name]) return LOCK_MEMO_[name];
    if (!inLock && MEMO_[name]) return MEMO_[name];
  }
  const headers = TABLES[name];
  const started = Date.now();
  const readAt = started;
  const shared = !!SHARED_TABLES_[name];
  let values = null;
  let from = "sheet";
  if (shared && !inLock && !forceFresh) {
    // A copy younger than 2 minutes is used as is. An older one is still used while ONE request re-reads the tab,
    // so a class arriving together never sends 30 reads of the same tab at once.
    try {
      const c = CacheService.getScriptCache();
      const hit = c.get("tc3_" + name);
      if (hit) {
        const v = JSON.parse(hit);
        if (Date.now() - v.t < 120000 || c.get("tr3_" + name)) { values = v.v; from = "cache"; }
        else c.put("tr3_" + name, "1", 20); // this request refreshes it
      }
    } catch (e) { values = null; }
  }
  let sheetObj = null;
  const sh = { // the sheet is opened only when needed (a cached read never touches it)
    get_: function () { return sheetObj || (sheetObj = sheet_(name)); },
    getLastRow: function () { return this.get_().getLastRow(); },
    getRange: function (r, c, nr, nc) { return this.get_().getRange(r, c, nr, nc); },
    appendRow: function (v) { return this.get_().appendRow(v); },
  };
  if (!values) {
    const last = sh.getLastRow();
    values = last > 1 ? sh.getRange(2, 1, last - 1, headers.length).getValues() : [];
    if (shared) {
      try {
        const c = CacheService.getScriptCache();
        const j = JSON.stringify({ t: readAt, v: values });
        if (j.length < 95000) c.put("tc3_" + name, j, 21600);
        c.remove("tr3_" + name);
      } catch (e) { /* too big or cache busy */ }
    }
  }
  if (TIMING_) TIMING_.push({ tab: name, rows: values.length, ms: Date.now() - started, from: from });
  const rows = values.map(function (v, i) {
    const o = { _row: i + 2 };
    headers.forEach(function (h, j) { o[h] = v[j] === "" ? "" : v[j]; });
    return o;
  });
  const toValues = function (obj) { return headers.map(function (h) { return obj[h] === undefined || obj[h] === null ? "" : obj[h]; }); };
  const t = {
    rows: rows,
    readAt: readAt,
    find: function (pred) { for (let i = 0; i < rows.length; i++) if (pred(rows[i])) return rows[i]; return null; },
    filter: function (pred) { return rows.filter(pred); },
    append: function (obj) {
      sh.appendRow(toValues(obj)); // atomic, safe while other students write too
      delete MEMO_[name];
      dropTableCache_(name);
      if (SLICED_[name] && obj.email) markSliceWrite_(name, String(obj.email));
      rows.push(Object.assign({ _row: null }, obj)); // row number unknown (others may append at the same moment)
      return obj;
    },
    /** Insert or merge-update the first row matching pred. Call inside withLock_. */
    upsert: function (pred, obj) {
      // inside a lock this table was read fresh; otherwise re-read so concurrent writers don't overwrite each other
      const fresh = inLock ? t : rawTable_(name, true);
      const memoRow = fresh.find(pred);
      let existing = memoRow;
      if (existing && !existing._row) existing = rawTable_(name, true).find(pred) || existing; // just appended this request: find its real row
      if (memoRow && memoRow !== existing) Object.assign(memoRow, obj, { _row: existing._row });
      delete MEMO_[name];
      dropTableCache_(name);
      if (existing && existing._row) {
        const merged = Object.assign({}, existing, obj);
        sh.getRange(existing._row, 1, 1, headers.length).setValues([toValues(merged)]);
        Object.assign(existing, obj);
        if (SLICED_[name] && merged.email) markSliceWrite_(name, String(merged.email));
        return merged;
      }
      return fresh.append(obj);
    },
  };
  if (inLock) LOCK_MEMO_[name] = t;
  else MEMO_[name] = t;
  return t;
}

// ───────────────────────── Student copies ─────────────────────────
// Reading whole tabs is what makes a busy class slow: under load every Sheet read waits its turn (even a 6-row tab
// took ~0.7 s with 30 students at once), and Progress/Levels/Evidence grow all semester. So each student's own rows
// of these tabs are also kept in Google's script cache ("student copies", up to 6 hours). Opening the app then needs
// no Sheet reads; a save writes only that student's row.
//  · One full read of a tab fills the copies of the whole class (classmates included), so a class warms up together.
//    The teacher dashboard does this too.
//  · Every copy records when its data was read. Every write to a student's rows records the time of that write; a copy
//    older than the student's last write is ignored and rebuilt. So a copy can never hide a newer change, whether the
//    student, another tab, or the teacher made it.
//  · Bulk changes (test data, Student view reset, "Refresh saved copies") start a new generation of copies.
//  · Hand edits to these tabs in the Sheet: use Tools → Refresh saved copies (or wait up to 6 hours).
const SLICED_ = { Progress: 1, Levels: 1, Evidence: 1, Journals: 1, Summary: 1, Prints: 1, Redemptions: 1 };
const SLICE_TTL_ = 21600;
const SLICE_CHUNK_ = 45000; // characters per cache value (Google allows 100 KB)
var SCOPE_EMAIL_ = null; // set while a student's own request runs
var SLICE_MEMO_ = {};
var SLICE_GEN_ = null;
var SLICE_PREFETCH_ = null;

function sliceGen_() {
  if (SLICE_GEN_) return SLICE_GEN_;
  const c = CacheService.getScriptCache();
  let g = c.get("slgen");
  if (!g) g = Utilities.getUuid().slice(0, 8); // a lost generation just orphans the old copies
  c.put("slgen", g, SLICE_TTL_);
  return (SLICE_GEN_ = g);
}
function bumpSliceGen_() {
  SLICE_GEN_ = Utilities.getUuid().slice(0, 8);
  CacheService.getScriptCache().put("slgen", SLICE_GEN_, SLICE_TTL_);
  SLICE_MEMO_ = {};
  SLICE_PREFETCH_ = null;
}
function sliceKey_(name, email) { return "s5_" + sliceGen_() + "_" + name + "_" + String(email).toLowerCase(); }
function sliceWriteKey_(name, email) { return "w5_" + name + "_" + String(email).toLowerCase(); }

/** Records that a student's rows in this tab just changed, so every older copy is ignored. */
function markSliceWrite_(name, email) {
  try { CacheService.getScriptCache().put(sliceWriteKey_(name, email), String(Date.now()), SLICE_TTL_); } catch (e) { /* ignore */ }
  if (SCOPE_EMAIL_ !== String(email).toLowerCase()) delete SLICE_MEMO_[name + "|" + String(email).toLowerCase()];
}

function encodeSlices_(entries) {
  const out = {};
  Object.keys(entries).forEach(function (k) {
    let s = JSON.stringify(entries[k]);
    let tag = "J";
    if (s.length > SLICE_CHUNK_ && typeof Utilities.gzip === "function") {
      try { s = Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(s, "application/json")).getBytes()); tag = "Z"; } catch (e) { tag = "J"; }
    }
    if (s.length <= SLICE_CHUNK_) { out[k] = tag + s; return; }
    const v = Utilities.getUuid().slice(0, 6);
    const n = Math.ceil(s.length / SLICE_CHUNK_);
    for (let i = 0; i < n; i++) out[k + "#" + v + i] = s.slice(i * SLICE_CHUNK_, (i + 1) * SLICE_CHUNK_);
    out[k] = "C" + tag + v + ":" + n;
  });
  return out;
}
function putSlices_(entries, extra) {
  const out = encodeSlices_(entries);
  Object.keys(extra || {}).forEach(function (k) { out[k] = extra[k]; });
  const keys = Object.keys(out).sort(function (a, b) { return (a.indexOf("#") < 0) - (b.indexOf("#") < 0); }); // chunks first
  const c = CacheService.getScriptCache();
  for (let i = 0; i < keys.length; i += 20) {
    const part = {};
    keys.slice(i, i + 20).forEach(function (k) { part[k] = out[k]; });
    try { c.putAll(part, SLICE_TTL_); } catch (e) { /* cache full or busy: copies are optional */ }
  }
}
/** Decodes a stored copy; null when missing, damaged, or older than the student's last write. */
function decodeSlice_(raw, got, key, lastWrite) {
  if (!raw) return null;
  try {
    let tag = raw.charAt(0);
    let s;
    if (tag === "C") {
      const z = raw.charAt(1);
      const m = raw.slice(2).split(":");
      const parts = [];
      for (let i = 0; i < Number(m[1]); i++) parts.push(key + "#" + m[0] + i);
      const have = parts.every(function (p) { return got[p] != null; }) ? got : CacheService.getScriptCache().getAll(parts);
      if (!parts.every(function (p) { return have[p] != null; })) return null;
      s = parts.map(function (p) { return have[p]; }).join("");
      tag = z;
    } else s = raw.slice(1);
    if (tag === "Z") s = Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(s), "application/x-gzip")).getDataAsString();
    const v = JSON.parse(s);
    if (!v || !Array.isArray(v.rows) || Number(v.w) < Number(lastWrite || 0)) return null;
    return v;
  } catch (e) {
    return null;
  }
}
/** One cache call for all of a student's copies (and their last-write times). */
function prefetchSlices_(email) {
  if (SLICE_PREFETCH_ && SLICE_PREFETCH_.email === email) return SLICE_PREFETCH_.got;
  const keys = [];
  Object.keys(SLICED_).forEach(function (n) { keys.push(sliceKey_(n, email), sliceWriteKey_(n, email)); });
  let got = {};
  try { got = CacheService.getScriptCache().getAll(keys); } catch (e) { got = {}; }
  SLICE_PREFETCH_ = { email: email, got: got };
  return got;
}

/** Everyone in the student's classes (for warming the class at once). */
function classmates_(email) {
  const mine = {};
  activeEnrollments_(email).forEach(function (e) { mine[e.classId] = true; });
  const out = {};
  table_("Enrollments").filter(function (e) { return mine[e.classId] && e.status !== "archived"; }).forEach(function (e) { out[String(e.email).toLowerCase()] = true; });
  return Object.keys(out).slice(0, 80);
}

/** Saves copies of a tab for these students from one full read (skipping students who already have a copy). */
function warmSlices_(name, full, emails, force) {
  const by = {};
  full.rows.forEach(function (r) { const e = String(r.email).toLowerCase(); (by[e] = by[e] || []).push(r); });
  let have = {};
  if (!force) {
    try { have = CacheService.getScriptCache().getAll(emails.map(function (e) { return sliceKey_(name, e); })); } catch (e) { have = {}; }
  }
  const entries = {};
  emails.forEach(function (e) {
    const k = sliceKey_(name, e);
    if (force || !have[k]) entries[k] = { w: full.readAt, rows: by[e] || [] };
  });
  if (Object.keys(entries).length) putSlices_(entries);
  return by;
}

/** Teacher dashboard: fill the class's copies (at most once an hour per class). */
function warmClass_(classId) {
  const c = CacheService.getScriptCache();
  const flag = "warm5_" + sliceGen_() + "_" + classId;
  if (c.get(flag)) return;
  const emails = table_("Enrollments").filter(function (e) { return e.classId === classId && e.status !== "archived"; }).map(function (e) { return String(e.email).toLowerCase(); });
  if (!emails.length) return;
  Object.keys(SLICED_).forEach(function (n) { warmSlices_(n, rawTable_(n), emails, false); });
  c.put(flag, "1", 3600);
}

function rowValues_(name, obj) {
  return TABLES[name].map(function (h) { return obj[h] === undefined || obj[h] === null ? "" : obj[h]; });
}

/** Finds the Sheet row of rows this student appended earlier (appendRow can't report its row number). */
function locateNewRows_(name, email, rows) {
  const col = TABLES[name].indexOf("email") + 1;
  const sh = sheet_(name);
  const last = sh.getLastRow();
  if (last < 2 || col < 1) return false;
  const found = sh.getRange(2, col, last - 1, 1).createTextFinder(email).matchEntireCell(true).findAll().map(function (r) { return r.getRow(); });
  const known = {};
  rows.forEach(function (r) { if (r._row) known[r._row] = true; });
  const unknown = found.filter(function (n) { return !known[n]; }).sort(function (a, b) { return a - b; });
  const missing = rows.filter(function (r) { return !r._row; });
  if (!missing.length || unknown.length !== missing.length) return false;
  missing.forEach(function (r, i) { r._row = unknown[i]; });
  return true;
}

var SLICE_READY_ = {}; // copies this request just built (when it warmed the class)

/**
 * No usable copy. At the bell many students arrive at once with no copies; instead of all 30 reading every big tab,
 * ONE request reads each tab once and saves copies for the whole class while the others wait a few seconds for theirs.
 */
function waitOrWarm_(name, email) {
  const c = CacheService.getScriptCache();
  let classes = "none";
  try { classes = activeEnrollments_(email).map(function (x) { return x.classId; }).sort().join(",") || "none"; } catch (e) { classes = "none"; }
  const flag = "wm6_" + sliceGen_() + "_" + classes;
  const key = sliceKey_(name, email);
  // Only when the student has no copies at all (a cold class). A single outdated copy (after a teacher's change)
  // is simply re-read below.
  const got0 = SLICE_PREFETCH_ && SLICE_PREFETCH_.email === email ? SLICE_PREFETCH_.got : prefetchSlices_(email);
  const cold = !Object.keys(SLICED_).some(function (n) { return got0[sliceKey_(n, email)]; });
  if (cold && !c.get(flag)) {
    c.put(flag, "1", 30); // "warming in progress"
    let mates = [];
    try { mates = classmates_(email).filter(function (e) { return e !== email; }); } catch (e) { mates = []; }
    let mine = null;
    Object.keys(SLICED_).forEach(function (n) {
      const full = rawTable_(n, true);
      const by = warmSlices_(n, full, mates, false);
      const own = { w: full.readAt, rows: (by[email] || []).map(function (r) { return Object.assign({}, r); }) };
      const o = {};
      o[sliceKey_(n, email)] = own;
      putSlices_(o);
      SLICE_READY_[n + "|" + email] = own;
      if (n === name) mine = own;
    });
    SLICE_PREFETCH_ = null;
    try { c.remove(flag); } catch (e) { /* expires anyway */ }
    if (mine) { delete SLICE_READY_[name + "|" + email]; mine.from = "sheet"; return mine; }
  } else if (cold) {
    // Someone is warming this class: wait for this student's copy (checking twice a second, up to 12 seconds).
    const until = Date.now() + 12000;
    while (Date.now() < until) {
      Utilities.sleep(350 + Math.floor(Math.random() * 300));
      let got = {};
      try { got = c.getAll([key, sliceWriteKey_(name, email)]); } catch (e) { got = {}; }
      const v = decodeSlice_(got[key], got, key, got[sliceWriteKey_(name, email)]);
      if (v) { SLICE_PREFETCH_ = null; v.from = "waited"; return v; }
      if (!c.get(flag)) break; // warming finished (or failed) without a copy for this student
    }
  }
  // Fallback: read just what this student needs.
  const full = rawTable_(name, true);
  const own = { w: full.readAt, rows: full.filter(function (r) { return String(r.email).toLowerCase() === email; }).map(function (r) { return Object.assign({}, r); }), from: "sheet" };
  const o = {};
  o[key] = { w: own.w, rows: own.rows };
  putSlices_(o);
  return own;
}

/** The student's own rows of a tab, with the same API as rawTable_. Call writes inside withStudentLock_. */
function sliceTable_(name, email) {
  email = String(email).toLowerCase();
  const memoKey = name + "|" + email;
  if (SLICE_MEMO_[memoKey]) return SLICE_MEMO_[memoKey];
  const started = Date.now();
  const got = prefetchSlices_(email);
  const key = sliceKey_(name, email);
  let v = decodeSlice_(got[key], got, key, got[sliceWriteKey_(name, email)]);
  let from = "copy";
  if (!v && SLICE_READY_[memoKey]) { v = SLICE_READY_[memoKey]; from = "copy"; }
  if (!v) { v = waitOrWarm_(name, email); from = v.from; delete v.from; }
  if (TIMING_ && from !== "sheet") TIMING_.push({ tab: name, rows: v.rows.length, ms: Date.now() - started, from: from });
  const rows = v.rows;
  const headers = TABLES[name];
  const commit = function () {
    const w = Date.now();
    v.w = w;
    const extra = {};
    extra[sliceWriteKey_(name, email)] = String(w);
    putSlices_((function () { const o = {}; o[key] = v; return o; })(), extra);
    if (SLICE_PREFETCH_ && SLICE_PREFETCH_.email === email) delete SLICE_PREFETCH_.got[key];
  };
  const t = {
    rows: rows,
    find: function (pred) { for (let i = 0; i < rows.length; i++) if (pred(rows[i])) return rows[i]; return null; },
    filter: function (pred) { return rows.filter(pred); },
    append: function (obj) {
      sheet_(name).appendRow(rowValues_(name, obj));
      rows.push(Object.assign({ _row: null }, obj));
      delete MEMO_[name];
      commit();
      return obj;
    },
    upsert: function (pred, obj) {
      const ex = t.find(pred);
      if (!ex) return t.append(obj);
      if (!ex._row && !locateNewRows_(name, email, rows)) {
        const real = rawTable_(name, true).find(pred); // last resort: a full read
        if (real) ex._row = real._row;
      }
      if (!ex._row) return t.append(Object.assign({}, ex, obj));
      // Write only the columns this save changes, in as few contiguous ranges as possible, so a teacher's change to
      // other columns of the same row (a review, an override) is never overwritten.
      const idx = headers.map(function (h, i) { return Object.prototype.hasOwnProperty.call(obj, h) && String(obj[h]) !== String(ex[h] === undefined ? "" : ex[h]) ? i : -1; }).filter(function (i) { return i >= 0; });
      Object.assign(ex, obj);
      const vals = rowValues_(name, ex);
      const sh = sheet_(name);
      for (let i = 0; i < idx.length;) {
        let j = i;
        while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;
        sh.getRange(ex._row, idx[i] + 1, 1, idx[j] - idx[i] + 1).setValues([vals.slice(idx[i], idx[j] + 1)]);
        i = j + 1;
      }
      delete MEMO_[name];
      if (idx.length) commit();
      return ex;
    },
  };
  SLICE_MEMO_[memoKey] = t;
  return t;
}

/** Class-wide lock: only for class structure (classes, rosters, settings). Student saves use withStudentLock_. */
function withLock_(fn) {
  if (SCRIPT_DEPTH_ > 0) return fn(); // already holding the lock
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) throw userError_("Lots of people are saving at once. Please try again in a moment.");
  SCRIPT_DEPTH_++;
  if (FRESH_++ === 0) { LOCK_MEMO_ = {}; SLICE_MEMO_ = {}; SLICE_PREFETCH_ = null; }
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
  if (FRESH_++ === 0) { LOCK_MEMO_ = {}; SLICE_MEMO_ = {}; SLICE_PREFETCH_ = null; }
  try {
    return fn();
  } finally {
    FRESH_--;
    delete STUDENT_HELD_[email];
    if (cache.get(key) === mine) cache.remove(key);
  }
}

var CONFIG_MEMO_ = null;
/** Config tab, shared between requests for 15 seconds (hand edits in the Sheet show up within 15 seconds). */
function config_() {
  if (CONFIG_MEMO_) return CONFIG_MEMO_;
  try {
    const c = CacheService.getScriptCache();
    const hit = c.get("cfg2");
    if (hit) {
      const v = JSON.parse(hit);
      if (Date.now() - v.t < 15000 || c.get("cfgr")) {
        CONFIG_MEMO_ = v.v;
        if (TIMING_) TIMING_.push({ tab: "Config", rows: Object.keys(CONFIG_MEMO_).length, ms: 0, from: "cache" });
        return CONFIG_MEMO_;
      }
      c.put("cfgr", "1", 10); // this request re-reads it; others keep using the copy meanwhile
    }
  } catch (e) { /* read the sheet */ }
  const started = Date.now();
  const sh = sheet_("Config");
  const out = {};
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { out[String(r[0]).trim()] = String(r[1]).trim(); });
  if (TIMING_) TIMING_.push({ tab: "Config", rows: Object.keys(out).length, ms: Date.now() - started, from: "sheet" });
  try { const c = CacheService.getScriptCache(); c.put("cfg2", JSON.stringify({ t: Date.now(), v: out }), 21600); c.remove("cfgr"); } catch (e) { /* ignore */ }
  CONFIG_MEMO_ = out;
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

// ───────────────────────── Lesson content feed ─────────────────────────
// Lessons and answer keys are DATA downloaded from the website (apps-script/content.json), never code. The feed is
// checked (format, engine version, checksum, shape) before it's used; anything wrong keeps the last good copy, and
// with no good copy at all the fallback included in the website bundle is used. Student data never leaves this Sheet.
var CONTENT_MEMO_ = null;
const FEED_FRESH_SECS_ = 900; // re-check the website every 15 minutes while classes are using the app
const FEED_CHUNK_ = 30000;    // cache values are limited to 100 KB; 30k characters is safe for any text

function content_() {
  if (!CONTENT_MEMO_) {
    let c = null;
    try { c = feedContent_(); } catch (e) { c = null; }
    CONTENT_MEMO_ = c || builtInContent_();
  }
  return CONTENT_MEMO_.data;
}
function contentVersion_() {
  content_();
  return CONTENT_MEMO_.version;
}

function feedContent_() {
  const cache = CacheService.getScriptCache();
  const cached = readFeedCache_(cache);
  if (cached && cache.get("cf_fresh")) return cached;
  const got = fetchFeed_(cache);
  if (got) {
    writeFeedCache_(cache, got);
    cache.put("cf_fresh", "1", FEED_FRESH_SECS_);
    return got;
  }
  cache.put("cf_fresh", "1", 300); // website down or feed rejected: try again in 5 minutes
  return cached;
}

/** Fallback lessons embedded in the website bundle, using the same scrambled feed the website publishes. */
function builtInContent_() {
  const got = decodeFeed_(CONTENT_FEED);
  if (!got) throw new Error("The website bundle's fallback lessons are damaged. Try again in a minute.");
  return { data: got.data, version: "built-in", text: got.text };
}

function decodeFeed_(feed) {
  if (!feed || feed.format !== Lib.FEED_FORMAT || typeof feed.data !== "string" || typeof feed.version !== "string") return null;
  try {
    const bytes = Utilities.base64Decode(feed.data);
    const ks = Lib.feedKeystream(feed.version, bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      const v = (bytes[i] & 255) ^ ks[i];
      bytes[i] = v > 127 ? v - 256 : v;
    }
    const text = Utilities.newBlob(bytes).getDataAsString("UTF-8");
    if (Lib.checksum(text) !== feed.checksum) return null;
    const data = JSON.parse(text);
    if (Lib.validateServerContent(data)) return null;
    return { data: data, version: feed.version, text: text };
  } catch (e) {
    return null;
  }
}

function fetchFeed_(cache) {
  if (!BUILD.site) return null;
  let feed;
  try {
    const r = UrlFetchApp.fetch(BUILD.site + "apps-script/content.json?t=" + Date.now(), { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return null;
    feed = JSON.parse(r.getContentText());
  } catch (e) {
    return null;
  }
  if (!feed || feed.format !== Lib.FEED_FORMAT) return null;
  if (Number(feed.engine) > Lib.ENGINE) {
    cache.put("cf_engine_behind", String(feed.engine), 21600); // newer lessons need an engine update (shown to teachers)
    return null;
  }
  cache.remove("cf_engine_behind");
  return decodeFeed_(feed);
}

function writeFeedCache_(cache, got) {
  const parts = {};
  let n = 0;
  for (let i = 0; i < got.text.length; i += FEED_CHUNK_) parts["cf_" + n++] = got.text.slice(i, i + FEED_CHUNK_);
  parts.cf_n = String(n);
  parts.cf_v = got.version;
  cache.putAll(parts, 21600);
}

function readFeedCache_(cache) {
  const n = Number(cache.get("cf_n"));
  if (!n) return null;
  const keys = [];
  for (let i = 0; i < n; i++) keys.push("cf_" + i);
  const got = cache.getAll(keys.concat(["cf_v"]));
  let text = "";
  for (let i = 0; i < n; i++) {
    if (typeof got["cf_" + i] !== "string") return null;
    text += got["cf_" + i];
  }
  try {
    const data = JSON.parse(text);
    return Lib.validateServerContent(data) ? null : { data: data, version: got.cf_v || "cached", text: text };
  } catch (e) {
    return null;
  }
}

// ───────────────────────── Learning logic ─────────────────────────

function lessonOf_(lessonId) {
  const l = content_().lessons[lessonId];
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

// ── XP store ──
// Cosmetic items only (looks, avatar parts, titles, celebrations) plus classroom perks a teacher creates.
// Reading, contrast, text size, read aloud and other access tools are never sold. Prices live here (the server
// decides); the website only shows them.
const STORE_ITEMS = [
  // looks (colour themes)
  { id: "blueprint", kind: "look", price: 0 }, { id: "neon", kind: "look", price: 150 }, { id: "arcade", kind: "look", price: 300 },
  { id: "sunset", kind: "look", price: 500 }, { id: "galaxy", kind: "look", price: 800 },
  // avatar: body, colour, hat, tool
  { id: "body-bot", kind: "body", price: 0 }, { id: "body-cube", kind: "body", price: 80 }, { id: "body-octo", kind: "body", price: 200 },
  { id: "body-dragon", kind: "body", price: 400 }, { id: "body-ufo", kind: "body", price: 600 },
  { id: "body-initials", kind: "body", price: 0 }, { id: "body-pixel", kind: "body", price: 150 }, { id: "body-visor", kind: "body", price: 250 },
  { id: "color-blue", kind: "color", price: 0 }, { id: "color-orange", kind: "color", price: 0 }, { id: "color-green", kind: "color", price: 40 },
  { id: "color-purple", kind: "color", price: 60 }, { id: "color-pink", kind: "color", price: 60 }, { id: "color-gold", kind: "color", price: 300 },
  { id: "hat-none", kind: "hat", price: 0 }, { id: "hat-goggles", kind: "hat", price: 80 }, { id: "hat-headphones", kind: "hat", price: 120 },
  { id: "hat-wizard", kind: "hat", price: 200 }, { id: "hat-crown", kind: "hat", price: 350 },
  { id: "tool-none", kind: "tool", price: 0 }, { id: "tool-wrench", kind: "tool", price: 60 }, { id: "tool-calipers", kind: "tool", price: 150 },
  { id: "tool-spool", kind: "tool", price: 220 }, { id: "tool-trophy", kind: "tool", price: 500 },
  // titles under your name: EARNED by finishing a mission (they can't be bought)
  { id: "title-rookie", kind: "title", price: 0 },
  { id: "title-layer-legend", kind: "title", price: 0, earn: "layers" }, { id: "title-cad-wizard", kind: "title", price: 0, earn: "boss-nametag" },
  { id: "title-support-slayer", kind: "title", price: 0, earn: "supports" }, { id: "title-tolerance-tamer", kind: "title", price: 0, earn: "tolerances" },
  { id: "title-bridge-boss", kind: "title", price: 0, earn: "bridging" }, { id: "title-infill-icon", kind: "title", price: 0, earn: "strength" },
  { id: "title-cad-surgeon", kind: "title", price: 0, earn: "cad-er" }, { id: "title-sprint-champion", kind: "title", price: 0, earn: "mini-design-sprint" },
  { id: "title-master-maker", kind: "title", price: 0, earn: "final-capstone" },
  { id: "title-shape-builder", kind: "title", price: 0, earn: "jr-shapes" }, { id: "title-bookmark-boss", kind: "title", price: 0, earn: "jr-boss-bookmark" },
  // what happens when you finish a mission
  { id: "fx-none", kind: "celebration", price: 0 }, { id: "fx-confetti", kind: "celebration", price: 0 }, { id: "fx-fireworks", kind: "celebration", price: 120 }, { id: "fx-pixels", kind: "celebration", price: 180 },
  { id: "fx-trophy", kind: "celebration", price: 250 }, { id: "fx-rocket", kind: "celebration", price: 350 },
];
const STORE_DEFAULTS = { look: "blueprint", body: "body-bot", color: "color-blue", hat: "hat-none", tool: "tool-none", title: "title-rookie", celebration: "fx-confetti" };
// kept for older pages that still ask for looks
const STORE_LOOKS = STORE_ITEMS.filter(function (x) { return x.kind === "look"; }).map(function (x) { return { id: x.id, price: x.price }; });

function completedOf_(email) {
  const out = {};
  table_("Progress").filter(function (r) { return r.email === email && r.status === "completed"; }).forEach(function (r) { out[r.lessonId] = true; });
  return out;
}

function storeItem_(id) {
  return STORE_ITEMS.filter(function (x) { return x.id === id; })[0] || null;
}

function storeOf_(row, completed) {
  const done = completed || {};
  const free = STORE_ITEMS.filter(function (x) { return x.price === 0 && (!x.earn || done[x.earn]); }).map(function (x) { return x.id; });
  const owned = free.slice();
  parse_(row && row.ownedLooks, []).concat(parse_(row && row.owned, [])).forEach(function (id) { if (storeItem_(id) && owned.indexOf(id) < 0) owned.push(id); });
  const saved = parse_(row && row.equipped, {});
  const equipped = {};
  Object.keys(STORE_DEFAULTS).forEach(function (slot) {
    const want = slot === "look" ? saved.look || (row && row.activeLook) : saved[slot];
    const item = storeItem_(want);
    equipped[slot] = item && item.kind === slot && owned.indexOf(want) >= 0 ? want : STORE_DEFAULTS[slot];
  });
  const earned = Number(row && row.xp) || 0;
  const spent = Math.max(0, Number(row && row.spentXp) || 0);
  return {
    balance: Math.max(0, earned - spent), spent: spent, owned: owned, equipped: equipped,
    prices: STORE_ITEMS.reduce(function (o, x) { o[x.id] = x.price; return o; }, {}),
    earn: STORE_ITEMS.reduce(function (o, x) { if (x.earn) o[x.id] = x.earn; return o; }, {}),
    // older pages
    ownedLooks: owned.filter(function (id) { return storeItem_(id).kind === "look"; }), activeLook: equipped.look,
  };
}

function storeRow_(email) {
  const t = table_("Summary");
  let row = t.find(function (r) { return r.email === email; });
  if (!row) {
    const base = Lib.applyEvents(Lib.emptySummary(), xpEventsFromHistory_(email), tz_());
    row = t.upsert(function (r) { return r.email === email; }, { email: email, xp: base.xp, days: JSON.stringify(base.days), seen: JSON.stringify(base.seen), byLesson: JSON.stringify(base.byLesson), updatedAt: now_() });
  }
  return { t: t, row: row };
}

function storeState_(email, classId) {
  let row = table_("Summary").find(function (r) { return r.email === email; });
  if (!row) { addXp_(email, []); row = table_("Summary", true).find(function (r) { return r.email === email; }); }
  const out = storeOf_(row, completedOf_(email));
  out.rewards = classId ? table_("Rewards").filter(function (r) { return r.classId === classId && String(r.active).toUpperCase() !== "FALSE"; }).map(rewardOut_) : [];
  out.requests = table_("Redemptions").filter(function (r) { return r.email === email; }).map(redemptionOut_).slice(-20).reverse();
  return out;
}

function buyItem_(email, id) {
  const item = storeItem_(id);
  if (!item) throw userError_("That store item doesn't exist.");
  return withStudentLock_(email, function () {
    const got = storeRow_(email);
    const done = completedOf_(email);
    const store = storeOf_(got.row, done);
    if (store.owned.indexOf(id) >= 0) return store;
    if (item.earn) throw userError_("You earn this title by finishing the " + ((content_().lessons[item.earn] || {}).title || item.earn) + " mission.");
    if (store.balance < item.price) throw userError_("You need " + (item.price - store.balance) + " more XP for that.");
    const bought = parse_(got.row.owned, []).concat([id]);
    const saved = got.t.upsert(function (r) { return r.email === email; }, { spentXp: store.spent + item.price, owned: JSON.stringify(bought), updatedAt: now_() });
    return storeOf_(saved, done);
  });
}

function equipItem_(email, id) {
  const item = storeItem_(id);
  if (!item) throw userError_("That store item doesn't exist.");
  return withStudentLock_(email, function () {
    const got = storeRow_(email);
    const done = completedOf_(email);
    const store = storeOf_(got.row, done);
    if (store.owned.indexOf(id) < 0) throw userError_(item.earn ? "Finish the " + ((content_().lessons[item.earn] || {}).title || item.earn) + " mission to earn this title." : "Get that item before using it.");
    const eq = store.equipped;
    eq[item.kind] = id;
    const patch = { equipped: JSON.stringify(eq), updatedAt: now_() };
    if (item.kind === "look") patch.activeLook = id;
    return storeOf_(got.t.upsert(function (r) { return r.email === email; }, patch), done);
  });
}

// ── Class rewards: real perks the teacher creates (e.g. pick the filament colour). Students request; teachers decide.
/** The class gallery as students see it: first names only, the teacher's caption, and a design link when there is one. */
function galleryFor_(classId) {
  if (!classId) return [];
  // Shared by the class for 5 minutes (changes when the teacher adds or removes a piece): it needs everyone's rows.
  const c = CacheService.getScriptCache();
  const key = "gal5_" + sliceGen_() + "_" + classId;
  try { const hit = c.get(key); if (hit) return JSON.parse(hit); } catch (e) { /* rebuild */ }
  const pins = rawTable_("Gallery").filter(function (g) { return g.classId === classId; });
  if (!pins.length) { try { c.put(key, "[]", 300); } catch (e) { /* ignore */ } return []; }
  const users = {};
  rawTable_("Users").filter(function () { return true; }).forEach(function (u) { users[u.email] = u.name || ""; });
  const evs = {};
  rawTable_("Evidence").filter(function () { return true; }).forEach(function (e) { evs[e.id] = e; });
  const looks = {};
  rawTable_("Summary").filter(function () { return true; }).forEach(function (r) { looks[r.email] = parse_(r.equipped, {}); });
  const out = pins.filter(function (g) { return evs[g.evidenceId]; }).slice(-24).reverse().map(function (g) {
    const ev = evs[g.evidenceId];
    const name = String(users[g.email] || "").trim();
    return {
      id: g.id, firstName: name.split(/\s+/)[0] || "A classmate", initials: name.split(/\s+/).map(function (w) { return w[0] || ""; }).join("").slice(0, 2),
      lessonId: g.lessonId, caption: g.caption || "", url: ev.type === "design_url" ? ev.url || null : null, avatar: looks[g.email] || {},
    };
  });
  try { const j = JSON.stringify(out); if (j.length < 95000) c.put(key, j, 300); } catch (e) { /* ignore */ }
  return out;
}

function rewardOut_(r) {
  return { id: r.id, name: r.name, description: r.description || "", price: Number(r.price) || 0, active: String(r.active).toUpperCase() !== "FALSE" };
}
function redemptionOut_(r) {
  return { id: r.id, email: r.email, rewardId: r.rewardId, name: r.rewardName, price: Number(r.price) || 0, status: r.status, teacherNote: r.teacherNote || "", createdAt: r.createdAt, updatedAt: r.updatedAt };
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
    const b = (content_().lessons[w.lessonId] || { blocks: {} }).blocks[w.blockId] || {};
    return { lessonId: w.lessonId, blockId: w.blockId, prompt: String(b.prompt || "").replace(/[*_`#]/g, "").slice(0, 140), count: w.students.length, students: w.students };
  }).sort(function (a, b) { return b.count - a.count; }).slice(0, 5);
  const activeToday = Object.keys(last).filter(function (email) { return Utilities.formatDate(new Date(last[email].t), tz_(), "yyyy-MM-dd") === today; }).length;
  stuck.sort(function (a, b) { return String(b.since).localeCompare(String(a.since)); });
  return { stuck: stuck, quiet: quiet, missed: missed, activeToday: activeToday, at: now_() };
}

// ───────────────────────── Print queue ─────────────────────────

const PRINT_STATUSES = ["queued", "redo", "printing", "printed", "failed", "cancelled"];
const PRINT_TRANSITIONS = {
  queued: ["redo", "printing", "cancelled"],
  redo: ["queued", "cancelled"],
  printing: ["printed", "failed", "redo"],
  printed: ["queued"],
  failed: ["queued", "redo"],
  cancelled: ["queued"],
};

function printStatus_(status) {
  if (status === "requested" || status === "approved") return "queued";
  if (status === "done") return "printed";
  return PRINT_STATUSES.indexOf(status) >= 0 ? status : "queued";
}

function printOut_(r) {
  return {
    id: r.id, email: r.email, classId: r.classId, lessonId: r.lessonId, evidenceId: r.evidenceId, fileName: r.fileName || null,
    fileUrl: r.fileId ? "https://drive.google.com/file/d/" + r.fileId + "/view" : null,
    status: printStatus_(r.status), note: r.note || "", teacherNote: r.teacherNote || "", createdAt: r.createdAt, updatedAt: r.updatedAt,
  };
}

function newPrint_(user, classId, ev, note) {
  const cls = classFor_(user, classId);
  return withStudentLock_(user.email, function () {
    const t = table_("Prints");
    const open = t.find(function (r) { return r.evidenceId === ev.id && ["queued", "redo", "printing", "requested", "approved"].indexOf(r.status) >= 0; });
    if (open) return printOut_(open);
    // A corrected file replaces an older redo request from the same mission, so the queue stays clear.
    t.filter(function (r) { return r.email === user.email && r.lessonId === ev.lessonId && printStatus_(r.status) === "redo"; }).forEach(function (old) {
      t.upsert(function (r) { return r.id === old.id; }, { status: "cancelled", updatedAt: now_() });
    });
    const row = { id: "p" + Utilities.getUuid().slice(0, 8), email: user.email, classId: cls.classId, lessonId: ev.lessonId, evidenceId: ev.id, fileId: ev.fileId, fileName: ev.fileName, status: "queued", note: String(note || "").slice(0, 500), teacherNote: "", createdAt: now_(), updatedAt: now_() };
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
        // "Last seen" lives in the student's own Summary row (written at most every 10 minutes), so the shared Users
        // tab isn't rewritten — and re-read by everyone — each time a student opens the app.
        const seenKey = "seen_" + user.email;
        const c = CacheService.getScriptCache();
        if (!c.get(seenKey)) {
          withStudentLock_(user.email, function () {
            const t = table_("Summary");
            if (t.find(function (r) { return r.email === user.email; })) t.upsert(function (r) { return r.email === user.email; }, { lastSeen: now_() });
          });
          c.put(seenKey, "1", 600);
        }
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
        user: { email: user.email, name: user.name, role: user.role, admin: !!user.admin, preview: !!user.preview },
        cls: cls ? classOut_(cls) : null,
        classes: classes.map(classOut_),
        progress: progress,
        levels: levels,
        evidence: evidence,
        journals: journals,
        stats: user.role === "student" ? stats_(user.email) : null,
        store: user.role === "student" ? storeState_(user.email, cls ? cls.classId : null) : null,
        gallery: cls ? galleryFor_(cls.classId) : [],
        prints: table_("Prints").filter(function (r) { return r.email === user.email; }).map(printOut_),
        app: user.role === "teacher" ? { version: BUILD.version, owner: String(Session.getEffectiveUser().getEmail() || "").toLowerCase(), content: contentVersion_(), engineBehind: !!CacheService.getScriptCache().get("cf_engine_behind"), autoUpdates: viaLoader_(), safeUpdates: loaderInfo_().safe, previous: loaderInfo_().previous } : null,
      };
    },
  },

  /** Ask the permanent loader to fetch the newest website bundle immediately. */
  /** Undo the last app update (same as the side panel's Undo). */
  undoUpdate: {
    role: "teacher",
    run: function () {
      return sidebarUndo();
    },
  },

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
      const shown = REQ_LANG_ === "es" && content_().es && content_().es[a.lessonId] ? Lib.localizeBlock(block, content_().es[a.lessonId]) : block;
      let score;
      try { score = Lib.scoreBlock(shown, a.response, REQ_LANG_); } catch (e) { throw userError_("That answer couldn't be read. Try again."); }
      const attempts = (prev.attempts || 0) + 1;
      const result = Lib.toClientResult(shown, score, attempts);
      table_("Attempts").append({ at: now_(), email: user.email, lessonId: a.lessonId, blockId: a.blockId, competencyId: block.competencyId || "", correct: score.correct === null ? "" : score.correct, misconceptionId: score.misconceptionId || "", response: JSON.stringify(a.response).slice(0, 2000) });
      saveBlockEntry_(user.email, a.lessonId, a.blockId, { response: a.response, correct: score.correct === null ? undefined : score.correct, attempts: attempts, done: true, result: result });
      addXp_(user.email, [{ kind: "attempt", at: now_(), lessonId: a.lessonId, blockId: a.blockId, correct: score.correct, attempt: attempts }]);
      if (block.competencyId && block.check) {
        recordLevel_(user.email, block.competencyId, Lib.autoLevel({ correct: score.correct === true, check: block.check, autoAssessable: !!content_().autoAssessable[block.competencyId] }), (block.check === "skill" ? "Skill check" : "Practice") + " in " + lesson.title, "");
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
        const ev = newEvidence_(user, a.lessonId, a.blockId, evidenceSkills_(user, a, block), "written", { text: text });
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
      if (a.kind === "written" && !extra.text) throw userError_("Write or dictate your explanation.");
      const ev = newEvidence_(user, a.lessonId, a.blockId, evidenceSkills_(user, a, block), a.kind, extra);
      saveBlockEntry_(user.email, a.lessonId, a.blockId, { done: true });
      addXp_(user.email, [{ kind: "work", at: now_(), lessonId: a.lessonId, blockId: a.blockId }]);
      if (a.requestPrint && a.kind === "stl" && ev.fileId) newPrint_(user, a.classId, ev, String(a.note || ""));
      return { id: ev.id, type: ev.type, fileName: ev.fileName || null, url: ev.url || null, createdAt: ev.createdAt };
    },
  },

  saveJournal: {
    run: function (user, a) {
      if (!/^[a-z0-9-]{1,40}$/.test(String(a.projectKey)) || content_().journalPrompts.indexOf(a.promptId) < 0) throw userError_("Unknown journal entry.");
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
      // Test out: every skill check right = the practice questions are optional (uploads and reflections still count).
      const skill = Object.keys(lesson.blocks).filter(function (id) { return Lib.isScorable(lesson.blocks[id]) && lesson.blocks[id].check === "skill"; });
      const testedOut = skill.length > 0 && skill.every(function (id) { return state[id] && state[id].correct === true; });
      const optional = function (id) { return testedOut && lesson.blocks[id] && Lib.isScorable(lesson.blocks[id]) && skill.indexOf(id) < 0; };
      const missing = lesson.required.filter(function (id) { return !(state[id] && state[id].done) && evBlocks.indexOf(id) < 0 && !optional(id); });
      if (missing.length) throw userError_("Almost there — " + missing.length + " required activit" + (missing.length === 1 ? "y is" : "ies are") + " still open.");
      withStudentLock_(user.email, function () {
        table_("Progress").upsert(function (r) { return r.email === user.email && r.lessonId === a.lessonId; }, { status: "completed", completedAt: (row && row.completedAt) || now_(), updatedAt: now_() });
      });
      addXp_(user.email, [{ kind: "lesson", at: now_(), lessonId: a.lessonId }]);
      const path = classPath_(classFor_(user, a.classId));
      const i = path.indexOf(a.lessonId);
      const next = i >= 0 && i < path.length - 1 ? path[i + 1] : null;
      const unlocked = path.filter(function (id) { return (content_().lessons[id].prerequisites || []).indexOf(a.lessonId) >= 0; });
      return { nextLessonId: next, unlocked: unlocked, stats: stats_(user.email) };
    },
  },

  heartbeat: { run: function () { return null; } },

  /** Teacher: "Check my setup" — what this Sheet is running and whether it's configured the way the website needs. */
  diagnose: {
    role: "teacher",
    run: function (user) {
      const cfg = config_();
      const latest = latestVersion_();
      const loader = loaderInfo_();
      // Only a loader too old to install updates safely (loader 1: no check, no Undo) needs a new deployment.
      // Every loader-2 copy of Code.gs works, including the first one (the app reads both reply styles).
      const loaderCurrent = viaLoader_() && loader.loader >= 2 && typeof academyUndo_ === "function";
      return {
        version: BUILD.version,
        latest: latest ? latest.version : null,
        upToDate: !latest || latest.version === BUILD.version,
        viaLoader: viaLoader_(),
        loaderCurrent: loaderCurrent,
        webAppUrl: webAppUrl_(),
        clientIdSet: !!(cfg.CLIENT_ID || BUILD.clientId),
        owner: String(Session.getEffectiveUser().getEmail() || "").toLowerCase(),
        you: user.email,
        allowedDomains: list_(cfg.ALLOWED_DOMAINS),
        classes: activeClasses_().length,
        content: contentVersion_(),
        engineBehind: !!CacheService.getScriptCache().get("cf_engine_behind"),
      };
    },
  },

  // ───── Teacher ─────

  classData: {
    role: "teacher",
    run: function (user, a) {
      const cls = classFor_(user, a.classId);
      const inClass = {};
      table_("Enrollments").filter(function (e) { return e.classId === cls.classId && e.status !== "archived"; }).forEach(function (e) { inClass[e.email] = true; });
      const seen = {};
      rawTable_("Summary").rows.forEach(function (r) { if (r.lastSeen) seen[r.email] = r.lastSeen; });
      const students = table_("Users").filter(function (r) { return r.role === "student" && inClass[r.email]; }).map(function (r) {
        return { email: r.email, name: r.name, status: r.status || "active", lastSeen: seen[r.email] || r.lastSeen || null };
      });
      const mine = function (r) { return inClass[r.email]; };
      const progressRows = table_("Progress").rows.filter(mine);
      const progress = progressRows.map(function (r) { return { email: r.email, lessonId: r.lessonId, status: r.status, updatedAt: r.updatedAt }; });
      const levels = {};
      table_("Levels").rows.filter(mine).forEach(function (r) { (levels[r.email] = levels[r.email] || {})[r.competencyId] = effective_(r); });
      const evidence = table_("Evidence").rows.filter(mine).map(evidenceOut_);
      const live = liveView_(progressRows);
      try { warmClass_(cls.classId); } catch (e) { console.warn("warm class: " + e); } // students' first loads skip the Sheet
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
        galleryIds: table_("Gallery").filter(function (g) { return g.classId === cls.classId; }).map(function (g) { return g.evidenceId; }),
      };
    },
  },

  /** Teacher: add a student's work to (or take it off) the class gallery. Classmates see first name, caption and a design link. */
  galleryToggle: {
    role: "teacher",
    run: function (user, a) {
      const cls = classFor_(user, a.classId);
      const ev = table_("Evidence").find(function (r) { return r.id === a.evidenceId; });
      if (!ev) throw userError_("That submission doesn't exist.");
      withLock_(function () {
        const t = table_("Gallery");
        const existing = t.find(function (g) { return g.classId === cls.classId && g.evidenceId === ev.id; });
        if (a.on === false) {
          if (existing) t.upsert(function (g) { return g.id === existing.id; }, { classId: "" }); // hidden from every class
        } else {
          t.upsert(function (g) { return g.classId === cls.classId && g.evidenceId === ev.id; }, { id: existing ? existing.id : "g" + Utilities.getUuid().slice(0, 8), classId: cls.classId, evidenceId: ev.id, email: ev.email, lessonId: ev.lessonId, caption: String(a.caption || "").slice(0, 140), createdAt: existing ? existing.createdAt : now_() });
        }
      });
      try { CacheService.getScriptCache().remove("gal5_" + sliceGen_() + "_" + cls.classId); } catch (e) { /* ignore */ }
      return { galleryIds: table_("Gallery").filter(function (g) { return g.classId === cls.classId; }).map(function (g) { return g.evidenceId; }) };
    },
  },

  requestPrint: {
    run: function (user, a) {
      const ev = table_("Evidence").find(function (r) { return r.id === a.evidenceId && r.email === user.email; });
      if (!ev || ev.type !== "stl" || !ev.fileId) throw userError_("Choose one of your uploaded STL files.");
      return newPrint_(user, a.classId, ev, a.note);
    },
  },

  buyLook: {
    run: function (user, a) {
      if (user.role !== "student") throw userError_("You don't have access to that.");
      return buyItem_(user.email, a.lookId);
    },
  },

  selectLook: {
    run: function (user, a) {
      if (user.role !== "student") throw userError_("You don't have access to that.");
      return equipItem_(user.email, a.lookId);
    },
  },

  buyItem: {
    run: function (user, a) {
      if (user.role !== "student") throw userError_("You don't have access to that.");
      return buyItem_(user.email, String(a.itemId || ""));
    },
  },

  equipItem: {
    run: function (user, a) {
      if (user.role !== "student") throw userError_("You don't have access to that.");
      return equipItem_(user.email, String(a.itemId || ""));
    },
  },

  /** Student asks for a class reward. The XP is held right away and given back if the teacher says no. */
  requestReward: {
    run: function (user, a) {
      if (user.role !== "student") throw userError_("You don't have access to that.");
      const cls = classFor_(user, a.classId);
      const reward = table_("Rewards").find(function (r) { return r.id === a.rewardId && r.classId === cls.classId && String(r.active).toUpperCase() !== "FALSE"; });
      if (!reward) throw userError_("That reward isn't available right now.");
      const price = Math.max(0, Math.round(Number(reward.price) || 0));
      return withStudentLock_(user.email, function () {
        const pending = table_("Redemptions").filter(function (r) { return r.email === user.email && r.rewardId === reward.id && r.status === "requested"; });
        if (pending.length) throw userError_("You already asked for this one. Your teacher will get back to you.");
        const got = storeRow_(user.email);
        const store = storeOf_(got.row);
        if (store.balance < price) throw userError_("You need " + (price - store.balance) + " more XP for that.");
        got.t.upsert(function (r) { return r.email === user.email; }, { spentXp: store.spent + price, updatedAt: now_() });
        table_("Redemptions").append({ id: "rd" + Utilities.getUuid().slice(0, 8), email: user.email, classId: cls.classId, rewardId: reward.id, rewardName: reward.name, price: price, status: "requested", teacherNote: "", createdAt: now_(), updatedAt: now_() });
        return storeState_(user.email, cls.classId);
      });
    },
  },

  /** Teacher: wipe your test student's work (answers, XP, store, requests) so you can start fresh. */
  /** Teacher: forget every saved copy (after editing student rows by hand in the Sheet). */
  flushCache: {
    role: "teacher",
    run: function () {
      dropAllTableCaches_();
      return { ok: true };
    },
  },

  /** Teacher: how big this Sheet is (stress test). */
  loadInfo: {
    role: "teacher",
    run: function () {
      const tabs = {};
      let cells = 0;
      ss_().getSheets().forEach(function (sh) {
        cells += sh.getMaxRows() * sh.getMaxColumns();
        if (TABLES[sh.getName()]) tabs[sh.getName()] = Math.max(0, sh.getLastRow() - 1);
      });
      const testStudents = table_("Users").filter(function (r) { return String(r.email).indexOf(LOAD_PREFIX_) === 0; }).length;
      return { tabs: tabs, cells: cells, cellLimit: 10000000, testStudents: testStudents };
    },
  },

  /** Teacher: add test students with a full semester of work (every 18-week mission done). Up to 25 per call. */
  loadSeed: {
    role: "teacher",
    run: function (user, a) {
      const from = Math.max(1, Math.floor(Number(a.from) || 1));
      const count = Math.min(25, Math.max(1, Math.floor(Number(a.count) || 25)));
      if (from + count - 1 > 300) throw userError_("Up to 300 test students.");
      const c = content_();
      const path = (c.paths["18-week"] || []).filter(function (id) { return c.lessons[id]; });
      const comps = Object.keys(c.competencyIds || {});
      return withLock_(function () {
        let cls = table_("Classes").find(function (r) { return r.name === LOAD_CLASS_NAME_ && r.status !== "archived"; });
        if (!cls) {
          cls = { classId: "c" + Utilities.getUuid().slice(0, 8), name: LOAD_CLASS_NAME_, section: "", pathId: "18-week", tinkercadUrl: "", unlockAll: "TRUE", status: "active", createdAt: now_() };
          table_("Classes").append(cls);
        }
        const have = {};
        table_("Users").rows.forEach(function (r) { have[r.email] = true; });
        const out = { Users: [], Enrollments: [], Progress: [], Attempts: [], Levels: [], Evidence: [], Summary: [] };
        const at = now_();
        for (let n = from; n < from + count; n++) {
          const email = loadEmail_(n);
          if (have[email]) continue;
          out.Users.push({ email: email, name: "Test student " + n, role: "student", sub: "", status: "active", createdAt: at, lastSeen: at });
          out.Enrollments.push({ email: email, classId: cls.classId, status: "active", source: "stress-test", createdAt: at });
          const seen = [];
          const byLesson = {};
          path.forEach(function (lid) {
            const L = c.lessons[lid];
            const st = {};
            Object.keys(L.blocks || {}).forEach(function (bid) {
              const b = L.blocks[bid];
              st[bid] = fakeEntry_(b, at);
              seen.push(lid + ":" + bid);
              if (Lib.isScorable(b)) for (let k = 0; k < 2; k++) out.Attempts.push({ at: at, email: email, lessonId: lid, blockId: bid, competencyId: b.competencyId || "", correct: k === 1, misconceptionId: "", response: JSON.stringify({ type: b.type, optionId: k ? "a" : "b" }) });
              if (b.type === "uploadEvidence") out.Evidence.push({ id: "e" + Utilities.getUuid().slice(0, 8), email: email, lessonId: lid, blockId: bid, competencyIds: JSON.stringify(b.competencyIds || []), type: "design_url", url: "https://www.tinkercad.com/things/stress-test", fileId: "", fileName: "", text: loremOf_(160), status: "reviewed", rating: "proficient", comment: "Good fit.", reviewedBy: user.email, reviewedAt: at, createdAt: at });
            });
            byLesson[lid] = 120;
            out.Progress.push({ email: email, lessonId: lid, status: "completed", blockState: JSON.stringify(st), startedAt: at, completedAt: at, updatedAt: at });
          });
          comps.forEach(function (cid) { out.Levels.push({ email: email, competencyId: cid, computed: "proficient", override: "", overrideAt: "", overrideBy: "", overrideComment: "", updatedAt: at }); });
          const days = {};
          for (let d = 0; d < 60; d++) days["2026-" + ("0" + (1 + (d % 12))).slice(-2) + "-" + ("0" + (1 + (d % 28))).slice(-2)] = 1;
          out.Summary.push({ email: email, xp: 4000, days: JSON.stringify(days), seen: JSON.stringify(seen), byLesson: JSON.stringify(byLesson), updatedAt: at, spentXp: 0, ownedLooks: "[]", activeLook: "", owned: "[]", equipped: "{}" });
        }
        Object.keys(out).forEach(function (name) { bulkAppend_(name, out[name]); });
        return { added: out.Users.length, classId: cls.classId };
      });
    },
  },

  /** Teacher: remove every test student and the stress-test class. Deletes only their rows. */
  loadClear: {
    role: "teacher",
    run: function () {
      let removed = 0;
      withLock_(function () {
        const ids = {};
        table_("Classes", true).rows.forEach(function (r) { if (r.name === LOAD_CLASS_NAME_) ids[r.classId] = true; });
        Object.keys(TABLES).forEach(function (name) {
          const col = name === "Classes" ? 0 : TABLES[name].indexOf("email");
          if (col < 0) return;
          const sh = ss_().getSheetByName(name);
          if (!sh || sh.getLastRow() < 2) return;
          const vals = sh.getRange(2, col + 1, sh.getLastRow() - 1, 1).getValues();
          const isTest = function (v) { return name === "Classes" ? !!ids[String(v)] : String(v).toLowerCase().indexOf(LOAD_PREFIX_) === 0; };
          // delete from the bottom in runs of neighbouring rows (seeded rows sit together, so this is a few calls)
          let i = vals.length - 1;
          while (i >= 0) {
            if (!isTest(vals[i][0])) { i--; continue; }
            let j = i;
            while (j - 1 >= 0 && isTest(vals[j - 1][0])) j--;
            sh.deleteRows(j + 2, i - j + 1);
            removed += i - j + 1;
            i = j - 1;
          }
        });
        dropAllTableCaches_();
      });
      return { removed: removed };
    },
  },

  resetPreview: {
    role: "teacher",
    run: function (user) {
      const email = previewEmail_(user.email);
      let removed = 0;
      withLock_(function () {
        Object.keys(TABLES).forEach(function (name) {
          const col = TABLES[name].indexOf("email");
          if (name === "Users" || name === "Enrollments" || col < 0) return;
          const sh = ss_().getSheetByName(name);
          if (!sh || sh.getLastRow() < 2) return;
          const vals = sh.getRange(2, col + 1, sh.getLastRow() - 1, 1).getValues();
          for (let i = vals.length - 1; i >= 0; i--) if (String(vals[i][0]).toLowerCase() === email) { sh.deleteRow(i + 2); removed++; }
        });
      });
      dropAllTableCaches_();
      return { removed: removed };
    },
  },

  /** Teacher: the class's rewards and requests. */
  rewards: {
    role: "teacher",
    run: function (user, a) {
      const cls = classFor_(user, a.classId);
      const names = {};
      table_("Users").filter(function () { return true; }).forEach(function (u) { names[u.email] = u.name || u.email; });
      return {
        rewards: table_("Rewards").filter(function (r) { return r.classId === cls.classId; }).map(rewardOut_),
        requests: table_("Redemptions").filter(function (r) { return r.classId === cls.classId; }).map(function (r) { const o = redemptionOut_(r); o.studentName = names[r.email] || r.email; return o; }).reverse(),
      };
    },
  },

  saveReward: {
    role: "teacher",
    run: function (user, a) {
      const cls = classFor_(user, a.classId);
      const name = String(a.name || "").trim().slice(0, 80);
      const price = Math.round(Number(a.price));
      if (!name) throw userError_("Give the reward a name.");
      if (!(price >= 10 && price <= 5000)) throw userError_("Set a price between 10 and 5,000 XP.");
      const id = a.id || "rw" + Utilities.getUuid().slice(0, 8);
      withLock_(function () {
        table_("Rewards").upsert(function (r) { return r.id === id; }, { id: id, classId: cls.classId, name: name, description: String(a.description || "").slice(0, 200), price: price, active: a.active === false ? "FALSE" : "TRUE", createdAt: now_(), updatedAt: now_() });
      });
      return ACTIONS.rewards.run(user, a);
    },
  },

  /** approved = XP stays spent; declined = XP goes back; given = marked as handed out. */
  decideReward: {
    role: "teacher",
    run: function (user, a) {
      const cls = classFor_(user, a.classId);
      if (["approved", "declined", "given"].indexOf(a.status) < 0) throw userError_("Choose approve, decline or given.");
      const req = table_("Redemptions").find(function (r) { return r.id === a.id && r.classId === cls.classId; });
      if (!req) throw userError_("That request doesn't exist.");
      if (req.status === "declined") throw userError_("That request was already declined.");
      withStudentLock_(req.email, function () {
        if (a.status === "declined") {
          const got = storeRow_(req.email);
          got.t.upsert(function (r) { return r.email === req.email; }, { spentXp: Math.max(0, (Number(got.row.spentXp) || 0) - (Number(req.price) || 0)), updatedAt: now_() });
        }
        table_("Redemptions").upsert(function (r) { return r.id === req.id; }, { status: a.status, teacherNote: String(a.note || "").slice(0, 200), updatedAt: now_() });
      });
      return ACTIONS.rewards.run(user, a);
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
        if (a.status) {
          const from = printStatus_(row.status);
          if ((PRINT_TRANSITIONS[from] || []).indexOf(a.status) < 0) throw userError_("That print can't move from " + from + " to " + a.status + ".");
          const note = a.teacherNote !== undefined ? String(a.teacherNote).trim() : String(row.teacherNote || "").trim();
          if (a.status === "redo" && !note) throw userError_("Add a note telling the student what to change.");
          patch.status = a.status;
        }
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
      if (Lib.LEVELS.indexOf(a.level) < 0 || !content_().competencyIds[a.competencyId]) throw userError_("Choose a competency and level.");
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
      const c = { classId: "c" + Utilities.getUuid().slice(0, 8), name: name, section: String(a.section || "").slice(0, 60), pathId: pathIdOf_(a.pathId), tinkercadUrl: "", unlockAll: "FALSE", googleCourseId: a.googleCourseId || "", status: "active", createdAt: now_() };
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
      if (a.custom !== undefined) {
        const custom = a.custom === null ? null : cleanCustom_(a.custom);
        if (a.custom !== null && !custom) throw userError_("Pick at least one lesson for the project path.");
        patch.custom = custom ? JSON.stringify({ title: custom.title, brief: custom.brief, lessonIds: custom.lessonIds, requirements: custom.requirements }) : "";
      }
      if (a.pathId !== undefined) {
        const hasCustom = patch.custom !== undefined ? !!patch.custom : !!customOf_(c);
        patch.pathId = a.pathId === "custom" && hasCustom ? "custom" : pathIdOf_(a.pathId);
      }
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
  const okExt = { screenshot: images, physical_test: images, written: images, stl: ["stl"], obj: ["obj"] }[kind] || [];
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
  try { CacheService.getScriptCache().remove("cfg2"); } catch (e) { /* ignore */ }
  CONFIG_MEMO_ = null;
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
  // Workspace accounts get /a/macros/<domain>/s/… or /a/<domain>/macros/s/…; both mean the same public address
  return url.replace(/\/a\/macros\/[^/]+\/s\//, "/macros/s/").replace(/\/a\/[^/]+\/macros\/s\//, "/macros/s/");
}

function viaLoader_() {
  return typeof ACADEMY_LOADER !== "undefined" && typeof academyRefresh_ === "function";
}

/** Loader 2+ installs updates only when a teacher asks, checks them first, and can undo. */
function loaderInfo_() {
  if (!viaLoader_()) return { loader: 0, safe: false, previous: null };
  const st = typeof academyState_ === "function" ? academyState_() : null;
  const n = Number((ACADEMY_LOADER && ACADEMY_LOADER.loader) || 1);
  return { loader: n, safe: n >= 2, previous: st && st.previous ? st.previous : null };
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
    safeUpdates: loaderInfo_().safe,
    previousVersion: loaderInfo_().previous,
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

function sidebarUpdate() {
  if (viaLoader_()) {
    const r = academyRefresh_();
    CacheService.getScriptCache().remove("latest_version");
    const fail = (typeof academyLastError_ === "function" && academyLastError_()) || "Couldn't reach the website. Try again in a minute.";
    if (!r) return { ok: false, error: fail };
    // Loaders in the wild answer three ways: a version string (loader 1), a plain { ok, version, same, error }
    // object (first loader 2), or a version string carrying .ok/.version/.same (current loader 2).
    if (typeof r === "object" && Object.prototype.toString.call(r) !== "[object String]") {
      if (r.ok === false) return { ok: false, error: String(r.error || fail) };
      return { ok: true, version: String(r.version || ""), same: !!r.same, redeployed: true };
    }
    return { ok: true, version: String(r.version || r), same: !!r.same, redeployed: true };
  }
  return {
    ok: false,
    needsPaste: true,
    pasteUrl: BUILD.site ? BUILD.site + "apps-script/paste.html" : null,
    error: "This copy needs the one-time two-file loader update.",
  };
}

/** "Undo last update" (loader 2+): goes back to the version installed before the last update. */
function sidebarUndo() {
  if (typeof academyUndo_ !== "function") return { ok: false, error: "Undo needs the newest loader (paste it once from the update page)." };
  const r = academyUndo_();
  CacheService.getScriptCache().remove("latest_version");
  return r;
}
