import React, { useState } from "react";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await API.post("/auth/register", {
        email,
        password,
      });

      alert("Registered! Now login");
      navigate("/login");

    } catch (err) {
      alert(err.response?.data?.error || "Register failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl w-80">

        <h2 className="text-xl mb-4 text-center">📝 Register</h2>

        <input
          className="w-full p-2 mb-3 bg-white/10 rounded"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-2 mb-4 bg-white/10 rounded"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          className="w-full py-2 bg-gradient-to-r from-green-500 to-blue-500 rounded"
        >
          Register
        </button>

      </div>
    </div>
  );
}

export default Register;