import React, { useEffect, useState } from "react";
import socket, { connectSocket } from "../utils/socket";

function Alert() {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    socket.on("scanAlert", (data) => {
      console.log("🚨 ALERT:", data);
      setAlert(data);

      setTimeout(() => setAlert(null), 4000);
    });

    if (localStorage.getItem("token")) {
      connectSocket();
    }

    return () => socket.off("scanAlert");
  }, []);

  if (!alert) return null;

  return (
    <div className="fixed top-5 right-5 bg-red-500 text-white p-4 rounded-xl shadow-xl z-50">
      🚨 {alert.type.toUpperCase()} Risk: {alert.risk}
    </div>
  );
}

export default Alert;
