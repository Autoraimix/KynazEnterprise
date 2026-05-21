import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListAdminQuotations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowRight, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800 border-blue-200" },
  ready: { label: "Ready", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200" },
  paid: { label: "Paid", color: "bg-purple-100 text-purple-800 border-purple-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

const statusFilters = ["all", "pending", "processing", "ready", "approved", "paid", "rejected", "expired"];
const PAGE_SIZE = 10;

export default function AdminQuotations() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const { data: allQuotations, isLoading } = useListAdminQuotations({});

  const filtered = (allQuotations ?? []).filter(q => {
    const matchesStatus = selectedStatus === "all" || q.status === selectedStatus;
    const matchesSearch = !search ||
      (q.customerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      q.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      (q.quotationRef ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleFilterChange = (s: string) => {
    setSelectedStatus(s);
    setPage(0);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif font-bold text-foreground">All Quotations</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and process customer quotation requests</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-testid="input-search"
              placeholder="Search by customer, service or reference..."
              className="pl-9"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map(s => (
              <button key={s} data-testid={`filter-${s}`} onClick={() => handleFilterChange(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  selectedStatus === s ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}>
                {s === "all" ? "All" : statusConfig[s]?.label ?? s}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <FileText size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground">No quotations found.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((q, i) => {
                const status = statusConfig[q.status] ?? statusConfig.pending;
                return (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Link href={`/admin/quotations/${q.id}`}>
                      <div data-testid={`row-quotation-${q.id}`}
                        className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                              <FileText size={18} className="text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground text-sm">{q.customerName ?? "Guest"}</div>
                              <div className="text-xs text-muted-foreground">{q.serviceName} · {q.customerEmail ?? (q.formData as Record<string, unknown>)?.email as string ?? "—"}</div>
                              <div className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {q.isGuest && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">Guest</span>
                            )}
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>{status.label}</span>
                            <ArrowRight size={16} className="text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="gap-1"
                  >
                    <ChevronLeft size={14} /> Back
                  </Button>
                  <span className="text-sm font-medium px-2">{page + 1} / {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="gap-1"
                  >
                    Next <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
