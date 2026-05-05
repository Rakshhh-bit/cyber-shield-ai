const DEFAULT_SETTINGS = {
  autoScan: true,
  popupAlerts: true,
  gmailScan: true,
  safeSearch: true,
  pageBlocking: true,
  downloadScan: true,
};

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await refreshScan();

  document.getElementById("rescanBtn").addEventListener("click", refreshScan);
  document.getElementById("explainBtn").addEventListener("click", showExplanation);
  document.getElementById("breachBtn").addEventListener("click", checkPasswordBreach);
  document.getElementById("qrInput").addEventListener("change", scanQrImage);
  document.getElementById("fileInput").addEventListener("change", scanFile);

  document.querySelectorAll("[data-setting]").forEach((input) => {
    input.addEventListener("change", saveSettings);
  });
});

async function refreshScan() {
  setStatus({ risk: "SCANNING", explanation: "Checking this tab for phishing and malware signals." });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:\/\//i.test(tab.url)) {
    setStatus({ risk: "UNKNOWN", explanation: "Open a normal website tab to scan it." });
    return;
  }

  const result = await sendMessage({ type: "SCAN_URL", url: tab.url });
  setStatus(result);
}

function setStatus(result = {}) {
  const risk = String(result.risk || "UNKNOWN").toUpperCase();
  const card = document.getElementById("statusCard");
  card.dataset.risk = risk;
  document.getElementById("riskLabel").textContent = risk;
  document.getElementById("scanSummary").textContent =
    result.explanation || "CyberShield could not classify this page yet.";
  document.getElementById("scanSource").textContent = `Source: ${result.source || "CyberShield extension"}`;
}

async function showExplanation() {
  const activeScan = await sendMessage({ type: "GET_ACTIVE_SCAN" });
  const explanation = await sendMessage({ type: "EXPLAIN_SCAN", result: activeScan || {} });

  document.getElementById("scanSummary").innerHTML = `
    <strong>${escapeHtml(explanation.title)}</strong><br>
    ${escapeHtml(explanation.body)}
  `;
  document.getElementById("scanSource").textContent = `Source: ${explanation.source || "CyberShield Backend Explanation Engine"}`;
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(["settings"]);
  const settings = { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };

  document.querySelectorAll("[data-setting]").forEach((input) => {
    input.checked = settings[input.dataset.setting] !== false;
  });
}

async function saveSettings() {
  const settings = {};
  document.querySelectorAll("[data-setting]").forEach((input) => {
    settings[input.dataset.setting] = input.checked;
  });

  await chrome.storage.local.set({ settings });
}

async function scanQrImage(event) {
  const output = document.getElementById("qrResult");
  output.className = "result-text";

  const file = event.target.files?.[0];
  if (!file) return;

  if (!("BarcodeDetector" in window)) {
    output.textContent = "QR scanning is not supported by this browser version.";
    output.classList.add("warn");
    return;
  }

  try {
    output.textContent = "Reading QR image...";
    const bitmap = await createImageBitmap(file);
    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    const codes = await detector.detect(bitmap);
    const value = codes[0]?.rawValue || "";

    if (!value) {
      output.textContent = "No QR code found in that image.";
      output.classList.add("warn");
      return;
    }

    if (/^https?:\/\//i.test(value)) {
      const result = await sendMessage({ type: "SCAN_URL", url: value });
      output.textContent = `QR link: ${result.risk} risk - ${result.explanation}`;
      output.classList.add(result.risk === "HIGH" ? "danger" : result.risk === "MEDIUM" ? "warn" : "safe");
      return;
    }

    output.textContent = `QR text: ${value}`;
    output.classList.add("safe");
  } catch {
    output.textContent = "Could not read that QR image.";
    output.classList.add("danger");
  }
}

async function scanFile(event) {
  const output = document.getElementById("fileResult");
  output.className = "result-text";

  const file = event.target.files?.[0];
  if (!file) return;

  try {
    output.textContent = "Hashing and analyzing file metadata...";
    const sha256 = await hashFile(file, "SHA-256");
    const result = await sendMessage({
      type: "SCAN_FILE",
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        sha256,
      },
    });

    output.textContent = `${result.risk} risk - ${result.explanation} SHA-256: ${sha256.slice(0, 16)}...`;
    output.classList.add(result.risk === "HIGH" ? "danger" : result.risk === "MEDIUM" ? "warn" : "safe");
  } catch {
    output.textContent = "File analysis failed.";
    output.classList.add("danger");
  }
}

async function checkPasswordBreach() {
  const input = document.getElementById("passwordInput");
  const output = document.getElementById("breachResult");
  output.className = "result-text";

  const password = input.value;
  if (!password) {
    output.textContent = "Enter a password to check.";
    output.classList.add("warn");
    return;
  }

  try {
    output.textContent = "Checking breach database...";
    const hash = await sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const body = await response.text();
    const match = body.split("\n").find((line) => line.startsWith(suffix));

    if (match) {
      const count = Number(match.split(":")[1] || 0);
      output.textContent = `Found in ${count.toLocaleString()} breaches. Change this password.`;
      output.classList.add("danger");
    } else {
      output.textContent = "No breach match found for this password.";
      output.classList.add("safe");
    }
  } catch {
    output.textContent = "Breach check failed. Try again later.";
    output.classList.add("warn");
  }
}

async function sha1(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

async function hashFile(file, algorithm) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest(algorithm, buffer);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response));
  });
}

function flashText(id, text) {
  const node = document.getElementById(id);
  node.textContent = text;
  setTimeout(refreshScan, 1200);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
