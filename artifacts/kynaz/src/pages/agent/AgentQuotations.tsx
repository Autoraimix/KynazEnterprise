import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { motion } from "framer-motion";
import { customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  ready: "bg-indigo-100 text-indigo-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-600",
  paid: "bg-green-100 text-green-800",
};

const PAGE_SIZE = 10;

export default function AgentQuotations() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);

  const { data: quotations, isLoading } = useQuery({
    queryKey: ["agent-quotations"],
    queryFn: () => customFetch<any[]>("/api/agents/quotations"),
  });

  const filtered = (quotations ?? []).filter((q: any) => {
    const matchesSearch =
      (q.quotationRef ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (q.customerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (q.serviceName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearchChange = (v: string) => { setSearch(v); setPage(0); };
  const handleStatusChange = (v: string) => { setStatusFilter(v); setPage(0); };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif font-bold text-foreground">Customer Quotations</h1>
          <p className="text-muted-foreground text-sm mt-1">Quotations from all your referred customers</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by ref, customer, service..."
              className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => handleStatusChange(e.target.value)}
            className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Status</option>
            {["pending","processing","ready","approved","paid","rejected","expired"].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <FileText size={40} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No quotations found.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginated.map((q: any) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-semibold text-primary text-sm">{q.quotationRef ?? `#${q.id}`}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[q.status] ?? "bg-muted text-muted-foreground"}`}>
                          {q.status}
                        </span>
                      </div>
                      <div className="text-sm text-foreground font-medium">{q.serviceName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Customer: {q.customerName ?? "—"}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {q.price != null ? (
                        <div className="font-bold text-lg text-foreground">RM {q.price.toFixed(2)}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Price pending</div>
                      )}
                      <div className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{filtered.length} quotation{filtered.length !== 1 ? "s" : ""}</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                    <ChevronLeft size={16} /> Prev
                  </Button>
                  <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                    Next <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}
