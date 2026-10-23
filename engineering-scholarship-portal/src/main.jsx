import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  HeartHandshake,
  Home,
  Info,
  KeyRound,
  Landmark,
  Lock,
  LogIn,
  LogOut,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  UserRound,
  Wallet
} from "lucide-react";
import "./styles.css";
import { AuthPage, getSavedAuth, AUTH_STORAGE_KEY } from "./AuthPage";
import pictLogo from "./assets/pict-logo.png";
import { AdminLoginPage } from "./AdminLoginPage";
import { AdminDashboard } from "./AdminDashboard";
import { getSavedAdminAuth, clearAdminAuth } from "./AdminAuth";

const tabs = [
  "All",
  "Government",
  "Private",
  "Hostel",
  "Maintenance",
  "Girls",
  "PwD",
  "Merit",
  "State"
];

const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const categories = ["General", "OBC", "SC", "ST", "EWS", "Minority", "PwD", "VJNT", "SBC", "DNT"];
const states = ["All India", "Maharashtra", "Karnataka", "Gujarat", "Telangana", "Tamil Nadu", "Rajasthan", "Uttar Pradesh", "Delhi", "Other"];
const branches = ["Any", "CSE / IT", "AI / ML / Data Science", "ECE / EEE", "Mechanical", "Civil", "Chemical", "Aerospace", "Other"];
const colleges = ["AICTE-approved", "Government", "Private", "Autonomous", "IIT / NIT / IIIT", "NIRF Top 50", "State Govt"];

const allCategoriesList = ["General", "OBC", "SC", "ST", "EWS", "Minority", "PwD", "VJNT", "SBC", "DNT"];

const scholarships = [
  {
    id: "pm-usp",
    name: "PM-USP Central Sector Scholarship Scheme",
    type: "Government",
    groups: ["Government", "Merit"],
    years: [1, 2, 3, 4],
    cats: allCategoriesList,
    income: 450000,
    state: "All India",
    amount: "₹12,000/yr (Yr 1-3), ₹20,000 (Yr 4)",
    deadline: "NSP Annual Cycle (Oct – Dec)",
    authority: "Department of Higher Education (NSP)",
    url: "https://scholarships.gov.in",
    desc: "Central sector scholarship for meritorious students entering regular undergraduate technical and non-technical programs."
  },
  {
    id: "aicte-pragati",
    name: "AICTE Pragati Scholarship for Girls",
    type: "Government",
    groups: ["Government", "Girls", "Merit"],
    years: [1, 2, 3, 4],
    cats: allCategoriesList,
    gender: "Female",
    income: 800000,
    state: "All India",
    amount: "₹50,000 per annum",
    deadline: "AICTE / NSP Notification Window",
    authority: "AICTE, New Delhi",
    url: "https://www.aicte-india.org",
    desc: "Dedicated financial grant to advance technical education for meritorious girl students admitted to AICTE-approved institutions."
  },
  {
    id: "aicte-saksham",
    name: "AICTE Saksham Scholarship for PwD Students",
    type: "Government",
    groups: ["Government", "PwD", "Merit"],
    years: [1, 2, 3, 4],
    cats: ["PwD"],
    income: 800000,
    state: "All India",
    amount: "₹50,000 per annum",
    deadline: "AICTE / NSP Notification Window",
    authority: "AICTE, New Delhi",
    url: "https://www.aicte-india.org",
    desc: "Specialized assistance scheme for students with benchmark disability (40% or more) pursuing technical degree courses."
  },
  {
    id: "top-class-sc",
    name: "Top Class Education Scheme for SC Students",
    type: "Government",
    groups: ["Government", "Maintenance", "Merit"],
    years: [1, 2, 3, 4],
    cats: ["SC"],
    income: 800000,
    state: "All India",
    amount: "Full tuition + living allowances",
    deadline: "NSP Annual Schedule",
    authority: "Ministry of Social Justice & Empowerment",
    url: "https://socialjustice.gov.in",
    desc: "Provides full tuition reimbursement, living expenses allowance, and academic book support for SC students in premier institutes."
  },
  {
    id: "top-class-st",
    name: "Top Class Education Scheme for ST Students",
    type: "Government",
    groups: ["Government", "Maintenance", "Merit"],
    years: [1, 2, 3, 4],
    cats: ["ST"],
    income: 600000,
    state: "All India",
    amount: "Full institutional fee + living stipend",
    deadline: "NSP Annual Schedule",
    authority: "Ministry of Tribal Affairs",
    url: "https://tribal.nic.in",
    desc: "Comprehensive funding covering entire tuition fees, hostel expenses, and study materials for meritorious ST students."
  },
  {
    id: "panjabrao-deshmukh",
    name: "Dr. Panjabrao Deshmukh Hostel Maintenance Allowance",
    type: "Government",
    groups: ["Government", "Hostel", "Maintenance", "State"],
    years: [1, 2, 3, 4],
    cats: allCategoriesList,
    income: 800000,
    state: "Maharashtra",
    amount: "Up to ₹30,000 / year (Hostel)",
    deadline: "MahaDBT Official Timeline",
    authority: "Directorate of Technical Education (DTE), Maharashtra",
    url: "https://mahadbt.maharashtra.gov.in",
    desc: "Maharashtra state subsistence allowance for children of registered workers and marginal farmers staying in hostel accommodations."
  },
  {
    id: "chhatrapati-shahu",
    name: "Rajarshi Chhatrapati Shahu Maharaj Fee Concession",
    type: "Government",
    groups: ["Government", "State", "Merit"],
    years: [1, 2, 3, 4],
    cats: ["General", "EWS", "OBC"],
    income: 800000,
    state: "Maharashtra",
    amount: "50% tuition & exam fee waiver",
    deadline: "MahaDBT Official Timeline",
    authority: "Govt. of Maharashtra (DTE)",
    url: "https://mahadbt.maharashtra.gov.in",
    desc: "Flagship higher education fee reimbursement providing 50% tuition support for economically backward category engineering students."
  },
  {
    id: "bharti-airtel",
    name: "Bharti Airtel Foundation Scholarship",
    type: "Private",
    groups: ["Private", "Maintenance", "Merit"],
    years: [1, 2, 3, 4],
    cats: allCategoriesList,
    income: 800000,
    state: "All India",
    amount: "100% tuition + hostel + mess + laptop",
    deadline: "August – September (Annual)",
    authority: "Bharti Airtel Foundation",
    url: "https://www.bhartiairtelfoundation.org/bharti-airtel-scholarship",
    desc: "High-impact private tech scholarship covering complete academic tuition, hostel fees, computing hardware, and living support."
  },
  {
    id: "kotak-kanya",
    name: "Kotak Kanya Scholarship",
    type: "Private",
    groups: ["Private", "Girls", "Merit"],
    years: [1, 2, 3, 4],
    cats: allCategoriesList,
    gender: "Female",
    income: 600000,
    state: "All India",
    amount: "₹1,50,000 per academic year",
    deadline: "September – October",
    authority: "Kotak Education Foundation",
    url: "https://kotakeducationfoundation.org",
    desc: "Merit-cum-means assistance enabling deserving girl scholars to pursue higher professional education in engineering."
  },
  {
    id: "ffe-scholarship",
    name: "Foundation for Excellence (FFE) Scholarship",
    type: "Private",
    groups: ["Private", "Merit"],
    years: [1, 2, 3, 4],
    cats: allCategoriesList,
    income: 400000,
    state: "All India",
    amount: "₹50,000/yr + technical mentorship",
    deadline: "Rolling / October",
    authority: "Foundation For Excellence",
    url: "https://ffe.org/scholarships/",
    desc: "Need-cum-merit financial support coupled with industry mentorship and soft skills curriculum for engineering undergraduates."
  },
  {
    id: "schaeffler-india",
    name: "Schaeffler India HOPE Engineering Scholarship",
    type: "Private",
    groups: ["Private", "Girls", "Merit"],
    years: [1, 2, 3, 4],
    cats: allCategoriesList,
    gender: "Female",
    income: 800000,
    state: "All India",
    amount: "₹75,000 per year (up to 50% fees)",
    deadline: "August – September",
    authority: "Schaeffler India CSR",
    url: "https://www.schaeffler.co.in",
    desc: "Corporate CSR scholarship aimed at empowering women engineers enrolled in technology and engineering programs."
  }
];

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[APPLICATION CRASH CAUGHT BY ERROR BOUNDARY]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FAFAF7", padding: "20px", fontFamily: "var(--font-sans, sans-serif)" }}>
          <div style={{ maxWidth: "480px", width: "100%", background: "#FFFFFF", padding: "32px", borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 10px 25px rgba(0,0,0,0.06)", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#FEE2E2", color: "#DC2626", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <AlertCircle size={26} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#111827", margin: "0 0 8px" }}>Something went wrong</h2>
            <p style={{ fontSize: "0.88rem", color: "#6B7280", margin: "0 0 20px", lineHeight: "1.5" }}>
              {this.state.error?.message || "An unexpected rendering error occurred. You can reload the page to continue."}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                className="btn btnPrimary"
                onClick={() => window.location.reload()}
                style={{ padding: "8px 18px", fontSize: "0.88rem" }}
              >
                Reload Page
              </button>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => {
                  window.location.href = "/";
                }}
                style={{ padding: "8px 18px", fontSize: "0.88rem" }}
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || "/");
  const [adminAuth, setAdminAuth] = useState(() => getSavedAdminAuth());
  const [user, setUser] = useState(() => getSavedAuth());
  const lastTrackedRef = useRef({ path: null, time: 0 });

  // Listen to popstate (browser back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Visitor Tracking: Track page visits on load and route changes (ignore /admin/* pages)
  useEffect(() => {
    if (currentPath.startsWith("/admin")) {
      return;
    }

    // Guard against React 18 StrictMode double-counting in development
    const now = Date.now();
    if (lastTrackedRef.current.path === currentPath && now - lastTrackedRef.current.time < 1200) {
      return;
    }
    lastTrackedRef.current = { path: currentPath, time: now };

    try {
      let visitorId = localStorage.getItem("scholar_visitor_id");
      if (!visitorId) {
        visitorId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : "vis_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        localStorage.setItem("scholar_visitor_id", visitorId);
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      fetch(`${API_BASE_URL}/api/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      }).catch(() => {
        // Silently ignore network errors
      });
    } catch (e) {
      // Storage unavailable
    }
  }, [currentPath]);

  // Route 1: Admin Login (/admin/login)
  if (currentPath === "/admin/login") {
    // If admin is already logged in with valid token, redirect to dashboard
    if (adminAuth && adminAuth.expiresAt > Date.now()) {
      return (
        <AdminDashboard
          adminAuth={adminAuth}
          onLogout={() => {
            clearAdminAuth();
            setAdminAuth(null);
            navigateTo("/admin/login");
          }}
          onNavigate={navigateTo}
        />
      );
    }
    return (
      <AdminLoginPage
        onLoginSuccess={(auth) => {
          setAdminAuth(auth);
          navigateTo("/admin/dashboard");
        }}
        onNavigate={navigateTo}
      />
    );
  }

  // Route 2: Admin Dashboard & Protected Admin Routes (/admin/*)
  if (currentPath.startsWith("/admin")) {
    // Protected route check: If not logged in as admin, redirect to /admin/login
    if (!adminAuth || adminAuth.expiresAt <= Date.now()) {
      return (
        <AdminLoginPage
          onLoginSuccess={(auth) => {
            setAdminAuth(auth);
            navigateTo("/admin/dashboard");
          }}
          onNavigate={navigateTo}
        />
      );
    }
    return (
      <AdminDashboard
        adminAuth={adminAuth}
        onLogout={() => {
          clearAdminAuth();
          setAdminAuth(null);
          navigateTo("/admin/login");
        }}
        onNavigate={navigateTo}
      />
    );
  }

  // Unified student logout handler that clears localStorage, state, and redirects to root
  const handleStudentLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    navigateTo("/");
  };

  // Route 3: Student Authentication Guard
  if (!user) {
    return (
      <AuthPage
        onAuthSuccess={(userData) => {
          setUser(userData);
          // Redirect cleanly to dashboard/scholarship home upon successful student login
          navigateTo("/");
        }}
        onAdminSuccess={(auth) => {
          setAdminAuth(auth);
          navigateTo("/admin/dashboard");
        }}
        onNavigate={navigateTo}
        initialRole="student"
      />
    );
  }

  // Route 4: Student Scholarship Portal
  return (
    <StudentPortal
      user={user}
      onLogout={handleStudentLogout}
      onNavigate={navigateTo}
      currentPath={currentPath}
    />
  );
}

function StudentPortal({ user, onLogout, onNavigate, currentPath = "/" }) {
  const [profile, setProfile] = useState({
    year: 1,
    category: "General",
    gender: "Any",
    state: "All India",
    branch: "Any",
    college: "AICTE-approved",
    income: 450000,
    hostel: true,
    maintenance: false
  });

  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [started, setStarted] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState(null);

  // Root cause fix for Task 1: handleLogout defined and delegated to onLogout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Check if current URL path is a scholarship detail route: /scholarship/:id or /scholarships/:id
  const isDetailRoute = currentPath.startsWith("/scholarship/") || currentPath.startsWith("/scholarships/");
  const routeParamId = isDetailRoute
    ? currentPath.replace(/^\/(?:scholarship|scholarships)\//, "").split("/")[0]?.trim()
    : null;

  // Resolve active scholarship detail from selected state or route param ID
  const activeScholarship = useMemo(() => {
    if (selectedScholarship) return selectedScholarship;
    if (routeParamId) {
      const match = scholarships.find(
        (s, idx) =>
          s.id === routeParamId ||
          s.id.toLowerCase() === routeParamId.toLowerCase() ||
          String(idx + 1) === routeParamId
      );
      return match || { notFound: true, requestedId: routeParamId };
    }
    return null;
  }, [selectedScholarship, routeParamId]);

  const results = useMemo(() => {
    return scholarships.filter((s) => {
      // Academic year matching
      if (!s.years.includes(profile.year)) return false;

      // Gender check: if female-specific scholarship and user specified male
      if (s.gender === "Female" && profile.gender === "Male") return false;

      // Category check
      if (s.cats.length === 1 && s.cats[0] === "PwD") {
        if (profile.category !== "PwD") return false;
      } else if (!s.cats.includes(profile.category) && !s.cats.includes("General")) {
        return false;
      }

      // State domicile matching
      if (profile.state !== "All India" && s.state !== "All India" && s.state !== profile.state) {
        return false;
      }

      // Income limit check: family income must not exceed scholarship cap
      if (profile.income && s.income && profile.income > s.income) {
        return false;
      }

      // Category tab filtering
      if (tab !== "All") {
        if (tab === "Government" && s.type !== "Government") return false;
        if (tab === "Private" && s.type !== "Private") return false;
        if (["Hostel", "Maintenance", "Girls", "PwD", "Merit", "State"].includes(tab) && !s.groups.includes(tab)) {
          return false;
        }
      }

      // Search keyword matching
      const q = search.toLowerCase().trim();
      if (q) {
        const hay = `${s.name} ${s.type} ${s.amount} ${s.desc} ${s.authority || ""} ${s.deadline} ${s.state}`.toLowerCase();
        return hay.includes(q);
      }

      return true;
    });
  }, [profile, tab, search]);

  const handleBackFromDetail = () => {
    setSelectedScholarship(null);
    setStarted(true);
    if (onNavigate) {
      onNavigate("/");
    }
  };

  // If a scholarship was requested by route param but not found in data
  if (activeScholarship && activeScholarship.notFound) {
    return (
      <div className="portalWrapper">
        <header className="topbar">
          <div className="topbarInner">
            <div className="brand" onClick={handleBackFromDetail} role="button" tabIndex={0} style={{ cursor: "pointer" }}>
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
            <div className="headerActions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="userHeaderBadge" title="Session active for 10 days on this device">
                <span className="userOnlineDot"></span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>PRN:</span>
                <span className="userPrnTag">{user?.prn}</span>
              </div>
              <button className="btnLogout" onClick={handleLogout} title="Log out of your account">
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="scholarshipDetailWrapper">
          <div className="emptyState" style={{ padding: "50px 24px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <Award className="emptyIcon" size={44} />
            <h2 className="emptyTitle">Scholarship Not Found</h2>
            <p className="emptyDesc">
              We couldn't find any scholarship matching "{activeScholarship.requestedId}". The scheme may have expired, or the URL parameter may be incorrect.
            </p>
            <button className="btn btnPrimary" onClick={handleBackFromDetail}>
              <ArrowLeft size={15} style={{ marginRight: "6px" }} />
              Return to Scholarship Directory
            </button>
          </div>
        </main>
      </div>
    );
  }

  // If a valid scholarship detail is active (via route or card click)
  if (activeScholarship) {
    return (
      <ScholarshipDetailView
        s={activeScholarship}
        onBack={handleBackFromDetail}
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  if (!started) {
    return (
      <Landing
        profile={profile}
        setProfile={setProfile}
        user={user}
        onLogout={handleLogout}
        onStart={() => setStarted(true)}
        onNavigate={onNavigate}
      />
    );
  }

  const formatIncome = (income) => {
    if (!income) return "Any income";
    return `≤ ₹${(income / 100000).toFixed(1)} Lakh`;
  };

  return (
    <div className="portalWrapper">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand" onClick={() => setStarted(false)} role="button" tabIndex={0}>
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
          <div className="headerActions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button className="btn btnSecondary btnSm" onClick={() => setStarted(false)}>
              <SlidersHorizontal size={14} />
              Edit Criteria
            </button>
            <div className="userHeaderBadge" title="Session active for 10 days on this device">
              <span className="userOnlineDot"></span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>PRN:</span>
              <span className="userPrnTag">{user.prn}</span>
            </div>
            <button className="btnLogout" onClick={handleLogout} title="Log out of your account">
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="portalShell">
        <div className="portalHeader">
          <div className="portalEyebrow">Verified Directory</div>
          <h1 className="portalTitle">Matching Scholarships</h1>
          <p className="portalSubtitle">
            Financial aid schemes matching your academic profile and eligibility criteria. Please confirm requirements on official websites before applying.
          </p>
        </div>

        {/* Active Profile Summary */}
        <section className="profileSummaryBar">
          <div className="profileSummaryContent">
            <span className="profileSummaryLabel">Active Filter:</span>
            <div className="profileBadgesList">
              <span className="profileBadge">
                <span className="profileBadgeKey">Year:</span>
                <span className="profileBadgeVal">{years[profile.year - 1]}</span>
              </span>
              <span className="profileBadge">
                <span className="profileBadgeKey">Category:</span>
                <span className="profileBadgeVal">{profile.category}</span>
              </span>
              <span className="profileBadge">
                <span className="profileBadgeKey">State:</span>
                <span className="profileBadgeVal">{profile.state}</span>
              </span>
              <span className="profileBadge">
                <span className="profileBadgeKey">Income:</span>
                <span className="profileBadgeVal">{formatIncome(profile.income)}</span>
              </span>
              <span className="profileBadge">
                <span className="profileBadgeKey">College:</span>
                <span className="profileBadgeVal">{profile.college}</span>
              </span>
              {profile.gender !== "Any" && (
                <span className="profileBadge">
                  <span className="profileBadgeKey">Gender:</span>
                  <span className="profileBadgeVal">{profile.gender}</span>
                </span>
              )}
            </div>
          </div>
          <button className="btn btnSecondary btnSm" onClick={() => setStarted(false)}>
            Change
          </button>
        </section>

        {/* Category Tabs */}
        <section className="categorySection">
          <div className="categorySectionHead">Filter by Scheme Type</div>
          <div className="tabsContainer">
            {tabs.map((t) => (
              <button
                key={t}
                className={`tabBtn ${tab === t ? "activeTab" : ""}`}
                onClick={() => setTab(t)}
              >
                {getTabIcon(t)}
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Search & Result Count Toolbar */}
        <div className="toolbar">
          <div className="resultsCount">
            Showing <strong>{results.length}</strong> {results.length === 1 ? "opportunity" : "opportunities"}
            {tab !== "All" && <span> in {tab}</span>}
            {search && <span> matching "{search}"</span>}
          </div>
          <div className="searchWrapper">
            <Search className="searchIcon" size={15} />
            <input
              type="text"
              className="searchInput"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by scheme name or benefit..."
            />
          </div>
        </div>

        {/* Scholarship Cards List */}
        <div className="cardsList">
          {results.map((s) => (
            <ScholarshipCard
              key={s.name}
              s={s}
              onViewDetail={(item) => {
                setSelectedScholarship(item);
                if (onNavigate) {
                  onNavigate(`/scholarship/${item.id}`);
                }
              }}
            />
          ))}

          {results.length === 0 && (
            <div className="emptyState">
              <Award className="emptyIcon" size={36} />
              <h2 className="emptyTitle">No scholarships match the selected criteria</h2>
              <p className="emptyDesc">
                Try switching the category tab to "All", clearing your search query, or adjusting your family annual income filter.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                {search && (
                  <button className="btn btnSecondary btnSm" onClick={() => setSearch("")}>
                    <RotateCcw size={13} />
                    Clear search
                  </button>
                )}
                {tab !== "All" && (
                  <button className="btn btnSecondary btnSm" onClick={() => setTab("All")}>
                    Show all categories
                  </button>
                )}
                <button className="btn btnPrimary btnSm" onClick={() => setStarted(false)}>
                  Modify profile
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footerInner">
          <div className="footerAdvisory">
            <Info size={15} />
            <span>
              <strong>Official Advisory:</strong> Eligibility criteria, application cycles, and sanction amounts are determined solely by the respective government ministries and foundations. Verify guidelines and deadline extensions directly on official portals.
            </span>
          </div>
          <div className="footerCredit" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <span>SCTR's Pune Institute of Computer Technology (PICT) — Student Academic & Scholarship Cell</span>
              <span>Built by SY students, seniors, and alumni for institutional student support</span>
            </div>
            <div>
              <a
                href="/admin/login"
                className="footerAdminLink"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("/admin/login");
                }}
              >
                Admin
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Landing({ profile, setProfile, onStart, user, onLogout, onNavigate }) {
  return (
    <div className="landingWrapper">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
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
          {user && (
            <div className="headerActions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="userHeaderBadge" title="Session active for 10 days on this device">
                <span className="userOnlineDot"></span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>PRN:</span>
                <span className="userPrnTag">{user.prn}</span>
              </div>
              <button className="btnLogout" onClick={onLogout} title="Log out of your account">
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="landingContainer">
        <div className="landingLayout">
          {/* Left Description Column */}
          <section className="landingIntro">
            <div className="institutionTag">
              <GraduationCap size={14} />
              PICT Engineering Student Initiative
            </div>
            <h1 className="landingHeading">
              Find Engineering Scholarships{" "}
              <span className="landingHeadingHighlight">Tailored to Your Profile</span>
            </h1>
            <p className="landingDescription">
              A structured discovery portal for undergraduate engineering students at Pune Institute of Computer Technology and throughout Maharashtra. Configure your academic standing to filter verified central, state, and private schemes.
            </p>

            <div className="featuresList">
              <div className="featureItem">
                <span className="featureBadge">
                  <Check className="featureIcon" size={13} strokeWidth={2.5} />
                </span>
                <span className="featureText">
                  <strong className="featureLead">Comprehensive Coverage:</strong> Direct access to NSP Central Sector, MahaDBT State schemes, AICTE initiatives, and premier private foundations.
                </span>
              </div>
              <div className="featureItem">
                <span className="featureBadge">
                  <Check className="featureIcon" size={13} strokeWidth={2.5} />
                </span>
                <span className="featureText">
                  <strong className="featureLead">Accurate Eligibility Rules:</strong> Accounts for academic year, reservation category, gender criteria, family income caps, and domicile requirements.
                </span>
              </div>
              <div className="featureItem">
                <span className="featureBadge">
                  <Check className="featureIcon" size={13} strokeWidth={2.5} />
                </span>
                <span className="featureText">
                  <strong className="featureLead">Direct Official Links:</strong> Immediate routing to authorized government and trust portals without third-party redirection or commercial ads.
                </span>
              </div>
            </div>

            <div className="collegeCard">
              <img
                src={pictLogo}
                alt="PICT Pune"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/pict-logo.png";
                }}
              />
              <div>
                <div className="collegeCardTitle">Pune Institute of Computer Technology (PICT)</div>
                <div className="collegeCardSub">
                  Society for Computer Technology & Research (SCTR) • Dhankawadi, Pune
                </div>
              </div>
            </div>
          </section>

          {/* Right Profile Form Column */}
          <section className="formCard">
            <div className="formCardHeader">
              <h2 className="formCardTitle">Student Profile Criteria</h2>
              <p className="formCardSubtitle">
                Select your academic and personal background to identify eligible scholarships.
              </p>
            </div>

            <div className="formGrid2">
              <div className="formField">
                <label>Academic Year</label>
                <select
                  value={profile.year}
                  onChange={(e) => setProfile({ ...profile, year: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4].map((y) => (
                    <option value={y} key={y}>
                      {years[y - 1]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formField">
                <label>Social Category</label>
                <select
                  value={profile.category}
                  onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="formGrid2">
              <div className="formField">
                <label>Gender</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                >
                  <option value="Any">Any / Not Specified</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="formField">
                <label>Domicile / State</label>
                <select
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                >
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="formGrid2">
              <div className="formField">
                <label>Engineering Branch</label>
                <select
                  value={profile.branch}
                  onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formField">
                <label>College Classification</label>
                <select
                  value={profile.college}
                  onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                >
                  {colleges.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="formField">
              <label>Family Annual Gross Income</label>
              <select
                value={profile.income}
                onChange={(e) => setProfile({ ...profile, income: Number(e.target.value) })}
              >
                <option value="0">Any income ceiling</option>
                <option value="250000">Up to ₹2.5 Lakh / year</option>
                <option value="450000">Up to ₹4.5 Lakh / year</option>
                <option value="600000">Up to ₹6.0 Lakh / year</option>
                <option value="800000">Up to ₹8.0 Lakh / year</option>
                <option value="10000000">Above ₹8.0 Lakh / year</option>
              </select>
            </div>

            <div className="checkboxGroup">
              <label className="checkboxLabel">
                <input
                  type="checkbox"
                  checked={profile.hostel}
                  onChange={(e) => setProfile({ ...profile, hostel: e.target.checked })}
                />
                <span>Requires hostel / room accommodation allowance</span>
              </label>

              <label className="checkboxLabel">
                <input
                  type="checkbox"
                  checked={profile.maintenance}
                  onChange={(e) => setProfile({ ...profile, maintenance: e.target.checked })}
                />
                <span>Requires books / living maintenance stipend</span>
              </label>
            </div>

            <button className="btn btnPrimary btnFull" onClick={onStart}>
              View Matching Scholarships
              <ArrowRight className="btnIcon" size={16} />
            </button>
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="footerInner">
          <div className="footerCredit">
            <span>SCTR's Pune Institute of Computer Technology (PICT)</span>
            <span>Engineering Scholarship Discovery System</span>
          </div>
          <div>
            <a
              href="/admin/login"
              className="footerAdminLink"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate("/admin/login");
                }
              }}
            >
              Admin
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ScholarshipDetailView({ s, onBack, user, onLogout }) {
  const isGovernment = s.type === "Government";

  return (
    <div className="portalWrapper">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand" onClick={onBack} role="button" tabIndex={0} style={{ cursor: "pointer" }}>
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
          <div className="headerActions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button className="btn btnSecondary btnSm" onClick={onBack}>
              <ArrowLeft size={14} />
              Back to List
            </button>
            <div className="userHeaderBadge" title="Session active for 10 days on this device">
              <span className="userOnlineDot"></span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>PRN:</span>
              <span className="userPrnTag">{user?.prn}</span>
            </div>
            <button className="btnLogout" onClick={onLogout} title="Log out of your account">
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="scholarshipDetailWrapper">
        <div className="detailBackBar">
          <button className="btnBackToList" onClick={onBack}>
            <ArrowLeft size={15} />
            Back to Scholarships
          </button>
        </div>

        <article className="scholarshipDetailCard">
          <div className="detailHeader">
            <div className="cardBadges">
              <span className={`typeBadge ${isGovernment ? "typeGov" : "typePriv"}`}>
                {s.type}
              </span>
              {s.groups
                ?.filter((g) => g !== s.type)
                .map((g) => (
                  <span className="subBadge" key={g}>
                    {g}
                  </span>
                ))}
              <span className="statusEligible" style={{ marginLeft: "auto" }}>
                <CheckCircle2 size={13} />
                Verified Scheme
              </span>
            </div>
            <h1 className="detailTitle">{s.name}</h1>
            <div className="detailAuthority">
              <strong>Authority:</strong> {s.authority || "Official Provider"}
            </div>
          </div>

          <div className="detailGrid">
            <div className="detailBlock">
              <div className="detailBlockLabel">Scholarship Benefit</div>
              <div className="detailBlockValue" style={{ color: "var(--primary)" }}>{s.amount}</div>
            </div>
            <div className="detailBlock">
              <div className="detailBlockLabel">Income Ceiling</div>
              <div className="detailBlockValue">
                {s.income ? `Up to ₹${(s.income / 100000).toFixed(1)} Lakh/yr` : "No limit"}
              </div>
            </div>
            <div className="detailBlock">
              <div className="detailBlockLabel">Application Timeline</div>
              <div className="detailBlockValue">{s.deadline}</div>
            </div>
            <div className="detailBlock">
              <div className="detailBlockLabel">State / Domicile</div>
              <div className="detailBlockValue">{s.state}</div>
            </div>
            <div className="detailBlock">
              <div className="detailBlockLabel">Eligible Academic Years</div>
              <div className="detailBlockValue">
                {s.years?.map((y) => `${y}${y === 1 ? "st" : y === 2 ? "nd" : y === 3 ? "rd" : "th"} Year`).join(", ")}
              </div>
            </div>
            <div className="detailBlock">
              <div className="detailBlockLabel">Eligible Categories</div>
              <div className="detailBlockValue" style={{ fontSize: "0.88rem" }}>
                {s.cats?.join(", ")}
              </div>
            </div>
          </div>

          <div className="detailDescSection">
            <h3>Overview & Benefits</h3>
            <p>{s.desc}</p>
          </div>

          <div className="detailActionFooter">
            <button className="btn btnSecondary" onClick={onBack}>
              <ArrowLeft size={15} />
              Return to Scholarships List
            </button>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btnPrimary"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
            >
              <span>Apply on Official Portal</span>
              <ExternalLink size={15} />
            </a>
          </div>
        </article>
      </main>
    </div>
  );
}

function ScholarshipCard({ s, onViewDetail }) {
  const isGovernment = s.type === "Government";

  return (
    <article className="scholarshipCard">
      <div className="cardHeaderRow">
        <div>
          <div className="cardBadges">
            <span className={`typeBadge ${isGovernment ? "typeGov" : "typePriv"}`}>
              {s.type}
            </span>
            {s.groups
              .filter((g) => g !== s.type)
              .slice(0, 3)
              .map((g) => (
                <span className="subBadge" key={g}>
                  {g}
                </span>
              ))}
          </div>
          <h2 className="cardTitle">{s.name}</h2>
          <p className="cardDesc">{s.desc}</p>
        </div>
        <div className="statusEligible">
          <CheckCircle2 size={13} />
          Eligible
        </div>
      </div>

      <div className="metricsGrid">
        <div className="metricCol">
          <span className="metricColTitle">Scholarship Benefit</span>
          <span className="metricColValue">{s.amount}</span>
        </div>
        <div className="metricCol">
          <span className="metricColTitle">Income Ceiling</span>
          <span className="metricColValue">
            {s.income ? `Up to ₹${(s.income / 100000).toFixed(1)}L` : "No limit"}
          </span>
        </div>
        <div className="metricCol">
          <span className="metricColTitle">Application Timeline</span>
          <span className="metricColValue">{s.deadline}</span>
        </div>
      </div>

      <div className="cardFooter">
        <div className="cardAuthority">
          <span>Authority: {s.authority || "Official Provider"}</span>
          <span className="cardAuthorityDot">•</span>
          <span>Eligible Years: {s.years.map((y) => `${y}${y === 1 ? "st" : y === 2 ? "nd" : y === 3 ? "rd" : "th"}`).join(", ")}</span>
          <span className="cardAuthorityDot">•</span>
          <span>Domicile: {s.state}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onViewDetail && (
            <button
              type="button"
              className="btn btnSecondary btnSm"
              onClick={() => onViewDetail(s)}
            >
              View Details
            </button>
          )}
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="portalLink"
          >
            Official Portal
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </article>
  );
}

function getTabIcon(t) {
  if (t === "Government") return <Landmark size={14} />;
  if (t === "Private") return <Building2 size={14} />;
  if (t === "Hostel") return <Home size={14} />;
  if (t === "Maintenance") return <Wallet size={14} />;
  if (t === "Girls") return <HeartHandshake size={14} />;
  if (t === "PwD") return <ShieldCheck size={14} />;
  if (t === "Merit") return <Award size={14} />;
  return <Filter size={14} />;
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
