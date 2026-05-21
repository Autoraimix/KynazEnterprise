import { Router, type IRouter } from "express";
import { db, usersTable, quotationsTable, cashbackTransactionsTable, agentsTable, servicesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-MY", { month: "short", year: "numeric" });
}

function getLast12Months(): string[] {
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push(getMonthLabel(d));
  }
  return months;
}

router.get("/admin/analytics", requireAdmin, async (_req, res): Promise<void> => {
  const [users, quotations, cashbackTx, agents, services] = await Promise.all([
    db.select().from(usersTable).orderBy(desc(usersTable.createdAt)),
    db.select().from(quotationsTable).orderBy(desc(quotationsTable.createdAt)),
    db.select().from(cashbackTransactionsTable).orderBy(desc(cashbackTransactionsTable.createdAt)),
    db.select().from(agentsTable).orderBy(desc(agentsTable.totalSales)),
    db.select().from(servicesTable),
  ]);

  const months = getLast12Months();

  // ── Monthly quotations & revenue ─────────────────────────────────────────
  const quotationsByMonth = months.map(month => {
    const monthQuots = quotations.filter(q => getMonthLabel(q.createdAt) === month);
    const paid = monthQuots.filter(q => q.status === "paid");
    const revenue = paid.reduce((s, q) => s + (q.price ? parseFloat(q.price) : 0), 0);
    return { month, total: monthQuots.length, paid: paid.length, revenue: parseFloat(revenue.toFixed(2)) };
  });

  // ── Monthly customer registrations ───────────────────────────────────────
  const registrationsByMonth = months.map(month => {
    const count = users.filter(u => u.role === "customer" && getMonthLabel(u.createdAt) === month).length;
    return { month, count };
  });

  // ── Quotation status breakdown ────────────────────────────────────────────
  const statusCounts: Record<string, number> = {};
  for (const q of quotations) {
    statusCounts[q.status] = (statusCounts[q.status] ?? 0) + 1;
  }
  const quotationStatusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  // ── Service popularity ────────────────────────────────────────────────────
  const serviceCountMap: Record<number, number> = {};
  for (const q of quotations) {
    serviceCountMap[q.serviceId] = (serviceCountMap[q.serviceId] ?? 0) + 1;
  }
  const serviceMap = new Map(services.map(s => [s.id, s.name]));
  const servicePopularity = Object.entries(serviceCountMap)
    .map(([id, count]) => ({ service: serviceMap.get(Number(id)) ?? `Service ${id}`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ── Top agents by sales ───────────────────────────────────────────────────
  const agentUserIds = agents.map(a => a.userId);
  const agentUsers = users.filter(u => agentUserIds.includes(u.id));
  const agentUserMap = new Map(agentUsers.map(u => [u.id, u]));

  const topAgents = agents.slice(0, 10).map(a => {
    const agentUser = agentUserMap.get(a.userId);
    return {
      name: agentUser?.fullName ?? `Agent #${a.userId}`,
      agentId: a.agentId,
      sales: a.totalSales,
      customers: a.totalCustomers,
      commission: parseFloat(a.totalCommission),
      badge: a.badge,
      points: a.points,
    };
  });

  // ── Monthly cashback issued ───────────────────────────────────────────────
  const cashbackByMonth = months.map(month => {
    const amount = cashbackTx
      .filter(t => ["earned", "referral", "promotion"].includes(t.type) && getMonthLabel(t.createdAt) === month)
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    return { month, amount: parseFloat(amount.toFixed(2)) };
  });

  // ── Role breakdown ────────────────────────────────────────────────────────
  const roleCounts = {
    customer: users.filter(u => u.role === "customer").length,
    agent: users.filter(u => u.role === "agent").length,
    admin: users.filter(u => u.role === "admin" || u.role === "superadmin").length,
  };

  // ── Quotations closed by agent ────────────────────────────────────────────
  const agentClosedQuotations = agents.slice(0, 10).map(a => {
    const agentUser = agentUserMap.get(a.userId);
    const closed = quotations.filter(q => q.userId !== null && a.userId === q.userId && q.status === "paid").length;
    return {
      name: agentUser?.fullName ?? `Agent #${a.userId}`,
      closed,
      agentId: a.agentId,
    };
  }).filter(a => a.closed > 0);

  res.json({
    quotationsByMonth,
    registrationsByMonth,
    quotationStatusBreakdown,
    servicePopularity,
    topAgents,
    cashbackByMonth,
    roleCounts,
    agentClosedQuotations,
    summary: {
      totalQuotations: quotations.length,
      totalPaid: quotations.filter(q => q.status === "paid").length,
      totalRevenue: quotations.filter(q => q.status === "paid").reduce((s, q) => s + (q.price ? parseFloat(q.price) : 0), 0),
      totalCustomers: users.filter(u => u.role === "customer").length,
      totalAgents: agents.filter(a => a.status === "active").length,
      totalCashback: cashbackTx.filter(t => ["earned", "referral", "promotion"].includes(t.type)).reduce((s, t) => s + parseFloat(t.amount), 0),
    },
  });
});

export default router;
