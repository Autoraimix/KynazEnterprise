/**
 * One-time data import script.
 * Imports all JSON seed files and creates new role-based accounts.
 * Run: node scripts/import-data.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "attached_assets");

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function hashPassword(password) {
  return createHash("sha256").update(password + "kynaz_salt_2024").digest("hex");
}

async function load(filename) {
  return JSON.parse(await readFile(path.join(ASSETS, filename), "utf8"));
}

async function run() {
  const client = await pool.connect();
  try {
    console.log("=== Kynaz Data Import ===\n");

    // ── 1. Load JSON files ──────────────────────────────────────────────────
    const [users, services, testimonials, settings, quotations, notifications, cashback] = await Promise.all([
      load("users_1779371028066.json"),
      load("services_1779371028065.json"),
      load("testimonials_1779371028065.json"),
      load("settings_1779371028066.json"),
      load("quotations_1779371028064.json"),
      load("notifications_1779371028064.json"),
      load("cashback_transactions_1779371028064.json"),
    ]);

    // ── 2. Users ────────────────────────────────────────────────────────────
    console.log(`Importing ${users.length} users...`);
    for (const u of users) {
      await client.query(`
        INSERT INTO users (id, full_name, email, phone, password_hash, role, referral_code,
          referred_by_code, cashback_balance, is_verified, is_suspended, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (id) DO UPDATE SET
          full_name=EXCLUDED.full_name, email=EXCLUDED.email, phone=EXCLUDED.phone,
          password_hash=EXCLUDED.password_hash, role=EXCLUDED.role,
          referral_code=EXCLUDED.referral_code, referred_by_code=EXCLUDED.referred_by_code,
          cashback_balance=EXCLUDED.cashback_balance, is_verified=EXCLUDED.is_verified,
          is_suspended=EXCLUDED.is_suspended, updated_at=EXCLUDED.updated_at
      `, [u.id, u.full_name, u.email, u.phone, u.password_hash,
          u.role, u.referral_code, u.referred_by_code ?? null,
          u.cashback_balance, u.is_verified, u.is_suspended,
          u.created_at, u.updated_at]);
    }

    // ── 3. Services ─────────────────────────────────────────────────────────
    console.log(`Importing ${services.length} services...`);
    for (const s of services) {
      await client.query(`
        INSERT INTO services (id, name, slug, category, description, benefits, required_documents, icon, is_active, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO UPDATE SET
          name=EXCLUDED.name, slug=EXCLUDED.slug, category=EXCLUDED.category,
          description=EXCLUDED.description, benefits=EXCLUDED.benefits,
          required_documents=EXCLUDED.required_documents, icon=EXCLUDED.icon,
          is_active=EXCLUDED.is_active
      `, [s.id, s.name, s.slug, s.category, s.description,
          JSON.stringify(s.benefits), JSON.stringify(s.required_documents),
          s.icon, s.is_active, s.created_at]);
    }

    // ── 4. Testimonials ─────────────────────────────────────────────────────
    console.log(`Importing ${testimonials.length} testimonials...`);
    for (const t of testimonials) {
      await client.query(`
        INSERT INTO testimonials (id, customer_name, role, content, rating, is_active, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET
          customer_name=EXCLUDED.customer_name, role=EXCLUDED.role, content=EXCLUDED.content,
          rating=EXCLUDED.rating, is_active=EXCLUDED.is_active
      `, [t.id, t.customer_name, t.role, t.content, t.rating, t.is_active, t.created_at]);
    }

    // ── 5. Settings ─────────────────────────────────────────────────────────
    console.log(`Importing ${settings.length} settings...`);
    for (const s of settings) {
      await client.query(`
        INSERT INTO settings (id, key, value, updated_at)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (id) DO UPDATE SET key=EXCLUDED.key, value=EXCLUDED.value, updated_at=EXCLUDED.updated_at
      `, [s.id, s.key, s.value, s.updated_at]);
    }

    // ── 6. Quotations ───────────────────────────────────────────────────────
    console.log(`Importing ${quotations.length} quotations...`);
    for (const q of quotations) {
      await client.query(`
        INSERT INTO quotations (id, user_id, service_id, status, form_data, remarks, document_url,
          quotation_ref, price, tax_amount, payment_proof_url, is_guest, expires_at, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (id) DO UPDATE SET
          status=EXCLUDED.status, form_data=EXCLUDED.form_data, remarks=EXCLUDED.remarks,
          document_url=EXCLUDED.document_url, quotation_ref=EXCLUDED.quotation_ref,
          price=EXCLUDED.price, tax_amount=EXCLUDED.tax_amount,
          payment_proof_url=EXCLUDED.payment_proof_url, updated_at=EXCLUDED.updated_at
      `, [q.id, q.user_id ?? null, q.service_id, q.status,
          JSON.stringify(q.form_data), q.remarks ?? null, q.document_url ?? null,
          q.quotation_ref ?? null, q.price ?? null, q.tax_amount ?? null,
          q.payment_proof_url ?? null, q.is_guest,
          q.expires_at ?? null, q.created_at, q.updated_at]);
    }

    // ── 7. Notifications ────────────────────────────────────────────────────
    console.log(`Importing ${notifications.length} notifications...`);
    for (const n of notifications) {
      await client.query(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET
          title=EXCLUDED.title, message=EXCLUDED.message, is_read=EXCLUDED.is_read
      `, [n.id, n.user_id, n.title, n.message, n.type, n.is_read, n.created_at]);
    }

    // ── 8. Cashback transactions ────────────────────────────────────────────
    console.log(`Importing ${cashback.length} cashback transactions...`);
    for (const tx of cashback) {
      await client.query(`
        INSERT INTO cashback_transactions (id, user_id, type, amount, description, reference_id, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET
          amount=EXCLUDED.amount, description=EXCLUDED.description
      `, [tx.id, tx.user_id, tx.type, tx.amount, tx.description,
          tx.reference_id ?? null, tx.created_at]);
    }

    // ── 9. Fix sequence counters so new inserts don't collide ──────────────
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
      await client.query(`SELECT setval('${seq}', (SELECT MAX(id) FROM ${tbl}))`);
    }

    // ── 10. Create new role-based accounts ──────────────────────────────────
    console.log("\nCreating new role-based accounts...");

    const newAccounts = [
      { fullName: "Super Admin Kynaz",  email: "superadmin@kynaz.com", phone: "0100000001", password: "SuperAdmin@2024", role: "superadmin", referralCode: "SUPER001" },
      { fullName: "Admin Kynaz 2",      email: "admin2@kynaz.com",     phone: "0100000002", password: "Admin@2024",      role: "admin",      referralCode: "ADMIN002" },
      { fullName: "Agent Kynaz",        email: "agent@kynaz.com",      phone: "0100000003", password: "Agent@2024",      role: "agent",      referralCode: "AGENT001" },
      { fullName: "Customer Demo",      email: "customer@kynaz.com",   phone: "0100000004", password: "Customer@2024",   role: "customer",   referralCode: "CUST001" },
    ];

    for (const acc of newAccounts) {
      const hash = hashPassword(acc.password);
      const { rows } = await client.query(`
        INSERT INTO users (full_name, email, phone, password_hash, role, referral_code,
          cashback_balance, is_verified, is_suspended, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,'0.00',true,false,NOW(),NOW())
        ON CONFLICT (email) DO UPDATE SET
          full_name=EXCLUDED.full_name, password_hash=EXCLUDED.password_hash,
          role=EXCLUDED.role, is_verified=true, updated_at=NOW()
        RETURNING id, email, role
      `, [acc.fullName, acc.email, acc.phone, hash, acc.role, acc.referralCode]);
      console.log(`  ✓ ${rows[0].role.padEnd(12)} ${rows[0].email} (id=${rows[0].id})`);
    }

    console.log("\n✅ Import complete!");
    console.log("\n══════════════════════════════════════════════════");
    console.log("  NEW ACCOUNT CREDENTIALS");
    console.log("══════════════════════════════════════════════════");
    console.log("  ROLE        EMAIL                   PASSWORD");
    console.log("──────────────────────────────────────────────────");
    console.log("  superadmin  superadmin@kynaz.com    SuperAdmin@2024");
    console.log("  admin       admin2@kynaz.com        Admin@2024");
    console.log("  agent       agent@kynaz.com         Agent@2024");
    console.log("  customer    customer@kynaz.com      Customer@2024");
    console.log("══════════════════════════════════════════════════");
    console.log("\n  EXISTING ACCOUNTS");
    console.log("──────────────────────────────────────────────────");
    console.log("  admin       admin@kynaz.com         admin123");
    console.log("  customer    demo@kynaz.com          demo123");
    console.log("══════════════════════════════════════════════════\n");

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error("Import failed:", err); process.exit(1); });
