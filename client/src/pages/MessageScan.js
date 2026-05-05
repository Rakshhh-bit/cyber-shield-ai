import React, { useState } from "react";
import api from "../utils/api";
import Layout from "../components/Layout";
import ScanUI from "../components/ScanUI";

const MESSAGE_TIPS = [
  "Scam and lottery fraud patterns",
  "Romance scam behavioral signals",
  "Impersonation & authority abuse",
  "Prize / gift card manipulation",
  "Fake emergency narratives",
  "Linguistic manipulation tactics",
];

function MessageScan() {
  const [text, setText] = useState("");
  const [risk, setRisk] = useState("");
  const [score, setScore] = useState(0);
  const [result, setResult] = useState("");

  const handleScan = async () => {
    if (!text.trim()) return;
    try {
      const res = await api.post("/scan/message", { text });
      setRisk(res.data.risk || "Unknown");
      setScore(
        res.data.score ? res.data.score : res.data.risk === "HIGH" ? 90 : res.data.risk === "MEDIUM" ? 60 : 20
      );
      setResult(res.data.explanation || "Message analyzed");
      // Results are displayed in this page via ScanUI
    } catch (err) {
      console.log(err);
      alert("❌ Scan failed");
    }
  };

  return (
    <Layout>
      <ScanUI
        title="💬 Message Scanner"
        placeholder="Paste the suspicious message, SMS, or chat content here..."
        value={text}
        setValue={setText}
        onClick={handleScan}
        risk={risk}
        result={result}
        riskPercent={score}
        textarea={true}
        tips={MESSAGE_TIPS}
        scanLabel="Scan Message"
      />
    </Layout>
  );
}

export default MessageScan;