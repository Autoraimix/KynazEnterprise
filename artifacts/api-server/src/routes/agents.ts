import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import {
  db, usersTable, agentsTable, commissionsTable, quotationsTable,
  servicesTable, notificationsTable, agentBroadcastsTable
} from "@workspace/db";
import { requireAuth, requireAdmin, type AuthenticatedRequest } from "../middlewares/auth";
import { sendEmail, emailAgentWelcome } from "../lib/email";

const router: IRouter = Router();

async function requireAgent(req: AuthenticatedRequest, res: any, next: any): Promise<void> {
  await requireAuth(req, res, async () => {
    if (req.userRole !== "agent" && req.userRole !== "admin" && req.userRole !== "superadmin") {
      res.status(403).json({ error: "Agent access required" });
      return;
    }
    next();
  });
}

function generateAgentId(name: string, id: number): string {
  const prefix = name.split(" ")[0]?.toUpperCase().slice(0, 5) ?? "AGT";
  return `KYNZ-${prefix}-${String(id).padStart(4, "0")}`;
}

function calcBadge(points: number): "bronze" | "silver" | "gold" | "platinum" | "elite" {
  if (points >= 10000) return "elite";
  if (points >= 5000) return "platinum";
  if (points >= 2000) return "gold";
  if (points >= 500) return "silver";
  return "bronze";
}

// ── Agent registers themselves (creates agent profile linked to user) ─────────
router.post("/agents/apply", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const existing = await db.select().from(agentsTable).where(eq(agentsTable.userId, userId));
  if (existing.length > 0) { res.status(400).json({ error: "Agent profile already exists" }); return; }

  const [agent] = await db.insert(agentsTable).values({
    userId,
    agentId: `KYNZ-TEMP-${userId}`,
    status: "pending",
  }).returning();

  res.status(201).json({ message: "Application submitted. Awaiting admin approval.", agentId: agent.agentId });
});

// ── Agent dashboard stats ─────────────────────────────────────────────────────
router.get("/agents/dashboard", requireAgent, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const isAdmin = req.userRole === "admin" || req.userRole === "superadmin";

  const [agent] = isAdmin
    ? [null]
    : await db.select().from(agentsTable).where(eq(agentsTable.userId, userId));

  if (!isAdmin && !agent) { res.status(404).json({ error: "Agent profile not found" }); return; }

  const [agentRow] = isAdmin ? await db.select().from(agentsTable).limit(1) : [agent];

  res.json({
    agent: agentRow,
    message: "Use /agents/me for full agent data",
  });
});

// ── Get my agent profile ───────────────────────────────────────────────────────
router.get("/agents/me", requireAgent, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.userId, userId));
  if (!agent) { res.status(404).json({ error: "Agent profile not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const customers = await db.select().from(usersTable).where(eq(usersTable.referredByCode, user!.referralCode));
  const customerIds = customers.map(c => c.id);
  const quotations = customerIds.length > 0
    ? await db.select().from(quotationsTable)
    : [];

  const filteredQ = quotations.filter(q => q.userId && customerIds.includes(q.userId));
  const paidQ = filteredQ.filter(q => q.status === "paid");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthQ = paidQ.filter(q => q.createdAt >= monthStart);

  res.json({
    agent,
    user: {
      id: user!.id,
      fullName: user!.fullName,
      email: user!.email,
      phone: user!.phone,
      referralCode: user!.referralCode,
    },
    stats: {
      totalCustomers: customers.length,
      totalQuotations: filteredQ.length,
      totalSales: paidQ.length,
      monthlyQuotations: monthQ.length,
      totalCommission: parseFloat(agent.totalCommission),
      commissionBalance: parseFloat(agent.commissionBalance),
      points: agent.points,
      badge: agent.badge,
      rank: agent.rankPosition,
    },
  });
});

// ── Get agent's customers ──────────────────────────────────────────────────────
router.get("/agents/customers", requireAgent, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const customers = await db.select().from(usersTable)
    .where(eq(usersTable.referredByCode, user.referralCode))
    .orderBy(desc(usersTable.createdAt));

  res.json(customers.map(c => ({
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    phone: c.phone,
    cashbackBalance: parseFloat(c.cashbackBalance),
    isVerified: c.isVerified,
    createdAt: c.createdAt.toISOString(),
  })));
});

// ── Get agent's quotations (from referred customers) ──────────────────────────
router.get("/agents/quotations", requireAgent, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const customers = await db.select().from(usersTable).where(eq(usersTable.referredByCode, user.referralCode));
  const customerIds = customers.map(c => c.id);
  const customerMap = new Map(customers.map(c => [c.id, c]));

  if (customerIds.length === 0) { res.json([]); return; }

  const quotations = await db.select().from(quotationsTable).orderBy(desc(quotationsTable.createdAt));
  const filtered = quotations.filter(q => q.userId && customerIds.includes(q.userId));

  const services = await db.select().from(servicesTable);
  const serviceMap = new Map(services.map(s => [s.id, s.name]));

  res.json(filtered.map(q => ({
    id: q.id,
    quotationRef: q.quotationRef,
    status: q.status,
    price: q.price ? parseFloat(q.price) : null,
    serviceName: serviceMap.get(q.serviceId) ?? "Unknown",
    customerName: q.userId ? customerMap.get(q.userId)?.fullName ?? null : null,
    customerEmail: q.userId ? customerMap.get(q.userId)?.email ?? null : null,
    createdAt: q.createdAt.toISOString(),
  })));
});

// ── Get commissions ────────────────────────────────────────────────────────────
router.get("/agents/commissions", requireAgent, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.userId, userId));
  if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }

  const commissions = await db.select().from(commissionsTable)
    .where(eq(commissionsTable.agentId, agent.id))
    .orderBy(desc(commissionsTable.createdAt));

  res.json(commissions.map(c => ({
    id: c.id,
    quotationId: c.quotationId,
    amount: parseFloat(c.amount),
    rate: parseFloat(c.rate),
    status: c.status,
    description: c.description,
    createdAt: c.createdAt.toISOString(),
  })));
});

// ── Get leaderboard ────────────────────────────────────────────────────────────
router.get("/agents/leaderboard", requireAuth, async (_req, res): Promise<void> => {
  const agents = await db.select().from(agentsTable)
    .where(eq(agentsTable.status, "active"))
    .orderBy(desc(agentsTable.points));

  const userIds = agents.map(a => a.userId);
  const users = await db.select().from(usersTable);
  const userMap = new Map(users.map(u => [u.id, u]));

  res.json(agents.map((a, idx) => ({
    rank: idx + 1,
    agentId: a.agentId,
    name: userMap.get(a.userId)?.fullName ?? "Unknown",
    badge: a.badge,
    points: a.points,
    totalSales: a.totalSales,
    totalCustomers: a.totalCustomers,
    totalCommission: parseFloat(a.totalCommission),
  })));
});

// ── Get broadcasts ─────────────────────────────────────────────────────────────
router.get("/agents/broadcasts", requireAgent, async (_req, res): Promise<void> => {
  const broadcasts = await db.select().from(agentBroadcastsTable)
    .where(eq(agentBroadcastsTable.isActive, true))
    .orderBy(desc(agentBroadcastsTable.createdAt));
  res.json(broadcasts);
});

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — Agent management endpoints
// ══════════════════════════════════════════════════════════════════════════════

router.get("/admin/agents", requireAdmin, async (_req, res): Promise<void> => {
  const agents = await db.select().from(agentsTable).orderBy(desc(agentsTable.createdAt));
  const users = await db.select().from(usersTable);
  const userMap = new Map(users.map(u => [u.id, u]));

  res.json(agents.map(a => ({
    id: a.id,
    agentId: a.agentId,
    userId: a.userId,
    status: a.status,
    badge: a.badge,
    points: a.points,
    totalSales: a.totalSales,
    totalCustomers: a.totalCustomers,
    totalCommission: parseFloat(a.totalCommission),
    commissionBalance: parseFloat(a.commissionBalance),
    commissionRate: parseFloat(a.commissionRate),
    createdAt: a.createdAt.toISOString(),
    user: userMap.get(a.userId) ? {
      fullName: userMap.get(a.userId)!.fullName,
      email: userMap.get(a.userId)!.email,
      phone: userMap.get(a.userId)!.phone,
      referralCode: userMap.get(a.userId)!.referralCode,
    } : null,
  })));
});

router.patch("/admin/agents/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { status, commissionRate, notes } = req.body;
  const updateData: Partial<typeof agentsTable.$inferInsert> = { updatedAt: new Date() };

  const [existing] = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Agent not found" }); return; }

  if (status) updateData.status = status;
  if (commissionRate != null) updateData.commissionRate = parseFloat(commissionRate).toFixed(2);
  if (notes != null) updateData.notes = notes;

  // When approving, generate proper agent ID and update user role
  if (status === "active" && existing.status !== "active") {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId));
    if (user) {
      const agentId = generateAgentId(user.fullName, existing.id);
      updateData.agentId = agentId;
      await db.update(usersTable).set({ role: "agent" }).where(eq(usersTable.id, existing.userId));
      sendEmail({
        to: user.email,
        subject: "Your Kynaz Agent Account is Approved!",
        html: emailAgentWelcome({ name: user.fullName, agentId, referralCode: user.referralCode }),
      }).catch(() => {});
    }
  }

  const [updated] = await db.update(agentsTable).set(updateData).where(eq(agentsTable.id, id)).returning();
  res.json(updated);
});

// Admin — approve commission payout
router.post("/admin/agents/:id/payout", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { amount } = req.body;
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) { res.status(400).json({ error: "Invalid amount" }); return; }

  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
  if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }

  const currentBalance = parseFloat(agent.commissionBalance);
  if (amountNum > currentBalance) { res.status(400).json({ error: "Insufficient commission balance" }); return; }

  const [updated] = await db.update(agentsTable)
    .set({ commissionBalance: (currentBalance - amountNum).toFixed(2), updatedAt: new Date() })
    .where(eq(agentsTable.id, id))
    .returning();

  res.json({ message: "Payout processed", newBalance: parseFloat(updated.commissionBalance) });
});

// Admin — refresh leaderboard rankings
router.post("/admin/agents/refresh-rankings", requireAdmin, async (_req, res): Promise<void> => {
  const agents = await db.select().from(agentsTable)
    .where(eq(agentsTable.status, "active"))
    .orderBy(desc(agentsTable.points));

  for (let i = 0; i < agents.length; i++) {
    await db.update(agentsTable).set({ rankPosition: i + 1 }).where(eq(agentsTable.id, agents[i]!.id));
  }

  res.json({ message: `Rankings refreshed for ${agents.length} agents` });
});

// Admin — send broadcast to agents
router.post("/admin/agents/broadcast", requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { title, message } = req.body;
  if (!title || !message) { res.status(400).json({ error: "title and message are required" }); return; }

  const [broadcast] = await db.insert(agentBroadcastsTable).values({
    title,
    message,
    sentBy: req.userId!,
  }).returning();

  // Notify all active agents via notification
  const agents = await db.select().from(agentsTable).where(eq(agentsTable.status, "active"));
  for (const agent of agents) {
    await db.insert(notificationsTable).values({
      userId: agent.userId,
      title,
      message,
      type: "announcement",
      isRead: false,
    }).catch(() => {});
  }

  res.status(201).json(broadcast);
});

// Admin — create agent account directly
router.post("/admin/agents", requireAdmin, async (req, res): Promise<void> => {
  const { userId, commissionRate } = req.body;
  if (!userId) { res.status(400).json({ error: "userId is required" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parseInt(userId)));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const existing = await db.select().from(agentsTable).where(eq(agentsTable.userId, user.id));
  if (existing.length > 0) { res.status(400).json({ error: "Agent profile already exists for this user" }); return; }

  const [agent] = await db.insert(agentsTable).values({
    userId: user.id,
    agentId: `KYNZ-TEMP-${user.id}`,
    status: "pending",
    commissionRate: commissionRate ? parseFloat(commissionRate).toFixed(2) : "5.00",
  }).returning();

  res.status(201).json(agent);
});

export default router;
