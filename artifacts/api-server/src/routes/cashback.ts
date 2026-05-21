import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, cashbackTransactionsTable } from "@workspace/db";
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

export default router;
