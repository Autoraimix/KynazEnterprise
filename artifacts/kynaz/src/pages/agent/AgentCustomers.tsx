import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { motion } from "framer-motion";
import { customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;

export default function AgentCustomers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["agent-customers"],
    queryFn: () => customFetch<any[]>("/api/agents/customers"),
  });

  const filtered = (customers ?? []).filter((c: any) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearchChange = (v: string) => { setSearch(v); setPage(0); };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif font-bold text-foreground">My Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">Customers who registered using your referral code</p>
        </motion.div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Users size={40} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">{search ? "No customers match your search." : "No customers yet. Share your referral code to get started!"}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginated.map((c: any) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-foreground">{c.fullName}</div>
                    <div className="text-sm text-muted-foreground">{c.email} · {c.phone}</div>
                    <div className="text-xs text-muted-foreground mt-1">Joined {new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Cashback</div>
                      <div className="font-semibold text-primary">RM {c.cashbackBalance?.toFixed(2) ?? "0.00"}</div>
                    </div>
                    {c.isVerified ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <XCircle size={18} className="text-muted-foreground/40" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{filtered.length} customer{filtered.length !== 1 ? "s" : ""}</span>
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
