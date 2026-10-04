/**
 * 3D Design Academy — the only script file in your Sheet.
 *
 * Paste this whole file as "Code" (delete any Lib, Content or Sidebar files). You never need to edit it again:
 * it downloads the app from the website, keeps a copy, and picks up new versions on its own (within 30 minutes).
 *
 * How it works: the app code is cached for 6 hours and re-checked every 30 minutes. If the website can't be
 * reached, it keeps using the cached copy, then a backup saved in a hidden tab of this Sheet.
 */
var ACADEMY_LOADER = { site: "", loader: 1 }; // @loader

var ACADEMY_ERROR_ = null;

function academyGetCode_() {
  var cache = CacheService.getScriptCache();
  var cached = academyFromCache_(cache);
  if (cached && cache.get("ac_fresh")) return cached.code;
  var fresh = null;
  try { fresh = academyDownload_(); } catch (e) { fresh = null; } // e.g. onOpen before permissions, or the site is down
  if (fresh) {
    academyToCache_(cache, fresh);
    try { academySaveBackup_(fresh); } catch (e) { /* not allowed in this context; next run saves it */ }
    return fresh.code;
  }
  if (cached) { cache.put("ac_fresh", "1", 300); return cached.code; } // try the site again in 5 minutes
  var backup = null;
  try { backup = academyReadBackup_(); } catch (e) { backup = null; }
  return backup;
}

function academyDownload_() {
  var r = UrlFetchApp.fetch(ACADEMY_LOADER.site + "apps-script/bundle.js?t=" + Date.now(), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  var code = r.getContentText("UTF-8");
  var m = code.match(/^\/\/ 3D Design Academy bundle ([\w.-]+)/);
  if (!m) return null; // not our file (an error page, a captive portal…)
  return { version: m[1], code: code };
}

// Cache values are limited to 100 KB, so the code is stored base64-encoded in pieces.
var ACADEMY_CHUNK_ = 90000;

function academyToCache_(cache, b) {
  var text = Utilities.base64Encode(b.code, Utilities.Charset.UTF_8);
  var parts = {};
  var n = 0;
  for (var i = 0; i < text.length; i += ACADEMY_CHUNK_) parts["ac_" + n++] = text.slice(i, i + ACADEMY_CHUNK_);
  parts.ac_n = String(n);
  parts.ac_v = b.version;
  cache.putAll(parts, 21600);
  cache.put("ac_fresh", "1", 1800);
}

function academyFromCache_(cache) {
  var keys = ["ac_n", "ac_v"];
  for (var i = 0; i < 12; i++) keys.push("ac_" + i);
  var got = cache.getAll(keys);
  var n = Number(got.ac_n || 0);
  if (!n) return null;
  var text = "";
  for (var j = 0; j < n; j++) {
    if (got["ac_" + j] == null) return null;
    text += got["ac_" + j];
  }
  return { version: got.ac_v, code: Utilities.newBlob(Utilities.base64Decode(text, Utilities.Charset.UTF_8)).getDataAsString("UTF-8") };
}

/** Clears the cached code so the next request downloads the newest version (the "Update now" button). */
function academyRefresh_() {
  var cache = CacheService.getScriptCache();
  cache.removeAll(["ac_fresh", "ac_n"]);
  var fresh = academyDownload_();
  if (!fresh) return null;
  academyToCache_(cache, fresh);
  try { academySaveBackup_(fresh); } catch (e) { /* ignore */ }
  return fresh.version;
}

// Backup in a hidden tab, written only when the version changes (a cell holds up to 50,000 characters).
function academyBook_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  var id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  return id ? SpreadsheetApp.openById(id) : null;
}

function academySaveBackup_(b) {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty("AC_BACKUP") === b.version) return;
  var ss = academyBook_();
  if (!ss) return;
  var sh = ss.getSheetByName("_app_backup") || ss.insertSheet("_app_backup");
  sh.hideSheet();
  sh.clear();
  var cells = [];
  for (var i = 0; i < b.code.length; i += 45000) cells.push([b.code.slice(i, i + 45000)]);
  sh.getRange(1, 1, cells.length, 1).setNumberFormat("@").setValues(cells); // plain text: never read as a formula
  props.setProperty("AC_BACKUP", b.version);
}

function academyReadBackup_() {
  var ss = academyBook_();
  var sh = ss && ss.getSheetByName("_app_backup");
  if (!sh || sh.getLastRow() < 1) return null;
  return sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(function (r) { return String(r[0]); }).join("");
}

function academyNotLoaded_() {
  return "3D Design Academy couldn't load (" + (ACADEMY_ERROR_ ? ACADEMY_ERROR_.message || ACADEMY_ERROR_ : "the website didn't answer") + "). Try again in a minute.";
}

/*
 * Entry points. Google only calls functions written in this file, so each one is listed here.
 * When the app loads, its own versions replace these. These only run if it couldn't load.
 */
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

// Load last, after every setting above has its value.
(function academyLoad_() {
  var code = null;
  try { code = academyGetCode_(); } catch (e) { ACADEMY_ERROR_ = e; }
  if (!code) return;
  try { (0, eval)(code); } catch (e) { ACADEMY_ERROR_ = e; }
})();
