import { Router } from "express";
import { requireAuth, authenticatedUserId, type AuthRequest } from "../middleware/auth.js";
import { getDb } from "../db.js";

export const contactRouter = Router();
contactRouter.use(requireAuth);

// GET: Fetch only the logged-in user's contacts
contactRouter.get("/", async (req: AuthRequest, res) => {
  const userId = authenticatedUserId(req)!;
  const contacts = await getDb().orm.public.Contact.where({ userId }).all();
  res.json({ contacts });
});

// POST: Create a new contact
contactRouter.post("/", async (req: AuthRequest, res) => {
  const userId = authenticatedUserId(req)!;
  const { firstName, lastName, email, nextFollowUp, notes } = req.body;

  if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
    return res.status(400).json({ message: "First name is required and must be text." });
  }

  if (email && (typeof email !== "string" || !email.includes("@"))) {
    return res.status(400).json({ message: "If provided, email must be a valid format." });
  }

  let parsedFollowUp = null;
  if (nextFollowUp) {
    if (typeof nextFollowUp !== "string" || isNaN(Date.parse(nextFollowUp))) {
      return res.status(400).json({ message: "Next follow-up must be a valid date format (e.g., YYYY-MM-DD)." });
    }
    parsedFollowUp = new Date(nextFollowUp);
  }

  const newContact = await getDb().orm.public.Contact.create({
    userId,
    firstName: firstName.trim(),
    lastName: typeof lastName === "string" ? lastName.trim() : null,
    email: typeof email === "string" ? email.trim() : null,
    nextFollowUp: parsedFollowUp,
    notes: typeof notes === "string" ? notes.trim() : null,
  });

  res.status(201).json({ contact: newContact });
});

// PATCH: Update an existing contact (enforcing ownership)
contactRouter.patch("/:id", async (req: AuthRequest, res) => {
  const userId = authenticatedUserId(req)!;
  const contactId = Number(req.params.id);
  
  const existingContact = await getDb().orm.public.Contact.where({ id: contactId, userId }).first();
  if (!existingContact) {
    return res.status(404).json({ message: "Contact not found or unauthorized." });
  }

  const updatedContact = await getDb().orm.public.Contact.update({ id: contactId }, req.body);
  res.json({ contact: updatedContact });
});

// DELETE: Delete a contact (enforcing ownership)
contactRouter.delete("/:id", async (req: AuthRequest, res) => {
  const userId = authenticatedUserId(req)!;
  const contactId = Number(req.params.id);

  const existingContact = await getDb().orm.public.Contact.where({ id: contactId, userId }).first();
  if (!existingContact) {
    return res.status(404).json({ message: "Contact not found or unauthorized." });
  }

  await getDb().orm.public.Contact.delete({ id: contactId });
  res.status(204).send();
});