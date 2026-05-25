import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { createHash } from "crypto";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { sendEmail, emailProfileUpdated } from "../lib/email";

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
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const { fullName, phone, email, bankName, bankAccountNumber, bankAccountName } = req.body as {
      fullName?: string; phone?: string; email?: string;
      bankName?: string | null; bankAccountNumber?: string | null; bankAccountName?: string | null;
    };

    // Fetch current user so we can detect what changed
    const [current] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
    if (!current) { res.status(404).json({ error: "User not found" }); return; }

    if (email && email !== current.email) {
      const [existing] = await db.select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, email));
      if (existing && existing.id !== req.userId) {
        res.status(400).json({ error: "This email is already taken" });
        return;
      }
    }

    if (phone && phone !== current.phone) {
      const [existing] = await db.select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.phone, phone));
      if (existing && existing.id !== req.userId) {
        res.status(400).json({ error: "This phone number is already taken" });
        return;
      }
    }

    const updateData: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };
    const changedFields: string[] = [];

    if (fullName !== undefined && fullName !== current.fullName) {
      updateData.fullName = fullName;
      changedFields.push("Full Name");
    }
    if (phone !== undefined && phone !== current.phone) {
      updateData.phone = phone;
      changedFields.push("Phone Number");
    }
    if (email !== undefined && email !== current.email) {
      updateData.email = email;
      changedFields.push("Email Address");
    }
    if (bankName !== undefined) {
      updateData.bankName = bankName || null;
      if ((bankName || null) !== current.bankName) changedFields.push("Bank Name");
    }
    if (bankAccountNumber !== undefined) {
      updateData.bankAccountNumber = bankAccountNumber || null;
      if ((bankAccountNumber || null) !== current.bankAccountNumber) changedFields.push("Bank Account Number");
    }
    if (bankAccountName !== undefined) {
      updateData.bankAccountName = bankAccountName || null;
      if ((bankAccountName || null) !== current.bankAccountName) changedFields.push("Bank Account Name");
    }

    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, req.userId)).returning();
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    // Send email notification if anything actually changed
    if (changedFields.length > 0) {
      const notifyEmail = email ?? current.email;
      sendEmail({
        to: notifyEmail,
        subject: "Your Kynaz Profile Has Been Updated",
        html: emailProfileUpdated({
          name: user.fullName,
          email: notifyEmail,
          changedFields,
        }),
      }).catch(() => {});
    }

    res.json(formatProfileUser(user));
  } catch (_err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/auth/change-password", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }

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
