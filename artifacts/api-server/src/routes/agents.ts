import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import {
  db, usersTable, agentsTable, commissionsTable, quotationsTable,
  servicesTable, notificationsTable, agentBroadcastsTable, settingsTable,
  withdrawalRequestsTable
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
  const agents = await db.select().from(agentsTable).where(eq(agentsTable.status, "active"));
  const users = await db.select().from(usersTable);
  const userMap = new Map(users.map(u => [u.id, u]));
  const quotations = await db.select().from(quotationsTable);

  // Sort: badge weight desc → totalSales desc → points desc
  const sorted = [...agents].sort((a, b) => {
    const bwDiff = (BADGE_WEIGHT[b.badge] ?? 0) - (BADGE_WEIGHT[a.badge] ?? 0);
    if (bwDiff !== 0) return bwDiff;
    if (b.totalSales !== a.totalSales) return b.totalSales - a.totalSales;
    return b.points - a.points;
  });

  res.json(sorted.map((a, idx) => {
    const paidQ = quotations.filter(q => q.userId === a.userId && q.status === "paid");
    const totalSalesValue = paidQ.reduce((s, q) => s + (q.price ? parseFloat(q.price) : 0), 0);
    return {
      rank: idx + 1,
      agentId: a.agentId,
      name: userMap.get(a.userId)?.fullName ?? "Unknown",
      badge: a.badge,
      badgeWeight: BADGE_WEIGHT[a.badge] ?? 0,
      points: a.points,
      totalSales: a.totalSales,
      totalSalesValue: parseFloat(totalSalesValue.toFixed(2)),
      totalCustomers: a.totalCustomers,
      totalCommission: parseFloat(a.totalCommission),
    };
  }));
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

const BADGE_WEIGHT: Record<string, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4, elite: 5 };

const DEFAULT_BADGE_CRITERIA = {
  bronze:   { minSales: 8,  minValue: 10000 },
  silver:   { minSales: 12, minValue: 10000 },
  gold:     { minSales: 16, minValue: 15000 },
  platinum: { minSales: 20, minValue: 20000 },
};
const DEFAULT_POINTS_PER_SALE = 10;

async function getBadgeCriteria() {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "badge_criteria"));
  if (row) {
    try { return JSON.parse(row.value) as typeof DEFAULT_BADGE_CRITERIA; } catch {}
  }
  return DEFAULT_BADGE_CRITERIA;
}

async function getPointsPerSale(): Promise<number> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "points_per_sale"));
  return row ? parseFloat(row.value) : DEFAULT_POINTS_PER_SALE;
}

// Get badge criteria settings
router.get("/admin/agents/badge-criteria", requireAdmin, async (_req, res): Promise<void> => {
  const criteria = await getBadgeCriteria();
  const pointsPerSale = await getPointsPerSale();
  res.json({ criteria, pointsPerSale });
});

// Update badge criteria settings
router.put("/admin/agents/badge-criteria", requireAdmin, async (req, res): Promise<void> => {
  const { criteria, pointsPerSale } = req.body as {
    criteria: typeof DEFAULT_BADGE_CRITERIA; pointsPerSale: number;
  };
  if (!criteria) { res.status(400).json({ error: "criteria required" }); return; }

  const criteriaJson = JSON.stringify(criteria);
  await db.insert(settingsTable).values({ key: "badge_criteria", value: criteriaJson })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: criteriaJson, updatedAt: new Date() } });

  if (pointsPerSale != null) {
    const pps = String(pointsPerSale);
    await db.insert(settingsTable).values({ key: "points_per_sale", value: pps })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value: pps, updatedAt: new Date() } });
  }

  res.json({ message: "Badge criteria updated" });
});

router.get("/admin/agents", requireAdmin, async (_req, res): Promise<void> => {
  const agents = await db.select().from(agentsTable);
  const users = await db.select().from(usersTable);
  const quotations = await db.select().from(quotationsTable);
  const userMap = new Map(users.map(u => [u.id, u]));

  // Sort by badge weight desc, then total sales desc, then points desc
  const sorted = [...agents].sort((a, b) => {
    const bwDiff = (BADGE_WEIGHT[b.badge] ?? 0) - (BADGE_WEIGHT[a.badge] ?? 0);
    if (bwDiff !== 0) return bwDiff;
    if (b.totalSales !== a.totalSales) return b.totalSales - a.totalSales;
    return b.points - a.points;
  });

  res.json(sorted.map((a, idx) => {
    const user = userMap.get(a.userId);
    const paidQuotations = quotations.filter(q => q.userId === a.userId && q.status === "paid");
    const totalSalesValue = paidQuotations.reduce((sum, q) => sum + (q.price ? parseFloat(q.price) : 0), 0);
    return {
      id: a.id,
      agentId: a.agentId,
      userId: a.userId,
      status: a.status,
      badge: a.badge,
      points: a.points,
      rankPosition: idx + 1,
      totalSales: a.totalSales,
      totalSalesValue: parseFloat(totalSalesValue.toFixed(2)),
      totalCustomers: a.totalCustomers,
      totalCommission: parseFloat(a.totalCommission),
      commissionBalance: parseFloat(a.commissionBalance),
      commissionRate: parseFloat(a.commissionRate),
      notes: a.notes,
      createdAt: a.createdAt.toISOString(),
      user: user ? {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
      } : null,
    };
  }));
});

router.patch("/admin/agents/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { status, commissionRate, notes, badge, points, fullName, phone } = req.body as {
    status?: string; commissionRate?: string; notes?: string;
    badge?: string; points?: number; fullName?: string; phone?: string;
  };

  const updateData: Partial<typeof agentsTable.$inferInsert> = { updatedAt: new Date() };

  const [existing] = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Agent not found" }); return; }

  if (status) updateData.status = status as typeof agentsTable.$inferInsert["status"];
  if (commissionRate != null) updateData.commissionRate = parseFloat(commissionRate).toFixed(2);
  if (notes != null) updateData.notes = notes;
  if (badge != null) updateData.badge = badge as typeof agentsTable.$inferInsert["badge"];
  if (points != null) updateData.points = Number(points);

  // When approving, generate proper agent ID and update user role
  if (status === "active" && existing.status !== "active") {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId));
    if (user) {
      const agentId = generateAgentId(user.fullName, existing.id);
      updateData.agentId = agentId;
      await db.update(usersTable).set({ role: "agent", updatedAt: new Date() }).where(eq(usersTable.id, existing.userId));
      sendEmail({
        to: user.email,
        subject: "Your Kynaz Agent Account is Approved!",
        html: emailAgentWelcome({ name: user.fullName, agentId, referralCode: user.referralCode }),
      }).catch(() => {});
    }
  }

  // Update user name/phone if provided
  if (fullName || phone) {
    const userUpdate: Record<string, unknown> = { updatedAt: new Date() };
    if (fullName) userUpdate.fullName = fullName;
    if (phone) userUpdate.phone = phone;
    await db.update(usersTable).set(userUpdate as Partial<typeof usersTable.$inferInsert>).where(eq(usersTable.id, existing.userId));
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

// ── Agent: get own withdrawal history ─────────────────────────────────────────
router.get("/agents/commissions/withdrawals", requireAgent, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const requests = await db.select().from(withdrawalRequestsTable)
    .where(and(eq(withdrawalRequestsTable.userId, userId), eq(withdrawalRequestsTable.requestType, "agent")))
    .orderBy(desc(withdrawalRequestsTable.createdAt));
  res.json(requests.map(r => ({ ...r, amount: parseFloat(r.amount) })));
});

// ── Agent: submit withdrawal request ──────────────────────────────────────────
router.post("/agents/commissions/withdraw", requireAgent, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.userId, userId));
  if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }

  const { amount, bankName, accountName, accountNumber } = req.body;
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum < 50) {
    res.status(400).json({ error: "Minimum withdrawal amount is RM50" });
    return;
  }

  const currentBalance = parseFloat(agent.commissionBalance);
  if (amountNum > currentBalance) {
    res.status(400).json({ error: "Insufficient commission balance" });
    return;
  }

  if (!bankName || !accountName || !accountNumber) {
    res.status(400).json({ error: "Bank name, account holder name, and account number are required" });
    return;
  }

  const [request] = await db.insert(withdrawalRequestsTable).values({
    userId,
    requestType: "agent",
    amount: amountNum.toFixed(2),
    bankName,
    accountName,
    accountNumber,
    status: "pending",
  }).returning();

  await db.update(agentsTable)
    .set({ commissionBalance: (currentBalance - amountNum).toFixed(2), updatedAt: new Date() })
    .where(eq(agentsTable.id, agent.id));

  res.status(201).json({ ...request, amount: parseFloat(request.amount) });
});

// ── Admin: list all withdrawal requests ───────────────────────────────────────
router.get("/admin/withdrawals", requireAdmin, async (_req, res): Promise<void> => {
  const requests = await db.select().from(withdrawalRequestsTable)
    .orderBy(desc(withdrawalRequestsTable.createdAt));
  const users = await db.select().from(usersTable);
  const userMap = new Map(users.map(u => [u.id, u]));
  res.json(requests.map(r => ({
    ...r,
    amount: parseFloat(r.amount),
    user: userMap.get(r.userId)
      ? { id: userMap.get(r.userId)!.id, fullName: userMap.get(r.userId)!.fullName, email: userMap.get(r.userId)!.email, phone: userMap.get(r.userId)!.phone }
      : null,
  })));
});

// ── Admin: update withdrawal request status ────────────────────────────────────
router.patch("/admin/withdrawals/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { status, adminNotes } = req.body;
  if (!status) { res.status(400).json({ error: "status required" }); return; }

  const [existing] = await db.select().from(withdrawalRequestsTable).where(eq(withdrawalRequestsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Withdrawal request not found" }); return; }

  if (status === "rejected" && existing.status === "pending") {
    if (existing.requestType === "agent") {
      const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.userId, existing.userId));
      if (agent) {
        const restored = (parseFloat(agent.commissionBalance) + parseFloat(existing.amount)).toFixed(2);
        await db.update(agentsTable).set({ commissionBalance: restored, updatedAt: new Date() }).where(eq(agentsTable.id, agent.id));
      }
    } else {
      const restored = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId));
      if (restored.length > 0) {
        const newBal = (parseFloat(restored[0]!.cashbackBalance) + parseFloat(existing.amount)).toFixed(2);
        await db.update(usersTable).set({ cashbackBalance: newBal, updatedAt: new Date() }).where(eq(usersTable.id, existing.userId));
      }
    }
  }

  const updateData: Partial<typeof withdrawalRequestsTable.$inferInsert> = { status: status as string, updatedAt: new Date() };
  if (adminNotes != null) updateData.adminNotes = adminNotes;
  if (status === "completed" || status === "approved") updateData.processedAt = new Date();

  const [updated] = await db.update(withdrawalRequestsTable).set(updateData).where(eq(withdrawalRequestsTable.id, id)).returning();
  res.json({ ...updated, amount: parseFloat(updated.amount) });
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
