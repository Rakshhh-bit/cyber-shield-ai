import React, { useState } from "react";
import api from "../utils/api";

import {
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Zap,
  Phone,
} from "lucide-react";

const SECURITY_TIPS = [
  "Never click links in unsolicited emails",
  "Verify sender domains carefully — look for typos",
  "Hover over links before clicking to preview URLs",
  "Enable 2FA on all critical accounts",
  "Use unique passwords for each service",
];

function Auth() {

  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("form");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const [tipIndex] = useState(
    Math.floor(Math.random() * SECURITY_TIPS.length)
  );

  // ─── PARSE ERROR FROM BACKEND ─────────────────────────────────
  const parseError = (err) => {
    console.error("Full error object:", err);
    
    if (!err) return "Something went wrong. Please try again.";
    
    // Network error or no response
    if (!err?.response) {
      return err?.message || "Network error - please check your connection and server is running.";
    }
    
    const data = err.response.data;
    if (!data) return "Server error - no response data";
    if (typeof data === "string") return data;
    if (typeof data === "object" && data.error) return data.error;
    if (typeof data === "object" && data.message) return data.message;
    return JSON.stringify(data);
  };

  // ─── PASSWORD VALIDATION ──────────────────────────────────────
  const validatePassword = (pass) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(pass);

  // ─── LOGIN / REGISTER ─────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      // ── LOGIN ──
      if (mode === "login") {
        const trimmedIdentifier = String(identifier || "").trim();
        const trimmedPassword = String(password || "").trim();

        if (!trimmedIdentifier) {
          setError("Please enter your email or mobile number.");
          return;
        }
        if (!trimmedPassword) {
          setError("Please enter your password.");
          return;
        }

        const res = await api.post("/auth/login", {
          identifier: trimmedIdentifier,
          password: trimmedPassword,
        });

        // Handle error responses
        if (res.status >= 400) {
          setError(res.data?.error || "Login failed");
          return;
        }

        if (!res.data?.token) {
          setError("Login failed — no token received.");
          return;
        }

        localStorage.setItem("token", res.data.token);
        window.location.replace("/home");
        return;
      }

      // ── REGISTER ──
      if (mode === "register") {
        const trimmedFirstName  = String(firstName  || "").trim();
        const trimmedLastName   = String(lastName   || "").trim();
        const trimmedEmail      = String(email      || "").trim();
        const trimmedMobile     = String(mobile     || "").trim();
        const trimmedPassword   = String(password   || "").trim();

        if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !trimmedMobile || !trimmedPassword) {
          setError("All fields are required.");
          return;
        }

        if (!validatePassword(trimmedPassword)) {
          setError("Password must contain uppercase, lowercase, number and special symbol.");
          return;
        }

        const payload = {
          firstName: trimmedFirstName,
          lastName:  trimmedLastName,
          email:     trimmedEmail,
          mobile:    trimmedMobile,
          password:  trimmedPassword,
        };

        console.log("Registering with payload:", payload);

        try {
          const registerRes = await api.post("/auth/register", payload);

          console.log("Register response:", registerRes);

          // Handle error responses (4xx, 5xx)
          if (registerRes.status >= 400) {
            setError(registerRes.data?.error || `Registration failed (${registerRes.status})`);
            return;
          }

          setStep("otp");
        } catch (registrationError) {
          console.error("Registration error details:", registrationError);
          throw registrationError; // Re-throw to be caught by outer catch
        }
      }

    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  // ─── VERIFY OTP ───────────────────────────────────────────────
  // FIX: backend verifyOTP expects { email, otp } — NOT { identifier, otp }
  const verifyOtp = async () => {
    try {
      setLoading(true);
      setError("");

      if (!otp.trim()) {
        setError("Please enter the OTP.");
        return;
      }

      await api.post("/auth/verify", {
        email: String(email || "").trim(),
        otp: otp.trim(),
      });

      setMode("login");
      setStep("form");
      setOtp("");
      setError("");

    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  // ─── FORGOT PASSWORD ──────────────────────────────────────────
  const handleForgot = async () => {
    try {
      setLoading(true);
      setError("");

      const trimmedIdentifier = String(identifier || "").trim();
      if (!trimmedIdentifier) {
        setError("Please enter your email address.");
        return;
      }

      await api.post("/auth/forgot", {
        email: trimmedIdentifier,
      });

      setError("Reset link sent successfully. Check your email.");

    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <div
      className="auth-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
      }}
    >

      {/* AMBIENT GLOW */}
      <div
        style={{
          position: "fixed",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,128,255,0.08) 0%, transparent 70%)",
          top: "50%",
          left: "30%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "920px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderRadius: "24px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.6)",
        }}
      >

        {/* ── LEFT PANEL ── */}
        <div
          style={{
            background: "linear-gradient(145deg, rgba(0,128,255,0.08) 0%, rgba(139,92,246,0.08) 100%)",
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>

            {/* LOGO */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #0080ff, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={20} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: "Orbitron", fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.06em" }}>
                  CYBERSHIELD
                </div>
                <div style={{ fontSize: "0.6rem", color: "#00f5ff", letterSpacing: "0.12em" }}>
                  AI SECURITY
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "16px" }}>
              {mode === "login" ? "Welcome back." : "Join the shield."}
            </h2>

            <p style={{ color: "rgba(255,255,255,0.45)", lineHeight: "1.7" }}>
              {mode === "login"
                ? "Your cybersecurity dashboard awaits."
                : "Start protecting yourself from phishing and scams."}
            </p>
          </div>

          {/* SECURITY TIP */}
          <div
            style={{
              padding: "18px",
              borderRadius: "14px",
              background: "rgba(0,245,255,0.05)",
              border: "1px solid rgba(0,245,255,0.12)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Zap size={14} color="#00f5ff" />
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.12em", color: "#00f5ff" }}>
                SECURITY TIP
              </span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem" }}>
              {SECURITY_TIPS[tipIndex]}
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >

          <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
            {mode === "login" && "Sign In"}
            {mode === "register" && "Create Account"}
            {mode === "forgot" && "Reset Password"}
          </h3>

          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "28px" }}>
            {mode === "login"    && "Login using email or mobile number"}
            {mode === "register" && "Set up your CyberShield account"}
            {mode === "forgot"   && "We'll send you a reset link"}
          </p>

          {/* ERROR BOX */}
          {error && (
            <div
              style={{
                marginBottom: "18px",
                padding: "14px",
                borderRadius: "12px",
                background: error.toLowerCase().includes("success")
                  ? "rgba(0,255,128,0.08)"
                  : "rgba(255,0,0,0.08)",
                border: error.toLowerCase().includes("success")
                  ? "1px solid rgba(0,255,128,0.2)"
                  : "1px solid rgba(255,0,0,0.2)",
                color: error.toLowerCase().includes("success") ? "#00ff88" : "#ff6b6b",
                fontSize: "0.85rem",
              }}
            >
              {error}
            </div>
          )}

          {/* ── OTP SCREEN ── */}
          {step === "otp" ? (
            <>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "18px", fontSize: "0.85rem" }}>
                An OTP has been sent to <strong style={{ color: "white" }}>{email}</strong>
              </p>

              <InputField
                icon={Lock}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={setOtp}
              />

              <div style={{ height: "20px" }} />

              <AuthButton onClick={verifyOtp} loading={loading} label="Verify OTP" />

              <button
                onClick={() => { setStep("form"); setMode("register"); setOtp(""); setError(""); }}
                style={{
                  marginTop: "14px",
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                ← Back to registration
              </button>
            </>

          ) : (
            <>
              {/* REGISTER FIELDS */}
              {mode === "register" && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <InputField icon={User} placeholder="First Name"  value={firstName} onChange={setFirstName} />
                    <InputField icon={User} placeholder="Last Name"   value={lastName}  onChange={setLastName}  />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <InputField icon={Phone} placeholder="Mobile Number (10 digits)" value={mobile} onChange={setMobile} />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <InputField icon={Mail} placeholder="Email Address" value={email} onChange={setEmail} />
                  </div>
                </>
              )}

              {/* LOGIN / FORGOT — identifier field */}
              {mode !== "register" && (
                <div style={{ marginBottom: "16px" }}>
                  <InputField
                    icon={Mail}
                    placeholder={mode === "forgot" ? "Enter your email" : "Email or Mobile Number"}
                    value={identifier}
                    onChange={setIdentifier}
                  />
                </div>
              )}

              {/* PASSWORD */}
              {mode !== "forgot" && (
                <div style={{ marginBottom: "14px" }}>
                  <InputField
                    icon={Lock}
                    placeholder="Password"
                    value={password}
                    type={showPass ? "text" : "password"}
                    onChange={setPassword}
                    rightEl={
                      <button
                        onClick={() => setShowPass(!showPass)}
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                </div>
              )}

              {/* PASSWORD REQUIREMENTS NOTE */}
              {mode === "register" && (
                <div
                  style={{
                    marginBottom: "22px",
                    padding: "12px",
                    borderRadius: "12px",
                    background: "rgba(0,245,255,0.04)",
                    border: "1px solid rgba(0,245,255,0.12)",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: "0.78rem",
                    lineHeight: "1.7",
                  }}
                >
                  Password must contain:
                  <br />• Minimum 8 characters
                  <br />• One uppercase letter
                  <br />• One number
                  <br />• One special symbol (@$!%*?&)
                </div>
              )}

              {/* FORGOT LINK */}
              {mode === "login" && (
                <button
                  onClick={() => { setMode("forgot"); setError(""); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.4)",
                    textAlign: "right",
                    marginBottom: "18px",
                    cursor: "pointer",
                  }}
                >
                  Forgot password?
                </button>
              )}

              {/* SUBMIT BUTTON */}
              <AuthButton
                onClick={mode === "forgot" ? handleForgot : handleSubmit}
                loading={loading}
                label={
                  mode === "login"    ? "Sign In" :
                  mode === "register" ? "Send OTP" :
                                        "Send Reset Link"
                }
              />

              {/* SWITCH MODE */}
              <div style={{ marginTop: "22px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                {mode === "login" && (
                  <>
                    Don't have an account?{" "}
                    <button
                      onClick={() => { setMode("register"); setError(""); }}
                      style={{ background: "none", border: "none", color: "#00f5ff", cursor: "pointer" }}
                    >
                      Sign up
                    </button>
                  </>
                )}

                {mode === "register" && (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => { setMode("login"); setError(""); }}
                      style={{ background: "none", border: "none", color: "#00f5ff", cursor: "pointer" }}
                    >
                      Sign in
                    </button>
                  </>
                )}

                {mode === "forgot" && (
                  <button
                    onClick={() => { setMode("login"); setError(""); }}
                    style={{ background: "none", border: "none", color: "#00f5ff", cursor: "pointer" }}
                  >
                    ← Back to login
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── INPUT FIELD ──────────────────────────────────────────────────
function InputField({ icon: Icon, placeholder, value, onChange, type = "text", rightEl }) {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "rgba(255,255,255,0.25)",
          pointerEvents: "none",
        }}
      >
        <Icon size={16} />
      </div>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        style={{
          width: "100%",
          padding: "14px 16px 14px 42px",
          paddingRight: rightEl ? "44px" : "16px",
          borderRadius: "12px",
          background: "rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "white",
          outline: "none",
          fontSize: "0.9rem",
          boxSizing: "border-box",
        }}
      />

      {rightEl && (
        <div
          style={{
            position: "absolute",
            right: "14px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          {rightEl}
        </div>
      )}
    </div>
  );
}

// ─── AUTH BUTTON ──────────────────────────────────────────────────
function AuthButton({ onClick, loading, label }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: "12px",
        background: loading
          ? "rgba(0,128,255,0.3)"
          : "linear-gradient(135deg, #0080ff, #8b5cf6)",
        border: "1px solid rgba(0,245,255,0.2)",
        color: "white",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      {loading ? "Loading..." : <>{label} <ArrowRight size={16} /></>}
    </button>
  );
}

export default Auth;