import { Router } from "express";
import { requireAuth, authenticatedUserId, type AuthRequest } from "../middleware/auth.js";
import { getDb } from "../db.js";

export const contactRouter = Router();

// 1. Enforce Authorization: Protect these routes
contactRouter.use(requireAuth);

// 2. GET: Securely fetch only the logged-in user's contacts
contactRouter.get("/", async (req: AuthRequest, res) => {
  const userId = authenticatedUserId(req)!;
  const contacts = await getDb().orm.public.Contact.where({ userId }).all();
  res.json({ contacts });
});

// 3. POST: Create a new contact with strict input validation
contactRouter.post("/", async (req: AuthRequest, res) => {
  const userId = authenticatedUserId(req)!;
  const { firstName, lastName, email, followUpDate, notes } = req.body;

  // --- Validate Contact Details ---
  if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
    return res.status(400).json({ message: "First name is required and must be text." });
  }

  if (email && (typeof email !== "string" || !email.includes("@"))) {
    return res.status(400).json({ message: "If provided, email must be a valid format." });
  }

  // --- Validate Follow-up Fields & Dates ---
  let parsedFollowUp = null;
  if (followUpDate) {
    // Check if it's a valid date string
    if (typeof followUpDate !== "string" || isNaN(Date.parse(followUpDate))) {
      return res.status(400).json({ message: "Follow-up date must be a valid date format (e.g., YYYY-MM-DD)." });
    }
    parsedFollowUp = new Date(followUpDate);
  }

  // Securely create the contact tied to the user
  const newContact = await getDb().orm.public.Contact.create({
    userId,
    firstName: firstName.trim(),
    lastName: typeof lastName === "string" ? lastName.trim() : null,
    email: typeof email === "string" ? email.trim() : null,
    followUpDate: parsedFollowUp,
    notes: typeof notes === "string" ? notes.trim() : null,
  });

  res.status(201).json({ contact: newContact });
});