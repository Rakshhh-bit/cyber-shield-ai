import React, { useState } from "react";
import api from "../utils/api";
// navigation handled by Layout

function MessageScan() {
  const [text, setText] = useState("");
  const [risk, setRisk] = useState("");
  const [score, setScore] = useState(0);
  const [result, setResult] = useState("");


  const handleScan = async () => {
    try {
      const res = await api.post("/scan/message", { text });

      setRisk(res.data.risk || "Unknown");
      setScore(
        res.data.score
          ? res.data.score
          : res.data.risk === "HIGH"
          ? 90
          : res.data.risk === "MEDIUM"
          ? 60
          : 20
      );
      setResult(res.data.explanation || "Message analyzed");

    } catch (err) {
      console.log(err);
      alert("❌ Scan failed");
    }
  };

  return (
    <div className="flex min-h-screen text-white">

      {/* SIDEBAR */}
      <div className="w-64 p-6 flex flex-col justify-between border-r border-white/10 backdrop-blur-xl bg-white/5">

        <div>

            className="p-3 rounded-lg text-black w-80 mb-4"
            placeholder="Enter message"
            onChange={(e) => setText(e.target.value)}
          />

          <button
            onClick={handleScan}
            className="px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Scan Message
          </button>

          {risk && (
            <div className="mt-6 p-6 rounded-xl bg-white/10 w-80 text-center">
              <h3 className="text-xl mb-2">
                Risk: {risk} ({score}%)
              </h3>

              <p>{result}</p>

              <div className="w-full bg-gray-700 h-3 mt-4 rounded-full">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>
          )}

        </div>
      );