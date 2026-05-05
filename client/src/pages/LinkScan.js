import React, { useState } from "react";
import api from "../utils/api";
import Layout from "../components/Layout";
import ScanUI from "../components/ScanUI";

const LINK_TIPS = [
  "Domain reputation and age verification",
  "SSL certificate validity checks",
  "Multi-hop redirect chain analysis",
  "Known malware & phishing databases",
  "URL shortener unwrapping",
  "Homograph & IDN attack detection",
];

function LinkScan() {
  const [url, setUrl] = useState("");
  const [risk, setRisk] = useState("");
  const [score, setScore] = useState(0);
  const [result, setResult] = useState("");

  // 🔥 NEW STATES
  const [screenshot, setScreenshot] = useState("");
  const [verdict, setVerdict] = useState("");

  const handleScan = async () => {
    if (!url.trim()) return;

    try {
      const res = await api.post("/scan/link", { url });

      setRisk(res.data.risk || "Unknown");

      setScore(
        res.data.risk === "HIGH"
          ? 90
          : res.data.risk === "MEDIUM"
          ? 60
          : 20
      );

      setResult(
        res.data.result ||
        "Link analyzed successfully"
      );

      // 🔥 URLSCAN.IO DATA
      setScreenshot(res.data.screenshot || "");

      setVerdict(
        res.data.verdict ||
        "No advanced threat detected"
      );

    } catch (err) {
      console.log(err);
      alert("❌ Scan failed");
    }
  };

  return (
    <Layout>

      <div className="space-y-6">

        {/* MAIN SCAN UI */}
        <ScanUI
          title="🔗 Link Scanner"
          placeholder="Paste URL to analyze, e.g. https://suspicious-site.com"
          value={url}
          setValue={setUrl}
          onClick={handleScan}
          risk={risk}
          result={result}
          riskPercent={score}
          textarea={false}
          tips={LINK_TIPS}
          scanLabel="Scan URL"
        />

        {/* 🔥 URLSCAN.IO RESULT */}
        {(screenshot || verdict) && (
          <div className="glass p-6 rounded-3xl border border-white/10 backdrop-blur-xl animate-fadeIn">

            <h2 className="text-2xl font-semibold mb-4">
              🛡 Advanced Threat Intelligence
            </h2>

            {/* VERDICT */}
            <div
              className={`mb-5 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                risk === "HIGH"
                  ? "bg-red-500/20 text-red-400 border border-red-500/20"
                  : risk === "MEDIUM"
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/20"
                  : "bg-green-500/20 text-green-400 border border-green-500/20"
              }`}
            >
              {verdict}
            </div>

            {/* SCREENSHOT */}
            {screenshot ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">

                <img
                  src={screenshot}
                  alt="Website Screenshot"
                  className="w-full object-cover hover:scale-[1.02] transition duration-500"
                />

              </div>
            ) : (
              <div className="p-10 rounded-2xl bg-white/5 text-gray-400 text-center">
                Screenshot unavailable
              </div>
            )}

            {/* EXTRA INFO */}
            <div className="mt-5 grid md:grid-cols-3 gap-4">

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-sm text-gray-400 mb-1">
                  Threat Engine
                </p>

                <h3 className="font-semibold">
                  URLScan.io
                </h3>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-sm text-gray-400 mb-1">
                  Scan Status
                </p>

                <h3 className="font-semibold">
                  Completed
                </h3>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-sm text-gray-400 mb-1">
                  Detection Level
                </p>

                <h3
                  className={`font-semibold ${
                    risk === "HIGH"
                      ? "text-red-400"
                      : risk === "MEDIUM"
                      ? "text-yellow-300"
                      : "text-green-400"
                  }`}
                >
                  {risk}
                </h3>
              </div>

            </div>

          </div>
        )}

      </div>

    </Layout>
  );
}

export default LinkScan;