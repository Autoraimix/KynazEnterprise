/**
 * Seed script — imports JSON export files into the database.
 * Run: pnpm --filter @workspace/scripts run seed
 *
 * Safe to run multiple times: uses ON CONFLICT DO NOTHING on every table.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../");

const { Pool } = pg;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function load(filename: string): unknown[] {
  const p = resolve(root, "attached_assets", filename);
  const raw = readFileSync(p, "utf-8");
  return JSON.parse(raw) as unknown[];
}

async function run(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ── 1. Settings ──────────────────────────────────────────────────────────
    const settings = load("settings_1779490965513.json") as Array<{
      id: number; key: string; value: string; updated_at: string;
    }>;
    for (const s of settings) {
      await client.query(
        `INSERT INTO settings (id, key, value, updated_at)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO UPDATE SET value=EXCLUDED.value, updated_at=EXCLUDED.updated_at`,
        [s.id, s.key, s.value, s.updated_at],
      );
    }
    console.log(`✓ settings: ${settings.length}`);

    // ── 2. Testimonials ───────────────────────────────────────────────────────
    const testimonials = load("testimonials_1779490965513.json") as Array<{
      id: number; customer_name: string; role: string; content: string;
      rating: number; is_active: boolean; created_at: string;
    }>;
    for (const t of testimonials) {
      await client.query(
        `INSERT INTO testimonials (id, customer_name, role, content, rating, is_active, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        [t.id, t.customer_name, t.role, t.content, t.rating, t.is_active, t.created_at],
      );
    }
    console.log(`✓ testimonials: ${testimonials.length}`);

    // ── 3. Services ───────────────────────────────────────────────────────────
    const services = load("services_1779490965514.json") as Array<{
      id: number; name: string; slug: string; category: string;
      description: string; benefits: string[]; required_documents: string[];
      icon: string; is_active: boolean; created_at: string;
    }>;
    for (const s of services) {
      await client.query(
        `INSERT INTO services (id, name, slug, category, description, benefits, required_documents, icon, is_active, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name, slug=EXCLUDED.slug, category=EXCLUDED.category,
           description=EXCLUDED.description, benefits=EXCLUDED.benefits,
           required_documents=EXCLUDED.required_documents, icon=EXCLUDED.icon,
           is_active=EXCLUDED.is_active`,
        [
          s.id, s.name, s.slug, s.category, s.description,
          JSON.stringify(s.benefits), JSON.stringify(s.required_documents),
          s.icon, s.is_active, s.created_at,
        ],
      );
    }
    console.log(`✓ services: ${services.length}`);

    // ── 4. Users ──────────────────────────────────────────────────────────────
    const users = load("users_1779490965513.json") as Array<{
      id: number; full_name: string; email: string; phone: string;
      password_hash: string; role: string; referral_code: string;
      referred_by_code: string | null; cashback_balance: string;
      is_verified: boolean; is_suspended: boolean;
      created_at: string; updated_at: string;
    }>;
    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, full_name, email, phone, password_hash, role, referral_code,
           referred_by_code, cashback_balance, is_verified, is_suspended, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO UPDATE SET
           full_name=EXCLUDED.full_name, email=EXCLUDED.email, phone=EXCLUDED.phone,
           password_hash=EXCLUDED.password_hash, role=EXCLUDED.role,
           referral_code=EXCLUDED.referral_code, referred_by_code=EXCLUDED.referred_by_code,
           cashback_balance=EXCLUDED.cashback_balance, is_verified=EXCLUDED.is_verified,
           is_suspended=EXCLUDED.is_suspended, updated_at=EXCLUDED.updated_at`,
        [
          u.id, u.full_name, u.email, u.phone, u.password_hash, u.role,
          u.referral_code, u.referred_by_code, u.cashback_balance,
          u.is_verified, u.is_suspended, u.created_at, u.updated_at,
        ],
      );
    }
    console.log(`✓ users: ${users.length}`);

    // ── 5. Quotations ─────────────────────────────────────────────────────────
    const quotations = load("quotations_1779490965514.json") as Array<{
      id: number; user_id: number | null; service_id: number; status: string;
      form_data: Record<string, unknown>; remarks: string | null;
      document_url: string | null; quotation_ref: string | null;
      price: string | null; tax_amount: string | null;
      payment_proof_url: string | null; is_guest: boolean;
      expires_at: string | null; created_at: string; updated_at: string;
    }>;
    for (const q of quotations) {
      await client.query(
        `INSERT INTO quotations (id, user_id, service_id, status, form_data, remarks,
           document_url, quotation_ref, price, tax_amount, payment_proof_url,
           is_guest, expires_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO UPDATE SET
           status=EXCLUDED.status, form_data=EXCLUDED.form_data,
           remarks=EXCLUDED.remarks, document_url=EXCLUDED.document_url,
           quotation_ref=EXCLUDED.quotation_ref, price=EXCLUDED.price,
           tax_amount=EXCLUDED.tax_amount, payment_proof_url=EXCLUDED.payment_proof_url,
           updated_at=EXCLUDED.updated_at`,
        [
          q.id, q.user_id, q.service_id, q.status,
          JSON.stringify(q.form_data), q.remarks, q.document_url,
          q.quotation_ref, q.price, q.tax_amount, q.payment_proof_url,
          q.is_guest, q.expires_at, q.created_at, q.updated_at,
        ],
      );
    }
    console.log(`✓ quotations: ${quotations.length}`);

    // ── 6. Notifications ──────────────────────────────────────────────────────
    const notifications = load("notifications_1779490965514.json") as Array<{
      id: number; user_id: number; title: string; message: string;
      type: string; is_read: boolean; created_at: string;
    }>;
    for (const n of notifications) {
      await client.query(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        [n.id, n.user_id, n.title, n.message, n.type, n.is_read, n.created_at],
      );
    }
    console.log(`✓ notifications: ${notifications.length}`);

    // ── 7. Cashback transactions ───────────────────────────────────────────────
    const cashback = load("cashback_transactions_1779490965515.json") as Array<{
      id: number; user_id: number; type: string; amount: string;
      description: string; reference_id: number | null; created_at: string;
    }>;
    for (const c of cashback) {
      await client.query(
        `INSERT INTO cashback_transactions (id, user_id, type, amount, description, reference_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.user_id, c.type, c.amount, c.description, c.reference_id, c.created_at],
      );
    }
    console.log(`✓ cashback_transactions: ${cashback.length}`);

    // ── 8. Referrals ──────────────────────────────────────────────────────────
    const referrals = load("referrals_1779490965514.json") as Array<{
      id: number; referrer_id: number; referred_user_id: number;
      cashback_earned: string; created_at: string;
    }>;
    for (const r of referrals) {
      await client.query(
        `INSERT INTO referrals (id, referrer_id, referred_user_id, cashback_earned, created_at)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO NOTHING`,
        [r.id, r.referrer_id, r.referred_user_id, r.cashback_earned, r.created_at],
      );
    }
    console.log(`✓ referrals: ${referrals.length}`);

    // ── 9. Agents ─────────────────────────────────────────────────────────────
    const agents = load("agents_1779490965515.json") as Array<{
      id: number; user_id: number; agent_id: string; status: string;
      badge: string; total_sales: number; total_customers: number;
      total_commission: string; commission_balance: string;
      commission_rate: string; points: number; rank_position: number | null;
      notes: string | null; created_at: string; updated_at: string;
    }>;
    for (const a of agents) {
      await client.query(
        `INSERT INTO agents (id, user_id, agent_id, status, badge, total_sales, total_customers,
           total_commission, commission_balance, commission_rate, points, rank_position,
           notes, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO UPDATE SET
           status=EXCLUDED.status, badge=EXCLUDED.badge,
           total_sales=EXCLUDED.total_sales, total_customers=EXCLUDED.total_customers,
           total_commission=EXCLUDED.total_commission, commission_balance=EXCLUDED.commission_balance,
           commission_rate=EXCLUDED.commission_rate, points=EXCLUDED.points,
           rank_position=EXCLUDED.rank_position, notes=EXCLUDED.notes,
           updated_at=EXCLUDED.updated_at`,
        [
          a.id, a.user_id, a.agent_id, a.status, a.badge,
          a.total_sales, a.total_customers, a.total_commission,
          a.commission_balance, a.commission_rate, a.points,
          a.rank_position, a.notes, a.created_at, a.updated_at,
        ],
      );
    }
    console.log(`✓ agents: ${agents.length}`);

    // ── 10. Reset sequences ───────────────────────────────────────────────────
    const tables = [
      "settings", "testimonials", "services", "users", "quotations",
      "notifications", "cashback_transactions", "referrals", "agents",
    ];
    for (const t of tables) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 0) + 1, false)`,
      );
    }
    console.log("✓ sequences reset");

    await client.query("COMMIT");
    console.log("\n✅ Seed complete!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
