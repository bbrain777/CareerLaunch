
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getDb } from "../db.js";
import {
  authenticatedUserId,
  requireAuth,
  AuthRequest,
} from "../middleware/auth.js";

export const authRouter = Router();

interface StoredUser {
  id: number;
  email: string;
  name: string;
  password: string;
  currentRole?: string;
  targetRole?: string;
  weeklyGoal?: number;
}

const users: StoredUser[] = [];

const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-careerlaunch-key";

function usesDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function splitName(name: string) {
  const [firstName, ...remaining] = name.trim().split(/\s+/);

  return {
    firstName,
    lastName: remaining.length ? remaining.join(" ") : null,
  };
}

function databaseUserToStored(
  user: Record<string, any>,
): StoredUser {
  return {
    id: Number(user.id),
    email: String(user.email),
    name: [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" "),
    password: String(user.passwordHash),
    currentRole:
      typeof user.currentRole === "string"
        ? user.currentRole
        : undefined,
    targetRole:
      typeof user.targetRole === "string"
        ? user.targetRole
        : undefined,
    weeklyGoal:
      typeof user.weeklyGoal === "number"
        ? user.weeklyGoal
        : 5,
  };
}

async function findUserByEmail(
  email: string,
): Promise<StoredUser | undefined> {
  if (!usesDatabase()) {
    return users.find((user) => user.email === email);
  }

  const user = await getDb().orm.public.User
    .where({ email })
    .first();

  return user ? databaseUserToStored(user) : undefined;
}

async function findUserById(
  id: number | undefined,
): Promise<StoredUser | undefined> {
  if (!id) {
    return undefined;
  }

  if (!usesDatabase()) {
    return users.find((user) => user.id === id);
  }

  const user = await getDb().orm.public.User
    .where({ id })
    .first();

  return user ? databaseUserToStored(user) : undefined;
}

async function createUser(input: {
  email: string;
  name: string;
  password: string;
  targetRole?: string;
}): Promise<StoredUser> {
  if (!usesDatabase()) {
    const user: StoredUser = {
      id: users.length + 1,
      email: input.email,
      name: input.name,
      password: input.password,
      targetRole: input.targetRole,
      weeklyGoal: 5,
    };

    users.push(user);
    return user;
  }

  const { firstName, lastName } = splitName(input.name);

  const user = await getDb().orm.public.User.create({
    email: input.email,
    passwordHash: input.password,
    firstName,
    lastName,
    role: "STUDENT",
    targetRole: input.targetRole ?? null,
    weeklyGoal: 5,
  });

  return databaseUserToStored(user);
}

async function updateStoredUser(
  user: StoredUser,
  input: {
    name: string;
    email: string;
    currentRole?: string;
    targetRole?: string;
    weeklyGoal?: number;
  },
): Promise<StoredUser> {
  if (!usesDatabase()) {
    user.name = input.name;
    user.email = input.email;

    if (input.currentRole !== undefined) {
      user.currentRole = input.currentRole;
    }

    if (input.targetRole !== undefined) {
      user.targetRole = input.targetRole;
    }

    if (input.weeklyGoal !== undefined) {
      user.weeklyGoal = input.weeklyGoal;
    }

    return user;
  }

  const { firstName, lastName } = splitName(input.name);

  const updated = await getDb().orm.public.User
    .where({ id: user.id })
    .update({
      email: input.email,
      firstName,
      lastName,
      currentRole: input.currentRole ?? user.currentRole ?? null,
      targetRole: input.targetRole ?? user.targetRole ?? null,
      weeklyGoal: input.weeklyGoal ?? user.weeklyGoal ?? 5,
    });

  if (!updated) {
    throw new Error("Authenticated user no longer exists");
  }

  return databaseUserToStored(updated);
}

function publicUser(user: StoredUser) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

// 1. Registration endpoint
authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name, targetRole } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      password.length < 8 ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      res.status(400).json({
        message:
          "Name, email, and a password of at least 8 characters are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser =
      await findUserByEmail(normalizedEmail);

    if (existingUser) {
      res.status(400).json({
        message: "User already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      email: normalizedEmail,
      name: name.trim(),
      password: hashedPassword,
      targetRole:
        typeof targetRole === "string"
          ? targetRole.trim()
          : undefined,
    });

    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: publicUser(newUser),
    });
  } catch (error) {
    console.error(
      "Registration failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    res.status(500).json({
      message: "Server error during registration",
    });
  }
});

// 2. Login endpoint
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const user = await findUserByEmail(
      email.trim().toLowerCase(),
    );

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error(
      "Login failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    res.status(500).json({
      message: "Server error during login",
    });
  }
});

// 3. Logout endpoint
authRouter.post("/logout", (_req, res) => {
  // JWT sessions are stateless. The client should discard its token.
  res.status(200).json({
    message: "Logout successful",
  });
});

// 4. Get profile endpoint
authRouter.get(
  "/profile",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const userId = authenticatedUserId(req);
      const user = await findUserById(userId);

      if (!user) {
        res.status(404).json({
          message: "User profile not found",
        });
        return;
      }

      res.status(200).json({
        message: "Profile accessed successfully",
        user: publicUser(user),
      });
    } catch (error) {
      console.error(
        "Profile retrieval failed:",
        error instanceof Error ? error.message : "Unknown error",
      );

      res.status(500).json({
        message: "Server error while retrieving profile",
      });
    }
  },
);

// 5. Update profile endpoint
authRouter.put(
  "/profile",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const userId = authenticatedUserId(req);
      const user = await findUserById(userId);

      if (!user) {
        res.status(404).json({
          message: "User profile not found",
        });
        return;
      }

      const {
        name,
        email,
        currentRole,
        targetRole,
        weeklyGoal,
      } = req.body;

      if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof email !== "string" ||
        !email.trim()
      ) {
        res.status(400).json({
          message: "Name and email are required",
        });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      const emailOwner =
        await findUserByEmail(normalizedEmail);

      if (emailOwner && emailOwner.id !== user.id) {
        res.status(409).json({
          message: "Email is already in use",
        });
        return;
      }

      if (
        currentRole !== undefined &&
        typeof currentRole !== "string"
      ) {
        res.status(400).json({
          message: "Current role must be a string",
        });
        return;
      }

      if (
        targetRole !== undefined &&
        typeof targetRole !== "string"
      ) {
        res.status(400).json({
          message: "Target role must be a string",
        });
        return;
      }

      if (
        weeklyGoal !== undefined &&
        (
          typeof weeklyGoal !== "number" ||
          !Number.isInteger(weeklyGoal) ||
          weeklyGoal < 1 ||
          weeklyGoal > 168
        )
      ) {
        res.status(400).json({
          message:
            "Weekly goal must be a whole number between 1 and 168",
        });
        return;
      }

      const normalizedCurrentRole =
        typeof currentRole === "string"
          ? currentRole.trim()
          : undefined;

      const normalizedTargetRole =
        typeof targetRole === "string"
          ? targetRole.trim()
          : undefined;

      const updatedUser = await updateStoredUser(user, {
        name: name.trim(),
        email: normalizedEmail,
        currentRole: normalizedCurrentRole,
        targetRole: normalizedTargetRole,
        weeklyGoal:
          typeof weeklyGoal === "number"
            ? weeklyGoal
            : user.weeklyGoal,
      });

      res.status(200).json({
        message: "Profile updated successfully",
        user: publicUser(updatedUser),
      });
    } catch (error) {
      console.error(
        "Profile update failed:",
        error instanceof Error ? error.message : "Unknown error",
      );

      res.status(500).json({
        message: "Server error while updating profile",
      });
    }
  },
);