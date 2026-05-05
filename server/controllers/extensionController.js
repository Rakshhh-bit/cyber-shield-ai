const SUSPICIOUS_TLDS = new Set(["zip", "mov", "click", "country", "stream", "gq", "tk", "ml", "cf"]);
const SHORTENERS = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "rebrand.ly", "cutt.ly"]);
const EXECUTABLE_EXTENSIONS = /\.(exe|msi|dmg|pkg|scr|bat|cmd|ps1|apk|crx|jar|vbs|js)$/i;
const ARCHIVE_EXTENSIONS = /\.(zip|rar|7z|gz|iso)$/i;

const normalizeRisk = (risk) => String(risk || "UNKNOWN").toUpperCase();

const classifyScore = (score) => {
  if (score >= 65) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
};

const scanUrlHeuristic = (rawUrl) => {
  const reasons = [];
  let score = 0;

  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    const tld = host.split(".").pop();

    if (parsed.protocol === "http:") {
      score += 18;
      reasons.push("The page uses insecure HTTP instead of HTTPS");
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      score += 35;
      reasons.push("The URL uses an IP address instead of a normal domain");
    }

    if (host.includes("xn--")) {
      score += 30;
      reasons.push("The domain contains punycode, which can hide lookalike characters");
    }

    if (SUSPICIOUS_TLDS.has(tld)) {
      score += 14;
      reasons.push(`The domain uses a higher-risk .${tld} extension`);
    }

    if (SHORTENERS.has(host)) {
      score += 22;
      reasons.push("The URL is shortened, hiding the final destination");
    }

    if (rawUrl.length > 140) {
      score += 16;
      reasons.push("The URL is unusually long");
    }

    if (rawUrl.includes("@")) {
      score += 24;
      reasons.push("The URL contains an @ redirection pattern");
    }

    if (/%[0-9a-f]{2}/i.test(rawUrl)) {
      score += 12;
      reasons.push("The URL contains encoded characters");
    }

    if (/(login|verify|account|password|wallet|bank|otp|secure|update|invoice|payment)/i.test(path + host)) {
      score += 18;
      reasons.push("The URL uses account, payment, or credential keywords");
    }

    if (EXECUTABLE_EXTENSIONS.test(path)) {
      score += 35;
      reasons.push("The URL points to an executable file type");
    } else if (ARCHIVE_EXTENSIONS.test(path)) {
      score += 22;
      reasons.push("The URL points to a compressed archive");
    }
  } catch {
    score += 45;
    reasons.push("The URL could not be parsed safely");
  }

  const risk = classifyScore(score);
  return {
    risk,
    score: Math.min(score, 100),
    source: "CyberShield Backend Engine",
    explanation: reasons.join(". ") || "No obvious phishing or malware indicators were found.",
    details: { reasons },
    analyzedAt: new Date().toISOString(),
    url: rawUrl,
  };
};

const scanTextHeuristic = (text = "") => {
  const lower = String(text).toLowerCase();
  const reasons = [];
  let score = 0;

  [
    ["urgent", "Urgency language"],
    ["immediately", "Immediate action pressure"],
    ["verify your account", "Account verification request"],
    ["password", "Password request"],
    ["otp", "OTP request"],
    ["bank", "Financial keyword"],
    ["wallet", "Crypto wallet keyword"],
    ["gift card", "Gift card bait"],
    ["click here", "Generic link bait"],
    ["limited time", "Scarcity pressure"],
    ["suspended", "Account suspension threat"],
  ].forEach(([needle, reason]) => {
    if (lower.includes(needle)) {
      score += 12;
      reasons.push(reason);
    }
  });

  const links = String(text).match(/https?:\/\/[^\s]+/gi) || [];
  if (links.length) {
    score += Math.min(links.length * 12, 30);
    reasons.push("Contains external links");
  }

  const risk = classifyScore(score);
  return {
    risk,
    score: Math.min(score, 100),
    source: "CyberShield Backend Text Engine",
    explanation: reasons.join(", ") || "No obvious scam wording was found.",
    details: { reasons, links },
    analyzedAt: new Date().toISOString(),
  };
};

const explainResult = (result = {}, context = "browser") => {
  const risk = normalizeRisk(result.risk);
  const reasons = result.details?.reasons || [];
  const contextLabel = context === "gmail" ? "email" : context === "download" ? "download" : "page";
  const lead = {
    HIGH: `This ${contextLabel} should be treated as dangerous.`,
    MEDIUM: `This ${contextLabel} has suspicious signals and needs caution.`,
    LOW: `This ${contextLabel} looks safe based on current checks.`,
  }[risk] || `CyberShield could not fully classify this ${contextLabel}.`;

  return {
    title: `${risk} risk explanation`,
    body: `${lead} ${result.explanation || ""}`.trim(),
    bullets: reasons.length ? reasons : [
      "No high-confidence malicious indicator was found.",
      "Keep checking sender, domain spelling, and download prompts.",
    ],
    nextSteps: risk === "HIGH"
      ? ["Close the page", "Do not enter passwords or OTPs", "Do not download files from it"]
      : risk === "MEDIUM"
        ? ["Verify the domain", "Avoid entering sensitive data", "Use a trusted source instead"]
        : ["Continue normally", "Stay alert for redirects or unexpected downloads"],
    source: "CyberShield Backend Explanation Engine",
  };
};

const scanUrl = (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });
  res.json(scanUrlHeuristic(url));
};

const explain = (req, res) => {
  res.json(explainResult(req.body.result || {}, req.body.context || "browser"));
};

const scanText = (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });
  res.json(scanTextHeuristic(text));
};

const scanDownload = (req, res) => {
  const target = req.body.url || req.body.filename || "";
  if (!target) return res.status(400).json({ error: "Download URL or filename is required" });

  const result = scanUrlHeuristic(target);
  const reasons = [...(result.details.reasons || [])];

  if (EXECUTABLE_EXTENSIONS.test(target)) {
    result.score = Math.min(result.score + 42, 100);
    reasons.push("Executable downloads can install software or malware");
  } else if (ARCHIVE_EXTENSIONS.test(target)) {
    result.score = Math.min(result.score + 24, 100);
    reasons.push("Archives can hide executable payloads");
  }

  result.risk = classifyScore(result.score);
  result.source = "CyberShield Backend Download Engine";
  result.explanation = reasons.join(". ") || "Download metadata does not show obvious risk.";
  result.details.reasons = reasons;
  res.json(result);
};

const scanFile = (req, res) => {
  const { name = "", type = "", size = 0, sha256 = "" } = req.body;
  const reasons = [];
  let score = 0;

  if (EXECUTABLE_EXTENSIONS.test(name)) {
    score += 52;
    reasons.push("Executable file extension");
  }

  if (ARCHIVE_EXTENSIONS.test(name)) {
    score += 38;
    reasons.push("Archive file can hide nested payloads");
  }

  if (Number(size) > 50 * 1024 * 1024) {
    score += 8;
    reasons.push("Large file size");
  }

  if (!type || type === "application/octet-stream") {
    score += 10;
    reasons.push("Browser could not identify a specific file type");
  }

  const risk = classifyScore(score);
  res.json({
    risk,
    score: Math.min(score, 100),
    source: "CyberShield Backend File Engine",
    explanation: reasons.join(". ") || "File metadata looks normal. Deep malware scanning requires uploading the file to a malware analysis service.",
    details: { reasons, sha256 },
    analyzedAt: new Date().toISOString(),
  });
};

module.exports = {
  scanUrl,
  explain,
  scanText,
  scanDownload,
  scanFile,
};
