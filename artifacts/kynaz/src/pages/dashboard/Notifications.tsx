import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bell, FileText, Wallet, RefreshCw, Megaphone, Settings, CheckCheck } from "lucide-react";

const typeConfig: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  quotation: { icon: FileText, color: "text-primary bg-primary/10" },
  cashback: { icon: Wallet, color: "text-secondary bg-secondary/10" },
  renewal: { icon: RefreshCw, color: "text-amber-600 bg-amber-100" },
  announcement: { icon: Megaphone, color: "text-purple-600 bg-purple-100" },
  system: { icon: Settings, color: "text-gray-600 bg-gray-100" },
};

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markReadMutation = useMarkNotificationRead();
  const queryClient = useQueryClient();

  const markRead = (id: number) => {
    markReadMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
    });
  };

  const unread = notifications?.filter(n => !n.isRead) ?? [];

  return (
    <ProtectedLayout>
      <div className="max-w-3xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {unread.length > 0 ? `${unread.length} unread notification${unread.length > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          {unread.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => unread.forEach(n => markRead(n.id))}
              disabled={markReadMutation.isPending}
            >
              <CheckCheck size={15} /> Mark all read
            </Button>
          )}
        </motion.div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : !notifications?.length ? (
          <div className="bg-card border border-border rounded-xl p-16 text-center">
            <Bell size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground mb-2">No notifications</h3>
            <p className="text-muted-foreground text-sm">You're all caught up. We'll notify you when there's something new.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const config = typeConfig[n.type] ?? typeConfig.system;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  data-testid={`notification-${n.id}`}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                    n.isRead
                      ? "bg-card border-border"
                      : "bg-primary/5 border-primary/20"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                    <config.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`font-medium text-sm ${n.isRead ? "text-foreground" : "text-primary font-semibold"}`}>{n.title}</div>
                        <div className="text-muted-foreground text-sm mt-0.5">{n.message}</div>
                        <div className="text-muted-foreground text-xs mt-1.5">{new Date(n.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                      {!n.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs shrink-0"
                          onClick={() => markRead(n.id)}
                          disabled={markReadMutation.isPending}
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
