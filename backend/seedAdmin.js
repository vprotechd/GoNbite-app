import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Admin from "./models/Admin.js";

dotenv.config();

const createAdmin = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 2. Admin credentials
    const adminEmail = "admin@snax.com";
    const adminPassword = "Admin@123";

    // 3. Check Admin collection
    const existingAdmin = await Admin.findOne({
      email: adminEmail.toLowerCase(),
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists in Admin collection!");
      await mongoose.connection.close();
      process.exit(0);
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 5. Create admin in Admin collection
    const newAdmin = new Admin({
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
    });

    await newAdmin.save();

    console.log("================================");
    console.log("✅ ADMIN CREATED SUCCESSFULLY");
    console.log("================================");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log("📁 Collection: Admin");
    console.log("================================");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);

    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();