const CS_BADGE_CLASS = "cybershield-search-badge";
const CS_PANEL_ID = "cybershield-risk-panel";
const scannedGmailTexts = new Set();

initCyberShieldContent();

function initCyberShieldContent() {
  chrome.storage.local.get(["settings"], ({ settings = {} }) => {
    if (settings.safeSearch !== false) addSafeSearchBadges();
    if (settings.gmailScan !== false) scanGmailMessages();
    scanCurrentPage();
  });
}

async function scanCurrentPage() {
  if (!/^https?:\/\//i.test(location.href)) return;

  const result = await sendMessage({ type: "SCAN_URL", url: location.href });
  if (!result || !["HIGH", "MEDIUM"].includes(result.risk)) return;

  showRiskPanel(result);
}

function addSafeSearchBadges() {
  if (!isSearchPage()) return;

  const badgeLinks = () => {
    const links = [...document.querySelectorAll("a[href^='http']")]
      .filter((link) => !link.querySelector(`.${CS_BADGE_CLASS}`))
      .filter((link) => {
        const text = link.innerText || "";
        return text.length > 8 && link.offsetParent;
      })
      .slice(0, 30);

    links.forEach(async (link) => {
      const result = await sendMessage({ type: "SCAN_URL", url: link.href, silent: true });
      const badge = document.createElement("span");
      badge.className = CS_BADGE_CLASS;
      badge.textContent = result?.risk === "HIGH" ? "High risk" : result?.risk === "MEDIUM" ? "Caution" : "Safe";
      badge.title = result?.explanation || "CyberShield scan";
      badge.dataset.risk = result?.risk || "UNKNOWN";
      link.appendChild(badge);
    });
  };

  badgeLinks();
  observePage(badgeLinks);
}

function scanGmailMessages() {
  if (!location.hostname.includes("mail.google.com")) return;

  const scanVisibleEmail = () => {
    const bodies = [...document.querySelectorAll("div[role='main'] .a3s, div[role='main'] [data-message-id]")]
      .map((node) => node.innerText || "")
      .filter((text) => text.length > 40)
      .slice(0, 5);

    bodies.forEach(async (text) => {
      const fingerprint = text.slice(0, 240);
      if (scannedGmailTexts.has(fingerprint)) return;
      scannedGmailTexts.add(fingerprint);

      const result = await sendMessage({ type: "SCAN_TEXT", text }) || localTextScan(text);
      markGmailRisk(result);

      if (["HIGH", "MEDIUM"].includes(result.risk)) {
        chrome.runtime.sendMessage({
          type: "REPORT_GMAIL_RISK",
          summary: result.explanation,
        });
      }
    });
  };

  scanVisibleEmail();
  observePage(scanVisibleEmail);
}

function markGmailRisk(result) {
  const main = document.querySelector("div[role='main']");
  if (!main) return;

  let banner = main.querySelector(".cybershield-gmail-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.className = "cybershield-gmail-banner";
    main.prepend(banner);
  }

  banner.className = "cybershield-gmail-banner";
  banner.dataset.risk = result.risk;
  banner.innerHTML = `
    <strong>CyberShield Gmail Scan:</strong>
    <span>${escapeHtml(result.risk)} risk - ${escapeHtml(result.explanation)}</span>
  `;
  main.prepend(banner);
}

function showRiskPanel(result) {
  if (document.getElementById(CS_PANEL_ID)) return;

  const panel = document.createElement("div");
  panel.id = CS_PANEL_ID;
  panel.innerHTML = `
    <div class="cs-panel-title">CyberShield Alert</div>
    <div class="cs-panel-risk">${escapeHtml(result.risk)} RISK</div>
    <div class="cs-panel-body">${escapeHtml(result.explanation || "Suspicious page detected.")}</div>
    <div class="cs-panel-actions">
      <button id="cs-explain-btn">Explain</button>
      <button id="cs-dismiss-btn">Dismiss</button>
    </div>
  `;

  document.documentElement.appendChild(panel);

  panel.querySelector("#cs-dismiss-btn").addEventListener("click", () => panel.remove());
  panel.querySelector("#cs-explain-btn").addEventListener("click", async () => {
    const explanation = await sendMessage({ type: "EXPLAIN_SCAN", result, context: "browser" });
    panel.querySelector(".cs-panel-body").innerHTML = `
      ${escapeHtml(explanation.body)}
      <ul>${(explanation.tips || explanation.nextSteps || []).map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
    `;
  });
}

function localTextScan(text) {
  const lower = text.toLowerCase();
  const reasons = [];
  let score = 0;

  [
    ["urgent", "Urgency language"],
    ["verify your account", "Account verification request"],
    ["password", "Password request"],
    ["otp", "OTP request"],
    ["bank", "Financial keyword"],
    ["gift card", "Gift card bait"],
    ["click here", "Generic link bait"],
    ["limited time", "Pressure tactic"],
  ].forEach(([word, reason]) => {
    if (lower.includes(word)) {
      score += 14;
      reasons.push(reason);
    }
  });

  const links = text.match(/https?:\/\/[^\s]+/gi) || [];
  if (links.length) {
    score += 22;
    reasons.push("Contains external links");
  }

  const risk = score >= 55 ? "HIGH" : score >= 28 ? "MEDIUM" : "LOW";
  return {
    risk,
    score,
    explanation: reasons.join(", ") || "No obvious scam language found.",
  };
}

function isSearchPage() {
  return (
    location.hostname.includes("google.") ||
    location.hostname.includes("bing.com") ||
    location.hostname.includes("duckduckgo.com")
  );
}

function observePage(callback) {
  let timer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(callback, 800);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response));
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
