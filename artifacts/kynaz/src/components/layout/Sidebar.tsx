import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
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

export function Sidebar({ userRole, onNavClick }: { userRole: string; onNavClick?: () => void }) {
  const [location] = useLocation();
  const [, setLocation] = useWouterLocation();
  const { logout } = useAuth();
  const isAdmin = userRole === "admin" || userRole === "superadmin";
  const isSuperAdmin = userRole === "superadmin";
  const isAgent = userRole === "agent";

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const customerLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/quotations", label: "My Quotations", icon: FileText },
    { href: "/dashboard/cashback", label: "Cashback Wallet", icon: Wallet },
    { href: "/dashboard/referrals", label: "Referrals", icon: Users },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ];

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/quotations", label: "Quotations", icon: FileText },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/agents", label: "Agents", icon: Megaphone },
    { href: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/admin/cashback", label: "Cashback Mgt", icon: Wallet },
    { href: "/admin/infographics", label: "Infographics", icon: BarChart3 },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    ...(isSuperAdmin ? [
      { href: "/superadmin", label: "Super Admin", icon: ShieldCheck },
      { href: "/superadmin/users", label: "Manage Users", icon: UserCog },
    ] : []),
  ];

  const agentLinks = [
    { href: "/agent", label: "Dashboard", icon: LayoutDashboard },
    { href: "/agent/customers", label: "My Customers", icon: Users },
    { href: "/agent/quotations", label: "Quotations", icon: FileText },
    { href: "/agent/commissions", label: "Commissions", icon: Wallet },
    { href: "/agent/ranking", label: "Leaderboard", icon: Trophy },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ];

  const links = isAdmin ? adminLinks : isAgent ? agentLinks : customerLinks;
  const portalLabel = isSuperAdmin ? "Super Admin" : isAdmin ? "Admin Portal" : isAgent ? "Agent Portal" : "Portal";

  return (
    <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3" onClick={onNavClick}>
          <div className="w-8 h-8 bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center rounded font-serif font-bold">
            K
          </div>
          <span className="font-serif font-bold text-xl text-sidebar-foreground">
            {portalLabel}
          </span>
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-1 py-4 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || (location.startsWith(link.href + "/") && link.href !== "/dashboard" && link.href !== "/admin" && link.href !== "/superadmin");
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut size={18} className="mr-3" />
              Logout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out of Kynaz Enterprise Portal?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-primary text-white hover:bg-primary/90">
                Yes, Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
