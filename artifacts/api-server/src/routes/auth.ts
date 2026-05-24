import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterBody,
  LoginBody,
  ResetPasswordBody,
} from "@workspace/api-zod";
import { createHash, randomBytes } from "crypto";
import { sendEmail, STAFF_EMAIL, emailWelcomeCustomer, emailStaffNewUser } from "../lib/email";

const router: IRouter = Router();

function hashPassword(password: string): string {
  const salt = process.env.PASSWORD_SALT ?? "kynaz_salt_2024";
  return createHash("sha256").update(password + salt).digest("hex");
}

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

function generateToken(userId: number): string {
  const secret = process.env.SESSION_SECRET ?? "kynaz_secret";
  return createHash("sha256")
    .update(`${userId}:${Date.now()}:${secret}`)
    .digest("hex");
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

const tokenStore = new Map<string, number>(); // token -> userId
const otpStore = new Map<string, { userId: number; code: string; expiresAt: number; attempts: number }>();

export function getTokenStore() {
  return tokenStore;
}

// Clean expired OTPs every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (val.expiresAt < now) otpStore.delete(key);
  }
}, 10 * 60 * 1000);

router.post("/auth/register", async (req, res): Promise<void> => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { fullName, email, phone, password, referralCode } = parsed.data;

    // Check email AND phone uniqueness together in one query
    const existing = await db
      .select({ id: usersTable.id, email: usersTable.email, phone: usersTable.phone })
      .from(usersTable)
      .where(or(eq(usersTable.email, email), eq(usersTable.phone, phone)));

    if (existing.length > 0) {
      const emailTaken = existing.some(u => u.email === email);
      const phoneTaken = existing.some(u => u.phone === phone);
      if (emailTaken && phoneTaken) {
        res.status(400).json({ error: "Email and phone number are already registered" });
      } else if (emailTaken) {
        res.status(400).json({ error: "This email address is already registered" });
      } else {
        res.status(400).json({ error: "This phone number is already registered" });
      }
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
      referredByCode: referralCode ? referralCode.toUpperCase().trim() : null,
      role: "customer",
      cashbackBalance: "0.00",
      isVerified: false,
      isSuspended: false,
      updatedAt: new Date(),
    }).returning();

    const token = generateToken(user.id);
    tokenStore.set(token, user.id);

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

    sendEmail({
      to: STAFF_EMAIL,
      subject: `[New Registration] ${fullName} — ${email}`,
      html: emailStaffNewUser({
        name: fullName,
        email,
        phone,
        role: "customer",
        referredBy: referralCode ? referralCode.toUpperCase().trim() : undefined,
      }),
    }).catch(() => {});

    res.status(201).json({ user: formatUser(user), token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      if (msg.toLowerCase().includes("phone")) {
        res.status(400).json({ error: "This phone number is already registered" });
      } else {
        res.status(400).json({ error: "This email address is already registered" });
      }
    } else {
      req.log?.error({ err }, "Registration failed");
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  }
});

// Step 1 of login — validates credentials and sends OTP
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

    // Generate OTP
    const otp = generateOtp();
    const pendingToken = randomBytes(32).toString("hex");
    otpStore.set(pendingToken, {
      userId: user.id,
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
    });

    sendEmail({
      to: user.email,
      subject: "Your Kynaz OTP Code",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f9f9;border-radius:12px;">
          <h2 style="color:#0d1f3c;margin-bottom:4px;">Kynaz Enterprise</h2>
          <p style="color:#555;font-size:14px;margin-bottom:24px;">One-Time Password</p>
          <p style="color:#333;">Hi <strong>${user.fullName}</strong>,</p>
          <p style="color:#333;">Your login OTP code is:</p>
          <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#0d1f3c;text-align:center;padding:20px;background:#fff;border-radius:8px;border:2px solid #e5e7eb;margin:20px 0;">
            ${otp}
          </div>
          <p style="color:#888;font-size:13px;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
          <p style="color:#888;font-size:12px;margin-top:24px;">If you did not attempt to log in, please ignore this email.</p>
        </div>
      `,
    }).catch(() => {});

    res.json({ requiresOtp: true, pendingToken });
  } catch (err) {
    req.log?.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// Step 2 of login — validates OTP
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  try {
    const { pendingToken, otp } = req.body as { pendingToken?: string; otp?: string };

    if (!pendingToken || !otp) {
      res.status(400).json({ error: "Missing OTP or session token" });
      return;
    }

    const entry = otpStore.get(pendingToken);
    if (!entry) {
      res.status(401).json({ error: "Session expired. Please log in again." });
      return;
    }

    if (entry.expiresAt < Date.now()) {
      otpStore.delete(pendingToken);
      res.status(401).json({ error: "OTP has expired. Please log in again." });
      return;
    }

    entry.attempts += 1;
    if (entry.attempts > 5) {
      otpStore.delete(pendingToken);
      res.status(429).json({ error: "Too many attempts. Please log in again." });
      return;
    }

    if (entry.code !== otp.trim()) {
      res.status(401).json({ error: `Invalid OTP. ${5 - entry.attempts} attempt(s) remaining.` });
      return;
    }

    otpStore.delete(pendingToken);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, entry.userId));
    if (!user || user.isSuspended) {
      res.status(401).json({ error: "Account not found or suspended" });
      return;
    }

    const token = generateToken(user.id);
    tokenStore.set(token, user.id);

    res.json({ user: formatUser(user), token });
  } catch (err) {
    req.log?.error({ err }, "OTP verify error");
    res.status(500).json({ error: "Verification failed. Please try again." });
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
