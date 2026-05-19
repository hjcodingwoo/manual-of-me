const CLAUDE_API_KEY = "YOUR_CLAUDE_API_KEY";
const GMAIL_USER = "adminonly.noreply@gmail.com";
const SHEET_ID = "1x0qaZuHAM06drEOT30dWogRkQPhsZ77h8S37QRcv1fk";
const SHEET_NAME = "themanualofme";

const QUESTIONS = [
  "Conditions I like to work in",
  "Times/Hours I like to work",
  "The best ways to communicate with me",
  "The ways I like to receive feedback",
  "Things I need",
  "Things I struggle with",
  "Things I love",
  "Other things to know about me",
  "My favorites",
  "Guilty pleasure",
  "Dietary restrictions",
  "Hobbies",
  "Personality type (MBTI or other)"
];

function doPost(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    if (action === "refine") return refineText(params.rawText, params.questionTitle);
    if (action === "saveAllResponses") return saveAllResponses(params.name, JSON.parse(params.responses), params.company);
    if (action === "saveResponse") return saveResponse(params.name, params.questionIndex, params.rawText, params.refinedText);
    if (action === "createUser") return createUser(params.name, params.email, params.company);
    if (action === "sendEmail") return sendManualEmail(params.name, params.email, JSON.parse(params.responses));
    if (action === "getUsers") return getUsers();
    if (action === "getUserResponses") return getUserResponses(params.name, params.company);
    if (action === "getQuestionResponses") return getQuestionResponses(params.questionIndex);
    if (action === "analyzeQuestion") return analyzeQuestion(params.questionIndex, JSON.parse(params.responses));
    if (action === "getCompany") return getCompany(params.slug);
    if (action === "getCompanies") return getCompanies();
    if (action === "saveCompany") return saveCompany(params.slug, params.company_name, params.logo_url, params.primary_color, params.secondary_color, params.tertiary_color);
    if (action === "toggleCompany") return toggleCompany(params.slug, params.status);
    if (action === "logUsage") return logUsage(params.company, params.event, params.name);
    return ContentService.createTextOutput(JSON.stringify({ error: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function refineText(rawText, questionTitle) {
  const prompt = `Clean up these raw notes into 2-3 clear sentences. Keep the person's exact words where possible. Do not add warmth, emotion, or personality that isn't already in the input. Do not interpret — only clarify and tighten. Output only the sentences, no preamble, no introduction.

Question context: ${questionTitle}

Raw notes:
${rawText}`;

  const payload = { model: "claude-haiku-4-5-20251001", max_tokens: 150, messages: [{ role: "user", content: prompt }] };
  const options = { method: "post", headers: { "Content-Type": "application/json", "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01" }, payload: JSON.stringify(payload), muteHttpExceptions: true };
  try {
    const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", options);
    const result = JSON.parse(response.getContentText());
    if (result.content && result.content[0]) return ContentService.createTextOutput(JSON.stringify({ refined: result.content[0].text })).setMimeType(ContentService.MimeType.JSON);
    return ContentService.createTextOutput(JSON.stringify({ error: "API error: " + JSON.stringify(result) })).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Fetch error: " + e.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// FIX: company param now properly received and saved as column 6
function saveAllResponses(name, responses, company) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["name", "questionIndex", "rawText", "refinedText", "timestamp", "company"]);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(["name", "questionIndex", "rawText", "refinedText", "timestamp", "company"]);
  }
  const timestamp = new Date().toISOString();
  const rows = responses.map(function(r, i) {
    return [name, i, r.raw || '', r.refined || r.raw || '', timestamp, company || ''];
  });
  if (rows.length > 0) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 6).setValues(rows);
  if (company) logUsage(company, 'publish', name);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function saveResponse(name, questionIndex, rawText, refinedText) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  sheet.appendRow([name, questionIndex, rawText, refinedText, new Date().toISOString()]);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function createUser(name, email, company) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("Users");
  if (!sheet) sheet = ss.insertSheet("Users");
  if (sheet.getLastRow() === 0) sheet.appendRow(["name", "email", "createdAt", "company"]);
  const existing = sheet.getDataRange().getValues();
  const nameLower = (name || '').toLowerCase();
  for (let i = 1; i < existing.length; i++) {
    if ((existing[i][0] || '').toLowerCase() === nameLower) {
      if (email && !existing[i][1]) sheet.getRange(i + 1, 2).setValue(email);
      return ContentService.createTextOutput(JSON.stringify({ success: true, exists: true })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  sheet.appendRow([name, email || "", new Date().toISOString(), company || ""]);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

// FIX: removed fake "from" domain — sends from actual Gmail account
function sendManualEmail(name, email, responses) {
  if (!email) return ContentService.createTextOutput(JSON.stringify({ error: "No email" })).setMimeType(ContentService.MimeType.JSON);
  const subject = "Your Manual of Me — " + name;
  let body = '<html><body style="font-family:Georgia,serif;color:#1a1a18;max-width:600px;margin:0 auto">';
  body += '<div style="background:#1a1a18;padding:2rem;border-radius:12px 12px 0 0;text-align:center"><h1 style="color:#FFBF00;margin:0;font-size:24px">Manual of Me</h1></div>';
  body += '<div style="padding:2rem;background:white;border:1px solid #e8e4da;border-top:none;border-radius:0 0 12px 12px">';
  body += '<p>Hi <strong>' + name + '</strong>,</p>';
  body += '<p style="color:#888;font-size:14px">Here\'s a copy of your Manual of Me.</p>';
  body += '<div style="border-top:1px solid #f0f0f0;padding-top:1.5rem;margin-top:1rem">';
  responses.forEach(function(resp, i) {
    if (!QUESTIONS[i]) return;
    body += '<div style="margin-bottom:1.5rem"><h3 style="font-size:12px;font-weight:bold;color:#FF7900;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 0.5rem">' + (i+1) + '. ' + QUESTIONS[i] + '</h3>';
    body += '<p style="font-size:14px;line-height:1.7;margin:0">' + (resp || 'no answer') + '</p></div>';
  });
  body += '</div>';
  body += '<div style="text-align:center;margin-top:1.5rem"><a href="https://themanualofme.vercel.app/profile/' + encodeURIComponent(name) + '" style="display:inline-block;padding:0.75rem 1.5rem;background:#FF7900;color:white;border-radius:8px;text-decoration:none;font-weight:bold">View My Profile</a></div>';
  body += '</div></body></html>';
  try {
    GmailApp.sendEmail(email, subject, "", { htmlBody: body });
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Email failed: " + e.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getUsers() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Users");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ users: [] })).setMimeType(ContentService.MimeType.JSON);
  const data = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < data.length; i++) users.push({ name: data[i][0], email: data[i][1], createdAt: data[i][2], company: data[i][3] });
  return ContentService.createTextOutput(JSON.stringify({ users })).setMimeType(ContentService.MimeType.JSON);
}

// FIX: case-insensitive name matching
function getUserResponses(name, company) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const responses = {};
  const nameLower = (name || '').toLowerCase();
  data.forEach(function(row, i) {
    if (i === 0) return;
    const rowCompany = row[5] || '';
    const companyMatch = !company || !rowCompany || rowCompany.toLowerCase() === company.toLowerCase();
    if ((row[0] || '').toLowerCase() === nameLower && companyMatch) {
      responses[row[1]] = { raw: row[2], refined: row[3] };
    }
  });
  return ContentService.createTextOutput(JSON.stringify({ responses })).setMimeType(ContentService.MimeType.JSON);
}

function getQuestionResponses(questionIndex) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const responses = [];
  data.forEach(function(row, i) {
    if (i === 0) return;
    if (row[1] == questionIndex) responses.push({ name: row[0], refined: row[3] });
  });
  return ContentService.createTextOutput(JSON.stringify({ responses })).setMimeType(ContentService.MimeType.JSON);
}

// FIX: shorter prompts = faster response (<30 seconds)
function analyzeQuestion(questionIndex, responses) {
  let prompt;
  if (questionIndex == -1) {
    const allText = responses[0] ? responses[0].refined : "";
    prompt = "Analyze these personal operating manuals. Plain prose only, no markdown, no asterisks. 3 short paragraphs: (1) what this team has in common, (2) key differences, (3) one concrete recommendation. Max 120 words.\n\n" + allText;
  } else {
    const questionTitle = QUESTIONS[questionIndex] || ("Question " + questionIndex);
    const allAnswers = responses.map(function(r) { return r.name + ": " + (r.refined || r.raw || 'no answer'); }).join("\n");
    prompt = "Question: " + questionTitle + "\n\nResponses:\n" + allAnswers + "\n\nPlain prose only, no markdown. 3 sentences: (1) common theme, (2) key difference, (3) one tip. Max 80 words.";
  }
  const payload = { model: "claude-haiku-4-5-20251001", max_tokens: 200, messages: [{ role: "user", content: prompt }] };
  const options = { method: "post", headers: { "Content-Type": "application/json", "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01" }, payload: JSON.stringify(payload), muteHttpExceptions: true };
  try {
    const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", options);
    const result = JSON.parse(response.getContentText());
    if (result.content && result.content[0]) return ContentService.createTextOutput(JSON.stringify({ analysis: result.content[0].text })).setMimeType(ContentService.MimeType.JSON);
    return ContentService.createTextOutput(JSON.stringify({ error: "API error: " + JSON.stringify(result) })).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Fetch error: " + e.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getCompany(slug) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("Companies");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: "No companies sheet" })).setMimeType(ContentService.MimeType.JSON);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if ((data[i][0] || '').toLowerCase() === (slug || '').toLowerCase()) {
      return ContentService.createTextOutput(JSON.stringify({ company: {
        slug: data[i][0], company_name: data[i][1], logo_url: data[i][2],
        primary_color: data[i][3], secondary_color: data[i][4], tertiary_color: data[i][5] || '#fffdf5',
        status: data[i][6] || 'active', user_count: data[i][7] || 0, refine_count: data[i][8] || 0
      }})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ error: "Company not found" })).setMimeType(ContentService.MimeType.JSON);
}

function getCompanies() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("Companies");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ companies: [] })).setMimeType(ContentService.MimeType.JSON);
  const data = sheet.getDataRange().getValues();
  const companies = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    companies.push({ slug:data[i][0], company_name:data[i][1], logo_url:data[i][2], primary_color:data[i][3], secondary_color:data[i][4], tertiary_color:data[i][5]||'#fffdf5', status:data[i][6]||'active', user_count:data[i][7]||0, refine_count:data[i][8]||0 });
  }
  return ContentService.createTextOutput(JSON.stringify({ companies })).setMimeType(ContentService.MimeType.JSON);
}

// FIX: now saves tertiary_color as column 6, shifted status/counts to 7/8/9
function saveCompany(slug, company_name, logo_url, primary_color, secondary_color, tertiary_color) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("Companies");
  if (!sheet) {
    sheet = ss.insertSheet("Companies");
    sheet.appendRow(["slug","company_name","logo_url","primary_color","secondary_color","tertiary_color","status","user_count","refine_count","created_at"]);
  }
  const data = sheet.getDataRange().getValues();
  const slugLower = (slug || '').toLowerCase();
  for (let i = 1; i < data.length; i++) {
    if ((data[i][0] || '').toLowerCase() === slugLower) {
      sheet.getRange(i+1, 1, 1, 6).setValues([[slug, company_name, logo_url||'', primary_color||'#FF7900', secondary_color||'#FFBF00', tertiary_color||'#fffdf5']]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, updated: true })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  sheet.appendRow([slug, company_name, logo_url||'', primary_color||'#FF7900', secondary_color||'#FFBF00', tertiary_color||'#fffdf5', 'active', 0, 0, new Date().toISOString()]);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function toggleCompany(slug, status) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Companies");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: "No companies sheet" })).setMimeType(ContentService.MimeType.JSON);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if ((data[i][0]||'').toLowerCase() === (slug||'').toLowerCase()) { sheet.getRange(i+1, 7).setValue(status); break; }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function logUsage(company, event, name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("UsageLog");
  if (!sheet) {
    sheet = ss.insertSheet("UsageLog");
    sheet.appendRow(["timestamp","company","event","name"]);
  }
  sheet.appendRow([new Date().toISOString(), company||'', event||'', name||'']);
  const companiesSheet = ss.getSheetByName("Companies");
  if (companiesSheet && company) {
    const data = companiesSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if ((data[i][0]||'').toLowerCase() === company.toLowerCase()) {
        if (event === 'publish') companiesSheet.getRange(i+1, 8).setValue((data[i][7]||0) + 1);
        if (event === 'refine') companiesSheet.getRange(i+1, 9).setValue((data[i][8]||0) + 1);
        break;
      }
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

// RUN THIS FUNCTION IN APPS SCRIPT TO TEST YOUR API KEY
// Click the dropdown next to Run button, select "testClaudeAPI", then click Run
function testClaudeAPI() {
  const payload = { model: "claude-haiku-4-5-20251001", max_tokens: 20, messages: [{ role: "user", content: "Say hi" }] };
  const options = { method: "post", headers: { "Content-Type": "application/json", "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01" }, payload: JSON.stringify(payload), muteHttpExceptions: true };
  const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", options);
  const result = JSON.parse(response.getContentText());
  Logger.log("API TEST RESULT: " + JSON.stringify(result));
  if (result.content) Logger.log("SUCCESS: " + result.content[0].text);
  else Logger.log("FAILED: " + result.error?.message);
}
