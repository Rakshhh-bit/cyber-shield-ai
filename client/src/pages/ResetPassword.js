import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Shield, CheckCircle2 } from "lucide-react";
import api from "../utils/api";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = useMemo(() => ([
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Lowercase", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Special", ok: /[^A-Za-z0-9]/.test(password) },
  ]), [password]);

  const canSubmit =
    token &&
    password &&
    confirmPassword &&
    password === confirmPassword &&
    passwordChecks.every((check) => check.ok);

  const handleSubmit = async () => {
    setError("");

    if (!token) {
      setError("Reset token is missing. Please request a new reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!passwordChecks.every((check) => check.ok)) {
      setError("Use a stronger password before continuing.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/reset", { token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || "Password reset failed. Please request a new link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
    }}>
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(0,245,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.025) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%",
        maxWidth: "460px",
        padding: "34px",
        borderRadius: "20px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 40px 110px rgba(0,0,0,0.55)",
        position: "relative",
        animation: "fadeUp 0.45s ease both",
      }}>
        <div style={{
          width: "44px",
          height: "44px",
          borderRadius: "13px",
          background: done ? "linear-gradient(135deg, #00a86b, #00f5ff)" : "linear-gradient(135deg, #0080ff, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 28px rgba(0,128,255,0.35)",
          marginBottom: "22px",
        }}>
          {done ? <CheckCircle2 size={22} color="white" /> : <Shield size={22} color="white" />}
        </div>

        {done ? (
          <>
            <h1 style={{ fontSize: "1.55rem", fontWeight: 700, marginBottom: "10px", fontFamily: "Space Grotesk, sans-serif" }}>
              Password updated
            </h1>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.45)", marginBottom: "26px" }}>
              Your CyberShield password has been changed. You can now sign in with your new password.
            </p>
            <PrimaryButton label="Back to sign in" onClick={() => navigate("/")} />
          </>
        ) : (
          <>
            <div style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.65rem",
              color: "rgba(0,245,255,0.65)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}>
              Account Recovery
            </div>
            <h1 style={{ fontSize: "1.55rem", fontWeight: 700, marginBottom: "10px", fontFamily: "Space Grotesk, sans-serif" }}>
              Create a new password
            </h1>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.42)", marginBottom: "24px" }}>
              Choose a strong password to finish resetting your account.
            </p>

            <PasswordInput
              label="New password"
              value={password}
              show={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              onChange={setPassword}
            />

            <div style={{ marginTop: "14px" }}>
              <PasswordInput
                label="Confirm password"
                value={confirmPassword}
                show={showPassword}
                onToggle={() => setShowPassword((value) => !value)}
                onChange={setConfirmPassword}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px", marginBottom: "18px" }}>
              {passwordChecks.map((check) => (
                <span
                  key={check.label}
                  style={{
                    padding: "5px 8px",
                    borderRadius: "8px",
                    fontSize: "0.68rem",
                    fontFamily: "JetBrains Mono, monospace",
                    color: check.ok ? "rgba(0,255,136,0.9)" : "rgba(255,255,255,0.28)",
                    background: check.ok ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.04)",
                    border: check.ok ? "1px solid rgba(0,255,136,0.18)" : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {check.label}
                </span>
              ))}
            </div>

            {error && (
              <div style={{
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(255,51,102,0.09)",
                border: "1px solid rgba(255,51,102,0.18)",
                color: "rgba(255,130,155,0.92)",
                fontSize: "0.8rem",
                marginBottom: "16px",
              }}>
                {error}
              </div>
            )}

            <PrimaryButton
              label={loading ? "Updating..." : "Update password"}
              disabled={loading || !canSubmit}
              onClick={handleSubmit}
            />

            <button
              onClick={() => navigate("/")}
              style={{
                marginTop: "18px",
                width: "100%",
                background: "none",
                border: "none",
                color: "rgba(0,245,255,0.7)",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 600,
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PasswordInput({ label, value, show, onToggle, onChange }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{
        display: "block",
        fontSize: "0.72rem",
        color: "rgba(255,255,255,0.4)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
        fontFamily: "JetBrains Mono, monospace",
      }}>
        {label}
      </span>
      <div style={{ position: "relative" }}>
        <Lock size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.22)" }} />
        <input
          value={value}
          type={show ? "text" : "password"}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "13px 44px 13px 42px",
            borderRadius: "11px",
            background: "rgba(0,0,0,0.28)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            fontSize: "0.9rem",
            outline: "none",
            fontFamily: "Space Grotesk, sans-serif",
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            right: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.36)",
            cursor: "pointer",
            padding: 0,
            display: "flex",
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

function PrimaryButton({ label, disabled = false, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: "12px",
        background: disabled ? "rgba(0,128,255,0.25)" : "linear-gradient(135deg, #0080ff, #8b5cf6)",
        border: "1px solid rgba(0,245,255,0.2)",
        color: "white",
        fontSize: "0.9rem",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: disabled ? "none" : "0 0 24px rgba(0,128,255,0.2)",
        fontFamily: "Space Grotesk, sans-serif",
      }}
    >
      {label}
      {!disabled && <ArrowRight size={16} />}
    </button>
  );
}

export default ResetPassword;
