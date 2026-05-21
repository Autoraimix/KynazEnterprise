import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, quotationsTable, servicesTable, usersTable, notificationsTable } from "@workspace/db";
import { CreateQuotationBody } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

function generateRef(id: number): string {
  const year = new Date().getFullYear();
  return `KYN-${year}-${String(id).padStart(5, "0")}`;
}

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
    taxAmount: q.taxAmount != null ? parseFloat(q.taxAmount) : null,
    paymentProofUrl: q.paymentProofUrl ?? null,
    isGuest: q.isGuest,
    expiresAt: q.expiresAt ? q.expiresAt.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    customerName: customerName ?? null,
    customerEmail: customerEmail ?? null,
  };
}

router.get("/quotations", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const quotations = await db.select().from(quotationsTable)
    .where(eq(quotationsTable.userId, userId))
    .orderBy(quotationsTable.createdAt);

  const services = await db.select().from(servicesTable);
  const serviceMap = new Map(services.map(s => [s.id, s.name]));

  res.json(quotations.map(q => formatQuotation(q, serviceMap.get(q.serviceId) ?? "Unknown")));
});

router.post("/quotations", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CreateQuotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.userId!;
  const { serviceId, formData } = parsed.data;

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId));
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  const [quotation] = await db.insert(quotationsTable).values({
    userId,
    serviceId,
    formData: formData as Record<string, unknown>,
    status: "pending",
    isGuest: false,
  }).returning();

  // Generate and save quotation ref
  const ref = generateRef(quotation.id);
  const [updated] = await db.update(quotationsTable)
    .set({ quotationRef: ref })
    .where(eq(quotationsTable.id, quotation.id))
    .returning();

  // Create notification — wrapped in try-catch so it never crashes the request
  try {
    await db.insert(notificationsTable).values({
      userId,
      title: "Quotation Submitted",
      message: `Your quotation request ${ref} for ${service.name} has been received and is being processed.`,
      type: "quotation",
      isRead: false,
    });
  } catch (_e) { /* non-fatal */ }

  res.status(201).json(formatQuotation(updated, service.name));
});

// Guest quotation (no auth required)
router.post("/quotations/guest", async (req, res): Promise<void> => {
  const { serviceId, fullName, phone, email, notes, formData: bodyFormData } = req.body;

  if (!serviceId || !fullName || !phone || !email) {
    res.status(400).json({ error: "serviceId, fullName, phone and email are required" });
    return;
  }

  const parsedServiceId = parseInt(serviceId, 10);
  if (isNaN(parsedServiceId)) {
    res.status(400).json({ error: "Invalid serviceId" });
    return;
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, parsedServiceId));
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  // Use full formData from client if provided (service-specific fields), else fall back to basics
  const storedFormData: Record<string, unknown> =
    bodyFormData && typeof bodyFormData === "object"
      ? { ...bodyFormData as Record<string, unknown> }
      : { fullName, phone, email, notes: notes ?? "" };

  // Always ensure contact fields are present
  storedFormData.fullName = fullName;
  storedFormData.phone = phone;
  storedFormData.email = email;

  const [quotation] = await db.insert(quotationsTable).values({
    userId: null,
    serviceId: parsedServiceId,
    formData: storedFormData,
    status: "pending",
    isGuest: true,
  }).returning();

  const ref = generateRef(quotation.id);
  const [updated] = await db.update(quotationsTable)
    .set({ quotationRef: ref })
    .where(eq(quotationsTable.id, quotation.id))
    .returning();

  res.status(201).json(formatQuotation(updated, service.name));
});

router.get("/quotations/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const userId = req.userId!;
  const [quotation] = await db.select().from(quotationsTable)
    .where(and(eq(quotationsTable.id, id), eq(quotationsTable.userId, userId)));

  if (!quotation) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, quotation.serviceId));
  res.json(formatQuotation(quotation, service?.name ?? "Unknown"));
});

router.post("/quotations/:id/accept", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const userId = req.userId!;
  const [quotation] = await db.select().from(quotationsTable)
    .where(and(eq(quotationsTable.id, id), eq(quotationsTable.userId, userId)));

  if (!quotation) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  if (quotation.status !== "ready") {
    res.status(400).json({ error: "Only quotations with status 'ready' can be accepted" });
    return;
  }

  const [updated] = await db.update(quotationsTable)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(quotationsTable.id, id))
    .returning();

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, quotation.serviceId));
  res.json(formatQuotation(updated, service?.name ?? "Unknown"));
});

// Submit payment proof
router.post("/quotations/:id/payment-proof", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { paymentProofUrl } = req.body;
  if (!paymentProofUrl || typeof paymentProofUrl !== "string") {
    res.status(400).json({ error: "paymentProofUrl is required" });
    return;
  }

  const userId = req.userId!;
  const [quotation] = await db.select().from(quotationsTable)
    .where(and(eq(quotationsTable.id, id), eq(quotationsTable.userId, userId)));

  if (!quotation) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  if (quotation.status !== "approved") {
    res.status(400).json({ error: "Quotation must be in approved status to submit payment" });
    return;
  }

  const [updated] = await db.update(quotationsTable)
    .set({ paymentProofUrl, updatedAt: new Date() })
    .where(eq(quotationsTable.id, id))
    .returning();

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, quotation.serviceId));

  // Notify user — non-fatal
  try {
    await db.insert(notificationsTable).values({
      userId,
      title: "Payment Proof Submitted",
      message: `Your payment proof for ${updated.quotationRef ?? `quotation #${id}`} has been submitted. Our team will verify it shortly.`,
      type: "quotation",
      isRead: false,
    });
  } catch (_e) { /* non-fatal */ }

  res.json(formatQuotation(updated, service?.name ?? "Unknown"));
});

// Cashback withdrawal request
router.post("/cashback/withdraw", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const { amount } = req.body;

  const amountNum = parseFloat(amount);
  if (!amount || isNaN(amountNum) || amountNum < 50) {
    res.status(400).json({ error: "Minimum withdrawal amount is RM 50.00" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const balance = parseFloat(user.cashbackBalance);
  if (amountNum > balance) {
    res.status(400).json({ error: "Insufficient cashback balance" });
    return;
  }

  const newBalance = parseFloat((balance - amountNum).toFixed(2));

  try {
    const { cashbackTransactionsTable } = await import("@workspace/db");

    await db.insert(cashbackTransactionsTable).values({
      userId,
      type: "redeemed",
      amount: amountNum.toFixed(2),
      description: `Withdrawal Request — RM ${amountNum.toFixed(2)} (pending bank transfer processing)`,
      referenceId: null,
    });

    await db.update(usersTable)
      .set({ cashbackBalance: newBalance.toFixed(2) })
      .where(eq(usersTable.id, userId));

    // Notify user
    await db.insert(notificationsTable).values({
      userId,
      title: "Withdrawal Request Submitted",
      message: `Your cashback withdrawal request of RM ${amountNum.toFixed(2)} has been submitted. Our team will process your bank transfer within 3–5 business days.`,
      type: "cashback",
      isRead: false,
    }).catch(() => {});

    res.json({ message: "Withdrawal request submitted successfully", newBalance });
  } catch (err) {
    console.error("Withdrawal error:", err instanceof Error ? err.message : err);
    res.status(500).json({ error: "Failed to process withdrawal request. Please try again." });
  }
});

export default router;
