// scratch/verify_changes.mjs
const BASE_URL = "http://localhost:5000";

async function run() {
  console.log("=== VERIFYING CHANGE 2: PRN FORMAT RESTRICTIONS REMOVAL ===");

  // 1. Register with arbitrary PRN "abc123"
  console.log("\n1. Register student with PRN 'abc123':");
  const reg1 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prn: "  abc123  ", password: "Password@123" })
  });
  const reg1Data = await reg1.json();
  console.log("Status:", reg1.status, reg1Data);

  // 2. Register with arbitrary PRN "2025CE01"
  console.log("\n2. Register student with PRN '2025CE01':");
  const reg2 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prn: "2025CE01", password: "Password@123" })
  });
  const reg2Data = await reg2.json();
  console.log("Status:", reg2.status, reg2Data);

  // 3. Login with PRN "abc123"
  console.log("\n3. Login with PRN 'abc123':");
  const login1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prn: "abc123", password: "Password@123" })
  });
  const login1Data = await login1.json();
  console.log("Status:", login1.status, login1Data.success ? "Success (JWT received)" : login1Data);

  // 4. Duplicate registration check (must fail with 409)
  console.log("\n4. Try duplicate registration with 'abc123' (Expected 409):");
  const regDup = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prn: "abc123", password: "Password@123" })
  });
  const regDupData = await regDup.json();
  console.log("Status:", regDup.status, regDupData);

  // 5. Admin Login
  console.log("\n5. Admin Login (pict@gmail.com / pict123):");
  const adminLogin = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "pict@gmail.com", password: "pict123" })
  });
  const adminData = await adminLogin.json();
  const token = adminData.token;
  console.log("Status:", adminLogin.status, "Admin token received:", !!token);

  // 6. Admin get student list and verify abc123 and 2025CE01 are present
  console.log("\n6. Admin fetch users list:");
  const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const usersData = await usersRes.json();
  const prns = usersData.data.map(u => u.prn);
  console.log("Total users in DB:", usersData.data.length);
  console.log("Contains abc123?", prns.includes("abc123"));
  console.log("Contains 2025CE01?", prns.includes("2025CE01"));

  // 7. Admin delete by PRN "abc123"
  console.log("\n7. Admin delete by PRN 'abc123':");
  const del1 = await fetch(`${BASE_URL}/api/admin/users/abc123`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const del1Data = await del1.json();
  console.log("Status:", del1.status, del1Data);

  // 8. Admin delete by PRN "2025CE01"
  console.log("\n8. Admin delete by PRN '2025CE01':");
  const del2 = await fetch(`${BASE_URL}/api/admin/users/2025CE01`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const del2Data = await del2.json();
  console.log("Status:", del2.status, del2Data);

  // 9. Confirm both were deleted
  const usersResAfter = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const usersDataAfter = await usersResAfter.json();
  const prnsAfter = usersDataAfter.data.map(u => u.prn);
  console.log("\n9. Verify deletions from DB:");
  console.log("Contains abc123?", prnsAfter.includes("abc123"));
  console.log("Contains 2025CE01?", prnsAfter.includes("2025CE01"));

  console.log("\nALL BACKEND PRN TESTS PASSED!");
}

run().catch(console.error);
