/**
 * Seeds 3 agents + 12 customers with yopmail emails.
 * Assigns customers randomly across agents via referral codes.
 * Also updates all existing user emails to @yopmail.com.
 * Run: cd scripts && pnpm exec tsx src/seed-agents-customers.ts
 */
import { createHash } from "node:crypto";
import { db, pool, usersTable, agentsTable, quotationsTable, cashbackTransactionsTable, commissionsTable, referralsTable } from "../../lib/db/src/index.ts";
import { eq, sql, inArray } from "drizzle-orm";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "kynaz_salt_2024").digest("hex");
}

const AGENTS = [
  { fullName: "Ahmad Razin Mohd",     email: "agent.razin@yopmail.com",  phone: "0111000001", password: "Agent@2024", referralCode: "AGT001", agentId: "KYN-AGT-0010" },
  { fullName: "Nurul Huda Ismail",    email: "agent.huda@yopmail.com",   phone: "0111000002", password: "Agent@2024", referralCode: "AGT002", agentId: "KYN-AGT-0011" },
  { fullName: "Farid Hakim Abdullah", email: "agent.farid@yopmail.com",  phone: "0111000003", password: "Agent@2024", referralCode: "AGT003", agentId: "KYN-AGT-0012" },
];

const CUSTOMERS = [
  { fullName: "Siti Aminah Rahman",   email: "cust01@yopmail.com", phone: "0120000001", password: "Cust@2024", agentRef: "AGT001" },
  { fullName: "Muhammad Ali Hassan",  email: "cust02@yopmail.com", phone: "0120000002", password: "Cust@2024", agentRef: "AGT002" },
  { fullName: "Rosmah Ahmad",         email: "cust03@yopmail.com", phone: "0120000003", password: "Cust@2024", agentRef: "AGT003" },
  { fullName: "Aziz Karim",           email: "cust04@yopmail.com", phone: "0120000004", password: "Cust@2024", agentRef: "AGT001" },
  { fullName: "Fatimah Zahra",        email: "cust05@yopmail.com", phone: "0120000005", password: "Cust@2024", agentRef: "AGT002" },
  { fullName: "Kamal Ibrahim",        email: "cust06@yopmail.com", phone: "0120000006", password: "Cust@2024", agentRef: "AGT001" },
  { fullName: "Zainab Mohd",          email: "cust07@yopmail.com", phone: "0120000007", password: "Cust@2024", agentRef: "AGT003" },
  { fullName: "Razif Othman",         email: "cust08@yopmail.com", phone: "0120000008", password: "Cust@2024", agentRef: "AGT002" },
  { fullName: "Hasnah Bakar",         email: "cust09@yopmail.com", phone: "0120000009", password: "Cust@2024", agentRef: "AGT001" },
  { fullName: "Shafiq Nordin",        email: "cust10@yopmail.com", phone: "0120000010", password: "Cust@2024", agentRef: "AGT003" },
  { fullName: "Suraya Alias",         email: "cust11@yopmail.com", phone: "0120000011", password: "Cust@2024", agentRef: "AGT002" },
  { fullName: "Rizal Yahya",          email: "cust12@yopmail.com", phone: "0120000012", password: "Cust@2024", agentRef: "AGT003" },
];

async function run() {
  console.log("=== Seeding Agents & Customers ===\n");

  // ── 1. Update existing non-yopmail emails ──────────────────────────────────
  console.log("Updating existing emails to @yopmail.com...");
  const emailMap: Record<string, string> = {
    "admin@kynaz.com":      "admin@yopmail.com",
    "demo@kynaz.com":       "demo@yopmail.com",
    "superadmin@kynaz.com": "superadmin@yopmail.com",
    "admin2@kynaz.com":     "admin2@yopmail.com",
    "agent@kynaz.com":      "agent@yopmail.com",
    "customer@kynaz.com":   "customer@yopmail.com",
  };
  for (const [oldEmail, newEmail] of Object.entries(emailMap)) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, oldEmail));
    if (user) {
      await db.update(usersTable).set({ email: newEmail, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
      console.log(`  ✓ Updated ${oldEmail} → ${newEmail}`);
    }
  }

  // ── 2. Get service IDs for quotations ──────────────────────────────────────
  const { rows: serviceRows } = await db.execute(sql`SELECT id FROM services ORDER BY id LIMIT 10`);
  const serviceIds = (serviceRows as { id: number }[]).map(r => r.id);
  if (serviceIds.length === 0) { console.error("No services found!"); process.exit(1); }

  // ── 3. Create agents ───────────────────────────────────────────────────────
  console.log("\nCreating agents...");
  const agentUserIds: number[] = [];

  for (const agent of AGENTS) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, agent.email));
    let userId = existing?.id;

    if (!existing) {
      const [user] = await db.insert(usersTable).values({
        fullName: agent.fullName, email: agent.email, phone: agent.phone,
        passwordHash: hashPassword(agent.password), role: "agent",
        referralCode: agent.referralCode, cashbackBalance: "0.00",
        isVerified: true, isSuspended: false, updatedAt: new Date(),
      }).returning({ id: usersTable.id });
      userId = user.id;
    } else {
      await db.update(usersTable).set({ role: "agent", referralCode: agent.referralCode, updatedAt: new Date() }).where(eq(usersTable.id, existing.id));
    }

    await db.insert(agentsTable).values({
      userId: userId!, agentId: agent.agentId, status: "active", badge: "bronze",
      commissionRate: "5.00", updatedAt: new Date(),
    }).onConflictDoNothing();

    agentUserIds.push(userId!);
    console.log(`  ✓ Agent: ${agent.fullName} (${agent.referralCode}) id=${userId}`);
  }

  // ── 4. Create customers + assign to agents ─────────────────────────────────
  console.log("\nCreating customers...");
  const agentSalesCount: Record<string, number> = { AGT001: 0, AGT002: 0, AGT003: 0 };
  const agentCustomerCount: Record<string, number> = { AGT001: 0, AGT002: 0, AGT003: 0 };

  for (const cust of CUSTOMERS) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, cust.email));
    let userId = existing?.id;

    if (!existing) {
      const refCode = `CUST${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const [user] = await db.insert(usersTable).values({
        fullName: cust.fullName, email: cust.email, phone: cust.phone,
        passwordHash: hashPassword(cust.password), role: "customer",
        referralCode: refCode, referredByCode: cust.agentRef,
        cashbackBalance: "0.00", isVerified: true, isSuspended: false, updatedAt: new Date(),
      }).returning({ id: usersTable.id });
      userId = user.id;
    } else {
      await db.update(usersTable).set({ referredByCode: cust.agentRef, updatedAt: new Date() }).where(eq(usersTable.id, existing.id));
    }

    agentCustomerCount[cust.agentRef]++;

    // Create 1-2 paid quotations per customer to generate ranking data
    const numQuotations = Math.floor(Math.random() * 3) + 1;
    for (let q = 0; q < numQuotations; q++) {
      const serviceId = serviceIds[Math.floor(Math.random() * serviceIds.length)];
      const price = (Math.floor(Math.random() * 19) + 2) * 100; // RM200–RM2000
      const ref = `KYN-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`;
      const [quotation] = await db.insert(quotationsTable).values({
        userId: userId!, serviceId, status: "paid",
        formData: { phone: cust.phone, fullName: cust.fullName },
        remarks: "Processed", price: String(price), taxAmount: String((price * 0.08).toFixed(2)),
        quotationRef: ref, isGuest: false, updatedAt: new Date(),
      }).returning({ id: quotationsTable.id }).catch(() => []);

      if (quotation) {
        agentSalesCount[cust.agentRef]++;
        // Cashback for customer (1%)
        await db.insert(cashbackTransactionsTable).values({
          userId: userId!, type: "earned", amount: String((price * 0.01).toFixed(2)),
          description: `Cashback for ${ref} (1% of RM${price})`, referenceId: quotation.id,
        }).catch(() => {});
      }
    }

    console.log(`  ✓ Customer: ${cust.fullName} → Agent ${cust.agentRef}  (id=${userId})`);
  }

  // ── 5. Update agent totals + commissions ───────────────────────────────────
  console.log("\nUpdating agent stats...");
  for (const agent of AGENTS) {
    const [agentUser] = await db.select().from(usersTable).where(eq(usersTable.email, agent.email));
    if (!agentUser) continue;
    const [agentRecord] = await db.select().from(agentsTable).where(eq(agentsTable.userId, agentUser.id));
    if (!agentRecord) continue;

    const sales = agentSalesCount[agent.referralCode] ?? 0;
    const customers = agentCustomerCount[agent.referralCode] ?? 0;
    const commission = sales * 100 * 0.05; // 5% of ~RM100 average
    const points = sales * 10 + customers * 5;
    const badge = points >= 200 ? "silver" : "bronze";

    await db.update(agentsTable).set({
      totalSales: sales, totalCustomers: customers,
      totalCommission: String(commission.toFixed(2)),
      commissionBalance: String((commission * 0.5).toFixed(2)),
      points, badge: badge as "bronze" | "silver",
      status: "active", updatedAt: new Date(),
    }).where(eq(agentsTable.id, agentRecord.id));

    console.log(`  ✓ ${agent.fullName}: sales=${sales} customers=${customers} points=${points} badge=${badge}`);
  }

  // ── 6. Update sequences ────────────────────────────────────────────────────
  for (const [seq, tbl] of [
    ["users_id_seq", "users"],
    ["quotations_id_seq", "quotations"],
    ["cashback_transactions_id_seq", "cashback_transactions"],
    ["agents_id_seq", "agents"],
  ] as [string, string][]) {
    await db.execute(sql.raw(`SELECT setval('${seq}', (SELECT COALESCE(MAX(id),1) FROM ${tbl}))`));
  }

  await pool.end();
  console.log("\n✅ Seed complete!\n");
  console.log("═══════════════════════════════════════════════════════");
  console.log("  AGENT CREDENTIALS (password: Agent@2024)");
  console.log("───────────────────────────────────────────────────────");
  for (const a of AGENTS) console.log(`  ${a.agentId}  ${a.email}  ref: ${a.referralCode}`);
  console.log("───────────────────────────────────────────────────────");
  console.log("  CUSTOMER CREDENTIALS (password: Cust@2024)");
  console.log("───────────────────────────────────────────────────────");
  for (const c of CUSTOMERS) console.log(`  ${c.email.padEnd(26)} → ${c.agentRef}`);
  console.log("═══════════════════════════════════════════════════════");
}

run().catch(err => { console.error("Seed failed:", err.message ?? err); process.exit(1); });
