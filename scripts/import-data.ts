import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { db, pool, usersTable, servicesTable, testimonialsTable, settingsTable, quotationsTable, notificationsTable, cashbackTransactionsTable } from "../lib/db/src/index.ts";
import { sql } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, "../attached_assets");

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "kynaz_salt_2024").digest("hex");
}

async function load<T>(filename: string): Promise<T> {
  return JSON.parse(await readFile(path.join(ASSETS, filename), "utf8")) as T;
}

type Row = Record<string, unknown>;

async function run() {
  console.log("=== Kynaz Data Import ===\n");

  const [users, services, testimonials, settings, quotations, notifications, cashback] = await Promise.all([
    load<Row[]>("users_1779371028066.json"),
    load<Row[]>("services_1779371028065.json"),
    load<Row[]>("testimonials_1779371028065.json"),
    load<Row[]>("settings_1779371028066.json"),
    load<Row[]>("quotations_1779371028064.json"),
    load<Row[]>("notifications_1779371028064.json"),
    load<Row[]>("cashback_transactions_1779371028064.json"),
  ]);

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log(`Importing ${users.length} users...`);
  for (const u of users) {
    await db.insert(usersTable).values({
      id: Number(u.id),
      fullName: String(u.full_name),
      email: String(u.email),
      phone: String(u.phone),
      passwordHash: String(u.password_hash),
      role: String(u.role) as "guest" | "customer" | "agent" | "admin" | "superadmin",
      referralCode: String(u.referral_code),
      referredByCode: u.referred_by_code ? String(u.referred_by_code) : null,
      cashbackBalance: String(u.cashback_balance),
      isVerified: Boolean(u.is_verified),
      isSuspended: Boolean(u.is_suspended),
      createdAt: new Date(String(u.created_at)),
      updatedAt: new Date(String(u.updated_at)),
    }).onConflictDoUpdate({
      target: usersTable.id,
      set: {
        fullName: String(u.full_name),
        email: String(u.email),
        phone: String(u.phone),
        passwordHash: String(u.password_hash),
        role: String(u.role) as "guest" | "customer" | "agent" | "admin" | "superadmin",
        referralCode: String(u.referral_code),
        cashbackBalance: String(u.cashback_balance),
        isVerified: Boolean(u.is_verified),
        isSuspended: Boolean(u.is_suspended),
        updatedAt: new Date(String(u.updated_at)),
      },
    });
  }

  // ── Services ───────────────────────────────────────────────────────────────
  console.log(`Importing ${services.length} services...`);
  for (const s of services) {
    await db.insert(servicesTable).values({
      id: Number(s.id),
      name: String(s.name),
      slug: String(s.slug),
      category: String(s.category),
      description: String(s.description),
      benefits: s.benefits as string[],
      requiredDocuments: s.required_documents as string[],
      icon: String(s.icon),
      isActive: Boolean(s.is_active),
      createdAt: new Date(String(s.created_at)),
    }).onConflictDoUpdate({
      target: servicesTable.id,
      set: {
        name: String(s.name),
        slug: String(s.slug),
        category: String(s.category),
        description: String(s.description),
        benefits: s.benefits as string[],
        requiredDocuments: s.required_documents as string[],
        icon: String(s.icon),
        isActive: Boolean(s.is_active),
      },
    });
  }

  // ── Testimonials ───────────────────────────────────────────────────────────
  console.log(`Importing ${testimonials.length} testimonials...`);
  for (const t of testimonials) {
    await db.insert(testimonialsTable).values({
      id: Number(t.id),
      customerName: String(t.customer_name),
      role: String(t.role),
      content: String(t.content),
      rating: Number(t.rating),
      isActive: Boolean(t.is_active),
      createdAt: new Date(String(t.created_at)),
    }).onConflictDoUpdate({
      target: testimonialsTable.id,
      set: {
        customerName: String(t.customer_name),
        role: String(t.role),
        content: String(t.content),
        rating: Number(t.rating),
        isActive: Boolean(t.is_active),
      },
    });
  }

  // ── Settings ───────────────────────────────────────────────────────────────
  console.log(`Importing ${settings.length} settings...`);
  for (const s of settings) {
    await db.insert(settingsTable).values({
      id: Number(s.id),
      key: String(s.key),
      value: String(s.value),
      updatedAt: new Date(String(s.updated_at)),
    }).onConflictDoUpdate({
      target: settingsTable.id,
      set: { key: String(s.key), value: String(s.value), updatedAt: new Date(String(s.updated_at)) },
    });
  }

  // ── Quotations ─────────────────────────────────────────────────────────────
  console.log(`Importing ${quotations.length} quotations...`);
  for (const q of quotations) {
    await db.insert(quotationsTable).values({
      id: Number(q.id),
      userId: q.user_id ? Number(q.user_id) : null,
      serviceId: Number(q.service_id),
      status: String(q.status) as "pending" | "processing" | "ready" | "approved" | "rejected" | "expired" | "paid",
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
    }).onConflictDoUpdate({
      target: quotationsTable.id,
      set: {
        status: String(q.status) as "pending" | "processing" | "ready" | "approved" | "rejected" | "expired" | "paid",
        formData: q.form_data as Record<string, unknown>,
        remarks: q.remarks ? String(q.remarks) : null,
        documentUrl: q.document_url ? String(q.document_url) : null,
        quotationRef: q.quotation_ref ? String(q.quotation_ref) : null,
        price: q.price ? String(q.price) : null,
        taxAmount: q.tax_amount ? String(q.tax_amount) : null,
        updatedAt: new Date(String(q.updated_at)),
      },
    });
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  console.log(`Importing ${notifications.length} notifications...`);
  for (const n of notifications) {
    await db.insert(notificationsTable).values({
      id: Number(n.id),
      userId: Number(n.user_id),
      title: String(n.title),
      message: String(n.message),
      type: String(n.type) as "quotation" | "cashback" | "renewal" | "announcement" | "system",
      isRead: Boolean(n.is_read),
      createdAt: new Date(String(n.created_at)),
    }).onConflictDoUpdate({
      target: notificationsTable.id,
      set: {
        title: String(n.title),
        message: String(n.message),
        isRead: Boolean(n.is_read),
      },
    });
  }

  // ── Cashback transactions ──────────────────────────────────────────────────
  console.log(`Importing ${cashback.length} cashback transactions...`);
  for (const tx of cashback) {
    await db.insert(cashbackTransactionsTable).values({
      id: Number(tx.id),
      userId: Number(tx.user_id),
      type: String(tx.type) as "earned" | "redeemed" | "adjusted" | "referral" | "promotion",
      amount: String(tx.amount),
      description: String(tx.description),
      referenceId: tx.reference_id ? Number(tx.reference_id) : null,
      createdAt: new Date(String(tx.created_at)),
    }).onConflictDoUpdate({
      target: cashbackTransactionsTable.id,
      set: { amount: String(tx.amount), description: String(tx.description) },
    });
  }

  // ── Reset sequences so new inserts don't collide ───────────────────────────
  console.log("\nResetting sequences...");
  for (const [seq, tbl] of [
    ["users_id_seq", "users"],
    ["services_id_seq", "services"],
    ["testimonials_id_seq", "testimonials"],
    ["settings_id_seq", "settings"],
    ["quotations_id_seq", "quotations"],
    ["notifications_id_seq", "notifications"],
    ["cashback_transactions_id_seq", "cashback_transactions"],
  ]) {
    await db.execute(sql.raw(`SELECT setval('${seq}', (SELECT MAX(id) FROM ${tbl}))`));
  }

  // ── Create new role-based accounts ────────────────────────────────────────
  console.log("\nCreating new role-based accounts...");

  const newAccounts: Array<{
    fullName: string; email: string; phone: string;
    password: string; role: "superadmin" | "admin" | "agent" | "customer"; referralCode: string;
  }> = [
    { fullName: "Super Admin Kynaz", email: "superadmin@kynaz.com", phone: "0100000001", password: "SuperAdmin@2024", role: "superadmin", referralCode: "SUPER001" },
    { fullName: "Admin Kynaz 2",     email: "admin2@kynaz.com",     phone: "0100000002", password: "Admin@2024",      role: "admin",      referralCode: "ADMIN002" },
    { fullName: "Agent Kynaz",       email: "agent@kynaz.com",      phone: "0100000003", password: "Agent@2024",      role: "agent",      referralCode: "AGENT001" },
    { fullName: "Customer Demo",     email: "customer@kynaz.com",   phone: "0100000004", password: "Customer@2024",   role: "customer",   referralCode: "CUST001"  },
  ];

  for (const acc of newAccounts) {
    const [row] = await db.insert(usersTable).values({
      fullName: acc.fullName,
      email: acc.email,
      phone: acc.phone,
      passwordHash: hashPassword(acc.password),
      role: acc.role,
      referralCode: acc.referralCode,
      cashbackBalance: "0.00",
      isVerified: true,
      isSuspended: false,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: usersTable.email,
      set: {
        fullName: acc.fullName,
        passwordHash: hashPassword(acc.password),
        role: acc.role,
        isVerified: true,
        updatedAt: new Date(),
      },
    }).returning({ id: usersTable.id, email: usersTable.email, role: usersTable.role });
    console.log(`  ✓ ${row.role.padEnd(12)} ${row.email}  (id=${row.id})`);
  }

  console.log("\n✅ Import complete!");
  await pool.end();
}

run().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
