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
};

const DEFAULT_CONFIG = [
  ["CLIENT_ID", "", "Google OAuth Web client ID used by the Pages site (same value for every class)."],
  ["ALLOWED_DOMAINS", "", "Comma-separated email domains allowed to sign in, e.g. district.org,students.district.org"],
  ["TEACHER_EMAILS", "", "Comma-separated teacher emails (the script owner is always a teacher)."],
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

function userError_(message) {
  const e = new Error(message);
  e.userMessage = message;
  return e;
}

function handle_(req) {
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
    return { ok: false, error: "Something went wrong. Your work is safe — please try again." };
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
  if (!cfg.CLIENT_ID || claims.aud !== cfg.CLIENT_ID) throw userError_("This class isn't set up for this website yet (CLIENT_ID).");
  if (Number(claims.exp) * 1000 < Date.now()) throw userError_("Your sign-in expired. Please sign in again.");
  if (String(claims.email_verified) !== "true") throw userError_("Your Google account needs a verified email.");
  const email = String(claims.email).toLowerCase();
  const domain = email.split("@")[1];
  const allowed = list_(cfg.ALLOWED_DOMAINS);
  const teachers = list_(cfg.TEACHER_EMAILS).concat([String(Session.getEffectiveUser().getEmail()).toLowerCase()]);
  if (allowed.length && allowed.indexOf(domain) < 0 && teachers.indexOf(email) < 0) throw userError_("Please sign in with your school Google account.");

  if (teachers.indexOf(email) >= 0) return { email: email, name: claims.name || email, role: "teacher", sub: claims.sub };

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

/** Minimal table API over a sheet: rows as objects keyed by header. */
function table_(name) {
  const sh = sheet_(name);
  const headers = TABLES[name];
  const values = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues() : [];
  const rows = values.map(function (v, i) {
    const o = { _row: i + 2 };
    headers.forEach(function (h, j) { o[h] = v[j] === "" ? "" : v[j]; });
    return o;
  });
  const toValues = function (obj) { return headers.map(function (h) { return obj[h] === undefined || obj[h] === null ? "" : obj[h]; }); };
  return {
    rows: rows,
    find: function (pred) { for (let i = 0; i < rows.length; i++) if (pred(rows[i])) return rows[i]; return null; },
    filter: function (pred) { return rows.filter(pred); },
    append: function (obj) {
      sh.appendRow(toValues(obj));
      return obj;
    },
    /** Insert or merge-update the first row matching pred. Call inside withLock_. */
    upsert: function (pred, obj) {
      // re-read inside the lock so concurrent writers don't overwrite each other
      const fresh = table_(name);
      const existing = fresh.find(pred);
      if (existing) {
        const merged = Object.assign({}, existing, obj);
        sh.getRange(existing._row, 1, 1, headers.length).setValues([toValues(merged)]);
        return merged;
      }
      sh.appendRow(toValues(obj));
      return obj;
    },
  };
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) throw userError_("Lots of people are saving at once. Please try again in a moment.");
  try {
    return fn();
  } finally {
    lock.releaseLock();
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
  return withLock_(function () {
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
  withLock_(function () {
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

// ───────────────────────── Actions ─────────────────────────

const ACTIONS = {
  /** Everything the student app needs on load. */
  me: {
    run: function (user, a) {
      const hasClass = user.role === "student" || activeClasses_().length > 0;
      const cls = hasClass ? classFor_(user, a.classId) : null;
      const classes = user.role === "teacher" ? activeClasses_() : activeEnrollments_(user.email).map(function (e) { return classById_(e.classId); }).filter(Boolean);
      if (user.role === "student") {
        withLock_(function () { table_("Users").upsert(function (r) { return r.email === user.email; }, { lastSeen: now_() }); });
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
        user: { email: user.email, name: user.name, role: user.role },
        cls: cls ? classOut_(cls) : null,
        classes: classes.map(classOut_),
        progress: progress,
        levels: levels,
        evidence: evidence,
        journals: journals,
      };
    },
  },

  answerBlock: {
    run: function (user, a) {
      const lesson = lessonOf_(a.lessonId);
      const block = lesson.blocks[a.blockId];
      if (!block || !Lib.isScorable(block)) throw userError_("That activity doesn't take answers.");
      const row = progressRow_(user.email, a.lessonId);
      const prev = (row ? parse_(row.blockState, {}) : {})[a.blockId] || {};
      if (prev.result && prev.result.locked) return prev.result;
      let score;
      try { score = Lib.scoreBlock(block, a.response); } catch (e) { throw userError_("That answer couldn't be read. Try again."); }
      const attempts = (prev.attempts || 0) + 1;
      const result = Lib.toClientResult(block, score, attempts);
      withLock_(function () {
        table_("Attempts").append({ at: now_(), email: user.email, lessonId: a.lessonId, blockId: a.blockId, competencyId: block.competencyId || "", correct: score.correct === null ? "" : score.correct, misconceptionId: score.misconceptionId || "", response: JSON.stringify(a.response).slice(0, 2000) });
      });
      saveBlockEntry_(user.email, a.lessonId, a.blockId, { response: a.response, correct: score.correct === null ? undefined : score.correct, attempts: attempts, done: true, result: result });
      if (block.competencyId && block.check) {
        recordLevel_(user.email, block.competencyId, Lib.autoLevel({ correct: score.correct === true, check: block.check, autoAssessable: !!CONTENT.autoAssessable[block.competencyId] }), (block.check === "skill" ? "Skill check" : "Practice") + " in " + lesson.title, "");
      }
      return result;
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
      const ev = newEvidence_(user, a.lessonId, a.blockId, block.competencyIds || [], "written", { text: text });
      saveBlockEntry_(user.email, a.lessonId, a.blockId, { response: { text: text, evidenceId: ev.id }, done: true });
      return { evidenceId: ev.id };
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
      return { id: ev.id, type: ev.type, fileName: ev.fileName || null, url: ev.url || null, createdAt: ev.createdAt };
    },
  },

  saveJournal: {
    run: function (user, a) {
      if (!/^[a-z0-9-]{1,40}$/.test(String(a.projectKey)) || CONTENT.journalPrompts.indexOf(a.promptId) < 0) throw userError_("Unknown journal entry.");
      return withLock_(function () {
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
      withLock_(function () {
        table_("Progress").upsert(function (r) { return r.email === user.email && r.lessonId === a.lessonId; }, { status: "completed", completedAt: (row && row.completedAt) || now_(), updatedAt: now_() });
      });
      const path = CONTENT.paths[classOut_(classFor_(user, a.classId)).pathId];
      const i = path.indexOf(a.lessonId);
      const next = i >= 0 && i < path.length - 1 ? path[i + 1] : null;
      const unlocked = path.filter(function (id) { return (CONTENT.lessons[id].prerequisites || []).indexOf(a.lessonId) >= 0; });
      return { nextLessonId: next, unlocked: unlocked };
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
      const progress = table_("Progress").rows.filter(mine).map(function (r) { return { email: r.email, lessonId: r.lessonId, status: r.status, updatedAt: r.updatedAt }; });
      const levels = {};
      table_("Levels").rows.filter(mine).forEach(function (r) { (levels[r.email] = levels[r.email] || {})[r.competencyId] = effective_(r); });
      const evidence = table_("Evidence").rows.filter(mine).map(evidenceOut_);
      const struggles = {};
      table_("Attempts").rows.filter(mine).forEach(function (r) {
        const b = (CONTENT.lessons[r.lessonId] || { blocks: {} }).blocks[r.blockId];
        if (!b || b.check !== "skill") return;
        const k = r.email + "|" + r.lessonId + "|" + r.blockId;
        const s = (struggles[k] = struggles[k] || { email: r.email, lessonId: r.lessonId, blockId: r.blockId, competencyId: r.competencyId, attempts: 0, solved: false });
        s.attempts++;
        if (r.correct === true || r.correct === "TRUE") s.solved = true;
      });
      return {
        cls: classOut_(cls),
        classes: activeClasses_().map(classOut_),
        students: students,
        progress: progress,
        levels: levels,
        evidence: evidence,
        struggles: Object.keys(struggles).map(function (k) { return struggles[k]; }).filter(function (s) { return s.attempts >= 3 && !s.solved; }),
      };
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
      withLock_(function () {
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
  withLock_(function () { table_("Evidence").append(ev); });
  return ev;
}

function evidenceOut_(r) {
  return {
    id: r.id, email: r.email, lessonId: r.lessonId, blockId: r.blockId, competencyIds: parse_(r.competencyIds, []), type: r.type,
    url: r.url || (r.fileId ? "https://drive.google.com/file/d/" + r.fileId + "/view" : null), fileName: r.fileName || null, text: r.text || null,
    status: r.status || "submitted", rating: r.rating || null, comment: r.comment || null, createdAt: r.createdAt,
  };
}

/** Uploads go to a private Drive folder owned by the teacher (the script owner). */
function saveUpload_(user, kind, file) {
  const maxMb = Number(config_().MAX_UPLOAD_MB || 10);
  const bytes = Utilities.base64Decode(String(file.base64 || ""));
  if (!bytes.length) throw userError_("That file is empty.");
  if (bytes.length > maxMb * 1024 * 1024) throw userError_("That file is larger than " + maxMb + " MB.");
  const name = String(file.name || "upload").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
  const ext = (name.split(".").pop() || "").toLowerCase();
  const okExt = { screenshot: ["png", "jpg", "jpeg", "webp", "gif"], physical_test: ["png", "jpg", "jpeg", "webp", "gif"], stl: ["stl"], obj: ["obj"] }[kind] || [];
  if (okExt.indexOf(ext) < 0) throw userError_("That file type isn't allowed here.");
  const isImg = okExt[0] === "png";
  if (isImg) {
    const b = bytes;
    const png = b[0] === -119 && b[1] === 80; // signed bytes in Apps Script
    const jpg = b[0] === -1 && b[1] === -40;
    const gif = b[0] === 71 && b[1] === 73;
    const webp = b[0] === 82 && b[1] === 73;
    if (!(png || jpg || gif || webp)) throw userError_("That image file looks damaged.");
  }
  const folder = uploadFolder_(user.email);
  const blob = Utilities.newBlob(bytes, isImg ? "image/" + (ext === "jpg" ? "jpeg" : ext) : "application/octet-stream", new Date().toISOString().slice(0, 10) + "-" + name);
  const f = folder.createFile(blob);
  return { id: f.getId(), name: name };
}

function uploadFolder_(email) {
  const props = PropertiesService.getScriptProperties();
  let rootId = props.getProperty("UPLOAD_FOLDER_ID");
  let root;
  try { root = rootId ? DriveApp.getFolderById(rootId) : null; } catch (e) { root = null; }
  if (!root) {
    root = DriveApp.createFolder("3D Design Academy uploads");
    props.setProperty("UPLOAD_FOLDER_ID", root.getId());
  }
  const it = root.getFoldersByName(email);
  return it.hasNext() ? it.next() : root.createFolder(email);
}

// ───────────────────────── Setup (run once from the editor) ─────────────────────────

function setup() {
  Object.keys(TABLES).forEach(sheet_);
  const sh = sheet_("Config");
  const existing = config_();
  DEFAULT_CONFIG.forEach(function (row) {
    if (!(row[0] in existing)) sh.appendRow(row);
  });
  sh.autoResizeColumns(1, 3);
  ensureClasses_();
  return "Ready. Fill in the Config tab, then Deploy → New deployment → Web app. Create classes from the website.";
}
