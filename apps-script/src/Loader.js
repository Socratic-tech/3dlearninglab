/**
 * 3D Design Academy — the only script file in a teacher's Sheet.
 *
 * The app itself is published with the website as bundle.js. This loader keeps an INSTALLED copy of it in the
 * Sheet (a hidden tab, plus a fast cache) and runs that copy. New versions are never picked up on their own:
 *
 *   - The teacher clicks "Update now" (side panel or dashboard). The loader downloads the new version and runs a
 *     safety check on it first. Only a version that passes is installed; otherwise the Sheet keeps what it has.
 *   - The version it replaced is kept, so "Undo last update" puts it back in one click.
 *   - Lessons and answer keys still update by themselves: they are data (content.json), checked by the app.
 *
 * A brand-new Sheet installs the current version the first time it runs (with the same safety check).
 */
var ACADEMY_LOADER = { site: "", loader: 2 }; // @loader

var ACADEMY_ERROR_ = null;
var ACADEMY_CHUNK_ = 90000;
var ACADEMY_TABS_ = { current: "_app_backup", previous: "_app_previous" };
var ACADEMY_GLOBAL_ = Function("return this")(); // the global scope, to tell the new version's functions from the running ones

/** The installed app: cache first, then the hidden tab; a new Sheet installs the current website version. */
function academyGetCode_() {
  var cache = CacheService.getScriptCache();
  var cached = academyFromCache_(cache);
  if (cached) return cached.code;
  var installed = null;
  try { installed = academyReadTab_(ACADEMY_TABS_.current); } catch (e) { installed = null; }
  if (installed) {
    try { academyToCache_(cache, installed); } catch (e) { /* the hidden tab is enough */ }
    return installed.code;
  }
  // Nothing installed yet (new Sheet): install the website's current version if it passes the safety check.
  var fresh = null;
  try { fresh = academyDownload_(); } catch (e) { fresh = null; }
  if (!fresh) return null;
  var bad = academyCheck_(fresh.code);
  if (bad) { ACADEMY_ERROR_ = new Error(bad); return null; }
  try { academyToCache_(cache, fresh); } catch (e) { /* fine */ }
  try { academyInstall_(fresh, null); } catch (e) { /* before permissions: installs on the next run */ }
  return fresh.code;
}

function academyDownload_() {
  var r = UrlFetchApp.fetch(ACADEMY_LOADER.site + "apps-script/bundle.js?t=" + Date.now(), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  var code = r.getContentText("UTF-8");
  var m = code.match(/^\/\/ 3D Design Academy bundle ([\w.-]+)/);
  if (!m) return null; // an error page, a captive portal…
  return { version: m[1], code: code };
}

/**
 * Safety check: run the new version in a sealed-off scope (it can't replace anything that is running) and make
 * sure the app's main parts exist and its built-in lessons decode. Returns null when it's fine, or the reason.
 */
function academyCheck_(code) {
  try {
    var probe = new Function(code + "\n;return {" +
      // each entry point must be the new version's own (not the loader's or the running app's global one)
      "entry: [typeof doPost === 'function' && doPost, typeof doGet === 'function' && doGet, typeof showSidebar === 'function' && showSidebar, typeof sidebarState === 'function' && sidebarState]" +
      ".every(function (f, i) { return f && f !== ACADEMY_GLOBAL_[['doPost', 'doGet', 'showSidebar', 'sidebarState'][i]]; })," +
      "app: typeof ACTIONS === 'object' && typeof BUILD === 'object' && typeof Lib === 'object' && typeof SIDEBAR_HTML === 'string'," +
      "lessons: typeof builtInContent_ !== 'function' || !!(builtInContent_().data.lessons)" +
      "};");
    var r = probe();
    if (!r.entry) return "it is missing the app's entry points";
    if (!r.app) return "it is missing part of the app";
    if (!r.lessons) return "its lessons didn't load";
    return null;
  } catch (e) {
    return "it failed to start: " + (e && e.message ? e.message : String(e));
  }
}

function academyToCache_(cache, bundle) {
  var text = Utilities.base64Encode(bundle.code, Utilities.Charset.UTF_8);
  var parts = {};
  var count = 0;
  for (var i = 0; i < text.length; i += ACADEMY_CHUNK_) parts["ac_" + count++] = text.slice(i, i + ACADEMY_CHUNK_);
  parts.ac_n = String(count);
  parts.ac_v = bundle.version;
  cache.putAll(parts, 21600);
}

function academyFromCache_(cache) {
  var keys = ["ac_n", "ac_v"];
  for (var i = 0; i < 20; i++) keys.push("ac_" + i);
  var got = cache.getAll(keys);
  var count = Number(got.ac_n || 0);
  if (!count || count > 20) return null;
  var text = "";
  for (var j = 0; j < count; j++) {
    if (got["ac_" + j] == null) return null;
    text += got["ac_" + j];
  }
  return { version: got.ac_v, code: Utilities.newBlob(Utilities.base64Decode(text, Utilities.Charset.UTF_8)).getDataAsString("UTF-8") };
}

function academyBook_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  var id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  return id ? SpreadsheetApp.openById(id) : null;
}

function academyWriteTab_(name, bundle) {
  var ss = academyBook_();
  if (!ss) throw new Error("Open the class Sheet and try again.");
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.hideSheet();
  sh.clear();
  var cells = [];
  for (var i = 0; i < bundle.code.length; i += 45000) cells.push([bundle.code.slice(i, i + 45000)]);
  sh.getRange(1, 1, cells.length, 1).setNumberFormat("@").setValues(cells);
}

function academyReadTab_(name) {
  var ss = academyBook_();
  var sh = ss && ss.getSheetByName(name);
  if (!sh || sh.getLastRow() < 1) return null;
  var code = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(function (row) { return String(row[0]); }).join("");
  var m = code.match(/^\/\/ 3D Design Academy bundle ([\w.-]+)/);
  return m ? { version: m[1], code: code } : null;
}

/** Make `bundle` the installed version; `replaced` (if any) becomes the one "Undo" goes back to. */
function academyInstall_(bundle, replaced) {
  if (replaced) academyWriteTab_(ACADEMY_TABS_.previous, replaced);
  academyWriteTab_(ACADEMY_TABS_.current, bundle);
  var props = PropertiesService.getScriptProperties();
  props.setProperty("AC_CURRENT", bundle.version);
  if (replaced) props.setProperty("AC_PREVIOUS", replaced.version);
  academyToCache_(CacheService.getScriptCache(), bundle);
}

function academyInstalled_() {
  return academyFromCache_(CacheService.getScriptCache()) || academyReadTab_(ACADEMY_TABS_.current);
}

var ACADEMY_LAST_ERROR_ = null;
function academyLastError_() { return ACADEMY_LAST_ERROR_; }

/**
 * "Update now": download, check, install. Returns the installed version as a string (with .ok/.version/.same),
 * or null with the reason in academyLastError_(). A plain string keeps older app versions' panels readable.
 */
function academyRefresh_() {
  ACADEMY_LAST_ERROR_ = null;
  var fresh = academyDownload_();
  if (!fresh) { ACADEMY_LAST_ERROR_ = "Couldn't reach the website. Try again in a minute."; return null; }
  var current = academyInstalled_();
  var same = !!(current && current.version === fresh.version);
  if (!same) {
    var bad = academyCheck_(fresh.code);
    if (bad) { ACADEMY_LAST_ERROR_ = "The new version didn't pass its safety check (" + bad + "), so your Sheet kept the version it has. Nothing changed for your students."; return null; }
    academyInstall_(fresh, current);
  }
  var out = new String(fresh.version); // eslint-disable-line no-new-wrappers
  out.ok = true;
  out.version = fresh.version;
  out.same = same;
  return out;
}

/** "Undo last update": put the previous version back (and keep the current one as the new "previous"). */
function academyUndo_() {
  var previous = academyReadTab_(ACADEMY_TABS_.previous);
  if (!previous) return { ok: false, error: "There's no earlier version to go back to." };
  var current = academyInstalled_();
  academyInstall_(previous, current);
  return { ok: true, version: previous.version };
}

function academyState_() {
  var props = PropertiesService.getScriptProperties();
  return { loader: ACADEMY_LOADER.loader, current: props.getProperty("AC_CURRENT"), previous: props.getProperty("AC_PREVIOUS") };
}

function academyNotLoaded_() {
  return "3D Design Academy couldn't load (" + (ACADEMY_ERROR_ ? ACADEMY_ERROR_.message || ACADEMY_ERROR_ : "the website didn't answer") + "). Try again in a minute.";
}

// Google invokes only named top-level functions, so the permanent loader declares every entry point.
function onOpen() {
  SpreadsheetApp.getUi().createMenu("3D Design Academy").addItem("Set up & class links", "showSidebar").addToUi();
}
// If the installed app can't start, this small panel still offers Update and Undo.
function showSidebar() {
  var msg = String(academyNotLoaded_()).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  var html = '<div style="font:14px/1.5 system-ui;padding:12px"><p>' + msg + "</p>" +
    '<button onclick="go(\'sidebarUpdate\', this)">Install the newest version</button> ' +
    '<button onclick="go(\'sidebarUndo\', this)">Undo last update</button><p id="r"></p></div>' +
    "<script>function go(fn,b){b.disabled=true;google.script.run.withSuccessHandler(function(r){document.getElementById('r').textContent=r.ok?'Done (version '+r.version+'). Close and reopen this panel.':r.error;b.disabled=false}).withFailureHandler(function(e){document.getElementById('r').textContent=e.message;b.disabled=false})[fn]()}</script>";
  SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutput(html).setTitle("3D Design Academy"));
}
function doGet() { return ContentService.createTextOutput(academyNotLoaded_()); }
function doPost() { return ContentService.createTextOutput(JSON.stringify({ ok: false, error: academyNotLoaded_() })).setMimeType(ContentService.MimeType.JSON); }
function setup() { throw new Error(academyNotLoaded_()); }
function sidebarState() { throw new Error(academyNotLoaded_()); }
function sidebarAutoSetup() { throw new Error(academyNotLoaded_()); }
function sidebarPrepare() { throw new Error(academyNotLoaded_()); }
function sidebarSaveSettings() { throw new Error(academyNotLoaded_()); }
function sidebarCreateClass() { throw new Error(academyNotLoaded_()); }
function sidebarUpdate() { // still works if the installed app is broken
  var r = academyRefresh_();
  return r ? { ok: true, version: String(r) } : { ok: false, error: academyLastError_() };
}
function sidebarUndo() { return academyUndo_(); }

(function academyLoad_() {
  var code = null;
  try { code = academyGetCode_(); } catch (e) { ACADEMY_ERROR_ = e; }
  if (!code) return;
  try { (0, eval)(code); } catch (e) { ACADEMY_ERROR_ = e; }
})();
