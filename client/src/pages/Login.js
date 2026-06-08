import React, { useState } from "react";
import API from "../utils/api";
import { setToken } from "../auth";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [identifier, setIdentifier] = useState("");

  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await API.post("/auth/login", {
        identifier,
        password,
      });

      // Handle error responses
      if (res.status >= 400) {
        alert(res.data?.error || "Login failed");
        return;
      }

      if (!res.data?.token) {
        alert("Login failed — no token received");
        return;
      }

      setToken(res.data.token);

      // ✅ AUTO REDIRECT
      navigate("/dashboard");

    } catch (err) {
      alert(err.response?.data?.error || err.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl w-80">

        <h2 className="text-xl mb-4 text-center">🔐 Login</h2>

        <input
          className="w-full p-2 mb-3 bg-white/10 rounded"
          placeholder="Email or Mobile"
          onChange={(e) => setIdentifier(e.target.value)}
        />


        <input
          type="password"
          className="w-full p-2 mb-4 bg-white/10 rounded"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded"
        >
          Login
        </button>

        <p className="text-sm mt-3 text-center">
          No account? <Link to="/register">Create</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;