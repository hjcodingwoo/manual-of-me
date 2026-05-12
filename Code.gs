const CLAUDE_API_KEY = "YOUR_CLAUDE_API_KEY";
const GMAIL_USER = "YOUR_EMAIL@gmail.com";
const SHEET_ID = "YOUR_SHEET_ID";
const SHEET_NAME = "Responses";

const QUESTIONS = [
  "Conditions I like to work in",
  "Times/Hours I like to work",
  "The best ways to communicate with me",
  "The ways I like to receive feedback",
  "Things I need",
  "Things I struggle with",
  "Things I love",
  "Other things to know about me"
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
    if (action === "saveCompany") return saveCompany(params.slug, params.company_name, params.logo_url, params.primary_color, params.secondary_color);
    if (action === "toggleCompany") return toggleCompany(params.slug, params.status);
    if (action === "logUsage") return logUsage(params.company, params.event, params.name);
    return ContentService.createTextOutput(JSON.stringify({ error: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function refineText(rawText, questionTitle) {
  const prompt = `You are a professional writer helping someone articulate their working style for their team.

Question: ${questionTitle}

Transform these raw notes into a warm, authentic paragraph (2-3 sentences, ~80 words max). Preserve their voice. Be specific. No jargon.

Output ONLY the paragraph. No preamble.

Raw notes:
${rawText}`;

  const payload = { model: "claude-haiku-4-5-20251001", max_tokens: 150, messages: [{ role: "user", content: prompt }] };
  const options = { method: "post", headers: { "Content-Type": "application/json", "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01" }, payload: JSON.stringify(payload), muteHttpExceptions: true };
  const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", options);
  const result = JSON.parse(response.getContentText());
  if (result.content && result.content[0]) return ContentService.createTextOutput(JSON.stringify({ refined: result.content[0].text })).setMimeType(ContentService.MimeType.JSON);
  return ContentService.createTextOutput(JSON.stringify({ error: "Failed: " + JSON.stringify(result) })).setMimeType(ContentService.MimeType.JSON);
}

function saveAllResponses(name, responses) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const timestamp = new Date().toISOString();
  const rows = responses.map((r, i) => [name, i, r.raw || '', r.refined || r.raw || '', timestamp]);
  if (rows.length > 0) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
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

function sendManualEmail(name, email, responses) {
  if (!email) return ContentService.createTextOutput(JSON.stringify({ error: "No email" })).setMimeType(ContentService.MimeType.JSON);
  const subject = "Your Manual of Me — " + name;
  let body = '<html><body style="font-family:Georgia,serif;color:#1a1a18;max-width:600px;margin:0 auto">';
  body += '<div style="background:#1a1a18;padding:2rem;border-radius:12px 12px 0 0;text-align:center"><h1 style="color:#FFBF00;margin:0;font-size:24px">Manual of Me</h1></div>';
  body += '<div style="padding:2rem;background:white;border:1px solid #e8e4da;border-top:none;border-radius:0 0 12px 12px">';
  body += '<p>Hi <strong>' + name + '</strong>,</p>';
  body += '<div style="border-top:1px solid #f0f0f0;padding-top:1.5rem;margin-top:1rem">';
  responses.forEach(function(resp, i) {
    body += '<div style="margin-bottom:1.5rem"><h3 style="font-size:12px;font-weight:bold;color:#FFBF00;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 0.5rem">' + (i+1) + '. ' + QUESTIONS[i] + '</h3>';
    body += '<p style="font-size:14px;line-height:1.7;margin:0">' + (resp || '<em style="color:#ccc">Not answered</em>') + '</p></div>';
  });
  body += '</div>';
  body += '<div style="text-align:center;margin-top:1.5rem"><a href="https://themanualofme.vercel.app/profile/' + encodeURIComponent(name) + '" style="display:inline-block;padding:0.75rem 1.5rem;background:#FFBF00;color:#1a1a18;border-radius:8px;text-decoration:none;font-weight:bold">View Profile</a></div>';
  body += '</div></body></html>';
  GmailApp.sendEmail(email, subject, "", { htmlBody: body, from: "Manual of Me <noreply@themanualofme.com>" });
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function getUsers() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Users");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ users: [] })).setMimeType(ContentService.MimeType.JSON);
  const data = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < data.length; i++) users.push({ name: data[i][0], email: data[i][1], createdAt: data[i][2] });
  return ContentService.createTextOutput(JSON.stringify({ users })).setMimeType(ContentService.MimeType.JSON);
}

function getUserResponses(name, company) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const responses = {};
  const nameLower = (name || '').toLowerCase();
  data.forEach(function(row, i) {
    if (i === 0) return;
    const rowCompany = row[5] || '';
    const companyMatch = !company || !rowCompany || rowCompany === company;
    if ((row[0] || '').toLowerCase() === nameLower && companyMatch) responses[row[1]] = { raw: row[2], refined: row[3] };
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

function analyzeQuestion(questionIndex, responses) {
  let prompt;
  if (questionIndex == -1) {
    const allText = responses[0] ? responses[0].refined : "";
    prompt = "Analyze these personal operating manuals from a team. Write in plain prose (no markdown, no asterisks, no headers).\n\n" + allText + "\n\nStructure as 3 short paragraphs:\nParagraph 1 - What this team has in common\nParagraph 2 - Key differences to be aware of\nParagraph 3 - One concrete recommendation for how this team should work together\n\nMax 200 words. Plain text only.";
  } else {
    const questionTitle = QUESTIONS[questionIndex];
    const allAnswers = responses.map(function(r) { return r.name + ": " + (r.refined || r.raw || ''); }).join("\n\n");
    prompt = "Analyze these team responses to the question: " + questionTitle + "\n\n" + allAnswers + "\n\nWrite a short analysis in plain prose (no markdown, no asterisks, no bullet points, no headers). Structure it as 3 short paragraphs:\n\nParagraph 1 - Common themes: what do most people share?\nParagraph 2 - Key differences: what contrasts stand out?\nParagraph 3 - Recommendation: one specific, actionable suggestion for this team.\n\nMax 180 words total. Plain text only.";
  }
  const payload = { model: "claude-haiku-4-5-20251001", max_tokens: 300, messages: [{ role: "user", content: prompt }] };
  const options = { method: "post", headers: { "Content-Type": "application/json", "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01" }, payload: JSON.stringify(payload), muteHttpExceptions: true };
  const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", options);
  const result = JSON.parse(response.getContentText());
  if (result.content && result.content[0]) return ContentService.createTextOutput(JSON.stringify({ analysis: result.content[0].text })).setMimeType(ContentService.MimeType.JSON);
  return ContentService.createTextOutput(JSON.stringify({ error: "Failed" })).setMimeType(ContentService.MimeType.JSON);
}

function getCompany(slug) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("Companies");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: "No companies sheet" })).setMimeType(ContentService.MimeType.JSON);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === slug) {
      return ContentService.createTextOutput(JSON.stringify({ company: {
        slug: data[i][0], company_name: data[i][1], logo_url: data[i][2],
        primary_color: data[i][3], secondary_color: data[i][4], status: data[i][5],
        user_count: data[i][6] || 0, refine_count: data[i][7] || 0
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
    companies.push({ slug:data[i][0], company_name:data[i][1], logo_url:data[i][2], primary_color:data[i][3], secondary_color:data[i][4], status:data[i][5]||'active', user_count:data[i][6]||0, refine_count:data[i][7]||0 });
  }
  return ContentService.createTextOutput(JSON.stringify({ companies })).setMimeType(ContentService.MimeType.JSON);
}

function saveCompany(slug, company_name, logo_url, primary_color, secondary_color) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("Companies");
  if (!sheet) {
    sheet = ss.insertSheet("Companies");
    sheet.appendRow(["slug","company_name","logo_url","primary_color","secondary_color","status","user_count","refine_count","created_at"]);
  }
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === slug) {
      sheet.getRange(i+1, 1, 1, 5).setValues([[slug, company_name, logo_url||'', primary_color||'#FF7900', secondary_color||'#FFBF00']]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, updated: true })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  sheet.appendRow([slug, company_name, logo_url||'', primary_color||'#FF7900', secondary_color||'#FFBF00', 'active', 0, 0, new Date().toISOString()]);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function toggleCompany(slug, status) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Companies");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: "No companies sheet" })).setMimeType(ContentService.MimeType.JSON);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === slug) { sheet.getRange(i+1, 6).setValue(status); break; }
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
  // Update counters in Companies sheet
  const companiesSheet = ss.getSheetByName("Companies");
  if (companiesSheet && company) {
    const data = companiesSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === company) {
        if (event === 'publish') companiesSheet.getRange(i+1, 7).setValue((data[i][6]||0) + 1);
        if (event === 'refine') companiesSheet.getRange(i+1, 8).setValue((data[i][7]||0) + 1);
        break;
      }
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}
