const axios = require("axios");
const Scan = require("../models/Scan");

// ================= SOCKET EMIT HELPER =================
const emitAlert = (req, payload) => {
  try {
    const io = req.app.get("io");

    if (!io) {
      console.log("⚠️ Socket IO not found");
      return;
    }

    if (req.user && req.user.id) {
      io.to(req.user.id).emit("scanAlert", payload);
    } else {
      io.emit("scanAlert", payload);
    }

    console.log("🚨 Alert emitted:", payload.type, payload.risk);

  } catch (err) {
    console.error("❌ Socket emit error:", err.message);
  }
};

// ================= URL SCAN =================
const scanURL = async (url) => {
  try {
    const res = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_API_KEY}`,
      {
        client: {
          clientId: "cybershield",
          clientVersion: "1.0",
        },

        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
          ],

          platformTypes: [
            "ANY_PLATFORM",
          ],

          threatEntryTypes: [
            "URL",
          ],

          threatEntries: [
            { url },
          ],
        },
      }
    );

    if (res.data && res.data.matches) {
      return {
        risk: "HIGH",
        reason: "Google flagged this URL 🚨",
      };
    }

    return {
      risk: "LOW",
      reason: "No threat detected",
    };

  } catch {
    return {
      risk: "UNKNOWN",
      reason: "Scan failed",
    };
  }
};

// ================= VIRUSTOTAL =================
const scanWithVirusTotal = async (url) => {
  try {
    const res = await axios.post(
      "https://www.virustotal.com/api/v3/urls",

      new URLSearchParams({ url }),

      {
        headers: {
          "x-apikey": process.env.VIRUSTOTAL_API_KEY,
        },
      }
    );

    const id = res.data.data.id;

    const result = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${id}`,

      {
        headers: {
          "x-apikey": process.env.VIRUSTOTAL_API_KEY,
        },
      }
    );

    const stats = result.data.data.attributes.stats;
    const malicious = stats.malicious;

    if (malicious > 5) {
      return {
        risk: "HIGH",
        reason: "Multiple engines flagged 🚨",
      };
    }

    if (malicious > 0) {
      return {
        risk: "MEDIUM",
        reason: "Suspicious ⚠️",
      };
    }

    return {
      risk: "LOW",
      reason: "Safe by engines",
    };

  } catch {
    return {
      risk: "UNKNOWN",
      reason: "VirusTotal failed",
    };
  }
};

// ================= TEXT ANALYSIS =================
const analyzeText = (text) => {
  let score = 0;

  const reasons = [];

  const lower = text.toLowerCase();

  // URGENCY
  [
    "urgent",
    "immediately",
    "act now",
  ].forEach((w) => {
    if (lower.includes(w)) {
      score += 2;
      reasons.push("Urgency");
    }
  });

  // FINANCIAL / SENSITIVE
  [
    "bank",
    "password",
    "verify",
    "otp",
  ].forEach((w) => {
    if (lower.includes(w)) {
      score += 2;
      reasons.push("Sensitive data");
    }
  });

  // LINKS
  if (/(https?:\/\/[^\s]+)/g.test(text)) {
    score += 3;
    reasons.push("Contains link");
  }

  // BAIT WORDS
  [
    "free",
    "win",
    "reward",
    "gift",
  ].forEach((w) => {
    if (lower.includes(w)) {
      score += 1;
      reasons.push("Bait words");
    }
  });

  // FINAL RISK
  let risk = "LOW";

  if (score >= 6) {
    risk = "HIGH";
  } else if (score >= 3) {
    risk = "MEDIUM";
  }

  return {
    risk,
    score: Math.min(score * 15, 100),
    explanation:
      reasons.join(", ") || "Safe",
  };
};

// ================= LINK =================
const scanLink = async (req, res) => {
  try {
    const { url } = req.body;

    // ================= GOOGLE SAFE BROWSING =================
    const google = await scanURL(url);

    // ================= VIRUSTOTAL =================
    const vt = await scanWithVirusTotal(url);

   // ================= URLSCAN.IO =================
let urlscanData = {
  risk: "LOW",
  screenshot: "",
  verdict: "Safe",
};

try {

  // 🔥 SUBMIT URL
  const submit = await axios({
    method: "POST",
    url: "https://urlscan.io/api/v1/scan/",
    headers: {
      "API-Key": process.env.URLSCAN_API_KEY,
      "Content-Type": "application/json",
    },
    data: {
      url,
      visibility: "public",
    },
  });

  console.log("✅ URLSCAN SUBMITTED");

  const uuid = submit.data.uuid;

  let result = null;

  // 🔥 WAIT + RETRY LOOP
  for (let i = 0; i < 10; i++) {

    try {

      await new Promise((resolve) =>
        setTimeout(resolve, 5000)
      );

      const res = await axios.get(
        `https://urlscan.io/api/v1/result/${uuid}/`
      );

      result = res.data;

      console.log("✅ URLSCAN RESULT READY");

      break;

    } catch (err) {

      console.log(
        `⏳ Waiting for URLScan result... (${i + 1}/10)`
      );
    }
  }

  // 🔥 IF RESULT READY
  if (result) {

    const malicious =
      result.verdicts?.overall?.malicious;

    if (malicious) {

      urlscanData.risk = "HIGH";

      urlscanData.verdict =
        "Malicious / phishing behavior detected";
    }

    // ✅ SCREENSHOT
    urlscanData.screenshot =
      result.task?.screenshotURL || "";
  }

} catch (err) {

  console.log(
    "❌ URLSCAN ERROR:",
    err.response?.data || err.message
  );
}

    // ================= FINAL RISK =================
    let finalRisk = "LOW";

    if (
      google.risk === "HIGH" ||
      vt.risk === "HIGH" ||
      urlscanData.risk === "HIGH"
    ) {
      finalRisk = "HIGH";

    } else if (
      vt.risk === "MEDIUM"
    ) {
      finalRisk = "MEDIUM";
    }

    // ================= SAVE =================
    await Scan.create({
      userId: req.user?.id,
      type: "link",
      content: url,
      risk: finalRisk,
    });

    // ================= EMIT ALERT =================
    emitAlert(req, {
      type: "link",
      risk: finalRisk,
      content: url,
    });

    // ================= RESPONSE =================
    res.json({
      risk: finalRisk,

      details: {
        google,
        virustotal: vt,
        urlscan: urlscanData,
      },

      screenshot:
        urlscanData.screenshot,

      verdict:
        urlscanData.verdict,
    });

  } catch (error) {
    console.error(error);

    res.json({
      risk: "ERROR",
      message: "Link scan failed",
    });
  }
};

// ================= MESSAGE =================
const scanMessage = async (req, res) => {
  try {
    const { text } = req.body;

    const result = analyzeText(text);

    await Scan.create({
      userId: req.user?.id,
      type: "message",
      content: text,
      risk: result.risk,
    });

    emitAlert(req, {
      type: "message",
      risk: result.risk,
      content: text,
    });

    res.json(result);

  } catch (error) {
    console.error(error);

    res.json({
      risk: "ERROR",
    });
  }
};

// ================= EMAIL =================
const scanEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const result = analyzeText(email);

    await Scan.create({
      userId: req.user?.id,
      type: "email",
      content: email,
      risk: result.risk,
    });

    emitAlert(req, {
      type: "email",
      risk: result.risk,
      content: email,
    });

    res.json({
      risk: result.risk,
      score: result.score,
      message: result.explanation,
    });

  } catch (error) {
    console.error(error);

    res.json({
      risk: "ERROR",
    });
  }
};

// ================= GET =================
const getScans = async (req, res) => {
  try {
    const scans = await Scan.find({
      userId: req.user?.id,
    }).sort({
      createdAt: -1,
    });

    res.json(scans);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch scans",
    });
  }
};

module.exports = {
  scanLink,
  scanMessage,
  scanEmail,
  getScans,
};