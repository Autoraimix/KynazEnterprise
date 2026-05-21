import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, referralsTable, cashbackTransactionsTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/referrals/my-code", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const referrals = await db.select().from(referralsTable)
    .where(eq(referralsTable.referrerId, userId));

  const totalEarned = referrals.reduce((sum, r) => sum + parseFloat(r.cashbackEarned), 0);

  res.json({
    code: user.referralCode,
    totalReferrals: referrals.length,
    totalEarned,
  });
});

router.get("/referrals", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const referrals = await db.select().from(referralsTable)
    .where(eq(referralsTable.referrerId, userId));

  const result = await Promise.all(referrals.map(async (r) => {
    const [referredUser] = await db.select().from(usersTable).where(eq(usersTable.id, r.referredUserId));
    return {
      id: r.id,
      referredUserId: r.referredUserId,
      referredUserName: referredUser?.fullName ?? "Unknown",
      cashbackEarned: parseFloat(r.cashbackEarned),
      createdAt: r.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

export default router;
