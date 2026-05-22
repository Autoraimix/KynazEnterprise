import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, cashbackTransactionsTable, withdrawalRequestsTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/cashback/wallet", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const transactions = await db.select().from(cashbackTransactionsTable)
    .where(eq(cashbackTransactionsTable.userId, userId));

  const totalEarned = transactions
    .filter(t => ["earned", "referral", "promotion"].includes(t.type))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalRedeemed = transactions
    .filter(t => t.type === "redeemed")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const pendingAmount = 0; // Could be based on pending quotations

  res.json({
    balance: parseFloat(user.cashbackBalance),
    totalEarned,
    totalRedeemed,
    pendingAmount,
  });
});

router.get("/cashback/transactions", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;

  const transactions = await db.select().from(cashbackTransactionsTable)
    .where(eq(cashbackTransactionsTable.userId, userId))
    .orderBy(cashbackTransactionsTable.createdAt);

  res.json(transactions.map(t => ({
    id: t.id,
    userId: t.userId,
    type: t.type,
    amount: parseFloat(t.amount),
    description: t.description,
    referenceId: t.referenceId ?? null,
    createdAt: t.createdAt.toISOString(),
    userName: null,
  })));
});

router.get("/cashback/withdrawals", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const requests = await db.select().from(withdrawalRequestsTable)
    .where(eq(withdrawalRequestsTable.userId, userId))
    .orderBy(desc(withdrawalRequestsTable.createdAt));
  res.json(requests.map(r => ({ ...r, amount: parseFloat(r.amount) })));
});

router.post("/cashback/withdraw", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const { amount, bankName, accountName, accountNumber } = req.body;
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum < 50) {
    res.status(400).json({ error: "Minimum withdrawal amount is RM50" });
    return;
  }

  const currentBalance = parseFloat(user.cashbackBalance);
  if (amountNum > currentBalance) {
    res.status(400).json({ error: "Insufficient cashback balance" });
    return;
  }

  if (!bankName || !accountName || !accountNumber) {
    res.status(400).json({ error: "Bank name, account holder name, and account number are required" });
    return;
  }

  const [request] = await db.insert(withdrawalRequestsTable).values({
    userId,
    requestType: "customer",
    amount: amountNum.toFixed(2),
    bankName,
    accountName,
    accountNumber,
    status: "pending",
  }).returning();

  await db.update(usersTable)
    .set({ cashbackBalance: (currentBalance - amountNum).toFixed(2), updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  res.status(201).json({ ...request, amount: parseFloat(request.amount) });
});

export default router;
