import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {}

dotenv.config();

async function reset() {
  for (let i = 1; i <= 6; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      break;
    } catch (e) {
      if (i === 6) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("pict123", salt);

  const updateDoc = {
    passwordHash,
    mustChangePassword: true,
    updatedAt: new Date(),
  };

  await mongoose.connection.db.collection("admins").updateOne(
    { email: "pict@gmail.com" },
    { $set: updateDoc },
    { upsert: true }
  );

  const admin = await mongoose.connection.db.collection("admins").findOne({ email: "pict@gmail.com" });
  const matches = await bcrypt.compare("pict123", admin.passwordHash);
  console.log("Admin email:", admin.email);
  console.log("Verified pict123 match:", matches);
  await mongoose.disconnect();
}

reset().catch(console.error);
