import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Users,
  UserX,
  X,
} from "lucide-react";
import pictLogo from "./assets/pict-logo.png";
import { clearAdminAuth } from "./AdminAuth";

export function AdminDashboard({ adminAuth, onLogout, onNavigate }) {
  const [stats, setStats] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    visitsToday: 0,
    totalRegisteredUsers: 0,
  });
  const [users, setUsers] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [searchPrn, setSearchPrn] = useState("");
  const [deleteInputPrn, setDeleteInputPrn] = useState("");
  const [deletingPrn, setDeletingPrn] = useState(null);
  const [actionMsg, setActionMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  // Pagination (20 users per page)
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 20;

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmNewPw, setShowConfirmNewPw] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [mustChangePassword, setMustChangePassword] = useState(
    Boolean(adminAuth?.admin?.mustChangePassword)
  );

  const API_BASE_URL = import.meta.env.VITE_API_URL || "";
  const token = adminAuth?.token;

  // Auth header helper
  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // Fetch Stats & Users on mount
  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    setStatsError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: getHeaders(),
        cache: "no-store",
      });
      const data = await res.json();
      if (res.status === 401 || res.status === 403) {
        handleSessionExpired();
        return;
      }
      if (data?.success && data?.data) {
        setStats({
          totalVisits: Number(data.data.totalVisits ?? 0),
          uniqueVisitors: Number(data.data.uniqueVisitors ?? 0),
          visitsToday: Number(data.data.visitsToday ?? 0),
          totalRegisteredUsers: Number(data.data.totalRegisteredUsers ?? 0),
        });
      } else {
        setStatsError(data?.message || "Could not retrieve visitor analytics.");
      }
    } catch (err) {
      console.error("[ADMIN DASHBOARD] Error loading stats:", err);
      setStatsError("Cannot reach server. Ensure backend is running on port 5000.");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUsersError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.status === 401 || res.status === 403) {
        handleSessionExpired();
        return;
      }
      if (data?.success && Array.isArray(data?.data)) {
        setUsers(data.data);
      } else {
        setUsersError(data?.message || "Could not retrieve registered students.");
      }
    } catch (err) {
      console.error("[ADMIN DASHBOARD] Error loading users:", err);
      setUsersError("Cannot reach server. Ensure backend is running on port 5000.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSessionExpired = () => {
    clearAdminAuth();
    onLogout("Your administrator session has expired. Please sign in again.");
  };

  // Filter users by search PRN safely
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    const q = (searchPrn || "").trim().toUpperCase();
    if (!q) return users;
    return users.filter(
      (u) => u && typeof u.prn === "string" && u.prn.toUpperCase().includes(q)
    );
  }, [users, searchPrn]);

  // Paginated users
  const totalPages = Math.max(1, Math.ceil((filteredUsers?.length || 0) / USERS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    if (!Array.isArray(filteredUsers)) return [];
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchPrn]);

  // Delete student registration
  const handleDeleteStudent = async (targetPrn) => {
    const cleanPrn = (targetPrn || "").trim();
    if (!cleanPrn) return;

    const confirmed = window.confirm(
      `Delete registration for ${cleanPrn}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingPrn(cleanPrn);
    setActionMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${cleanPrn}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        handleSessionExpired();
        return;
      }

      if (!res.ok || !data.success) {
        setActionMsg({
          type: "error",
          text: data.message || `Failed to delete student ${cleanPrn}.`,
        });
        return;
      }

      // Success: update state
      setActionMsg({
        type: "success",
        text: data.message || `Student ${cleanPrn} removed successfully.`,
      });
      setDeleteInputPrn("");
      // Refresh user list and stats
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error("[ADMIN DASHBOARD] Delete error:", err);
      setActionMsg({
        type: "error",
        text: "Cannot reach server. Please ensure backend is running.",
      });
    } finally {
      setDeletingPrn(null);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match. Please verify.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        handleSessionExpired();
        return;
      }

      if (!res.ok || !data.success) {
        setPasswordError(data.message || "Failed to update password.");
        return;
      }

      setPasswordSuccess(data.message || "Password updated successfully!");
      setMustChangePassword(false);

      // Auto logout and redirect after 1.5s
      setTimeout(() => {
        clearAdminAuth();
        onLogout("Password changed successfully. Please log in with your new password.");
      }, 1500);
    } catch (err) {
      console.error("[CHANGE PASSWORD] Network error:", err);
      setPasswordError("Cannot reach server. Please ensure backend is running.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="adminDashboardWrapper">
      {/* Admin Header */}
      <header className="topbar">
        <div className="topbarInner" style={{ maxWidth: "1280px" }}>
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
              <span className="brandSubtitle">Administrative Console</span>
            </div>
          </div>

          <div className="headerActions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="userHeaderBadge" title="Administrator account">
              <span className="userOnlineDot"></span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Admin:</span>
              <span className="userPrnTag" style={{ fontSize: "12px", textTransform: "none" }}>
                {adminAuth?.admin?.email || "pict@gmail.com"}
              </span>
            </div>

            <button
              type="button"
              className="btn btnSecondary btnSm"
              onClick={() => {
                setShowPasswordModal(true);
                setPasswordError("");
                setPasswordSuccess("");
              }}
              title="Change administrator password"
            >
              <KeyRound size={13} />
              <span>Password</span>
            </button>

            <button
              type="button"
              className="btn btnSecondary btnSm"
              onClick={() => onNavigate("/")}
              title="View student scholarship portal"
            >
              <GraduationCap size={14} />
              <span>Student Portal</span>
            </button>

            <button
              type="button"
              className="btnLogout"
              onClick={() => {
                clearAdminAuth();
                onLogout("Logged out successfully.");
              }}
              title="Log out of admin console"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="adminContainer">
        {/* Default Password Warning Notice */}
        {mustChangePassword && (
          <div className="defaultPasswordNotice">
            <div className="defaultPasswordNoticeContent">
              <AlertTriangle size={20} className="noticeIcon" />
              <div>
                <strong>Default Password in Use:</strong> You are currently using the initial default administrator password (<code>pict123</code>). For system security, please update your password.
              </div>
            </div>
            <button
              type="button"
              className="btnChangePwNotice"
              onClick={() => {
                setShowPasswordModal(true);
                setPasswordError("");
                setPasswordSuccess("");
              }}
            >
              Change Password Now
            </button>
          </div>
        )}

        {/* Action Message Banner (e.g. After student deletion) */}
        {actionMsg && (
          <div
            className={`alertBox ${
              actionMsg.type === "success" ? "alertBoxSuccess" : "alertBoxError"
            }`}
            style={{ marginBottom: "20px" }}
          >
            {actionMsg.type === "success" ? (
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
            ) : (
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>{actionMsg.text}</div>
            <button
              type="button"
              onClick={() => setActionMsg(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Section 1: Visitor Analytics & Overview Stats */}
        <div className="adminSectionHeader">
          <div>
            <h1 className="adminTitle">System Overview & Visitor Analytics</h1>
            <p className="adminSubtitle">
              Real-time platform activity, anonymized engagement metrics, and registered student counts.
            </p>
          </div>
          <button
            type="button"
            className="btn btnSecondary btnSm"
            onClick={() => {
              fetchStats();
              fetchUsers();
            }}
            disabled={loadingStats || loadingUsers}
          >
            <RefreshCw size={13} className={loadingStats || loadingUsers ? "spinAnimation" : ""} />
            <span>Refresh Data</span>
          </button>
        </div>

        {statsError && (
          <div className="alertBox alertBoxError" style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{statsError}</span>
            </div>
            <button
              type="button"
              className="btn btnSecondary btnSm"
              onClick={fetchStats}
              style={{ padding: "4px 10px", fontSize: "0.78rem" }}
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        )}

        <div className="statsGrid">
          <div className="statCard">
            <div className="statCardHeader">
              <span className="statLabel">Total Visits</span>
              <div className="statIconWrap" style={{ backgroundColor: "#EBF5F3", color: "#176B63" }}>
                <Activity size={18} />
              </div>
            </div>
            <div className="statValue">
              {loadingStats ? "..." : (stats?.totalVisits ?? 0).toLocaleString()}
            </div>
            <div className="statMeta">Aggregated portal page sessions</div>
          </div>

          <div className="statCard">
            <div className="statCardHeader">
              <span className="statLabel">Unique Visitors</span>
              <div className="statIconWrap" style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>
                <Users size={18} />
              </div>
            </div>
            <div className="statValue">
              {loadingStats ? "..." : (stats?.uniqueVisitors ?? 0).toLocaleString()}
            </div>
            <div className="statMeta">Unique browser devices recorded</div>
          </div>

          <div className="statCard">
            <div className="statCardHeader">
              <span className="statLabel">Visits Today</span>
              <div className="statIconWrap" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
                <Calendar size={18} />
              </div>
            </div>
            <div className="statValue">
              {loadingStats ? "..." : (stats?.visitsToday ?? 0).toLocaleString()}
            </div>
            <div className="statMeta">Active sessions since midnight</div>
          </div>

          <div className="statCard">
            <div className="statCardHeader">
              <span className="statLabel">Registered Students</span>
              <div className="statIconWrap" style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
                <GraduationCap size={18} />
              </div>
            </div>
            <div className="statValue">
              {loadingStats ? "..." : (stats?.totalRegisteredUsers ?? 0).toLocaleString()}
            </div>
            <div className="statMeta">Verified PRN scholarship accounts</div>
          </div>
        </div>

        {/* Section 2: Delete Registration by PRN Form */}
        <div className="adminCard" style={{ marginTop: "24px" }}>
          <div className="adminCardHeader">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="dangerIconWrap">
                <UserX size={17} />
              </div>
              <div>
                <h2 className="adminCardTitle">Delete Student Registration</h2>
                <p className="adminCardSubtitle">
                  Permanently remove a student account from MongoDB by entering their college PRN.
                </p>
              </div>
            </div>
          </div>

          <form
            className="deletePrnForm"
            onSubmit={(e) => {
              e.preventDefault();
              handleDeleteStudent(deleteInputPrn);
            }}
          >
            <div className="formField" style={{ flex: 1, margin: 0 }}>
              <input
                type="text"
                className="authInput"
                placeholder="Enter your PRN"
                value={deleteInputPrn}
                onChange={(e) => setDeleteInputPrn(e.target.value)}
                style={{ padding: "0 14px" }}
              />
            </div>
            <button
              type="submit"
              className="btn btnDanger"
              disabled={!deleteInputPrn || deletingPrn === deleteInputPrn}
            >
              <Trash2 size={15} />
              <span>{deletingPrn === deleteInputPrn ? "Deleting..." : "Delete Student"}</span>
            </button>
          </form>
        </div>

        {/* Section 3: Registered Students Directory */}
        <div className="adminCard" style={{ marginTop: "24px" }}>
          <div className="adminCardHeader" style={{ flexWrap: "wrap", gap: "14px" }}>
            <div>
              <h2 className="adminCardTitle">
                Registered Students Directory ({filteredUsers?.length ?? 0} of {users?.length ?? 0})
              </h2>
              <p className="adminCardSubtitle">
                All undergraduate students currently registered on the scholarship portal.
              </p>
            </div>

            <div className="searchWrapper" style={{ width: "280px" }}>
              <Search className="searchIcon" size={15} />
              <input
                type="text"
                className="searchInput"
                placeholder="Filter by PRN..."
                value={searchPrn}
                onChange={(e) => setSearchPrn(e.target.value)}
              />
            </div>
          </div>

          {usersError && (
            <div className="alertBox alertBoxError" style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{usersError}</span>
              </div>
              <button
                type="button"
                className="btn btnSecondary btnSm"
                onClick={fetchUsers}
                style={{ padding: "4px 10px", fontSize: "0.78rem" }}
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {loadingUsers ? (
            <div className="tableLoadingState">
              <RefreshCw size={24} className="spinAnimation" style={{ color: "var(--primary)" }} />
              <span>Loading student registrations...</span>
            </div>
          ) : !filteredUsers || filteredUsers.length === 0 ? (
            <div className="emptyState" style={{ padding: "40px 20px" }}>
              <Users className="emptyIcon" size={32} />
              <h3 className="emptyTitle">
                {searchPrn ? `No students found matching "${searchPrn}"` : "No registered students yet"}
              </h3>
              <p className="emptyDesc">
                {searchPrn
                  ? "Check for typos or clear your search filter to see all registrations."
                  : "When students register their PRN on the portal, they will appear here."}
              </p>
            </div>
          ) : (
            <>
              <div className="adminTableWrapper">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>#</th>
                      <th>College PRN</th>
                      <th>Branch</th>
                      <th>Registration Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(paginatedUsers || []).map((u, index) => {
                      const branchCode = (u?.prn || "").substring(3, 5);
                      const branchNames = {
                        CE: "Computer Engineering",
                        ET: "Electronics & Telecom",
                        IT: "Information Technology",
                        EC: "Electronics & Computer",
                        AD: "AI & Data Science",
                      };
                      const branchName = branchNames[branchCode] || "Engineering";

                      return (
                        <tr key={u?._id || u?.prn || index}>
                          <td style={{ color: "var(--text-muted)" }}>
                            {(currentPage - 1) * USERS_PER_PAGE + index + 1}
                          </td>
                          <td>
                            <span className="prnBadge">{u?.prn || "N/A"}</span>
                          </td>
                          <td>
                            <span className="branchTag">{branchName}</span>
                          </td>
                          <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                            {formatDate(u?.createdAt)}
                          </td>
                          <td>
                            <span className="statusActiveTag">
                              <span className="userOnlineDot" style={{ width: 6, height: 6 }}></span>
                              Registered
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btnIconDelete"
                              title={`Delete registration for ${u?.prn || ""}`}
                              onClick={() => handleDeleteStudent(u?.prn)}
                              disabled={deletingPrn === u?.prn}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="paginationBar">
                  <div className="paginationInfo">
                    Showing {(currentPage - 1) * USERS_PER_PAGE + 1}–
                    {Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)} of{" "}
                    {filteredUsers.length} students
                  </div>

                  <div className="paginationActions">
                    <button
                      type="button"
                      className="btnPagination"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={16} />
                      <span>Previous</span>
                    </button>
                    <span className="paginationPageIndicator">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      className="btnPagination"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modalOverlay" onClick={() => setShowPasswordModal(false)}>
          <div
            className="modalCard"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modalHeader">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="statIconWrap" style={{ backgroundColor: "#EBF5F3", color: "#176B63" }}>
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="modalTitle">Change Administrator Password</h3>
                  <p className="modalSubtitle">
                    Update your password. You will need to sign in again after saving.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modalCloseBtn"
                onClick={() => setShowPasswordModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {passwordError && (
              <div className="alertBox alertBoxError" style={{ marginBottom: "14px" }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <div>{passwordError}</div>
              </div>
            )}

            {passwordSuccess && (
              <div className="alertBox alertBoxSuccess" style={{ marginBottom: "14px" }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <div>{passwordSuccess}</div>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="formField">
                <label>Current Password</label>
                <div className="inputWithIcon">
                  <Lock size={16} className="inputIconLeft" />
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    className="authInput hasLeadingIcon hasTrailingIcon"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="inputTogglePassword"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    aria-label="Toggle visibility"
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="formField">
                <label>New Password</label>
                <div className="inputWithIcon">
                  <KeyRound size={16} className="inputIconLeft" />
                  <input
                    type={showNewPw ? "text" : "password"}
                    className="authInput hasLeadingIcon hasTrailingIcon"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="inputTogglePassword"
                    onClick={() => setShowNewPw(!showNewPw)}
                    aria-label="Toggle visibility"
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="inputHelp">Must be at least 8 characters long and different from current</span>
              </div>

              <div className="formField">
                <label>Confirm New Password</label>
                <div className="inputWithIcon">
                  <KeyRound size={16} className="inputIconLeft" />
                  <input
                    type={showConfirmNewPw ? "text" : "password"}
                    className="authInput hasLeadingIcon hasTrailingIcon"
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="inputTogglePassword"
                    onClick={() => setShowConfirmNewPw(!showConfirmNewPw)}
                    aria-label="Toggle visibility"
                  >
                    {showConfirmNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="modalFooterActions">
                <button
                  type="button"
                  className="btn btnSecondary"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btnPrimary"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "Updating..." : "Save New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
