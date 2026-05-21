import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListAdminUsers, useSuspendUser, useUpdateAdminUser, getListAdminUsersQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Shield, ShieldOff, CheckCircle2, XCircle, Pencil, X, Save } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "@workspace/api-client-react";

const editSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
});

type EditData = z.infer<typeof editSchema>;

export default function AdminUsers() {
  const { data: users, isLoading } = useListAdminUsers();
  const suspendMutation = useSuspendUser();
  const updateMutation = useUpdateAdminUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filtered = users?.filter(u =>
    !search ||
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const form = useForm<EditData>({
    resolver: zodResolver(editSchema),
    defaultValues: { fullName: "", phone: "" },
  });

  const openEdit = (user: User) => {
    setEditingUser(user);
    form.reset({ fullName: user.fullName, phone: user.phone });
  };

  const closeEdit = () => {
    setEditingUser(null);
    form.reset();
  };

  const onEditSubmit = (data: EditData) => {
    if (!editingUser) return;
    updateMutation.mutate({ id: editingUser.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
        toast({ title: "User updated!", description: `${data.fullName}'s details have been saved.` });
        closeEdit();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update user.", variant: "destructive" });
      },
    });
  };

  const handleToggleSuspend = (id: number, name: string, currentlySuspended: boolean) => {
    const newState = !currentlySuspended;
    suspendMutation.mutate({ id, data: { suspended: newState } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
        toast({
          title: newState ? "User suspended" : "User reactivated",
          description: `${name} has been ${newState ? "suspended" : "reactivated"}.`,
        });
      },
      onError: () => toast({ title: "Error", description: "Failed to update user status.", variant: "destructive" }),
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{users?.length ?? 0} registered users</p>
        </motion.div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="input-search"
            placeholder="Search users by name or email..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Users size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground">No users found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((user, i) => (
              <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div
                  data-testid={`row-user-${user.id}`}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {user.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground text-sm flex items-center gap-2 flex-wrap">
                        {user.fullName}
                        {user.role !== "customer" && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded capitalize">{user.role}</span>
                        )}
                        {user.isSuspended && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Suspended</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{user.email} · {user.phone}</div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">Cashback: RM {user.cashbackBalance.toFixed(2)}</span>
                        {user.isVerified ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 size={11} /> Verified</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600"><XCircle size={11} /> Unverified</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Edit button */}
                    <Button
                      data-testid={`button-edit-${user.id}`}
                      size="sm"
                      variant="outline"
                      className="text-primary border-primary/20 hover:bg-primary hover:text-white gap-1.5 h-8"
                      onClick={() => openEdit(user)}
                    >
                      <Pencil size={13} /> Edit
                    </Button>

                    {/* Suspend/Reactivate */}
                    {user.role !== "customer" ? (
                      <span className="text-xs text-muted-foreground">Protected</span>
                    ) : user.isSuspended ? (
                      <Button
                        data-testid={`button-unsuspend-${user.id}`}
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1.5 h-8"
                        onClick={() => handleToggleSuspend(user.id, user.fullName, true)}
                        disabled={suspendMutation.isPending}
                      >
                        <Shield size={14} /> Reactivate
                      </Button>
                    ) : (
                      <Button
                        data-testid={`button-suspend-${user.id}`}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5 h-8"
                        onClick={() => handleToggleSuspend(user.id, user.fullName, false)}
                        disabled={suspendMutation.isPending}
                      >
                        <ShieldOff size={14} /> Suspend
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Edit User Details</DialogTitle>
            <DialogDescription>
              Update the details for <span className="font-semibold">{editingUser?.fullName}</span>
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 mt-2">
              <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
                <div className="text-xs text-muted-foreground">Email (cannot be changed)</div>
                <div className="font-medium text-foreground">{editingUser?.email}</div>
              </div>

              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="0123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1 gap-2" onClick={closeEdit}>
                  <X size={15} /> Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="flex-1 bg-primary text-white gap-2">
                  <Save size={15} />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
