/**
 * Chat Service — RAG (Retrieval-Augmented Generation) pipeline
 *
 * 1. Parses the user's natural language question
 * 2. Queries MongoDB for relevant logs, metrics, and alerts
 * 3. Builds a context prompt with the real data
 * 4. Sends the prompt to Google Gemini for a plain-English answer
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const Log = require("../models/Log");
const Metric = require("../models/Metric");
const Alert = require("../models/Alert");
const Server = require("../models/Server");

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Extract time window from the user's question.
 * Returns a Date object for the "since" boundary.
 */
function parseTimeWindow(question) {
  const q = question.toLowerCase();

  const minuteMatch = q.match(/(\d+)\s*min/);
  if (minuteMatch) {
    return new Date(Date.now() - parseInt(minuteMatch[1]) * 60 * 1000);
  }

  const hourMatch = q.match(/(\d+)\s*hour/);
  if (hourMatch) {
    return new Date(Date.now() - parseInt(hourMatch[1]) * 60 * 60 * 1000);
  }

  const dayMatch = q.match(/(\d+)\s*day/);
  if (dayMatch) {
    return new Date(Date.now() - parseInt(dayMatch[1]) * 24 * 60 * 60 * 1000);
  }

  if (q.includes("last hour") || q.includes("past hour")) {
    return new Date(Date.now() - 60 * 60 * 1000);
  }

  if (q.includes("today")) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Default: last 6 hours
  return new Date(Date.now() - 6 * 60 * 60 * 1000);
}

/**
 * Try to extract a serverId from the question.
 * Matches things like "server prod-api-01", "on Ishan", "srv-001", hostname patterns.
 */
function extractServerId(question) {
  // Look for common server name patterns
  const patterns = [
    /server\s+["']?([a-zA-Z0-9_-]+)["']?/i,
    /on\s+["']?([a-zA-Z0-9_-]+)["']?/i,
    /from\s+["']?([a-zA-Z0-9_-]+)["']?/i,
    /(srv-\d+)/i,
    /(prod-[a-zA-Z0-9_-]+)/i,
    /(staging-[a-zA-Z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) {
      const candidate = match[1];
      // Filter out common English words that aren't server IDs
      const stopWords = [
        "the", "a", "an", "this", "that", "my", "our", "last", "past",
        "hour", "minute", "server", "servers", "alert", "alerts", "log",
        "logs", "error", "errors", "why", "what", "how", "did", "is",
        "was", "were", "are", "been", "being", "have", "has", "had",
        "it", "its", "me", "all", "any", "each", "every",
      ];
      if (!stopWords.includes(candidate.toLowerCase())) {
        return candidate;
      }
    }
  }
  return null;
}

/**
 * Detect the user's intent to decide which collections to query.
 */
function detectIntent(question) {
  const q = question.toLowerCase();

  const intents = [];

  if (/log|error|warning|critical|message|exception|trace|crash/i.test(q)) {
    intents.push("logs");
  }
  if (/metric|cpu|memory|disk|usage|performance|load|resource/i.test(q)) {
    intents.push("metrics");
  }
  if (/alert|anomaly|incident|trigger|notify|notification|alarm/i.test(q)) {
    intents.push("alerts");
  }
  if (/server|infra|infrastructure|machine|node|host|uptime/i.test(q)) {
    intents.push("servers");
  }

  // If nothing specific matched, query everything
  if (intents.length === 0) {
    intents.push("logs", "metrics", "alerts");
  }

  return intents;
}

// ── Data Retrieval ───────────────────────────────────────────────────

async function fetchRelevantData(question) {
  const since = parseTimeWindow(question);
  const serverId = extractServerId(question);
  const intents = detectIntent(question);

  const context = { since: since.toISOString(), serverId, intents };

  // Build MongoDB filters
  const timeFilter = { timestamp: { $gte: since } };
  const serverFilter = serverId ? { serverId: { $regex: serverId, $options: "i" } } : {};

  const results = {};

  if (intents.includes("logs")) {
    results.logs = await Log.find({ ...timeFilter, ...serverFilter })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
  }

  if (intents.includes("metrics")) {
    results.metrics = await Metric.find({ ...timeFilter, ...serverFilter })
      .sort({ timestamp: -1 })
      .limit(30)
      .lean();
  }

  if (intents.includes("alerts")) {
    results.alerts = await Alert.find({ ...timeFilter })
      .sort({ timestamp: -1 })
      .limit(30)
      .lean();
  }

  if (intents.includes("servers")) {
    if (serverId) {
      results.servers = await Server.find({ serverId: { $regex: serverId, $options: "i" } })
        .lean();
    } else {
      results.servers = await Server.find({}).lean();
    }
  }

  return { context, results };
}

// ── Prompt Builder ───────────────────────────────────────────────────

function buildPrompt(question, { context, results }) {
  let dataSection = "";

  if (results.logs && results.logs.length > 0) {
    const logSummary = results.logs.map(
      (l) => `  [${l.timestamp}] ${l.severity} | ${l.serviceName} | ${l.serverId || "N/A"} | ${l.message}`
    ).join("\n");
    dataSection += `\n### Recent Logs (${results.logs.length} entries since ${context.since}):\n${logSummary}\n`;
  } else if (context.intents.includes("logs")) {
    dataSection += "\n### Recent Logs: No logs found in the specified time window.\n";
  }

  if (results.metrics && results.metrics.length > 0) {
    const metricSummary = results.metrics.map(
      (m) => `  [${m.timestamp}] Server: ${m.serverId} | CPU: ${m.cpuUsage}% | Memory: ${m.memoryUsage}% | Disk: ${m.diskUsage}%`
    ).join("\n");
    dataSection += `\n### Recent Metrics (${results.metrics.length} readings since ${context.since}):\n${metricSummary}\n`;
  } else if (context.intents.includes("metrics")) {
    dataSection += "\n### Recent Metrics: No metric data found in the specified time window.\n";
  }

  if (results.alerts && results.alerts.length > 0) {
    const alertSummary = results.alerts.map(
      (a) => `  [${a.timestamp}] ${a.severity} | Type: ${a.type} | ${a.message} | Resolved: ${a.resolved}`
    ).join("\n");
    dataSection += `\n### Recent Alerts (${results.alerts.length} alerts since ${context.since}):\n${alertSummary}\n`;
  } else if (context.intents.includes("alerts")) {
    dataSection += "\n### Recent Alerts: No alerts found in the specified time window.\n";
  }

  if (results.servers && results.servers.length > 0) {
    const serverSummary = results.servers.map(
      (s) => `  ${s.serverId} | Name: ${s.name} | IP: ${s.ipAddress} | Status: ${s.status} | OS: ${s.os} | Last Seen: ${s.lastSeen}`
    ).join("\n");
    dataSection += `\n### Server Info:\n${serverSummary}\n`;
  }

  const systemPrompt = `You are NexusOps AI Assistant — an intelligent DevOps monitoring chatbot.
You analyze real-time infrastructure data from a monitoring platform that tracks server metrics (CPU, Memory, Disk), application logs, and ML-detected anomaly alerts.

Your responsibilities:
- Answer questions about server health, log patterns, and alert triggers
- Provide root cause analysis when anomalies are detected
- Summarize trends and patterns in the data
- Give actionable recommendations for DevOps engineers
- If no relevant data is found, say so honestly and suggest what the user can check

Formatting rules:
- Keep responses concise but thorough (2-4 paragraphs max)
- Use bullet points for lists
- Bold key metrics and server names
- If referencing timestamps, convert to human-readable format
- Do NOT make up data that isn't in the context provided below

${dataSection}

Now answer the following user question based on the data above:`;

  return { systemPrompt, userMessage: question };
}

// ── LLM Call ─────────────────────────────────────────────────────────

async function callGemini(systemPrompt, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your backend/.env file. Get a free key from https://aistudio.google.com/apikey"
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userMessage);
  const response = result.response;
  return response.text();
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Main entry point — takes a user question, fetches data, calls LLM, returns answer.
 */
async function getAIResponse(question) {
  // 1. Fetch relevant data from MongoDB
  const data = await fetchRelevantData(question);

  // 2. Build the context-enriched prompt
  const { systemPrompt, userMessage } = buildPrompt(question, data);

  // 3. Call Google Gemini
  const aiResponse = await callGemini(systemPrompt, userMessage);

  return {
    answer: aiResponse,
    context: {
      dataQueried: data.context.intents,
      timeWindow: data.context.since,
      serverId: data.context.serverId,
      logsFound: data.results.logs?.length ?? 0,
      metricsFound: data.results.metrics?.length ?? 0,
      alertsFound: data.results.alerts?.length ?? 0,
    },
  };
}

module.exports = { getAIResponse };
