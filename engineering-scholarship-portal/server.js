import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";

// Fix for Node.js querySrv ECONNREFUSED on Windows / router DNS resolvers
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (dnsErr) {
  console.warn("[DNS] Could not set custom DNS servers:", dnsErr.message);
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "pict_scholarship_secret_key_2026_10days";
const STUDENT_TOKEN_EXPIRY = "10d"; // 10 days student session persistence
const STUDENT_TOKEN_EXPIRY_MS = 10 * 24 * 60 * 60 * 1000;
const ADMIN_TOKEN_EXPIRY = "2h"; // 2 hours admin session persistence

// Rate Limiter for Admin Login (10 attempts per 15 minutes)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// Middlewares
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any localhost or 127.0.0.1 port in development
      if (
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// Serve static assets from public (e.g. pict-logo.png)
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// MONGODB SCHEMAS & MODELS
// ==========================================

// 1. Student User Schema
const userSchema = new mongoose.Schema(
  {
    prn: {
      type: String,
      required: [true, "PRN is required"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// 2. Admin Schema (Kept completely separate from students)
const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Admin email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    mustChangePassword: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema);

// 3. Visitor Tracking Schema (No IP or personal data stored)
const visitSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    firstVisit: {
      type: Date,
      default: Date.now,
    },
    lastVisit: {
      type: Date,
      default: Date.now,
    },
    visitCount: {
      type: Number,
      default: 1,
    },
    history: {
      type: [Date],
      default: () => [],
    },
  },
  { timestamps: true }
);

const Visit = mongoose.model("Visit", visitSchema);

// ==========================================
// MIDDLEWARES
// ==========================================

// Student Auth Token Verification Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Admin Auth Token Verification Middleware (Role strict)
const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Administrator authorization required.",
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired admin session token.",
      });
    }

    // Role check: Student tokens will NEVER have role === "admin"
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: Administrator privileges required.",
      });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    req.admin = {
      id: admin._id,
      email: admin.email,
      mustChangePassword: admin.mustChangePassword,
    };
    next();
  } catch (err) {
    console.error("[ADMIN AUTH ERROR]:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during authorization verification.",
    });
  }
};

// ==========================================
// PUBLIC & STUDENT ROUTES
// ==========================================

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState,
  });
});

// Student Register Endpoint
app.post("/api/auth/register", async (req, res) => {
  try {
    const { prn, password } = req.body;

    if (!prn || typeof prn !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both PRN and password.",
      });
    }

    const cleanPrn = prn.trim();

    if (!cleanPrn) {
      return res.status(400).json({
        success: false,
        message: "Please enter your PRN.",
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters long.",
      });
    }

    // Check if PRN already exists
    const existing = await User.findOne({ prn: cleanPrn });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A user with this PRN number is already registered. Please login instead.",
      });
    }

    // Hash password with bcrypt - never store or return raw password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      prn: cleanPrn,
      password: hashedPassword,
      lastLogin: new Date(),
    });

    await newUser.save();

    // Generate 10-day JWT token
    const token = jwt.sign(
      { id: newUser._id, prn: newUser.prn },
      JWT_SECRET,
      { expiresIn: STUDENT_TOKEN_EXPIRY }
    );

    const expiresAt = Date.now() + STUDENT_TOKEN_EXPIRY_MS;

    console.log(`[AUTH] Student registered successfully: ${cleanPrn}`);

    return res.status(201).json({
      success: true,
      message: "Registration successful! Welcome to PICT Scholarship Portal.",
      token,
      expiresAt,
      user: {
        id: newUser._id,
        prn: newUser.prn,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("Register Error on server:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during registration. Please try again.",
    });
  }
});

// Student Login Endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { prn, password } = req.body;

    if (!prn || typeof prn !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your PRN and password.",
      });
    }

    const cleanPrn = prn.trim();

    if (!cleanPrn) {
      return res.status(400).json({
        success: false,
        message: "Please enter your PRN.",
      });
    }

    // Find student user
    const user = await User.findOne({ prn: cleanPrn });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid PRN number or password. Check credentials or register first.",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid PRN number or password.",
      });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Generate 10-day JWT
    const token = jwt.sign(
      { id: user._id, prn: user.prn },
      JWT_SECRET,
      { expiresIn: STUDENT_TOKEN_EXPIRY }
    );

    const expiresAt = Date.now() + STUDENT_TOKEN_EXPIRY_MS;

    console.log(`[AUTH] Student logged in successfully: ${cleanPrn}`);

    return res.json({
      success: true,
      message: "Login successful! Welcome back.",
      token,
      expiresAt,
      user: {
        id: user._id,
        prn: user.prn,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error("Login Error on server:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during login. Please try again.",
    });
  }
});

// Validate Student Token Endpoint
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.json({
      success: true,
      user: {
        id: user._id,
        prn: user.prn,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Record Visitor Session (Public - No PII/IP stored)
app.post("/api/visits", async (req, res) => {
  try {
    const { visitorId } = req.body;
    if (!visitorId || typeof visitorId !== "string" || visitorId.length > 120) {
      return res.status(400).json({
        success: false,
        message: "Valid visitor identifier is required.",
      });
    }

    const cleanVisitorId = visitorId.trim();
    const now = new Date();

    const existing = await Visit.findOne({ visitorId: cleanVisitorId });
    if (existing) {
      existing.visitCount += 1;
      existing.lastVisit = now;
      if (!Array.isArray(existing.history)) {
        existing.history = [];
      }
      while (existing.history.length < existing.visitCount - 1) {
        existing.history.unshift(existing.firstVisit || existing.lastVisit || now);
      }
      existing.history.push(now);
      await existing.save();
    } else {
      const newVisit = new Visit({
        visitorId: cleanVisitorId,
        firstVisit: now,
        lastVisit: now,
        visitCount: 1,
        history: [now],
      });
      await newVisit.save();
    }

    return res.json({
      success: true,
      message: "Visit recorded successfully.",
    });
  } catch (err) {
    console.error("Visit tracking error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while recording visit.",
    });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// Admin Login
app.post("/api/admin/login", adminLoginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = await Admin.findOne({ email: cleanEmail });

    // Use generic error for non-existent admin and wrong password
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Sign admin token with role: 'admin' and 2-hour duration
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: ADMIN_TOKEN_EXPIRY }
    );

    console.log(`[ADMIN AUTH] Admin logged in successfully: ${cleanEmail}`);

    return res.json({
      success: true,
      message: "Admin login successful.",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        mustChangePassword: admin.mustChangePassword,
      },
    });
  } catch (err) {
    console.error("Admin Login Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during admin authentication.",
    });
  }
});

// Verify Current Admin Token
app.get("/api/admin/me", adminAuthMiddleware, async (req, res) => {
  return res.json({
    success: true,
    admin: req.admin,
  });
});

// Change Admin Password
app.put("/api/admin/change-password", adminAuthMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide both your current password and a new password.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const isSame = await bcrypt.compare(newPassword, admin.passwordHash);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    admin.passwordHash = await bcrypt.hash(newPassword, salt);
    admin.mustChangePassword = false;
    await admin.save();

    console.log(`[ADMIN] Password updated successfully for: ${admin.email}`);

    return res.json({
      success: true,
      message: "Password updated successfully. Please log in with your new password.",
    });
  } catch (err) {
    console.error("Change Password Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while updating admin password.",
    });
  }
});

// Admin Stats (Analytics)
app.get("/api/admin/stats", adminAuthMiddleware, async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    const uniqueVisitors = await Visit.countDocuments();

    const sumResult = await Visit.aggregate([
      { $group: { _id: null, total: { $sum: "$visitCount" } } },
    ]);
    const totalVisits = sumResult.length > 0 ? sumResult[0].total : 0;

    // Local IST midnight (Asia/Kolkata)
    const istDateString = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const startOfToday = new Date(`${istDateString}T00:00:00+05:30`);

    const allVisits = await Visit.find().lean();
    let visitsToday = 0;
    for (const v of allVisits) {
      const historyVisitsToday = Array.isArray(v.history)
        ? v.history.filter((d) => new Date(d) >= startOfToday).length
        : 0;
      let docTodayCount = historyVisitsToday;
      if (v.lastVisit && new Date(v.lastVisit) >= startOfToday) {
        if (v.firstVisit && new Date(v.firstVisit) >= startOfToday) {
          docTodayCount = Math.max(docTodayCount, v.visitCount || 1);
        } else {
          docTodayCount = Math.max(docTodayCount, 1);
        }
      }
      visitsToday += docTodayCount;
    }

    const totalRegisteredUsers = await User.countDocuments();

    return res.json({
      success: true,
      data: {
        totalVisits,
        uniqueVisitors,
        visitsToday,
        totalRegisteredUsers,
      },
    });
  } catch (err) {
    console.error("Stats Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching analytics statistics.",
    });
  }
});

// List All Registered Students (Admin Only - Never exposes passwords)
app.get("/api/admin/users", adminAuthMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, "prn createdAt lastLogin")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    console.error("Get Registered Users Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching registered students list.",
    });
  }
});

// Delete Student Registration by PRN (Admin Only)
app.delete("/api/admin/users/:prn", adminAuthMiddleware, async (req, res) => {
  try {
    const cleanPrn = (req.params.prn || "").trim();

    if (!cleanPrn) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid PRN to delete.",
      });
    }

    // Safety: only deletes from User collection, never touches Admin collection
    const deletedStudent = await User.findOneAndDelete({ prn: cleanPrn });
    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: "No user found with this PRN",
      });
    }

    console.log(`[ADMIN] Deleted student registration: ${cleanPrn}`);

    return res.json({
      success: true,
      message: `Registration for ${cleanPrn} deleted successfully.`,
      prn: cleanPrn,
    });
  } catch (err) {
    console.error("Delete Student Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error deleting student registration.",
    });
  }
});

// ==========================================
// SEED INITIAL ADMIN (Runs once on empty Admin collection)
// ==========================================
async function seedAdmin() {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const email = (process.env.ADMIN_EMAIL || "pict@gmail.com").trim().toLowerCase();
      const plainPassword = process.env.ADMIN_PASSWORD || "pict123";
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(plainPassword, salt);

      const initialAdmin = new Admin({
        email,
        passwordHash,
        mustChangePassword: true,
      });

      await initialAdmin.save();
      console.log(`[SEED] Initial Admin account seeded: ${email} (mustChangePassword: true)`);
    } else {
      console.log(`[SEED] Admin collection already has ${adminCount} account(s). Seed skipped.`);
    }
  } catch (err) {
    console.error("[SEED] Error seeding admin account:", err.message);
  }
}

// Helper to URL-encode credentials in MongoDB URI if needed
function formatMongoUri(rawUri) {
  if (!rawUri) return rawUri;
  try {
    const match = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/);
    if (match) {
      const [, proto, user, pass, rest] = match;
      const encodedUser = encodeURIComponent(decodeURIComponent(user));
      const encodedPass = encodeURIComponent(decodeURIComponent(pass));
      let formatted = `${proto}${encodedUser}:${encodedPass}@${rest}`;
      if (!formatted.includes(".mongodb.net/") || formatted.match(/\.mongodb\.net\/(\?|$)/)) {
        formatted = formatted.replace(/\.mongodb\.net\/(\?|$)/, ".mongodb.net/scholarship_portal$1");
      }
      return formatted;
    }
    return rawUri;
  } catch (e) {
    return rawUri;
  }
}

// Connect to MongoDB Atlas with retries, then seed admin and start Express server
async function startServer() {
  const uri = formatMongoUri(MONGODB_URI);
  if (!uri) {
    console.error("Fatal Error: MONGODB_URI is not set in environment or .env file.");
    process.exit(1);
  }

  const maxRetries = 6;
  const retryDelay = 2000;
  let connected = false;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Connecting to MongoDB Atlas (Attempt ${attempt}/${maxRetries})...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        maxPoolSize: 10,
      });
      console.log("MongoDB connected");
      connected = true;
      break;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);

      // If SRV lookup fails due to DNS restrictions, try direct replica set connection
      if (err.message && err.message.includes("querySrv") && uri.includes("cluster0.amrbmel.mongodb.net")) {
        console.log("SRV lookup restricted. Attempting direct replica-set connection fallback...");
        try {
          const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/);
          if (match) {
            const [, , user, pass] = match;
            const directUri = `mongodb://${user}:${pass}@ac-qgavnds-shard-00-00.amrbmel.mongodb.net:27017,ac-qgavnds-shard-00-01.amrbmel.mongodb.net:27017,ac-qgavnds-shard-00-02.amrbmel.mongodb.net:27017/scholarship_portal?ssl=true&replicaSet=atlas-3fqdxf-shard-0&authSource=admin&retryWrites=true&w=majority`;
            await mongoose.connect(directUri, {
              serverSelectionTimeoutMS: 15000,
              maxPoolSize: 10,
            });
            console.log("MongoDB connected successfully via replica-set fallback");
            connected = true;
            break;
          }
        } catch (directErr) {
          console.error(`Direct replica-set fallback failed: ${directErr.message}`);
        }
      }

      if (attempt < maxRetries) {
        console.log(`Retrying MongoDB connection in ${retryDelay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        console.error("FATAL: All MongoDB connection attempts failed.");
        console.error("Full error:", err);
        process.exit(1);
      }
    }
  }

  if (connected) {
    // Seed initial admin if needed
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Engineering Scholarship Finder Backend running on http://localhost:${PORT}`);
    });
  }
}

startServer();
