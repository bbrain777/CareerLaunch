import { Router } from "express";
import { requireAuth, authenticatedUserId, type AuthRequest } from "../middleware/auth.js";
import { getDb } from "../db.js";

export const employerRouter = Router();
employerRouter.use(requireAuth);

// GET: Fetch only the logged-in user's employers
employerRouter.get("/", async (req: AuthRequest, res) => {
  const userId = authenticatedUserId(req)!;
  const employers = await getDb().orm.public.Employer.where({ userId }).all();
  res.json({ employers });
});

// POST: Create a new employer
employerRouter.post("/", async (req: AuthRequest, res) => {
  const userId = authenticatedUserId(req)!;
  const { name, industry, website } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Employer name is required and must be a text string." });
  }

  const newEmployer = await getDb().orm.public.Employer.create({
    userId, 
    name: name.trim(),
    industry: typeof industry === "string" ? industry.trim() : null,
    website: typeof website === "string" ? website.trim() : null,
  });

  res.status(201).json({ employer: newEmployer });
});

// PATCH: Update an existing employer (enforcing ownership)
employerRouter.patch("/:id", async (req: AuthRequest, res) => {
  const userId = authenticatedUserId(req)!;
  const employerId = Number(req.params.id);
  
  const existingEmployer = await getDb().orm.public.Employer.where({ id: employerId, userId }).first();
  if (!existingEmployer) {
    return res.status(404).json({ message: "Employer not found or unauthorized." });
  }

  const updatedEmployer = await getDb().orm.public.Employer.update({ id: employerId }, req.body);
  res.json({ employer: updatedEmployer });
});

// DELETE: Delete an employer (enforcing ownership)
employerRouter.delete("/:id", async (req: AuthRequest, res) => {
  const userId = authenticatedUserId(req)!;
  const employerId = Number(req.params.id);

  const existingEmployer = await getDb().orm.public.Employer.where({ id: employerId, userId }).first();
  if (!existingEmployer) {
    return res.status(404).json({ message: "Employer not found or unauthorized." });
  }

  await getDb().orm.public.Employer.delete({ id: employerId });
  res.status(204).send();
});