const params = new URLSearchParams(location.search);
const blockedUrl = params.get("url") || "";
const reason = params.get("reason") || "CyberShield detected a high-risk website.";

document.getElementById("reason").textContent = reason;
document.getElementById("blockedUrl").textContent = blockedUrl;

document.getElementById("backBtn").addEventListener("click", () => {
  history.length > 1 ? history.back() : location.replace("about:blank");
});

document.getElementById("continueBtn").addEventListener("click", () => {
  if (!blockedUrl) return;

  chrome.storage.local.set({
    bypassUrl: blockedUrl,
    bypassExpiresAt: Date.now() + 5 * 60 * 1000,
  }, () => {
    location.replace(blockedUrl);
  });
});
