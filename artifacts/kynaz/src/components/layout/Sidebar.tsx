import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  LayoutDashboard,
  FileText,
  Wallet,
  Users,
  Bell,
  User,
  Settings,
  LogOut,
  Trophy,
  Megaphone,
  BarChart3,
  ShieldCheck,
  UserCog,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLocation as useWouterLocation } from "wouter";

export function Sidebar({
  userRole,
  onNavClick,
  onClose,
}: {
  userRole: string;
  onNavClick?: () => void;
  onClose?: () => void;
}) {
  const [location] = useLocation();
  const [, setLocation] = useWouterLocation();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const isAdmin = userRole === "admin" || userRole === "superadmin";
  const isSuperAdmin = userRole === "superadmin";
  const isAgent = userRole === "agent";

  const logoHref = isAdmin ? (isSuperAdmin ? "/superadmin" : "/admin") : isAgent ? "/agent" : "/dashboard";

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const customerLinks = [
    { href: "/dashboard", labelKey: "sidebar.overview", icon: LayoutDashboard },
    { href: "/dashboard/quotations", labelKey: "sidebar.quotations", icon: FileText },
    { href: "/dashboard/cashback", labelKey: "sidebar.cashback", icon: Wallet },
    { href: "/dashboard/referrals", labelKey: "sidebar.referrals", icon: Users },
    { href: "/dashboard/notifications", labelKey: "sidebar.notifications", icon: Bell },
    { href: "/dashboard/profile", labelKey: "sidebar.profile", icon: User },
  ];

  const adminLinks = [
    { href: "/admin", labelKey: "admin.dashboard", icon: LayoutDashboard },
    { href: "/admin/quotations", labelKey: "admin.quotations", icon: FileText },
    { href: "/admin/users", labelKey: "admin.users", icon: Users },
    { href: "/admin/agents", labelKey: "admin.agents", icon: Megaphone },
    { href: "/admin/leaderboard", labelKey: "admin.leaderboard", icon: Trophy },
    { href: "/admin/cashback", labelKey: "admin.cashback", icon: Wallet },
    { href: "/admin/infographics", labelKey: "admin.infographics", icon: BarChart3 },
    { href: "/admin/settings", labelKey: "admin.settings", icon: Settings },
    ...(isSuperAdmin
      ? [
          { href: "/superadmin", labelKey: "sidebar.superAdmin", icon: ShieldCheck },
          { href: "/superadmin/users", labelKey: "admin.manageUsers", icon: UserCog },
        ]
      : []),
  ];

  const agentLinks = [
    { href: "/agent", labelKey: "agent.dashboard", icon: LayoutDashboard },
    { href: "/agent/customers", labelKey: "agent.customers", icon: Users },
    { href: "/agent/quotations", labelKey: "agent.quotations", icon: FileText },
    { href: "/agent/commissions", labelKey: "agent.commissions", icon: Wallet },
    { href: "/agent/ranking", labelKey: "agent.ranking", icon: Trophy },
    { href: "/dashboard/notifications", labelKey: "sidebar.notifications", icon: Bell },
    { href: "/dashboard/profile", labelKey: "sidebar.profile", icon: User },
  ];

  const links = isAdmin ? adminLinks : isAgent ? agentLinks : customerLinks;
  const portalLabel = isSuperAdmin
    ? t("sidebar.superAdmin")
    : isAdmin
      ? t("sidebar.adminPortal")
      : isAgent
        ? t("sidebar.agentPortal")
        : t("sidebar.portal");

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <div className="p-5 flex items-center justify-between">
        <Link
          href={logoHref}
          className="flex items-center gap-3"
          onClick={onNavClick}
        >
          <img src="/logo.png" alt="KYNAZ" className="h-8 w-auto object-contain shrink-0" />
          <span className="font-bold text-xl text-foreground">
            {portalLabel}
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 px-4 space-y-1 py-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            location === link.href ||
            (location.startsWith(link.href + "/") &&
              link.href !== "/dashboard" &&
              link.href !== "/admin" &&
              link.href !== "/superadmin");
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon size={18} />
              {t(link.labelKey)}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <LogOut size={18} className="mr-3" />
              {t("sidebar.logout")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("logout.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("logout.desc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("logout.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {t("logout.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
