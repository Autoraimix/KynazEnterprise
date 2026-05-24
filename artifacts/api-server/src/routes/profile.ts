import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { createHash } from "crypto";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

function hashPassword(password: string): string {
  const salt = process.env.PASSWORD_SALT ?? "kynaz_salt_2024";
  return createHash("sha256").update(password + salt).digest("hex");
}

function formatProfileUser(user: typeof usersTable.$inferSelect) {
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
    mustChangePassword: user.mustChangePassword,
    bankName: user.bankName ?? null,
    bankAccountNumber: user.bankAccountNumber ?? null,
    bankAccountName: user.bankAccountName ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.patch("/profile", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { fullName, phone, email, bankName, bankAccountNumber, bankAccountName } = req.body as {
      fullName?: string; phone?: string; email?: string;
      bankName?: string; bankAccountNumber?: string; bankAccountName?: string;
    };

    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    if (email) {
      const [existing] = await db.select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, email));
      if (existing && existing.id !== req.userId) {
        res.status(400).json({ error: "This email is already taken" });
        return;
      }
    }

    if (phone) {
      const [existing] = await db.select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.phone, phone));
      if (existing && existing.id !== req.userId) {
        res.status(400).json({ error: "This phone number is already taken" });
        return;
      }
    }

    const updateData: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (bankName !== undefined) updateData.bankName = bankName || null;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber || null;
    if (bankAccountName !== undefined) updateData.bankAccountName = bankAccountName || null;

    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, req.userId)).returning();
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    res.json(formatProfileUser(user));
  } catch (_err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/auth/change-password", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }

    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    if (!user.mustChangePassword) {
      if (!currentPassword) {
        res.status(400).json({ error: "Current password is required" });
        return;
      }
      if (user.passwordHash !== hashPassword(currentPassword)) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }
    }

    await db.update(usersTable)
      .set({ passwordHash: hashPassword(newPassword), mustChangePassword: false, updatedAt: new Date() })
      .where(eq(usersTable.id, req.userId));

    res.json({ message: "Password changed successfully" });
  } catch (_err) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
