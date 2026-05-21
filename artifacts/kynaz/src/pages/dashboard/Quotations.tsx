import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useListQuotations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Download, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
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

export default function Quotations() {
  const { data: quotations, isLoading } = useListQuotations();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);

  const filtered = (quotations ?? []).filter(q => filter === "all" || q.status === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleFilterChange = (s: string) => {
    setFilter(s);
    setPage(0);
  };

  return (
    <ProtectedLayout>
      <div className="max-w-5xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">My Quotations</h1>
            <p className="text-muted-foreground text-sm mt-1">Track and manage your quotation requests</p>
          </div>
          <Link href="/dashboard/quotations/new">
            <Button className="bg-primary text-white gap-2">
              <Plus size={16} /> New Quotation
            </Button>
          </Link>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(s => (
            <button
              key={s}
              data-testid={`filter-${s}`}
              onClick={() => handleFilterChange(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                filter === s
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === "all" ? "All" : statusConfig[s]?.label ?? s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <FileText size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground mb-2">No quotations found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {filter === "all" ? "Request your first quotation to get started." : `No ${statusConfig[filter]?.label ?? filter} quotations.`}
            </p>
            <Link href="/dashboard/quotations/new">
              <Button className="bg-primary text-white">Request Quotation</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paged.map((q, i) => {
                const status = statusConfig[q.status] ?? statusConfig.pending;
                const qStatus = q.status as string;
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link href={`/dashboard/quotations/${q.id}`}>
                      <div
                        data-testid={`card-quotation-${q.id}`}
                        className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                              <FileText size={18} className="text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{q.serviceName}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Submitted {new Date(q.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                              </div>
                              {q.quotationRef && (
                                <div className="text-xs text-primary font-mono mt-0.5">{q.quotationRef}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>
                              {status.label}
                            </span>
                            {qStatus === "ready" && (
                              <span className="text-xs text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Action needed
                              </span>
                            )}
                            {qStatus === "paid" && (
                              <span className="text-xs text-purple-600 flex items-center gap-1">
                                <ShieldCheck size={12} /> Cashback credited
                              </span>
                            )}
                            {q.documentUrl && (
                              <span className="text-xs text-blue-600 flex items-center gap-1">
                                <Download size={12} /> Document ready
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end mt-3">
                          <span className="text-xs text-primary flex items-center gap-1 hover:underline">
                            View details <ArrowRight size={12} />
                          </span>
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
    </ProtectedLayout>
  );
}
