import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getTokenStore } from "../routes/auth";

export interface AuthenticatedRequest extends Request {
  userId?: number;
  userRole?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const tokenStore = getTokenStore();

  // Check in-memory store first, fall back to DB (survives server restarts)
  let userId = tokenStore.get(token);
  if (!userId) {
    const [u] = await db
      .select({ id: usersTable.id, role: usersTable.role, isSuspended: usersTable.isSuspended })
      .from(usersTable)
      .where(eq(usersTable.authToken, token));
    if (u && !u.isSuspended) {
      tokenStore.set(token, u.id); // restore in-memory cache
      req.userId = u.id;
      req.userRole = u.role;
      next();
      return;
    }
    if (u?.isSuspended) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.isSuspended) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.userId = userId;
  req.userRole = user.role;
  next();
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, async () => {
    if (req.userRole !== "admin" && req.userRole !== "superadmin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}

export async function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, async () => {
    if (req.userRole !== "superadmin") {
      res.status(403).json({ error: "Forbidden: Super Admin access required" });
      return;
    }
    next();
  });
}
