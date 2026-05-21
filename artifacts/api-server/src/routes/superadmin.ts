import { Router, type IRouter } from "express";
import { eq, desc, ne } from "drizzle-orm";
import { db, usersTable, agentsTable, quotationsTable, cashbackTransactionsTable } from "@workspace/db";
import { createHash, randomBytes } from "crypto";
import { requireSuperAdmin, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "kynaz_salt_2024").digest("hex");
}

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    referralCode: user.referralCode,
    cashbackBalance: parseFloat(user.cashbackBalance),
    isVerified: user.isVerified,
    isSuspended: user.isSuspended,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// Super admin stats
router.get("/superadmin/stats", requireSuperAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  const quotations = await db.select().from(quotationsTable);
  const agents = await db.select().from(agentsTable);
  const cashback = await db.select().from(cashbackTransactionsTable);

  const totalCashback = cashback
    .filter(t => ["earned", "referral", "promotion"].includes(t.type))
    .reduce((s, t) => s + parseFloat(t.amount), 0);

  res.json({
    totalUsers: users.length,
    totalAdmins: users.filter(u => u.role === "admin").length,
    totalSuperAdmins: users.filter(u => u.role === "superadmin").length,
    totalAgents: users.filter(u => u.role === "agent").length,
    totalCustomers: users.filter(u => u.role === "customer").length,
    totalSuspended: users.filter(u => u.isSuspended).length,
    totalQuotations: quotations.length,
    totalActiveAgents: agents.filter(a => a.status === "active").length,
    totalCashbackIssued: totalCashback,
  });
});

// List all users (all roles)
router.get("/superadmin/users", requireSuperAdmin, async (req, res): Promise<void> => {
  const { role } = req.query as { role?: string };
  let users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  if (role) users = users.filter(u => u.role === role);
  res.json(users.map(formatUser));
});

// Get single user
router.get("/superadmin/users/:id", requireSuperAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

// Create user with any role
router.post("/superadmin/users", requireSuperAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { fullName, email, phone, password, role } = req.body as {
      fullName: string; email: string; phone: string; password: string;
      role: "customer" | "agent" | "admin" | "superadmin";
    };

    if (!fullName || !email || !phone || !password || !role) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const referralCode = generateReferralCode();
    const [user] = await db.insert(usersTable).values({
      fullName,
      email,
      phone,
      passwordHash: hashPassword(password),
      role,
      referralCode,
      cashbackBalance: "0.00",
      isVerified: true,
      isSuspended: false,
      updatedAt: new Date(),
    }).returning();

    // If creating an agent, auto-create the agent record
    if (role === "agent") {
      const agentId = `KYN-AGT-${String(user.id).padStart(4, "0")}`;
      await db.insert(agentsTable).values({
        userId: user.id,
        agentId,
        status: "active",
        badge: "bronze",
        commissionRate: "5.00",
        updatedAt: new Date(),
      }).onConflictDoNothing();
    }

    res.status(201).json(formatUser(user));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique")) {
      res.status(400).json({ error: "Email already registered" });
    } else {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
});

// Update user (role, name, phone, suspend)
router.patch("/superadmin/users/:id", requireSuperAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { fullName, phone, role, isSuspended, isVerified } = req.body as {
      fullName?: string; phone?: string;
      role?: "customer" | "agent" | "admin" | "superadmin";
      isSuspended?: boolean; isVerified?: boolean;
    };

    const updateData: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (isSuspended !== undefined) updateData.isSuspended = isSuspended;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    // If promoted to agent, auto-create agent record
    if (role === "agent") {
      const agentId = `KYN-AGT-${String(user.id).padStart(4, "0")}`;
      await db.insert(agentsTable).values({
        userId: user.id,
        agentId,
        status: "active",
        badge: "bronze",
        commissionRate: "5.00",
        updatedAt: new Date(),
      }).onConflictDoNothing();
    }

    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Reset user password
router.post("/superadmin/users/:id/reset-password", requireSuperAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { newPassword } = req.body as { newPassword: string };
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const [user] = await db.update(usersTable)
    .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ message: "Password reset successfully" });
});

// Delete user
router.delete("/superadmin/users/:id", requireSuperAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  if (id === req.userId) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }
  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ message: "User deleted successfully" });
});

export default router;
