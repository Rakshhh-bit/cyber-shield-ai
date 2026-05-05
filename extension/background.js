const API_BASE = "http://localhost:5001/api";
const HIGH_RISK = "HIGH";
const MEDIUM_RISK = "MEDIUM";
const LOW_RISK = "LOW";
const EXECUTABLE_EXTENSIONS = /\.(exe|msi|dmg|pkg|scr|bat|cmd|ps1|apk|crx|jar|vbs|js)$/i;
const ARCHIVE_EXTENSIONS = /\.(zip|rar|7z|gz|iso)$/i;

const DEFAULT_SETTINGS = {
  autoScan: true,
  popupAlerts: true,
  gmailScan: true,
  safeSearch: true,
  pageBlocking: true,
  downloadScan: true,
};

const tabScanCache = new Map();

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(["settings"]);
  await chrome.storage.local.set({
    settings: { ...DEFAULT_SETTINGS, ...(stored.settings || {}) },
  });
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  const settings = await getSettings();
  if (!settings.autoScan || shouldSkipUrl(tab.url)) return;
  if (await hasTemporaryBypass(tab.url)) return;

  const result = await scanUrl(tab.url);
  await saveTabScan(tabId, tab.url, result);
  updateBadge(tabId, result.risk);

  if (settings.popupAlerts && (result.risk === HIGH_RISK || result.risk === MEDIUM_RISK)) {
    notify(
      result.risk === HIGH_RISK ? "Dangerous website detected" : "Suspicious website detected",
      result.explanation || "CyberShield found suspicious signals."
    );
  }

  if (result.risk === HIGH_RISK) {
    if (settings.pageBlocking && !tab.url.startsWith(chrome.runtime.getURL(""))) {
      const blockUrl = chrome.runtime.getURL("blocked.html") +
        `?url=${encodeURIComponent(tab.url)}&reason=${encodeURIComponent(result.explanation || "High-risk website")}`;
      chrome.tabs.update(tabId, { url: blockUrl });
    }
  }
});

chrome.downloads?.onCreated.addListener(async (downloadItem) => {
  const settings = await getSettings();
  if (!settings.downloadScan) return;

  const target = downloadItem.finalUrl || downloadItem.url || downloadItem.filename || "";
  const result = await scanDownload(target);

  if (result.risk === HIGH_RISK) {
    notify("Download blocked", result.explanation);
    chrome.downloads.cancel(downloadItem.id);
  } else if (result.risk === MEDIUM_RISK) {
    notify("Suspicious download", result.explanation);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === "SCAN_URL") {
      const result = await scanUrl(message.url);
      if (sender.tab?.id && !message.silent) {
        await saveTabScan(sender.tab.id, message.url, result);
        updateBadge(sender.tab.id, result.risk);
      }
      sendResponse(result);
      return;
    }

    if (message.type === "GET_ACTIVE_SCAN") {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const cached = tab?.id ? tabScanCache.get(tab.id) : null;
      sendResponse(cached || null);
      return;
    }

    if (message.type === "EXPLAIN_SCAN") {
      sendResponse(await explainScan(message.result, message.context));
      return;
    }

    if (message.type === "SCAN_TEXT") {
      sendResponse(await scanText(message.text));
      return;
    }

    if (message.type === "SCAN_DOWNLOAD") {
      sendResponse(await scanDownload(message.target));
      return;
    }

    if (message.type === "SCAN_FILE") {
      sendResponse(await scanFile(message.file));
      return;
    }

    if (message.type === "TEST_ALERT") {
      notify("Popup alert test", "Notifications are working for CyberShield.");
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "REPORT_GMAIL_RISK") {
      notify("Suspicious Gmail message", message.summary || "CyberShield found risky wording.");
      sendResponse({ ok: true });
      return;
    }

    sendResponse(null);
  })();

  return true;
});

async function scanUrl(url) {
  const local = localUrlScan(url);

  try {
    const response = await fetch(`${API_BASE}/extension/scan-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) return local;

    const data = await response.json();
    if (!data || data.risk === "ERROR") return local;

    return {
      risk: normalizeRisk(data.risk),
      score: data.score ?? local.score,
      source: data.source || "CyberShield Backend Engine",
      explanation: data.explanation || data.verdict || data.message || local.explanation,
      details: data.details || {},
      url,
    };
  } catch {
    return local;
  }
}

async function scanText(text) {
  const local = localTextScan(text);

  try {
    const response = await fetch(`${API_BASE}/extension/scan-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) return local;
    const data = await response.json();
    return {
      ...local,
      ...data,
      risk: normalizeRisk(data.risk),
      source: data.source || "CyberShield Backend Text Engine",
    };
  } catch {
    return local;
  }
}

function localUrlScan(rawUrl) {
  const reasons = [];
  let score = 0;

  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (parsed.protocol === "http:") {
      score += 18;
      reasons.push("Uses an insecure HTTP connection");
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      score += 35;
      reasons.push("Uses an IP address instead of a domain");
    }

    if (host.includes("xn--")) {
      score += 30;
      reasons.push("Contains punycode characters that can hide spoofed domains");
    }

    if (rawUrl.length > 140) {
      score += 16;
      reasons.push("Very long URL");
    }

    if (rawUrl.includes("@")) {
      score += 24;
      reasons.push("Contains @ redirection pattern");
    }

    if (/%[0-9a-f]{2}/i.test(rawUrl)) {
      score += 12;
      reasons.push("Contains encoded characters");
    }

    if (/(login|verify|account|password|wallet|bank|otp|secure|update)/i.test(path + host)) {
      score += 18;
      reasons.push("Uses account or credential keywords");
    }

    if (/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|rebrand\.ly|cutt\.ly)$/i.test(host)) {
      score += 22;
      reasons.push("Uses a URL shortener");
    }

    if (/\.(zip|exe|dmg|scr|bat|cmd|msi|apk)$/i.test(path)) {
      score += 28;
      reasons.push("Links directly to a risky file type");
    }
  } catch {
    score += 40;
    reasons.push("URL could not be parsed safely");
  }

  const risk = score >= 65 ? HIGH_RISK : score >= 35 ? MEDIUM_RISK : LOW_RISK;

  return {
    risk,
    score: Math.min(score, 100),
    source: "Local Browser Scan",
    explanation: reasons.join(". ") || "No obvious phishing or malware signals found.",
    details: { reasons },
    url: rawUrl,
  };
}

async function scanDownload(target) {
  const result = localUrlScan(target);
  const extraReasons = [];

  if (/\.(exe|msi|dmg|pkg|scr|bat|cmd|ps1|apk|crx|jar)$/i.test(target)) {
    result.score += 42;
    extraReasons.push("Executable download type");
  }

  if (/\.zip(\?|$)/i.test(target)) {
    result.score += 24;
    extraReasons.push("Compressed archive download");
  }

  result.score = Math.min(result.score, 100);
  result.risk = result.score >= 65 ? HIGH_RISK : result.score >= 35 ? MEDIUM_RISK : LOW_RISK;
  result.explanation = [...(result.details.reasons || []), ...extraReasons].join(". ") || "Download looks normal.";

  try {
    const response = await fetch(`${API_BASE}/extension/scan-download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: target, filename: target }),
    });

    if (!response.ok) return result;
    const data = await response.json();
    return {
      ...result,
      ...data,
      risk: normalizeRisk(data.risk),
      source: data.source || "CyberShield Backend Download Engine",
    };
  } catch {
    return result;
  }
}

async function scanFile(file = {}) {
  const local = {
    risk: EXECUTABLE_EXTENSIONS.test(file.name || "") ? HIGH_RISK : ARCHIVE_EXTENSIONS.test(file.name || "") ? MEDIUM_RISK : LOW_RISK,
    score: EXECUTABLE_EXTENSIONS.test(file.name || "") ? 80 : ARCHIVE_EXTENSIONS.test(file.name || "") ? 45 : 10,
    source: "Local File Metadata Scan",
    explanation: "File checked by extension metadata.",
    details: { reasons: [] },
  };

  try {
    const response = await fetch(`${API_BASE}/extension/scan-file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(file),
    });

    if (!response.ok) return local;
    const data = await response.json();
    return {
      ...local,
      ...data,
      risk: normalizeRisk(data.risk),
      source: data.source || "CyberShield Backend File Engine",
    };
  } catch {
    return local;
  }
}

async function getSettings() {
  const stored = await chrome.storage.local.get(["settings"]);
  return { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };
}

async function hasTemporaryBypass(url) {
  const { bypassUrl, bypassExpiresAt } = await chrome.storage.local.get(["bypassUrl", "bypassExpiresAt"]);
  if (!bypassUrl || !bypassExpiresAt) return false;

  if (Date.now() > bypassExpiresAt) {
    await chrome.storage.local.remove(["bypassUrl", "bypassExpiresAt"]);
    return false;
  }

  return bypassUrl === url;
}

async function saveTabScan(tabId, url, result) {
  const scan = { ...result, url, scannedAt: Date.now() };
  tabScanCache.set(tabId, scan);
  await chrome.storage.local.set({ lastScan: scan });
}

function updateBadge(tabId, risk) {
  const colors = {
    HIGH: "#dc2626",
    MEDIUM: "#d97706",
    LOW: "#16a34a",
    UNKNOWN: "#64748b",
  };

  chrome.action.setBadgeText({
    tabId,
    text: risk === HIGH_RISK ? "!" : risk === MEDIUM_RISK ? "?" : "OK",
  });
  chrome.action.setBadgeBackgroundColor({ tabId, color: colors[risk] || colors.UNKNOWN });
}

function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: `CyberShield: ${title}`,
    message,
  }, () => {
    if (chrome.runtime.lastError) {
      console.warn("CyberShield notification failed:", chrome.runtime.lastError.message);
    }
  });
}

async function explainScan(result = {}, context = "browser") {
  try {
    const response = await fetch(`${API_BASE}/extension/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result, context }),
    });

    if (response.ok) return response.json();
  } catch {
    // Use local explanation below.
  }

  return buildExplanation(result);
}

function buildExplanation(result = {}) {
  const risk = normalizeRisk(result.risk);
  const lead = {
    HIGH: "This page has strong phishing or malware indicators.",
    MEDIUM: "This page has suspicious signals worth reviewing.",
    LOW: "This page looks safe based on the available checks.",
  }[risk] || "CyberShield could not fully classify this page.";

  return {
    title: `${risk} risk`,
    body: `${lead} ${result.explanation || ""}`.trim(),
    tips: [
      "Check the domain spelling before entering credentials.",
      "Avoid downloads from pages you did not intentionally visit.",
      "Do not enter passwords or OTPs after clicking unexpected links.",
    ],
  };
}

function localTextScan(text = "") {
  const lower = String(text).toLowerCase();
  const reasons = [];
  let score = 0;

  [
    ["urgent", "Urgency language"],
    ["verify your account", "Account verification request"],
    ["password", "Password request"],
    ["otp", "OTP request"],
    ["bank", "Financial keyword"],
    ["click here", "Generic link bait"],
  ].forEach(([word, reason]) => {
    if (lower.includes(word)) {
      score += 14;
      reasons.push(reason);
    }
  });

  if (/https?:\/\/[^\s]+/i.test(text)) {
    score += 22;
    reasons.push("Contains external links");
  }

  const risk = score >= 55 ? HIGH_RISK : score >= 28 ? MEDIUM_RISK : LOW_RISK;
  return {
    risk,
    score,
    source: "Local Text Scan",
    explanation: reasons.join(", ") || "No obvious scam language found.",
    details: { reasons },
  };
}

function normalizeRisk(risk) {
  return String(risk || "UNKNOWN").toUpperCase();
}

function shouldSkipUrl(url) {
  return (
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("http://localhost:3000") ||
    url.startsWith("http://localhost:5001")
  );
}
