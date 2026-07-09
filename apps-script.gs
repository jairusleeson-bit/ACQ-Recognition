/**
 * ACQ Recognition — Google Sheets capture endpoint
 * ---------------------------------------------------------------------------
 * Bridges the (static) GitHub Pages dashboard to your Google Sheet: every time
 * someone submits a recognition, the page POSTs it here and a row is appended.
 *
 * The dashboard's Sheet columns are matched BY HEADER NAME, so it does not
 * matter which column each header sits in (your sheet has a blank column A —
 * that's fine, the data lands under the right headers regardless).
 *
 * ── SETUP ──────────────────────────────────────────────────────────────────
 * 1. Open the Google Sheet → Extensions → Apps Script.
 * 2. Delete the starter code, paste this whole file, click Save.
 * 3. Deploy → New deployment → gear icon → "Web app".
 *       Description:      ACQ Recognition capture
 *       Execute as:       Me
 *       Who has access:   Anyone
 *    Click Deploy, authorize when prompted, and COPY the Web app URL
 *    (it ends in /exec).
 * 4. Paste that URL into index.html as SHEETS_WEBAPP_URL, commit & push.
 *
 * After that, every recognition given on the site appends a row here.
 * ───────────────────────────────────────────────────────────────────────────
 */

// Header labels exactly as they appear in the sheet (matched case-insensitively).
var FIELD_TO_HEADER = {
  firstName:      'First Name',
  lastName:       'Last name',
  senderEmail:    'Sender_email',
  recipientEmail: 'Recipient_email',
  value:          'Value',
  note:           'Note',
  tokens:         'Tokens'
};

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
      return String(h).trim().toLowerCase();
    });

    // Build a row aligned to the existing header columns.
    var row = new Array(header.length).fill('');
    var matched = 0;
    Object.keys(FIELD_TO_HEADER).forEach(function (field) {
      var target = FIELD_TO_HEADER[field].toLowerCase();
      var col = header.indexOf(target);
      if (col !== -1) { row[col] = data[field] != null ? data[field] : ''; matched++; }
    });

    // Empty / header-less sheet: lay down headers, then the row, in canonical order.
    if (matched === 0) {
      var order = ['firstName', 'lastName', 'senderEmail', 'recipientEmail', 'value', 'note', 'tokens'];
      sheet.appendRow(order.map(function (f) { return FIELD_TO_HEADER[f]; }));
      sheet.appendRow(order.map(function (f) { return data[f] != null ? data[f] : ''; }));
      return json_({ ok: true });
    }

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Optional: GET returns every row as JSON (handy if you later want the live
// site to read the feed back from the sheet instead of the demo data).
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() < 2) return json_([]);
  var values = sheet.getDataRange().getValues();
  var head = values.shift();
  var rows = values.map(function (r) {
    var o = {};
    head.forEach(function (h, i) { if (String(h).trim()) o[String(h).trim()] = r[i]; });
    return o;
  });
  return json_(rows);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
