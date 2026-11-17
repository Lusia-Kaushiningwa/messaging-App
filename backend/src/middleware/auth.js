import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

// Requires a valid "Authorization: Bearer <token>" header.
// Also updates lastSeen so other users can see who is online.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.update({
      where: { id: payload.id },
      data: { lastSeen: new Date() },
      select: { id: true, username: true },
    });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
