import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {}

dotenv.config();

const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("==================================================");
  console.log("ENGINEERING SCHOLARSHIP FINDER ADMIN MODULE FULL VERIFICATION SUITE");
  console.log("==================================================\n");

  for (let i = 1; i <= 5; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      break;
    } catch (e) {
      if (i === 5) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  const db = mongoose.connection.db;

  // -------------------------------------------------------------------------
  // TEST 1: Admin Login (Seeded Credentials & Wrong Password)
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: Admin Login (Seeded Credentials & Wrong Password) ---");
  // 1a. Wrong password
  const failLogin = await fetch(BASE_URL + "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "pict@gmail.com", password: "wrongpassword" }),
  });
  const failData = await failLogin.json();
  console.log("1a. Wrong Password Status (Expected 401):", failLogin.status);
  console.log("1a. Response:", failData);
  if (failLogin.status !== 401 || failData.message !== "Invalid email or password") {
    throw new Error("TEST 1a FAILED: expected 401 with Invalid email or password");
  }

  // 1b. Non-existent email
  const failEmail = await fetch(BASE_URL + "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nobody@gmail.com", password: "pict123" }),
  });
  const failEmailData = await failEmail.json();
  console.log("1b. Wrong Email Status (Expected 401):", failEmail.status);
  console.log("1b. Response:", failEmailData);
  if (failEmail.status !== 401 || failEmailData.message !== "Invalid email or password") {
    throw new Error("TEST 1b FAILED: expected 401 with generic error");
  }

  // 1c. Valid credentials
  const validLogin = await fetch(BASE_URL + "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "pict@gmail.com", password: "pict123" }),
  });
  const validData = await validLogin.json();
  console.log("1c. Seeded Login Status (Expected 200):", validLogin.status);
  console.log("1c. Response success:", validData.success, "Token present:", Boolean(validData.token));
  console.log("1c. mustChangePassword flag:", validData.admin?.mustChangePassword);
  if (validLogin.status !== 200 || !validData.token) {
    throw new Error("TEST 1c FAILED: could not login with seeded credentials");
  }
  const adminToken = validData.token;

  // -------------------------------------------------------------------------
  // TEST 2 & 3: Authorization Checks (No token, Student token vs Admin APIs)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2 & 3: Protected Admin Routes & Role Checks ---");
  // 2a. Call admin endpoint with no token (Expected 401)
  const noTokenRes = await fetch(BASE_URL + "/api/admin/stats");
  const noTokenData = await noTokenRes.json();
  console.log("2a. Call /api/admin/stats with NO token (Expected 401):", noTokenRes.status, noTokenData);
  if (noTokenRes.status !== 401) throw new Error("TEST 2a FAILED: expected 401");

  // 3a. Register/Login a student to get a real student token
  const testStudentPrn = "F25CE901";
  await db.collection("users").deleteOne({ prn: testStudentPrn });
  const studentReg = await fetch(BASE_URL + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prn: testStudentPrn, password: "StudentPass123" }),
  });
  const studentData = await studentReg.json();
  const studentToken = studentData.token;
  console.log("3a. Student registered, got student token:", Boolean(studentToken));

  // 3b. Student token attempts to call GET /api/admin/stats (Expected 403 Forbidden)
  const studentAttempt = await fetch(BASE_URL + "/api/admin/stats", {
    headers: { Authorization: "Bearer " + studentToken },
  });
  const studentAttemptData = await studentAttempt.json();
  console.log("3b. Student token calling /api/admin/stats (Expected 403):", studentAttempt.status, studentAttemptData);
  if (studentAttempt.status !== 403) throw new Error("TEST 3b FAILED: student token must be rejected with 403");

  // 3c. Valid admin token calling GET /api/admin/stats (Expected 200)
  const adminStatsRes = await fetch(BASE_URL + "/api/admin/stats", {
    headers: { Authorization: "Bearer " + adminToken },
  });
  const adminStatsData = await adminStatsRes.json();
  console.log("3c. Admin token calling /api/admin/stats (Expected 200):", adminStatsRes.status, adminStatsData);
  if (adminStatsRes.status !== 200 || !adminStatsData.success) throw new Error("TEST 3c FAILED: admin stats failed");

  // -------------------------------------------------------------------------
  // TEST 4: Visit Tracking (New browser increases, repeat in session does not)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: Visit Tracking ---");
  const initialUnique = adminStatsData.data.uniqueVisitors;
  const initialTotal = adminStatsData.data.totalVisits;

  // New browser visitor
  const testVisitorId = "test_vis_" + Date.now();
  const v1 = await fetch(BASE_URL + "/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId: testVisitorId }),
  });
  console.log("4a. First visit from new visitorId:", v1.status);

  // Repeat visit from same visitor
  const v2 = await fetch(BASE_URL + "/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId: testVisitorId }),
  });
  console.log("4b. Second visit from same visitorId:", v2.status);

  // Fetch stats again
  const afterStatsRes = await fetch(BASE_URL + "/api/admin/stats", {
    headers: { Authorization: "Bearer " + adminToken },
  });
  const afterStats = await afterStatsRes.json();
  console.log("4c. Stats after visits: uniqueVisitors +1?", afterStats.data.uniqueVisitors === initialUnique + 1,
              "totalVisits +2?", afterStats.data.totalVisits === initialTotal + 2);
  if (afterStats.data.uniqueVisitors !== initialUnique + 1 || afterStats.data.totalVisits !== initialTotal + 2) {
    throw new Error("TEST 4 FAILED: visit counters did not increment as expected");
  }

  // -------------------------------------------------------------------------
  // TEST 5: Registered Users List in MongoDB vs Admin API
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: Registered Students List ---");
  const usersRes = await fetch(BASE_URL + "/api/admin/users", {
    headers: { Authorization: "Bearer " + adminToken },
  });
  const usersData = await usersRes.json();
  console.log("5a. GET /api/admin/users Status (Expected 200):", usersRes.status, "Total users returned:", usersData.data?.length);
  const foundTestStudent = usersData.data.find((u) => u.prn === testStudentPrn);
  console.log("5b. Found test student", testStudentPrn, "in list?", Boolean(foundTestStudent));
  console.log("5c. Passwords excluded from admin user list?", usersData.data.every((u) => !u.password && !u.passwordHash));
  if (!foundTestStudent || !usersData.data.every((u) => !u.password && !u.passwordHash)) {
    throw new Error("TEST 5 FAILED: student list mismatch or passwords leaked");
  }

  // -------------------------------------------------------------------------
  // TEST 6: Delete Student Registration by PRN
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 6: Delete Student by PRN ---");
  // 6a. Delete non-existent PRN (Expected 404)
  const delNonExist = await fetch(BASE_URL + "/api/admin/users/F25AD999", {
    method: "DELETE",
    headers: { Authorization: "Bearer " + adminToken },
  });
  const delNonExistData = await delNonExist.json();
  console.log("6a. Delete non-existent PRN (Expected 404):", delNonExist.status, delNonExistData);
  if (delNonExist.status !== 404 || delNonExistData.message !== "No user found with this PRN") {
    throw new Error("TEST 6a FAILED: expected 404 for non-existent student");
  }

  // 6b. Delete existing test student F25CE901 (Expected 200)
  const delExist = await fetch(BASE_URL + "/api/admin/users/" + testStudentPrn, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + adminToken },
  });
  const delExistData = await delExist.json();
  console.log("6b. Delete existing student F25CE901 (Expected 200):", delExist.status, delExistData);
  if (delExist.status !== 200 || !delExistData.success) {
    throw new Error("TEST 6b FAILED: could not delete student");
  }

  // 6c. Confirm deletion in MongoDB directly
  const checkDb = await db.collection("users").findOne({ prn: testStudentPrn });
  console.log("6c. Student F25CE901 found in MongoDB after deletion (Expected null):", checkDb);
  if (checkDb !== null) {
    throw new Error("TEST 6c FAILED: user still exists in MongoDB");
  }

  // -------------------------------------------------------------------------
  // TEST 7: Change Admin Password & Relogin
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 7: Change Admin Password ---");
  // 7a. Try with wrong current password (Expected 400)
  const pwWrongCurrent = await fetch(BASE_URL + "/api/admin/change-password", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + adminToken },
    body: JSON.stringify({ currentPassword: "wrongCurrentPassword", newPassword: "newAdminPassword123" }),
  });
  console.log("7a. Change Password with wrong current pw (Expected 400):", pwWrongCurrent.status);
  if (pwWrongCurrent.status !== 400) throw new Error("TEST 7a FAILED");

  // 7b. Try with too short new password (Expected 400)
  const pwTooShort = await fetch(BASE_URL + "/api/admin/change-password", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + adminToken },
    body: JSON.stringify({ currentPassword: "pict123", newPassword: "short" }),
  });
  console.log("7b. Change Password with short new pw (Expected 400):", pwTooShort.status);
  if (pwTooShort.status !== 400) throw new Error("TEST 7b FAILED");

  // 7c. Valid change password
  const newAdminPass = "SuperSecureAdmin2026!";
  const pwValid = await fetch(BASE_URL + "/api/admin/change-password", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + adminToken },
    body: JSON.stringify({ currentPassword: "pict123", newPassword: newAdminPass }),
  });
  const pwValidData = await pwValid.json();
  console.log("7c. Change Password success (Expected 200):", pwValid.status, pwValidData);
  if (pwValid.status !== 200 || !pwValidData.success) throw new Error("TEST 7c FAILED");

  // 7d. Old password should now FAIL to login
  const oldLogin = await fetch(BASE_URL + "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "pict@gmail.com", password: "pict123" }),
  });
  console.log("7d. Login with OLD password (Expected 401):", oldLogin.status);
  if (oldLogin.status !== 401) throw new Error("TEST 7d FAILED: old password still worked");

  // 7e. New password should SUCCEED
  const newLogin = await fetch(BASE_URL + "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "pict@gmail.com", password: newAdminPass }),
  });
  const newLoginData = await newLogin.json();
  console.log("7e. Login with NEW password (Expected 200):", newLogin.status, "mustChangePassword:", newLoginData.admin?.mustChangePassword);
  if (newLogin.status !== 200 || newLoginData.admin?.mustChangePassword !== false) {
    throw new Error("TEST 7e FAILED: new password login failed or mustChangePassword was not cleared");
  }

  // Restore password back to pict123 for default dev consistency
  const resetToken = newLoginData.token;
  await fetch(BASE_URL + "/api/admin/change-password", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + resetToken },
    body: JSON.stringify({ currentPassword: newAdminPass, newPassword: "pict123" }),
  });
  const setObj = { mustChangePassword: true };
  await db.collection("admins").updateOne({ email: "pict@gmail.com" }, { $set: setObj });
  console.log("7f. Password cleanly restored to default for development demo.");

  // -------------------------------------------------------------------------
  // TEST 8: Existing Student Login & Registration Still Work
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 8: Student Registration & Login Preserved ---");
  const studentPRN = "F25ET555";
  await db.collection("users").deleteOne({ prn: studentPRN });
  const sReg = await fetch(BASE_URL + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prn: studentPRN, password: "MyStudentPass123" }),
  });
  const sRegData = await sReg.json();
  console.log("8a. Student Register (Expected 201):", sReg.status, "Token:", Boolean(sRegData.token));

  const sLogin = await fetch(BASE_URL + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prn: studentPRN, password: "MyStudentPass123" }),
  });
  const sLoginData = await sLogin.json();
  console.log("8b. Student Login (Expected 200):", sLogin.status, "Token:", Boolean(sLoginData.token));

  if (sReg.status !== 201 || sLogin.status !== 200) {
    throw new Error("TEST 8 FAILED: student auth broken");
  }

  // Clean up test student
  await db.collection("users").deleteOne({ prn: studentPRN });

  await mongoose.disconnect();
  console.log("\n==================================================");
  console.log("ALL 8 VERIFICATION TESTS PASSED SUCCESSFULLY! ✅");
  console.log("==================================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test suite error:", err);
  process.exit(1);
});
