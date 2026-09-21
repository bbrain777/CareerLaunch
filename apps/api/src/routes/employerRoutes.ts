import { Router } from "express";
import { requireAuth, authenticatedUserId, type AuthRequest } from "../middleware/auth.js";
import { getDb } from "../db.js";

export const employerRouter = Router();

// 1. Enforce Authorization: Only logged-in users can access these routes
employerRouter.use(requireAuth);

// 2. GET: Fetch only the employers belonging to the authenticated user
employerRouter.get("/", async (req: AuthRequest, res) => {
  const userId = authenticatedUserId(req)!; // Securely grabs the ID from the token

  // Enforce ownership: Filter database results by the logged-in user's ID
  const employers = await getDb().orm.public.Employer.where({ userId }).all();
  res.json({ employers });
});

// 3. POST: Create a new employer linked securely to the user
employerRouter.post("/", async (req: AuthRequest, res) => {
  const userId = authenticatedUserId(req)!;
  const { name, industry, website } = req.body;

  // Input Validation: Ensure name exists and is a valid string
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Employer name is required and must be a text string." });
  }

  // Create the record securely tied to the user's ID
  const newEmployer = await getDb().orm.public.Employer.create({
    userId, 
    name: name.trim(),
    industry: typeof industry === "string" ? industry.trim() : null,
    website: typeof website === "string" ? website.trim() : null,
  });

  res.status(201).json({ employer: newEmployer });
});