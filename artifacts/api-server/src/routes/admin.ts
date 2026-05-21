import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db, usersTable, quotationsTable, servicesTable,
  cashbackTransactionsTable, settingsTable, testimonialsTable, notificationsTable
} from "@workspace/db";
import {
  UpdateAdminUserBody,
  SuspendUserBody,
  UpdateAdminQuotationBody,
  AddCashbackBody,
  SetQuotationSpeedBody,
} from "@workspace/api-zod";
import { requireAdmin, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

function formatQuotation(
  q: typeof quotationsTable.$inferSelect,
  serviceName: string,
  customerName?: string,
  customerEmail?: string,
) {
  return {
    id: q.id,
    userId: q.userId ?? null,
    serviceId: q.serviceId,
    serviceName,
    status: q.status,
    formData: q.formData as Record<string, unknown>,
    remarks: q.remarks ?? null,
    documentUrl: q.documentUrl ?? null,
    quotationRef: q.quotationRef ?? null,
    price: q.price ? parseFloat(q.price) : null,
    taxAmount: q.taxAmount ? parseFloat(q.taxAmount) : null,
    paymentProofUrl: q.paymentProofUrl ?? null,
    isGuest: q.isGuest,
    expiresAt: q.expiresAt ? q.expiresAt.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    customerName: customerName ?? null,
    customerEmail: customerEmail ?? null,
  };
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
  };
}

async function getCashbackRate(): Promise<number> {
  const [setting] = await db.select().from(settingsTable)
    .where(eq(settingsTable.key, "cashback_rate"));
  return setting ? parseFloat(setting.value) : 5.0;
}

// Admin stats
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  const quotations = await db.select().from(quotationsTable);
  const services = await db.select().from(servicesTable);
  const cashbackTx = await db.select().from(cashbackTransactionsTable);

  const serviceMap = new Map(services.map(s => [s.id, s.name]));
  const userMap = new Map(users.map(u => [u.id, u]));

  const totalCashbackIssued = cashbackTx
    .filter(t => ["earned", "referral", "promotion"].includes(t.type))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const quotationsByStatus: Record<string, number> = {};
  quotations.forEach(q => {
    quotationsByStatus[q.status] = (quotationsByStatus[q.status] ?? 0) + 1;
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newUsersThisMonth = users.filter(u => u.createdAt >= monthStart).length;

  const recentQuotations = quotations
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map(q => {
      const customer = q.userId ? userMap.get(q.userId) : undefined;
      return formatQuotation(q, serviceMap.get(q.serviceId) ?? "Unknown", customer?.fullName, customer?.email);
    });

  res.json({
    totalUsers: users.length,
    totalQuotations: quotations.length,
    pendingQuotations: quotations.filter(q => q.status === "pending").length,
    totalCashbackIssued,
    activeServices: services.filter(s => s.isActive).length,
    quotationsByStatus,
    recentQuotations,
    newUsersThisMonth,
  });
});

// User management
router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(formatUser));
});

router.get("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.patch("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateAdminUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.fullName) updateData.fullName = parsed.data.fullName;
  if (parsed.data.phone) updateData.phone = parsed.data.phone;
  if (parsed.data.role) updateData.role = parsed.data.role as typeof usersTable.$inferInsert["role"];

  const [user] = await db.update(usersTable).set(updateData)
    .where(eq(usersTable.id, id)).returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.post("/admin/users/:id/suspend", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = SuspendUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.update(usersTable).set({ isSuspended: parsed.data.suspended })
    .where(eq(usersTable.id, id));

  res.json({ message: parsed.data.suspended ? "User suspended" : "User unsuspended" });
});

// Quotation management
router.get("/admin/quotations", requireAdmin, async (_req, res): Promise<void> => {
  const quotations = await db.select().from(quotationsTable).orderBy(desc(quotationsTable.createdAt));
  const services = await db.select().from(servicesTable);
  const users = await db.select().from(usersTable);
  const serviceMap = new Map(services.map(s => [s.id, s.name]));
  const userMap = new Map(users.map(u => [u.id, u]));

  res.json(quotations.map(q => {
    const customer = q.userId ? userMap.get(q.userId) : undefined;
    return formatQuotation(q, serviceMap.get(q.serviceId) ?? "Unknown", customer?.fullName, customer?.email);
  }));
});

router.patch("/admin/quotations/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateAdminQuotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Fetch current quotation first
  const [currentQuotation] = await db.select().from(quotationsTable).where(eq(quotationsTable.id, id));
  if (!currentQuotation) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  const updateData: Partial<typeof quotationsTable.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.status) updateData.status = parsed.data.status as typeof quotationsTable.$inferInsert["status"];
  if (parsed.data.remarks != null) updateData.remarks = parsed.data.remarks;
  if (parsed.data.documentUrl != null) updateData.documentUrl = parsed.data.documentUrl;
  if (parsed.data.expiresAt) updateData.expiresAt = new Date(parsed.data.expiresAt);
  if (parsed.data.price != null) updateData.price = parsed.data.price.toFixed(2);
  if (parsed.data.taxAmount != null) updateData.taxAmount = parsed.data.taxAmount.toFixed(2);
  if (parsed.data.paymentProofUrl != null) updateData.paymentProofUrl = parsed.data.paymentProofUrl;

  const [updated] = await db.update(quotationsTable).set(updateData)
    .where(eq(quotationsTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  // Notify user if status changed to ready
  if (parsed.data.status === "ready" && currentQuotation.status !== "ready" && updated.userId) {
    try {
      await db.insert(notificationsTable).values({
        userId: updated.userId,
        title: "Quotation Ready",
        message: `Your quotation ${updated.quotationRef ?? `#${updated.id}`} is ready for review. Please log in to view and accept it.`,
        type: "quotation",
        isRead: false,
      });
    } catch (_e) { /* non-fatal */ }
  }

  // Handle payment verification — when admin sets status to "paid"
  if (parsed.data.status === "paid" && currentQuotation.status !== "paid" && updated.userId) {
    const priceVal = updated.price ? parseFloat(updated.price) : null;

    if (priceVal && priceVal > 0) {
      try {
        const rate = await getCashbackRate();
        const cashbackAmount = parseFloat((priceVal * rate / 100).toFixed(2));

        if (cashbackAmount > 0) {
          const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
          if (user) {
            const currentBalance = parseFloat(user.cashbackBalance);
            const newBalance = currentBalance + cashbackAmount;

            await db.insert(cashbackTransactionsTable).values({
              userId: updated.userId,
              type: "earned",
              amount: cashbackAmount.toFixed(2),
              description: `Cashback for ${updated.quotationRef ?? `quotation #${updated.id}`} (${rate}% of RM${priceVal.toFixed(2)})`,
              referenceId: updated.id,
            });

            await db.update(usersTable)
              .set({ cashbackBalance: newBalance.toFixed(2) })
              .where(eq(usersTable.id, updated.userId));

            await db.insert(notificationsTable).values({
              userId: updated.userId,
              title: "Payment Verified & Cashback Credited",
              message: `Your payment for ${updated.quotationRef ?? `quotation #${updated.id}`} has been verified. RM${cashbackAmount.toFixed(2)} cashback has been credited to your wallet.`,
              type: "cashback",
              isRead: false,
            });
          }
        }
      } catch (_e) { /* non-fatal */ }
    } else {
      try {
        await db.insert(notificationsTable).values({
          userId: updated.userId,
          title: "Payment Verified",
          message: `Your payment for ${updated.quotationRef ?? `quotation #${updated.id}`} has been verified and confirmed.`,
          type: "quotation",
          isRead: false,
        });
      } catch (_e) { /* non-fatal */ }
    }
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, updated.serviceId));
  const customer = updated.userId
    ? (await db.select().from(usersTable).where(eq(usersTable.id, updated.userId)))[0]
    : undefined;
  res.json(formatQuotation(updated, service?.name ?? "Unknown", customer?.fullName, customer?.email));
});

// Cashback management
router.get("/admin/cashback", requireAdmin, async (_req, res): Promise<void> => {
  const transactions = await db.select().from(cashbackTransactionsTable)
    .orderBy(desc(cashbackTransactionsTable.createdAt));
  const users = await db.select().from(usersTable);
  const userMap = new Map(users.map(u => [u.id, u]));

  res.json(transactions.map(t => ({
    id: t.id,
    userId: t.userId,
    type: t.type,
    amount: parseFloat(t.amount),
    description: t.description,
    referenceId: t.referenceId ?? null,
    createdAt: t.createdAt.toISOString(),
    userName: userMap.get(t.userId)?.fullName ?? null,
  })));
});

router.post("/admin/cashback", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AddCashbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, type, amount, description } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [tx] = await db.insert(cashbackTransactionsTable).values({
    userId,
    type: type as typeof cashbackTransactionsTable.$inferInsert["type"],
    amount: amount.toString(),
    description,
  }).returning();

  const currentBalance = parseFloat(user.cashbackBalance);
  const newBalance = type === "redeemed"
    ? Math.max(0, currentBalance - amount)
    : currentBalance + amount;

  await db.update(usersTable)
    .set({ cashbackBalance: newBalance.toFixed(2) })
    .where(eq(usersTable.id, userId));

  res.status(201).json({
    id: tx.id,
    userId: tx.userId,
    type: tx.type,
    amount: parseFloat(tx.amount),
    description: tx.description,
    referenceId: tx.referenceId ?? null,
    createdAt: tx.createdAt.toISOString(),
    userName: user.fullName,
  });
});

// Settings — GET is public so users and guests can read the processing time
router.get("/admin/settings/quotation-speed", async (_req, res): Promise<void> => {
  const [setting] = await db.select().from(settingsTable)
    .where(eq(settingsTable.key, "quotation_fast_mode"));

  const fastMode = setting?.value === "true";
  res.json({
    fastMode,
    message: fastMode
      ? "Quotation will be generated within 10–15 minutes."
      : "Quotation will be provided within 24 hours.",
  });
});

router.post("/admin/settings/quotation-speed", requireAdmin, async (req, res): Promise<void> => {
  const parsed = SetQuotationSpeedBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fastMode } = parsed.data;
  const existing = await db.select().from(settingsTable)
    .where(eq(settingsTable.key, "quotation_fast_mode"));

  if (existing.length > 0) {
    await db.update(settingsTable)
      .set({ value: fastMode.toString(), updatedAt: new Date() })
      .where(eq(settingsTable.key, "quotation_fast_mode"));
  } else {
    await db.insert(settingsTable).values({
      key: "quotation_fast_mode",
      value: fastMode.toString(),
    });
  }

  res.json({
    fastMode,
    message: fastMode
      ? "Quotation will be generated within 10–15 minutes."
      : "Quotation will be provided within 24 hours.",
  });
});

// Cashback rate setting
router.get("/admin/settings/cashback-rate", requireAdmin, async (_req, res): Promise<void> => {
  const rate = await getCashbackRate();
  res.json({ rate });
});

router.post("/admin/settings/cashback-rate", requireAdmin, async (req, res): Promise<void> => {
  const { rate } = req.body;
  const parsed = parseFloat(rate);
  if (isNaN(parsed) || parsed < 0 || parsed > 100) {
    res.status(400).json({ error: "Rate must be a number between 0 and 100" });
    return;
  }

  const existing = await db.select().from(settingsTable)
    .where(eq(settingsTable.key, "cashback_rate"));

  if (existing.length > 0) {
    await db.update(settingsTable)
      .set({ value: parsed.toFixed(2), updatedAt: new Date() })
      .where(eq(settingsTable.key, "cashback_rate"));
  } else {
    await db.insert(settingsTable).values({
      key: "cashback_rate",
      value: parsed.toFixed(2),
    });
  }

  res.json({ rate: parsed });
});

// Testimonials
router.get("/admin/testimonials", requireAdmin, async (_req, res): Promise<void> => {
  const testimonials = await db.select().from(testimonialsTable)
    .orderBy(desc(testimonialsTable.createdAt));
  res.json(testimonials.map(t => ({
    id: t.id,
    customerName: t.customerName,
    role: t.role,
    content: t.content,
    rating: t.rating,
    isActive: t.isActive,
  })));
});

export default router;
