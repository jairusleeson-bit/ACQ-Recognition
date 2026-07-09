/**
 * ACQ Recognition — Google Sheets capture endpoint
 * ---------------------------------------------------------------------------
 * Bridges the (static) GitHub Pages dashboard to the Google Sheet: every time
 * someone submits a recognition, the page POSTs it here and a row is appended.
 *
 * Robust by design:
 *   - Opens the sheet by ID (works whether the script is bound or standalone).
 *   - Matches columns BY HEADER NAME (your sheet's blank column A is fine).
 *   - doGet lets you test the deployment by opening the /exec URL in a browser.
 *
 * ── SETUP ──────────────────────────────────────────────────────────────────
 * 1. Set SHEET_ID below to your spreadsheet's id (the long string in its URL:
 *    docs.google.com/spreadsheets/d/<THIS_PART>/edit).
 * 2. Apps Script editor → paste this whole file → Save.
 * 3. Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy
 *    (keeps the same /exec URL). Web app settings: Execute as = Me,
 *    Who has access = Anyone.
 * 4. Test: open the /exec URL in a browser — you should see
 *    {"ok":true,"message":"ACQ Recognition endpoint is live","rows":0}
 * ───────────────────────────────────────────────────────────────────────────
 */

var SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';

var FIELD_TO_HEADER = {
  firstName:      'First Name',
  lastName:       'Last name',
  senderEmail:    'Sender_email',
  recipientEmail: 'Recipient_email',
  value:          'Value',
  note:           'Note',
  tokens:         'Tokens',
  department:     'Department'   // optional: add a "Department" column header to capture it
};

function sheet_() {
  return SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = sheet_();
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
      return String(h).trim().toLowerCase();
    });

    var row = new Array(header.length).fill('');
    var matched = 0;
    Object.keys(FIELD_TO_HEADER).forEach(function (field) {
      var col = header.indexOf(FIELD_TO_HEADER[field].toLowerCase());
      if (col !== -1) { row[col] = data[field] != null ? data[field] : ''; matched++; }
    });

    if (matched === 0) {
      var order = ['firstName', 'lastName', 'senderEmail', 'recipientEmail', 'value', 'note', 'tokens'];
      sheet.appendRow(order.map(function (f) { return FIELD_TO_HEADER[f]; }));
      sheet.appendRow(order.map(function (f) { return data[f] != null ? data[f] : ''; }));
    } else {
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// GET returns every row as JSON. Supports JSONP via ?callback=fn so the
// (cross-origin) dashboard can read the rows without a CORS preflight.
function doGet(e) {
  try {
    var sheet = sheet_();
    var data = [];
    if (sheet.getLastRow() >= 2) {
      var v = sheet.getDataRange().getValues();
      var h = v.shift().map(function (x) { return String(x).trim(); });
      data = v.map(function (r) { var o = {}; h.forEach(function (k, i) { if (k) o[k] = r[i]; }); return o; });
    }
    var out = { ok: true, message: 'ACQ Recognition endpoint is live', rows: data.length, data: data };
    var cb = e && e.parameter && e.parameter.callback;
    if (cb) return ContentService.createTextOutput(cb + '(' + JSON.stringify(out) + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
    return json_(out);
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
