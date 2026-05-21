import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterBody,
  LoginBody,
  ResetPasswordBody,
} from "@workspace/api-zod";
import { createHash, randomBytes } from "crypto";
import { sendEmail, emailWelcomeCustomer, emailAgentNewCustomer } from "../lib/email";

const router: IRouter = Router();

function hashPassword(password: string): string {
  const salt = "kynaz_salt_2024";
  return createHash("sha256").update(password + salt).digest("hex");
}

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

function generateToken(userId: number): string {
  return createHash("sha256")
    .update(`${userId}:${Date.now()}:kynaz_secret`)
    .digest("hex");
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

// Store tokens in memory (simple for now)
const tokenStore = new Map<string, number>(); // token -> userId

export function getTokenStore() {
  return tokenStore;
}

router.post("/auth/register", async (req, res): Promise<void> => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { fullName, email, phone, password, referralCode } = parsed.data;

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const newCode = generateReferralCode();
    const passwordHash = hashPassword(password);

    const [user] = await db.insert(usersTable).values({
      fullName,
      email,
      phone,
      passwordHash,
      referralCode: newCode,
      referredByCode: referralCode ?? null,
      role: "customer",
      cashbackBalance: "0.00",
      isVerified: false,
      isSuspended: false,
      updatedAt: new Date(),
    }).returning();

    const token = generateToken(user.id);
    tokenStore.set(token, user.id);

    // Send welcome email + notify agent if referred
    let agentName: string | undefined;
    if (referralCode) {
      const [referrer] = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode));
      if (referrer && referrer.role === "agent") {
        agentName = referrer.fullName;
        sendEmail({
          to: referrer.email,
          subject: "New Customer Registered via Your Referral",
          html: (await import("../lib/email")).emailAgentNewCustomer({
            agentName: referrer.fullName,
            customerName: fullName,
            customerEmail: email,
          }),
        }).catch(() => {});
      }
    }
    sendEmail({
      to: email,
      subject: "Welcome to Kynaz Enterprise!",
      html: (await import("../lib/email")).emailWelcomeCustomer({
        name: fullName,
        referralCode: newCode,
        agentName,
      }),
    }).catch(() => {});

    res.status(201).json({ user: formatUser(user), token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Registration error:", msg);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.status(400).json({ error: "Email already registered" });
    } else {
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { email, password } = parsed.data;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({ error: "Account suspended" });
      return;
    }

    const token = generateToken(user.id);
    tokenStore.set(token, user.id);

    res.json({ user: formatUser(user), token });
  } catch (err) {
    console.error("Login error:", err instanceof Error ? err.message : err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    tokenStore.delete(token);
  }
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const userId = tokenStore.get(token);
  if (!userId) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (user) {
    const tempPassword = randomBytes(4).toString("hex");
    const newHash = hashPassword(tempPassword);
    await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));
    sendEmail({
      to: email,
      subject: "Your Kynaz Password Reset",
      html: `<p>Hi ${user.fullName},</p><p>Your temporary password is: <strong>${tempPassword}</strong></p><p>Please log in and change your password immediately.</p>`,
    }).catch(() => {});
  }
  res.json({ message: "If that email is registered, a reset link has been sent." });
});

export default router;
