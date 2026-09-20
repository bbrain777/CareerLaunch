import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend the Express Request type so we can attach the user's data to it
export interface AuthRequest extends Request {
  user?: string | jwt.JwtPayload;
}

export function authenticatedUserId(req: AuthRequest): number | undefined {
  if (!req.user || typeof req.user === "string") return undefined;

  const userId = req.user.userId;
  return typeof userId === "number" && Number.isInteger(userId) && userId > 0
    ? userId
    : undefined;
}

// In a real app, this comes from a hidden .env file. We use a fallback for local testing.
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-careerlaunch-key";

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // 1. Look for the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  // 2. Extract the token (format is "Bearer <token>")
  const token = authHeader.split(" ")[1];

  try {
    // 3. Verify the token using our secret key
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 4. Attach the decoded user data to the request
    req.user = decoded;
    
    // 5. Let the request pass through to the protected route
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    return;
  }
};
