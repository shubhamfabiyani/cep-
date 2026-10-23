import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import pictLogo from "./assets/pict-logo.png";
import { saveAdminAuth } from "./AdminAuth";

export function AdminLoginPage({ onLoginSuccess, onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const API_BASE_URL = import.meta.env.VITE_API_URL || "";
    const endpoint = `${API_BASE_URL}/api/admin/login`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("[ADMIN LOGIN] JSON parse error:", jsonErr);
        throw new Error("Invalid response received from authentication server.");
      }

      if (!res.ok || !data.success) {
        const errorMsg = data?.message || "Invalid email or password";
        console.error("[ADMIN LOGIN] Failed:", res.status, errorMsg);
        setError(errorMsg);
        return;
      }

      // Save token and admin session
      const saved = saveAdminAuth({
        token: data.token,
        admin: data.admin,
      });

      onLoginSuccess(saved);
    } catch (err) {
      console.error("[ADMIN LOGIN] Network or Auth Error:", err);
      if (
        err.name === "TypeError" ||
        err.message?.includes("fetch") ||
        err.message?.includes("NetworkError") ||
        err.message?.includes("Failed to fetch")
      ) {
        setError("Cannot reach server, please try again. Ensure backend is running on port 5000.");
      } else {
        setError(err.message || "Cannot reach server, please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrapper">
      <header className="topbar">
        <div className="topbarInner">
          <div
            className="brand"
            onClick={() => onNavigate("/")}
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer" }}
          >
            <img
              className="brandLogo"
              src={pictLogo}
              alt="PICT Pune Logo"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/pict-logo.png";
              }}
            />
            <div className="brandMeta">
              <span className="brandTitle">Engineering Scholarship Finder</span>
              <span className="brandSubtitle">Administrative Control Center</span>
            </div>
          </div>
          <div className="institutionTag" style={{ margin: 0, backgroundColor: "#EBF5F3", color: "#176B63" }}>
            <Shield size={14} />
            PICT Staff Portal
          </div>
        </div>
      </header>

      <main className="authMain">
        <div className="authCard" style={{ maxWidth: "440px" }}>
          {/* Segmented Role Switcher: Student vs Admin */}
          <div className="roleSelectorTabs">
            <button
              type="button"
              className="roleTab"
              onClick={() => onNavigate("/")}
            >
              <GraduationCap size={15} />
              <span>Student</span>
            </button>
            <button
              type="button"
              className="roleTab active"
              onClick={() => {}}
            >
              <Shield size={15} />
              <span>Admin</span>
            </button>
          </div>

          <div className="authHeader">
            <div className="authLogoWrap">
              <img
                className="authLogo"
                src={pictLogo}
                alt="PICT Logo"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/pict-logo.png";
                }}
              />
            </div>
            <div className="adminShieldBadge">
              <ShieldAlert size={14} />
              <span>Administrative Access</span>
            </div>
            <h1 className="authTitle" style={{ marginTop: "8px" }}>
              Admin Sign In
            </h1>
            <p className="authSubtitle">
              Authorized personnel only. Access system analytics, student registrations, and administrative settings.
            </p>
          </div>

          {error && (
            <div className="alertBox alertBoxError" style={{ marginBottom: "18px" }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          <form className="authForm" onSubmit={handleSubmit} noValidate>
            <div className="formField">
              <label htmlFor="adminEmailInput">Administrator Email</label>
              <div className="inputWithIcon">
                <Mail size={18} className="inputIconLeft" aria-hidden="true" />
                <input
                  id="adminEmailInput"
                  type="email"
                  className="authInput hasLeadingIcon"
                  placeholder="e.g. pict@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  autoFocus
                  autoComplete="username"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="formField">
              <label htmlFor="adminPasswordInput">Password</label>
              <div className="inputWithIcon">
                <Lock size={18} className="inputIconLeft" aria-hidden="true" />
                <input
                  id="adminPasswordInput"
                  type={showPassword ? "text" : "password"}
                  className="authInput hasLeadingIcon hasTrailingIcon"
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="inputTogglePassword"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btnPrimary btnFull ${loading ? "btnSubmitting" : ""}`}
              disabled={loading}
              style={{ marginTop: "10px" }}
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  Login as Admin
                  <ArrowRight size={16} className="btnIcon" />
                </>
              )}
            </button>
          </form>

          <div className="authFooterSwitch" style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
            <button
              type="button"
              className="authSwitchBtn"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
              onClick={() => onNavigate("/")}
            >
              <ArrowLeft size={14} />
              Return to Student Scholarship Portal
            </button>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footerInner">
          <div className="footerCredit">
            <span>SCTR's Pune Institute of Computer Technology (PICT)</span>
            <span>Engineering Scholarship Finder Administrative Services & Security System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
