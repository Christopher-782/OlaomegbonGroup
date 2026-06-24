require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/userSchema");

async function createSupportUser() {
  try {
    const mongoUri =
      process.env.MONGO ||
      process.env.MONGO ||
      "mongodb://127.0.0.1:27017/libra-construction";

    await mongoose.connect(mongoUri);

    console.log("Connected to MongoDB");

    const supportUser = {
      firstName: "Segun",
      lastName: "O",
      email: "support@Olaomegbon.com",
      password: "Support123",
      role: "support",
      isActive: true,
    };

    const existingUser = await User.findOne({
      email: supportUser.email.toLowerCase(),
    });

    const hashedPassword = await bcrypt.hash(supportUser.password, 10);

    if (existingUser) {
      existingUser.firstName = supportUser.firstName;
      existingUser.lastName = supportUser.lastName;
      existingUser.password = hashedPassword;
      existingUser.role = supportUser.role;
      existingUser.isActive = true;

      await existingUser.save();

      console.log("Support user already existed. User updated successfully.");
      console.log({
        email: supportUser.email,
        password: supportUser.password,
        role: supportUser.role,
      });
    } else {
      await User.create({
        firstName: supportUser.firstName,
        lastName: supportUser.lastName,
        email: supportUser.email.toLowerCase(),
        password: hashedPassword,
        role: supportUser.role,
        isActive: supportUser.isActive,
      });

      console.log("Support user created successfully.");
      console.log({
        email: supportUser.email,
        password: supportUser.password,
        role: supportUser.role,
      });
    }
  } catch (error) {
    console.error("Error creating support user:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
    process.exit(0);
  }
}

createSupportUser();
