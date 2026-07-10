/**
 * ACQ Recognition — Google Sheets capture endpoint + Slack notifier
 * ---------------------------------------------------------------------------
 * doPost  — appends each recognition submitted from the dashboard, then DMs
 *           the recognized person on Slack.
 * doGet   — returns all rows as JSON (JSONP via ?callback=) for the dashboard.
 *
 * DEPLOY (this is what fixes "only Jairus can submit"):
 *   Deploy → New deployment → Web app
 *     Execute as:      Me                <- always writes as the owner
 *     Who has access:  Anyone            <- anyone can submit, no login
 *   Copy the /exec URL and paste it into SHEETS_WEBAPP_URL in index.html.
 *
 * SLACK: set a Script Property named SLACK_BOT_TOKEN (Project Settings →
 *   Script Properties) to your bot token (xoxb-…). The token needs the
 *   users:lookupByEmail and chat:write scopes. Without it, writes still work
 *   and the Slack DM is simply skipped.
 */

var SHEET_ID = '1cInQmvvXQuAa8pwZFnAbj7BFnPbhlg1VIdkuqIKAY2k';
var DASHBOARD_URL = 'https://jairusleeson-bit.github.io/ACQ-Recognition/';

var FIELD_TO_HEADER = {
  firstName:      'First Name',
  lastName:       'Last name',
  senderEmail:    'Sender_email',
  recipientEmail: 'Recipient_email',
  value:          'Value',
  note:           'Note',
  tokens:         'Tokens',
  department:     'Department'
};

function sheet_() { return SpreadsheetApp.openById(SHEET_ID).getSheets()[0]; }

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = sheet_();
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var row = new Array(header.length).fill('');
    var matched = 0;
    Object.keys(FIELD_TO_HEADER).forEach(function (f) {
      var c = header.indexOf(FIELD_TO_HEADER[f].toLowerCase());
      if (c !== -1) { row[c] = data[f] != null ? data[f] : ''; matched++; }
    });
    if (matched === 0) {
      var order = ['firstName', 'lastName', 'senderEmail', 'recipientEmail', 'value', 'note', 'tokens', 'department'];
      sheet.appendRow(order.map(function (f) { return FIELD_TO_HEADER[f]; }));
      sheet.appendRow(order.map(function (f) { return data[f] != null ? data[f] : ''; }));
    } else {
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    }
    notifyRecipient_(data);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function notifyRecipient_(data) {
  try {
    var token = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');
    if (!token || !data.recipientEmail) return;
    var look = UrlFetchApp.fetch('https://slack.com/api/users.lookupByEmail?email=' + encodeURIComponent(data.recipientEmail),
      { method: 'get', headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
    var user = JSON.parse(look.getContentText());
    if (!user || !user.ok || !user.user) return;
    var uid = user.user.id;
    var name = String(data.firstName || '').trim() || 'there';
    var body = '*' + (data.value || 'Recognition') + '*'
      + (data.tokens ? '  ·  ' + data.tokens + ' tokens' : '')
      + (data.note ? '\n\n"' + data.note + '"' : '')
      + (data.senderEmail ? '\n\n— from ' + data.senderEmail : '');
    UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', {
      method: 'post', contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true,
      payload: JSON.stringify({
        channel: uid,
        text: name + ', you were just recognized for ' + (data.value || 'living the values') + '!',
        blocks: [
          { type: 'section', text: { type: 'mrkdwn', text: '🎉 *' + name + ', you were just recognized!*\n\n' + body } },
          { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Open the board' }, url: DASHBOARD_URL }] }
        ]
      })
    });
  } catch (err) {}
}

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
