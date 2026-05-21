import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { User, Mail, Phone, Shield, Tag, Calendar } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const fields = [
    { icon: User, label: "Full Name", value: user.fullName },
    { icon: Mail, label: "Email Address", value: user.email },
    { icon: Phone, label: "Phone Number", value: user.phone },
    { icon: Shield, label: "Account Role", value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
    { icon: Tag, label: "Referral Code", value: user.referralCode },
    { icon: Calendar, label: "Member Since", value: new Date(user.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" }) },
  ];

  return (
    <ProtectedLayout>
      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Your account information</p>
        </motion.div>

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-serif font-bold text-2xl">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <div className="text-xl font-semibold text-foreground">{user.fullName}</div>
            <div className="text-muted-foreground text-sm">{user.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {user.isVerified ? "Verified" : "Unverified"}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary capitalize">
                {user.role}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Info fields */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-5">Account Details</h2>
          <div className="space-y-4">
            {fields.map((field, i) => (
              <motion.div
                key={field.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                className="flex items-center gap-4 py-3 border-b border-border last:border-0"
              >
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <field.icon size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{field.label}</div>
                  <div className="text-sm font-medium text-foreground" data-testid={`profile-${field.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    {field.value}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Cashback Balance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-primary text-white rounded-xl p-6">
          <div className="text-white/70 text-sm mb-1">Current Cashback Balance</div>
          <div className="text-3xl font-bold">RM {user.cashbackBalance.toFixed(2)}</div>
          <div className="text-white/60 text-xs mt-1">Available for redemption on future services</div>
        </motion.div>
      </div>
    </ProtectedLayout>
  );
}
