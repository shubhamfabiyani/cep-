import React, { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  Shield,
  ShieldAlert,
  UserPlus,
  UserRound,
} from "lucide-react";
import pictLogo from "./assets/pict-logo.png";
import { saveAdminAuth } from "./AdminAuth";

export const AUTH_STORAGE_KEY = "scholar_auth";

// Check if a saved session exists and is still valid within 10 days
export function getSavedAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.token && parsed.expiresAt && parsed.expiresAt > Date.now()) {
      return parsed;
    }
    // Expired or invalid
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  } catch (e) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function AuthPage({ onAuthSuccess, onAdminSuccess, onNavigate, initialRole = "student" }) {
  // Role switcher: "student" or "admin"
  const [authRole, setAuthRole] = useState(initialRole);

  React.useEffect(() => {
    if (initialRole) {
      setAuthRole(initialRole);
    }
  }, [initialRole]);

  // Student Form States
  const [isRegister, setIsRegister] = useState(true);
  const [prn, setPrn] = useState("");
  const [prnTouched, setPrnTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Admin Form States
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  const handlePrnChange = (e) => {
    setPrn(e.target.value);
    if (error) setError("");
  };

  const handleTabSwitch = (toRegister) => {
    setIsRegister(toRegister);
    setError("");
    setSuccessMsg("");
    setSubmitted(false);
    setPrnTouched(false);
  };

  // PRN invalid check: show error only after touched or on submit when empty
  const isPrnInvalid = (prnTouched || submitted) && !prn.trim();
  const prnError = isPrnInvalid ? "Please enter your PRN." : "";

  // Handle Student Submit (Register or Login)
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");
    setSuccessMsg("");

    const cleanPrn = prn.trim();

    if (!cleanPrn) {
      setError("Please enter your PRN.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    const API_BASE_URL = import.meta.env.VITE_API_URL || "";
    const endpoint = `${API_BASE_URL}${isRegister ? "/api/auth/register" : "/api/auth/login"}`;

    try {
      console.log(`[AUTH] Fetching student ${isRegister ? "register" : "login"}:`, endpoint);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prn: cleanPrn, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("[AUTH] JSON parse error:", jsonErr);
        throw new Error("Invalid response received from server.");
      }

      if (!res.ok || !data.success) {
        const errorMsg =
          data?.message ||
          (res.status === 409
            ? "A user with this PRN is already registered."
            : res.status === 401
            ? "Invalid PRN number or password."
            : "Authentication failed.");
        console.error("[AUTH] Request error response:", res.status, errorMsg);
        setError(errorMsg);
        return;
      }

      const authData = {
        token: data.token,
        prn: data.user.prn,
        expiresAt: data.expiresAt,
      };

      // Persist auth session in localStorage for 10 days
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

      setSuccessMsg(
        isRegister
          ? "Registration successful! Loading your scholarship portal..."
          : "Login successful! Welcome back..."
      );

      setTimeout(() => {
        onAuthSuccess(authData);
      }, 600);
    } catch (err) {
      console.error("[AUTH] Network/Fetch error:", err);
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

  // Handle Admin Login Submit
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError("");

    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!cleanEmail || !adminPassword) {
      setAdminError("Please enter both email and password.");
      return;
    }

    setAdminLoading(true);
    const API_BASE_URL = import.meta.env.VITE_API_URL || "";
    const endpoint = `${API_BASE_URL}/api/admin/login`;

    try {
      console.log("[ADMIN LOGIN] Submitting credentials to:", endpoint);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: adminPassword }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("[ADMIN LOGIN] JSON parse error:", jsonErr);
        throw new Error("Invalid response received from authentication server.");
      }

      if (!res.ok || !data.success) {
        setAdminError(data?.message || "Invalid email or password");
        return;
      }

      // Save admin session with 2 hours expiry
      const saved = saveAdminAuth({
        token: data.token,
        admin: data.admin,
      });

      if (onAdminSuccess) {
        onAdminSuccess(saved);
      } else if (onNavigate) {
        onNavigate("/admin/dashboard");
      }
    } catch (err) {
      console.error("[ADMIN LOGIN] Error:", err);
      if (
        err.name === "TypeError" ||
        err.message?.includes("fetch") ||
        err.message?.includes("NetworkError") ||
        err.message?.includes("Failed to fetch")
      ) {
        setAdminError("Cannot reach server, please try again. Ensure backend is running on port 5000.");
      } else {
        setAdminError(err.message || "Cannot reach server, please try again.");
      }
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="authWrapper">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand" onClick={() => setAuthRole("student")} style={{ cursor: "pointer" }}>
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
              <span className="brandSubtitle">PICT Engineering Scholarship Portal</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="institutionTag"
              style={{
                margin: 0,
                cursor: "pointer",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
              onClick={() => {
                const nextRole = authRole === "student" ? "admin" : "student";
                setAuthRole(nextRole);
                setError("");
                setAdminError("");
              }}
              title="Switch between Student and Admin views"
            >
              {authRole === "student" ? (
                <>
                  <Shield size={14} />
                  <span>Admin Access</span>
                </>
              ) : (
                <>
                  <GraduationCap size={14} />
                  <span>Student Portal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="authMain">
        <div className="authCard">
          {/* Segmented Role Switcher: Student vs Admin */}
          <div className="roleSelectorTabs">
            <button
              type="button"
              className={`roleTab ${authRole === "student" ? "active" : ""}`}
              onClick={() => {
                setAuthRole("student");
                setError("");
                setAdminError("");
              }}
            >
              <GraduationCap size={15} />
              <span>Student</span>
            </button>
            <button
              type="button"
              className={`roleTab ${authRole === "admin" ? "active" : ""}`}
              onClick={() => {
                setAuthRole("admin");
                setError("");
                setAdminError("");
              }}
            >
              <Shield size={15} />
              <span>Admin</span>
            </button>
          </div>

          {/* =======================================================
              VIEW A: ADMINISTRATOR LOGIN FORM
             ======================================================= */}
          {authRole === "admin" ? (
            <div>
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
                <div className="adminShieldBadge" style={{ marginBottom: "8px" }}>
                  <ShieldAlert size={14} />
                  <span>Authorized Personnel Only</span>
                </div>
                <h1 className="authTitle">Administrator Login</h1>
                <p className="authSubtitle">
                  Sign in with your staff email and administrator password.
                </p>
              </div>

              {adminError && (
                <div className="alertBox alertBoxError" style={{ marginBottom: "16px" }}>
                  <AlertCircle size={17} style={{ flexShrink: 0 }} />
                  <div>{adminError}</div>
                </div>
              )}

              <form className="authForm" onSubmit={handleAdminSubmit} noValidate>
                <div className="formField">
                  <label htmlFor="adminEmailInput">Administrator Email</label>
                  <div className="inputWithIcon">
                    <Mail size={18} className="inputIconLeft" aria-hidden="true" />
                    <input
                      id="adminEmailInput"
                      type="email"
                      className="authInput hasLeadingIcon"
                      placeholder="e.g. pict@gmail.com"
                      value={adminEmail}
                      onChange={(e) => {
                        setAdminEmail(e.target.value);
                        if (adminError) setAdminError("");
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
                      type={showAdminPassword ? "text" : "password"}
                      className="authInput hasLeadingIcon hasTrailingIcon"
                      placeholder="Enter administrator password"
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        if (adminError) setAdminError("");
                      }}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="inputTogglePassword"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      aria-label={showAdminPassword ? "Hide password" : "Show password"}
                    >
                      {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn btnPrimary btnFull ${adminLoading ? "btnSubmitting" : ""}`}
                  disabled={adminLoading}
                  style={{ marginTop: "6px" }}
                >
                  {adminLoading ? (
                    <span>Verifying credentials...</span>
                  ) : (
                    <>
                      Login as Admin
                      <ArrowRight size={16} className="btnIcon" />
                    </>
                  )}
                </button>
              </form>

              <div
                className="authFooterSwitch"
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <button
                  type="button"
                  className="authSwitchBtn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                  }}
                  onClick={() => {
                    setAuthRole("student");
                    setAdminError("");
                  }}
                >
                  <ArrowLeft size={14} />
                  Switch to Student Login / Registration
                </button>
              </div>
            </div>
          ) : (
            /* =======================================================
               VIEW B: STUDENT REGISTRATION & LOGIN FORM
               ======================================================= */
            <div>
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
                <h1 className="authTitle">
                  {isRegister ? "Student Registration" : "Student Login"}
                </h1>
                <p className="authSubtitle">
                  {isRegister
                    ? "Register your college PRN to create your scholarship account."
                    : "Sign in with your registered PRN number and password."}
                </p>
              </div>

              {/* Student Register vs Sign In Tabs */}
              <div className="authTabs">
                <button
                  type="button"
                  className={`authTab ${isRegister ? "active" : ""}`}
                  onClick={() => handleTabSwitch(true)}
                >
                  <UserPlus size={15} />
                  Register
                </button>
                <button
                  type="button"
                  className={`authTab ${!isRegister ? "active" : ""}`}
                  onClick={() => handleTabSwitch(false)}
                >
                  <LogIn size={15} />
                  Sign In
                </button>
              </div>

              {/* 10-day persistence badge */}
              <div className="sessionBadgeNotice" style={{ marginBottom: "18px" }}>
                <Clock size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>10-Day Remember Login:</strong> You will stay logged in for at least 10 days on this browser unless you log out.
                </span>
              </div>

              {error && (
                <div className="alertBox alertBoxError" style={{ marginBottom: "16px" }}>
                  <AlertCircle size={17} style={{ flexShrink: 0 }} />
                  <div>{error}</div>
                </div>
              )}

              {successMsg && (
                <div className="alertBox alertBoxSuccess" style={{ marginBottom: "16px" }}>
                  <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                  <div>{successMsg}</div>
                </div>
              )}

              <form className="authForm" onSubmit={handleStudentSubmit} noValidate>
                <div className="formField">
                  <label htmlFor="prnInput">College PRN Number</label>
                  <div className="inputWithIcon">
                    <UserRound size={18} className="inputIconLeft" aria-hidden="true" />
                    <input
                      id="prnInput"
                      type="text"
                      className={`authInput hasLeadingIcon ${prnError ? "authInputError" : ""}`}
                      placeholder="Enter your PRN"
                      value={prn}
                      onChange={handlePrnChange}
                      onBlur={() => setPrnTouched(true)}
                      required
                      autoFocus
                      autoComplete="username"
                      spellCheck={false}
                    />
                  </div>
                  {prnError && <span className="fieldInlineError">{prnError}</span>}
                </div>

                <div className="formField">
                  <label htmlFor="passwordInput">Password</label>
                  <div className="inputWithIcon">
                    <Lock size={18} className="inputIconLeft" aria-hidden="true" />
                    <input
                      id="passwordInput"
                      type={showPassword ? "text" : "password"}
                      className="authInput hasLeadingIcon hasTrailingIcon"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      required
                      autoComplete={isRegister ? "new-password" : "current-password"}
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
                  <span className="inputHelp">Must be at least 4 characters</span>
                </div>

                {isRegister && (
                  <div className="formField">
                    <label htmlFor="confirmPasswordInput">Confirm Password</label>
                    <div className="inputWithIcon">
                      <KeyRound size={18} className="inputIconLeft" aria-hidden="true" />
                      <input
                        id="confirmPasswordInput"
                        type={showConfirmPassword ? "text" : "password"}
                        className="authInput hasLeadingIcon hasTrailingIcon"
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (error) setError("");
                        }}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="inputTogglePassword"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className={`btn btnPrimary btnFull ${loading ? "btnSubmitting" : ""}`}
                  disabled={loading}
                  style={{ marginTop: "6px" }}
                >
                  {loading ? (
                    <span>Connecting to database...</span>
                  ) : isRegister ? (
                    <>
                      Register & Continue
                      <ArrowRight size={16} className="btnIcon" />
                    </>
                  ) : (
                    <>
                      Sign In & Continue
                      <ArrowRight size={16} className="btnIcon" />
                    </>
                  )}
                </button>
              </form>

              <div className="authFooterSwitch">
                {isRegister ? (
                  <span>
                    Already registered?{" "}
                    <button
                      type="button"
                      className="authSwitchBtn"
                      onClick={() => handleTabSwitch(false)}
                    >
                      Sign In here
                    </button>
                  </span>
                ) : (
                  <span>
                    First time here?{" "}
                    <button
                      type="button"
                      className="authSwitchBtn"
                      onClick={() => handleTabSwitch(true)}
                    >
                      Register account
                    </button>
                  </span>
                )}
              </div>

              {/* Clearly visible secondary option to log in as admin */}
              <div className="adminAccessActionBlock">
                <button
                  type="button"
                  id="adminLoginSecondaryBtn"
                  className="btnSecondaryAdmin"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate("/admin/login");
                    } else {
                      setAuthRole("admin");
                    }
                    setError("");
                    setAdminError("");
                  }}
                >
                  <Shield size={15} />
                  <span>Login as Admin</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footerInner">
          <div className="footerCredit">
            <span>SCTR's Pune Institute of Computer Technology (PICT)</span>
            <span>Student Authentication & Scholarship Discovery Portal</span>
          </div>
          <div>
            <a
              href="/admin/login"
              className="footerAdminLink"
              onClick={(e) => {
                e.preventDefault();
                setAuthRole("admin");
              }}
            >
              Admin Portal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
