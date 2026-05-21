import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, quotationsTable, servicesTable, notificationsTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const allQuotations = await db.select().from(quotationsTable)
    .where(eq(quotationsTable.userId, userId));

  const services = await db.select().from(servicesTable);
  const serviceMap = new Map(services.map(s => [s.id, s.name]));

  const pendingQuotations = allQuotations.filter(q => ["pending", "processing"].includes(q.status)).length;
  const activePolicies = allQuotations.filter(q => q.status === "approved").length;

  const recentQuotations = allQuotations
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map(q => ({
      id: q.id,
      userId: q.userId,
      serviceId: q.serviceId,
      serviceName: serviceMap.get(q.serviceId) ?? "Unknown",
      status: q.status,
      formData: q.formData as Record<string, unknown>,
      remarks: q.remarks ?? null,
      documentUrl: q.documentUrl ?? null,
      expiresAt: q.expiresAt ? q.expiresAt.toISOString() : null,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
      customerName: null,
      customerEmail: null,
    }));

  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId));
  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  res.json({
    cashbackBalance: parseFloat(user.cashbackBalance),
    activePolicies,
    pendingQuotations,
    totalQuotations: allQuotations.length,
    recentQuotations,
    upcomingRenewals: [],
    unreadNotifications,
  });
});

router.get("/dashboard/notifications", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(notificationsTable.createdAt);

  res.json(notifications.map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  })).reverse());
});

router.post("/dashboard/notifications/:id/read", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.userId!)));

  res.json({ message: "Marked as read" });
});

export default router;
