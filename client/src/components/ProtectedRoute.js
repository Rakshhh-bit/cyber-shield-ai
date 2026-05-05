import React from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../auth"; // ✅ CORRECT FILE

function ProtectedRoute({ children }) {
  const token = getToken();

  if (!token) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;