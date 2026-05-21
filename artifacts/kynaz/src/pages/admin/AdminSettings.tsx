import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetQuotationSpeedSetting, useSetQuotationSpeed, getGetQuotationSpeedSettingQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Zap, Clock, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminSettings() {
  const { data: speedSetting, isLoading } = useGetQuotationSpeedSetting();
  const updateMutation = useSetQuotationSpeed();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [fastMode, setFastMode] = useState(false);

  useEffect(() => {
    if (speedSetting) {
      setFastMode(speedSetting.fastMode);
    }
  }, [speedSetting]);

  const handleToggle = (value: boolean) => {
    setFastMode(value);
    updateMutation.mutate({ data: { fastMode: value } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetQuotationSpeedSettingQueryKey() });
        toast({
          title: value ? "Fast mode enabled!" : "Standard mode enabled",
          description: value
            ? "Quotations will now be processed in 10–15 minutes."
            : "Quotations will be processed within 24 hours.",
        });
      },
      onError: () => {
        setFastMode(!value);
        toast({ title: "Error", description: "Failed to update setting.", variant: "destructive" });
      },
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif font-bold text-foreground">Portal Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure system-wide settings</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings size={18} className="text-primary" />
            <h2 className="font-semibold text-foreground">Quotation Processing Speed</h2>
          </div>

          {isLoading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : (
            <div className="space-y-4">
              <div className={`rounded-xl border p-5 transition-all ${fastMode ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {fastMode ? <Zap size={22} className="text-emerald-600" /> : <Clock size={22} className="text-blue-600" />}
                    <div>
                      <div className={`font-semibold ${fastMode ? "text-emerald-800" : "text-blue-800"}`}>
                        {fastMode ? "Fast Mode Active" : "Standard Mode Active"}
                      </div>
                      <div className={`text-sm ${fastMode ? "text-emerald-600" : "text-blue-600"}`}>
                        {fastMode ? "Quotations processed in 10–15 minutes" : "Quotations processed within 24 hours"}
                      </div>
                    </div>
                  </div>
                  <Switch
                    data-testid="toggle-fast-mode"
                    checked={fastMode}
                    onCheckedChange={handleToggle}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${!fastMode ? "border-blue-200 bg-blue-50" : "border-border bg-muted/30"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-blue-600" />
                    <span className="font-medium text-sm text-foreground">Standard Mode</span>
                    {!fastMode && <CheckCircle2 size={14} className="text-blue-600 ml-auto" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Quotations are processed within 24 hours by our team.</p>
                </div>
                <div className={`p-4 rounded-lg border ${fastMode ? "border-emerald-200 bg-emerald-50" : "border-border bg-muted/30"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={16} className="text-emerald-600" />
                    <span className="font-medium text-sm text-foreground">Fast Mode</span>
                    {fastMode && <CheckCircle2 size={14} className="text-emerald-600 ml-auto" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Quotations generated within 10–15 minutes. Best for high-volume periods.</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                This setting affects the message displayed to customers when they submit quotation requests.
              </p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Portal Information</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: "Portal Name", value: "Kynaz Enterprise Portal" },
              { label: "Version", value: "1.0.0 (Phase 1 MVP)" },
              { label: "Environment", value: "Production" },
              { label: "Last Updated", value: new Date().toLocaleDateString("en-MY") },
            ].map(item => (
              <div key={item.label} className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                <div className="font-medium text-foreground">{item.value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
