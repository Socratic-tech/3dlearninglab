/**
 * 3D Design Academy — the only script file in a teacher's Sheet.
 *
 * The rest of the application is published with the website as bundle.js. This loader checks for a
 * new version every 30 minutes, caches the working bundle, and keeps a backup in a hidden Sheet tab.
 */
var ACADEMY_LOADER = { site: "", loader: 1 }; // @loader

var ACADEMY_ERROR_ = null;

function academyGetCode_() {
  var cache = CacheService.getScriptCache();
  var cached = academyFromCache_(cache);
  if (cached && cache.get("ac_fresh")) return cached.code;
  var fresh = null;
  try { fresh = academyDownload_(); } catch (e) { fresh = null; }
  if (fresh) {
    academyToCache_(cache, fresh);
    try { academySaveBackup_(fresh); } catch (e) { /* unavailable before the teacher grants permission */ }
    return fresh.code;
  }
  if (cached) {
    cache.put("ac_fresh", "1", 300);
    return cached.code;
  }
  try { return academyReadBackup_(); } catch (e) { return null; }
}

function academyDownload_() {
  var r = UrlFetchApp.fetch(ACADEMY_LOADER.site + "apps-script/bundle.js?t=" + Date.now(), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  var code = r.getContentText("UTF-8");
  var m = code.match(/^\/\/ 3D Design Academy bundle ([\w.-]+)/);
  if (!m) return null;
  return { version: m[1], code: code };
}

var ACADEMY_CHUNK_ = 90000;

function academyToCache_(cache, bundle) {
  var text = Utilities.base64Encode(bundle.code, Utilities.Charset.UTF_8);
  var parts = {};
  var count = 0;
  for (var i = 0; i < text.length; i += ACADEMY_CHUNK_) parts["ac_" + count++] = text.slice(i, i + ACADEMY_CHUNK_);
  parts.ac_n = String(count);
  parts.ac_v = bundle.version;
  cache.putAll(parts, 21600);
  cache.put("ac_fresh", "1", 1800);
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
  return {
    version: got.ac_v,
    code: Utilities.newBlob(Utilities.base64Decode(text, Utilities.Charset.UTF_8)).getDataAsString("UTF-8"),
  };
}

function academyRefresh_() {
  var cache = CacheService.getScriptCache();
  cache.removeAll(["ac_fresh", "ac_n"]);
  var fresh = academyDownload_();
  if (!fresh) return null;
  academyToCache_(cache, fresh);
  try { academySaveBackup_(fresh); } catch (e) { /* the cached copy is still usable */ }
  return fresh.version;
}

function academyBook_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  var id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  return id ? SpreadsheetApp.openById(id) : null;
}

function academySaveBackup_(bundle) {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty("AC_BACKUP") === bundle.version) return;
  var ss = academyBook_();
  if (!ss) return;
  var sh = ss.getSheetByName("_app_backup") || ss.insertSheet("_app_backup");
  sh.hideSheet();
  sh.clear();
  var cells = [];
  for (var i = 0; i < bundle.code.length; i += 45000) cells.push([bundle.code.slice(i, i + 45000)]);
  sh.getRange(1, 1, cells.length, 1).setNumberFormat("@").setValues(cells);
  props.setProperty("AC_BACKUP", bundle.version);
}

function academyReadBackup_() {
  var ss = academyBook_();
  var sh = ss && ss.getSheetByName("_app_backup");
  if (!sh || sh.getLastRow() < 1) return null;
  return sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(function (row) { return String(row[0]); }).join("");
}

function academyNotLoaded_() {
  return "3D Design Academy couldn't load (" + (ACADEMY_ERROR_ ? ACADEMY_ERROR_.message || ACADEMY_ERROR_ : "the website didn't answer") + "). Try again in a minute.";
}

// Google invokes only named top-level functions, so the permanent loader declares every entry point.
function onOpen() {
  SpreadsheetApp.getUi().createMenu("3D Design Academy").addItem("Set up & class links", "showSidebar").addToUi();
}
function showSidebar() {
  SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutput("<p style=\"font:14px system-ui;padding:12px\">" + academyNotLoaded_() + "</p>").setTitle("3D Design Academy"));
}
function doGet() { return ContentService.createTextOutput(academyNotLoaded_()); }
function doPost() { return ContentService.createTextOutput(JSON.stringify({ ok: false, error: academyNotLoaded_() })).setMimeType(ContentService.MimeType.JSON); }
function setup() { throw new Error(academyNotLoaded_()); }
function sidebarState() { throw new Error(academyNotLoaded_()); }
function sidebarAutoSetup() { throw new Error(academyNotLoaded_()); }
function sidebarPrepare() { throw new Error(academyNotLoaded_()); }
function sidebarSaveSettings() { throw new Error(academyNotLoaded_()); }
function sidebarCreateClass() { throw new Error(academyNotLoaded_()); }
function sidebarUpdate() { throw new Error(academyNotLoaded_()); }

(function academyLoad_() {
  var code = null;
  try { code = academyGetCode_(); } catch (e) { ACADEMY_ERROR_ = e; }
  if (!code) return;
  try { (0, eval)(code); } catch (e) { ACADEMY_ERROR_ = e; }
})();
