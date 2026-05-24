import { useState, useEffect } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  UserCog, Plus, Search, Ban, CheckCircle, Trash2, KeyRound, RefreshCw,
  ChevronLeft, ChevronRight, Pencil, Save, X, Mail, Phone, Shield,
} from "lucide-react";
import { useSearch } from "wouter";

const PAGE_SIZE = 10;

interface SuperUser {
  id: number; fullName: string; email: string; phone: string;
  role: string; referralCode: string; cashbackBalance: number;
  isVerified: boolean; isSuspended: boolean; createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-amber-100 text-amber-700 border-amber-300",
  admin: "bg-purple-100 text-purple-700 border-purple-300",
  agent: "bg-emerald-100 text-emerald-700 border-emerald-300",
  customer: "bg-blue-100 text-blue-700 border-blue-300",
  guest: "bg-gray-100 text-gray-700 border-gray-300",
};

export default function SuperAdminUsers() {
  const { toast } = useToast();
  const searchStr = useSearch();
  const roleFilter = new URLSearchParams(searchStr).get("role") ?? "";
  const [users, setUsers] = useState<SuperUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState(roleFilter);
  const [page, setPage] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState<SuperUser | null>(null);
  const [editingUser, setEditingUser] = useState<SuperUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", phone: "", password: "", role: "customer" });
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", role: "customer", isSuspended: false, isVerified: false });

  const token = () => localStorage.getItem("kynaz_token") ?? "";

  const fetchUsers = () => {
    setLoading(true);
    const url = filterRole ? `/api/superadmin/users?role=${filterRole}` : "/api/superadmin/users";
    fetch(url, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(data => { setUsers(data as SuperUser[]); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [filterRole]);

  const handleSuspend = async (user: SuperUser) => {
    const res = await fetch(`/api/superadmin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ isSuspended: !user.isSuspended }),
    });
    if (res.ok) {
      toast({ title: user.isSuspended ? "User unsuspended" : "User suspended" });
      fetchUsers();
    } else {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    }
  };

  const handleDelete = async (user: SuperUser) => {
    if (!confirm(`Delete ${user.fullName}? This cannot be undone.`)) return;
    const res = await fetch(`/api/superadmin/users/${user.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      toast({ title: "User deleted", description: `${user.fullName} has been removed.` });
      fetchUsers();
    } else {
      const d = await res.json() as { error?: string };
      toast({ title: "Error", description: d.error ?? "Failed to delete user", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    if (!createForm.fullName || !createForm.email || !createForm.phone || !createForm.password) {
      toast({ title: "All fields required", variant: "destructive" }); return;
    }
    const res = await fetch("/api/superadmin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(createForm),
    });
    const data = await res.json() as { error?: string };
    if (res.ok) {
      toast({ title: "User created", description: `${createForm.fullName} has been created.` });
      setShowCreateDialog(false);
      setCreateForm({ fullName: "", email: "", phone: "", password: "", role: "customer" });
      fetchUsers();
    } else {
      toast({ title: "Error", description: data.error ?? "Failed to create user", variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    if (!showResetDialog || newPassword.length < 6) {
      toast({ title: "Password too short (min 6 chars)", variant: "destructive" }); return;
    }
    const res = await fetch(`/api/superadmin/users/${showResetDialog.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ newPassword }),
    });
    if (res.ok) {
      toast({ title: "Password reset", description: `Password updated for ${showResetDialog.fullName}` });
      setShowResetDialog(null); setNewPassword("");
    } else {
      toast({ title: "Error", description: "Failed to reset password", variant: "destructive" });
    }
  };

  const openEdit = (user: SuperUser) => {
    setEditingUser(user);
    setEditForm({ fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, isSuspended: user.isSuspended, isVerified: user.isVerified });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const res = await fetch(`/api/superadmin/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...editForm }),
    });
    if (res.ok) {
      toast({ title: "User updated", description: `${editForm.fullName}'s details have been saved.` });
      setEditingUser(null);
      fetchUsers();
    } else {
      const d = await res.json() as { error?: string };
      toast({ title: "Error", description: d.error ?? "Failed to update user", variant: "destructive" });
    }
  };

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleRoleFilter = (v: string) => { setFilterRole(v === "all" ? "" : v); setPage(0); };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <UserCog size={24} className="text-purple-500" /> Manage Users
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {users.length} total users · click any row to edit
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus size={16} /> Create User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
                <Input placeholder="Search by name or email…" className="pl-9" value={search} onChange={e => handleSearch(e.target.value)} />
              </div>
              <Select value={filterRole || "all"} onValueChange={handleRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchUsers}><RefreshCw size={16} /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No users found.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {paginated.map((user, i) => (
                    <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                      <div
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 hover:border-primary/30 flex-wrap cursor-pointer transition-colors"
                        onClick={() => openEdit(user)}
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm shrink-0">
                          {user.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground flex items-center gap-2 flex-wrap">
                            {user.fullName}
                            {user.isSuspended && <Badge variant="destructive" className="text-xs">Suspended</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{user.email} · {user.phone}</div>
                        </div>
                        <Badge className={`text-xs border ${ROLE_COLORS[user.role] ?? ""}`}>{user.role}</Badge>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => openEdit(user)}>
                            <Pencil size={14} className="text-primary" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title={user.isSuspended ? "Unsuspend" : "Suspend"} onClick={() => handleSuspend(user)}>
                            {user.isSuspended ? <CheckCircle size={15} className="text-emerald-500" /> : <Ban size={15} className="text-orange-500" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Reset password" onClick={() => setShowResetDialog(user)}>
                            <KeyRound size={15} className="text-blue-500" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Delete" onClick={() => handleDelete(user)}>
                            <Trash2 size={15} className="text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                        <ChevronLeft size={16} /> Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                        Next <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={open => { if (!open) setEditingUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Pencil size={16} className="text-primary" /> Edit User
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-1">
              <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Shield size={12} /> Referral: {editingUser.referralCode}
                  &nbsp;·&nbsp; Cashback: RM {editingUser.cashbackBalance.toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
                  <Input value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                    <Mail size={11} /> Email Address
                  </label>
                  <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                  <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
                  <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-muted-foreground">Suspended</label>
                  <button
                    type="button"
                    onClick={() => setEditForm(f => ({ ...f, isSuspended: !f.isSuspended }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.isSuspended ? "bg-red-500" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.isSuspended ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-muted-foreground">Verified</label>
                  <button
                    type="button"
                    onClick={() => setEditForm(f => ({ ...f, isVerified: !f.isVerified }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.isVerified ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.isVerified ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setEditingUser(null)}>
                  <X size={15} /> Cancel
                </Button>
                <Button className="flex-1 gap-2 bg-primary text-white" onClick={handleSaveEdit}>
                  <Save size={15} /> Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Create New User</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Full Name" value={createForm.fullName} onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))} />
            <Input placeholder="Email" type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
            <Input placeholder="Phone" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
            <Input placeholder="Password (min 6 chars)" type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
            <Select value={createForm.role} onValueChange={v => setCreateForm(f => ({ ...f, role: v }))}>
              <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!showResetDialog} onOpenChange={open => { if (!open) { setShowResetDialog(null); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Reset Password — {showResetDialog?.fullName}</DialogTitle></DialogHeader>
          <div className="py-2">
            <Input placeholder="New password (min 6 chars)" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowResetDialog(null); setNewPassword(""); }}>Cancel</Button>
            <Button onClick={handleResetPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
