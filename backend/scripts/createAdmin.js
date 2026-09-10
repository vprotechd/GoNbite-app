import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";

dotenv.config();

const createAdmin = async () => {
  try {
    // ==========================================
    // ADMIN CREDENTIALS
    // ==========================================

    const adminEmail = "rajatkumarvpro.com";
    const adminPassword = "Rajat.kmr@#116";

    // ==========================================
    // CONNECT DATABASE
    // ==========================================

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    // ==========================================
    // CHECK IF ADMIN ALREADY EXISTS
    // ==========================================

    const existingAdmin = await Admin.findOne({
      email: adminEmail.toLowerCase(),
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");

      await mongoose.connection.close();
      process.exit(0);
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(
      adminPassword,
      10
    );

    // ==========================================
    // CREATE ADMIN
    // ==========================================

    const admin = await Admin.create({
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
    });

    console.log("--------------------------------");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("--------------------------------");
    console.log("Email:", admin.email);
    console.log("Role: admin");
    console.log("--------------------------------");

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error("ADMIN CREATION ERROR:", error);

    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();