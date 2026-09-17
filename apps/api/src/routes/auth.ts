import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { requireAuth, AuthRequest } from "../middleware/auth.js"; 

export const authRouter = Router();

// Temporary array to store users until Saleh finishes the database setup
const users: any[] = [];
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-careerlaunch-key";

// 1. Registration Endpoint
authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the new user
    const newUser = { id: users.length + 1, email, name, password: hashedPassword };
    users.push(newUser);

    // Generate a session token
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({ message: "Registration successful", token, user: { id: newUser.id, email, name } });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration" });
  }
});

// 2. Login Endpoint
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user
    const user = users.find(u => u.email === email);
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Compare the entered password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Generate a session token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "Login successful", token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// 3. Logout Endpoint
authRouter.post("/logout", (req, res) => {
  // JWTs are stateless, so logout is mainly handled on the frontend by deleting the token.
  // We provide this endpoint so the frontend has a reliable URL to call.
  res.status(200).json({ message: "Logout successful" });
});

// 4. Profile Endpoint (Protected)
authRouter.get("/profile", requireAuth, (req: AuthRequest, res) => {
  // req.user is attached by the requireAuth middleware if the token is valid
  res.status(200).json({ message: "Profile accessed successfully", user: req.user });
});