import React, { useState } from "react";
import api from "../utils/api";
import Layout from "../components/Layout";
import ScanUI from "../components/ScanUI";

const EMAIL_TIPS = [
  "Sender domain spoofing & typosquatting",
  "Embedded malicious links and redirects",
  "Social engineering language patterns",
  "Urgency triggers and fear tactics",
  "Suspicious attachment references",
  "Header & metadata inconsistencies",
];

function EmailScan() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState("");
  const [risk, setRisk] = useState("");
  const [score, setScore] = useState(0);

  const handleScan = async () => {
    if (!email.trim()) return;
    try {
      const res = await api.post("/scan/email", { email });
      setResult(res.data.result || res.data.message || "Scan complete");
      setRisk(res.data.risk || "Unknown");
      setScore(
        res.data.score || (res.data.risk === "HIGH" ? 90 : res.data.risk === "MEDIUM" ? 60 : 20)
      );
      // Results are displayed in this page via ScanUI
    } catch (err) {
      console.log(err);
      alert("❌ Scan failed");
    }
  };

  return (
    <Layout>
      <ScanUI
        title="📧 Email Scanner"
        placeholder="Paste the suspicious email content or address here..."
        value={email}
        setValue={setEmail}
        onClick={handleScan}
        risk={risk}
        result={result}
        riskPercent={score}
        textarea={true}
        tips={EMAIL_TIPS}
        scanLabel="Scan Email"
      />
    </Layout>
  );
}
  
export default EmailScan;