import { useState, useEffect } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { UserCog, Plus, Search, Ban, CheckCircle, Trash2, KeyRound, RefreshCw } from "lucide-react";
import { useSearch } from "wouter";

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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState<SuperUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", phone: "", password: "", role: "customer" });

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
    const action = user.isSuspended ? "unsuspend" : "suspend";
    const res = await fetch(`/api/superadmin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ isSuspended: !user.isSuspended }),
    });
    if (res.ok) {
      toast({ title: `User ${action}ed`, description: `${user.fullName} has been ${action}ed.` });
      fetchUsers();
    } else {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    const res = await fetch(`/api/superadmin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      toast({ title: "Role updated", description: "User role has been changed." });
      fetchUsers();
    } else {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
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
    const data = await res.json() as { error?: string; id?: number };
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
      toast({ title: "Password too short", variant: "destructive" }); return;
    }
    const res = await fetch(`/api/superadmin/users/${showResetDialog.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ newPassword }),
    });
    if (res.ok) {
      toast({ title: "Password reset", description: `Password updated for ${showResetDialog.fullName}` });
      setShowResetDialog(null);
      setNewPassword("");
    } else {
      toast({ title: "Error", description: "Failed to reset password", variant: "destructive" });
    }
  };

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <UserCog size={24} className="text-purple-500" /> Manage Users
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Create, edit roles, suspend or delete accounts</p>
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
                <Input placeholder="Search by name or email…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={filterRole || "all"} onValueChange={v => setFilterRole(v === "all" ? "" : v)}>
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
              <div className="space-y-2">
                {filtered.map((user, i) => (
                  <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 flex-wrap">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm shrink-0">
                        {user.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">{user.fullName}</div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      </div>
                      <Badge className={`text-xs border ${ROLE_COLORS[user.role] ?? ""}`}>{user.role}</Badge>
                      {user.isSuspended && <Badge variant="destructive" className="text-xs">Suspended</Badge>}

                      <Select defaultValue={user.role} onValueChange={v => handleRoleChange(user.id, v)}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex gap-1">
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
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
          <DialogHeader><DialogTitle>Reset Password — {showResetDialog?.fullName}</DialogTitle></DialogHeader>
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
