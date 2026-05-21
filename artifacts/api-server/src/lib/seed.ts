import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  db,
  usersTable,
  servicesTable,
  testimonialsTable,
  quotationsTable,
  notificationsTable,
  cashbackTransactionsTable,
  referralsTable,
  settingsTable,
} from "@workspace/db";

const seedDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../attached_assets"
);

/**
 * Finds the most recently added JSON file whose name starts with `prefix`.
 * Files are named like `users_1778921823085.json` — we sort by the numeric
 * timestamp suffix descending and return the latest.
 */
async function findLatestFile(prefix: string): Promise<string | null> {
  try {
    const entries = await readdir(seedDir);
    const matches = entries
      .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
      .sort()
      .reverse();
    return matches.length > 0 ? path.join(seedDir, matches[0]) : null;
  } catch {
    return null;
  }
}

async function loadLatest<T>(prefix: string): Promise<T | null> {
  const file = await findLatestFile(prefix);
  if (!file) return null;
  return JSON.parse(await readFile(file, "utf8")) as T;
}

type Row = Record<string, unknown>;

export async function seedDatabase(): Promise<void> {
  const [
    users,
    services,
    testimonials,
    settings,
    quotations,
    notifications,
    cashbackTransactions,
  ] = await Promise.all([
    loadLatest<Row[]>("users_"),
    loadLatest<Row[]>("services_"),
    loadLatest<Row[]>("testimonials_"),
    loadLatest<Row[]>("settings_"),
    loadLatest<Row[]>("quotations_"),
    loadLatest<Row[]>("notifications_"),
    loadLatest<Row[]>("cashback_transactions_"),
  ]);

  // ── Users ──────────────────────────────────────────────────────────────────
  for (const user of users ?? []) {
    await db
      .insert(usersTable)
      .values({
        id: Number(user.id),
        fullName: String(user.full_name),
        email: String(user.email),
        phone: String(user.phone),
        passwordHash: String(user.password_hash),
        role: String(user.role) as "guest" | "customer" | "admin" | "superadmin",
        referralCode: String(user.referral_code),
        referredByCode: user.referred_by_code ? String(user.referred_by_code) : null,
        cashbackBalance: String(user.cashback_balance),
        isVerified: Boolean(user.is_verified),
        isSuspended: Boolean(user.is_suspended),
        createdAt: new Date(String(user.created_at)),
        updatedAt: new Date(String(user.updated_at)),
      })
      .onConflictDoNothing();
  }

  // ── Services ───────────────────────────────────────────────────────────────
  for (const service of services ?? []) {
    await db
      .insert(servicesTable)
      .values({
        id: Number(service.id),
        name: String(service.name),
        slug: String(service.slug),
        category: String(service.category),
        description: String(service.description),
        benefits: service.benefits as string[],
        requiredDocuments: service.required_documents as string[],
        icon: String(service.icon),
        isActive: Boolean(service.is_active),
        createdAt: new Date(String(service.created_at)),
      })
      .onConflictDoNothing();
  }

  // ── Testimonials ───────────────────────────────────────────────────────────
  for (const t of testimonials ?? []) {
    await db
      .insert(testimonialsTable)
      .values({
        id: Number(t.id),
        customerName: String(t.customer_name),
        role: String(t.role),
        content: String(t.content),
        rating: Number(t.rating),
        isActive: Boolean(t.is_active),
        createdAt: new Date(String(t.created_at)),
      })
      .onConflictDoNothing();
  }

  // ── Settings ───────────────────────────────────────────────────────────────
  for (const setting of settings ?? []) {
    await db
      .insert(settingsTable)
      .values({
        id: Number(setting.id),
        key: String(setting.key),
        value: String(setting.value),
        updatedAt: new Date(String(setting.updated_at)),
      })
      .onConflictDoNothing();
  }

  // ── Quotations ─────────────────────────────────────────────────────────────
  for (const q of quotations ?? []) {
    await db
      .insert(quotationsTable)
      .values({
        id: Number(q.id),
        userId: q.user_id ? Number(q.user_id) : null,
        serviceId: Number(q.service_id),
        status: String(q.status) as
          | "pending"
          | "processing"
          | "ready"
          | "approved"
          | "rejected"
          | "expired"
          | "paid",
        formData: q.form_data as Record<string, unknown>,
        remarks: q.remarks ? String(q.remarks) : null,
        documentUrl: q.document_url ? String(q.document_url) : null,
        quotationRef: q.quotation_ref ? String(q.quotation_ref) : null,
        price: q.price ? String(q.price) : null,
        taxAmount: q.tax_amount ? String(q.tax_amount) : null,
        paymentProofUrl: q.payment_proof_url ? String(q.payment_proof_url) : null,
        isGuest: Boolean(q.is_guest),
        expiresAt: q.expires_at ? new Date(String(q.expires_at)) : null,
        createdAt: new Date(String(q.created_at)),
        updatedAt: new Date(String(q.updated_at)),
      })
      .onConflictDoNothing();
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  for (const n of notifications ?? []) {
    await db
      .insert(notificationsTable)
      .values({
        id: Number(n.id),
        userId: Number(n.user_id),
        title: String(n.title),
        message: String(n.message),
        type: String(n.type) as
          | "quotation"
          | "cashback"
          | "renewal"
          | "announcement"
          | "system",
        isRead: Boolean(n.is_read),
        createdAt: new Date(String(n.created_at)),
      })
      .onConflictDoNothing();
  }

  // ── Cashback transactions ──────────────────────────────────────────────────
  for (const tx of cashbackTransactions ?? []) {
    await db
      .insert(cashbackTransactionsTable)
      .values({
        id: Number(tx.id),
        userId: Number(tx.user_id),
        type: String(tx.type) as
          | "earned"
          | "redeemed"
          | "adjusted"
          | "referral"
          | "promotion",
        amount: String(tx.amount),
        description: String(tx.description),
        referenceId: tx.reference_id ? Number(tx.reference_id) : null,
        createdAt: new Date(String(tx.created_at ?? new Date().toISOString())),
      })
      .onConflictDoNothing();
  }

  // ── Referrals (derived from users who have a referred_by_code) ────────────
  const allUsers = users ?? [];
  const referredUsers = allUsers.filter((u) => u.referred_by_code);
  for (const user of referredUsers) {
    const referrer = allUsers.find(
      (u) => u.referral_code === user.referred_by_code
    );
    if (!referrer) continue;
    await db
      .insert(referralsTable)
      .values({
        referrerId: Number(referrer.id),
        referredUserId: Number(user.id),
        cashbackEarned: "0",
      })
      .onConflictDoNothing();
  }
}
