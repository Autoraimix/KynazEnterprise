import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@kynazenterprise.my";

// Staff inbox — all alert emails go here
export const STAFF_EMAIL = process.env.STAFF_EMAIL ?? process.env.SMTP_USER ?? "admin@kynazenterprise.my";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[email] SMTP not configured — skipping email to", opts.to);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, ...opts });
    console.info("[email] Sent to", opts.to, "—", opts.subject);
  } catch (err) {
    console.error("[email] Failed to send to", opts.to, err instanceof Error ? err.message : err);
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    pending: "#e97316",
    processing: "#3b82f6",
    ready: "#8b5cf6",
    approved: "#0ea5e9",
    paid: "#16a34a",
    cancelled: "#ef4444",
    rejected: "#ef4444",
  };
  const colour = map[status] ?? "#888";
  return `<span style="display:inline-block;background:${colour};color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;text-transform:capitalize">${status}</span>`;
}

function formDataRows(data: Record<string, unknown>): string {
  const skip = new Set(["travelItinerary"]);
  return Object.entries(data)
    .filter(([k, v]) => !skip.has(k) && v != null && v !== "")
    .map(([k, v]) => {
      const label = k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
      return `<tr>
        <td style="padding:5px 8px;color:#888;font-size:12px;width:40%;vertical-align:top">${label}</td>
        <td style="padding:5px 8px;font-weight:600;font-size:13px;color:#1a1a2e;word-break:break-word">${String(v)}</td>
      </tr>`;
    })
    .join("");
}

// ─── Base layout ──────────────────────────────────────────────────────────────

function baseLayout(content: string, badge = "Member Portal"): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; max-width: 580px; margin: 0 auto; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { border-bottom: 2px solid #0d1f3c; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: bold; color: #0d1f3c; font-family: Georgia, serif; }
    .badge-pill { display: inline-block; background: #0d1f3c; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 4px; }
    .section { background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .label { color: #888; font-size: 12px; margin-bottom: 2px; }
    .value { font-weight: bold; color: #0d1f3c; font-size: 15px; }
    .amount { font-size: 22px; color: #0d1f3c; font-weight: bold; }
    .footer { margin-top: 28px; font-size: 12px; color: #aaa; text-align: center; }
    .btn { display: inline-block; background: #0d1f3c; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; margin: 16px 0; }
    .alert-box { border-left: 4px solid #c9a84c; background: #fffbeb; padding: 12px 16px; border-radius: 6px; margin: 16px 0; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table tr:nth-child(even) td { background: #f8f8f8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">Kynaz Enterprise</div>
      <div class="badge-pill">${badge}</div>
    </div>
    ${content}
    <div class="footer">
      This is an automated message from Kynaz Enterprise. Please do not reply directly.<br/>
      &copy; ${new Date().getFullYear()} Kynaz Enterprise. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CUSTOMER — Quotation lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

export function emailQuotationSubmitted(opts: { name: string; ref: string; service: string }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Quotation Submitted Successfully</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>We have received your quotation request. Our team will review it and get back to you shortly.</p>
    <div class="section">
      <div class="label">Quotation Reference</div>
      <div class="value">${opts.ref}</div>
      <div class="label" style="margin-top:10px">Service</div>
      <div class="value">${opts.service}</div>
    </div>
    <p>You can track the status of your quotation anytime from your member dashboard.</p>
  `);
}

export function emailGuestQuotationConfirmation(opts: { name: string; ref: string; service: string; email: string; phone: string }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Quotation Request Received</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>Thank you for reaching out to Kynaz Enterprise. We have received your quotation request and our team will be in touch shortly.</p>
    <div class="section">
      <div class="label">Quotation Reference</div>
      <div class="value" style="font-size:18px;letter-spacing:1px">${opts.ref}</div>
      <div class="label" style="margin-top:10px">Service Requested</div>
      <div class="value">${opts.service}</div>
      <div class="label" style="margin-top:10px">Contact Email</div>
      <div class="value">${opts.email}</div>
      <div class="label" style="margin-top:10px">Contact Phone</div>
      <div class="value">${opts.phone}</div>
    </div>
    <div class="alert-box">
      <strong>Please save your reference number: ${opts.ref}</strong><br/>
      Our team will contact you via your registered phone number or email address.
    </div>
    <p>Want to track your quotation status, earn cashback rewards, and get exclusive member benefits?</p>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/register" class="btn">Create a Free Account</a>
    <p style="color:#888;font-size:13px">If you did not submit this request, please disregard this email.</p>
  `, "Guest Enquiry");
}

export function emailQuotationReady(opts: { name: string; ref: string; service: string; price?: number; dashboardUrl: string }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Your Quotation is Ready!</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>Great news! Your quotation has been prepared and is ready for your review.</p>
    <div class="section">
      <div class="label">Quotation Reference</div>
      <div class="value">${opts.ref}</div>
      <div class="label" style="margin-top:10px">Service</div>
      <div class="value">${opts.service}</div>
      ${opts.price != null ? `
      <div class="label" style="margin-top:10px">Amount</div>
      <div class="amount">RM ${opts.price.toFixed(2)}</div>` : ""}
    </div>
    <p>Please log in to your dashboard to review and accept your quotation.</p>
    <a href="${opts.dashboardUrl}" class="btn">View Quotation</a>
  `);
}

export function emailQuotationStatusChanged(opts: { name: string; ref: string; service: string; status: string; remarks?: string }): string {
  const messages: Record<string, string> = {
    cancelled: "Your quotation request has been cancelled. If you believe this is an error or would like to resubmit, please contact our team.",
    rejected: "Unfortunately, your quotation request could not be processed at this time. Please contact our team for more information.",
    processing: "Your quotation is currently being processed by our team. We will notify you once it is ready.",
  };
  const body = messages[opts.status] ?? `Your quotation status has been updated to: <strong>${opts.status}</strong>.`;
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Quotation Update</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>${body}</p>
    <div class="section">
      <div class="label">Quotation Reference</div>
      <div class="value">${opts.ref}</div>
      <div class="label" style="margin-top:10px">Service</div>
      <div class="value">${opts.service}</div>
      <div class="label" style="margin-top:10px">Status</div>
      <div style="margin-top:4px">${statusBadge(opts.status)}</div>
      ${opts.remarks ? `<div class="label" style="margin-top:10px">Remarks from Team</div>
      <div class="value">${opts.remarks}</div>` : ""}
    </div>
    <p>Log in to your dashboard to view full details or submit a new request.</p>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/dashboard/quotations" class="btn">View Dashboard</a>
  `);
}

export function emailPaymentProofReceived(opts: { name: string; ref: string; service: string; amount?: number }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Payment Proof Received</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>We have received your payment proof. Our team will verify your payment and process it shortly.</p>
    <div class="section">
      <div class="label">Quotation Reference</div>
      <div class="value">${opts.ref}</div>
      <div class="label" style="margin-top:10px">Service</div>
      <div class="value">${opts.service}</div>
      ${opts.amount != null ? `
      <div class="label" style="margin-top:10px">Amount Submitted</div>
      <div class="amount">RM ${opts.amount.toFixed(2)}</div>` : ""}
    </div>
    <p>Cashback will be credited to your wallet once payment is verified. Thank you!</p>
  `);
}

export function emailPaymentVerified(opts: { name: string; ref: string; service: string; cashback?: number }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Payment Verified ✓</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>Your payment has been verified and confirmed by our team.</p>
    <div class="section">
      <div class="label">Quotation Reference</div>
      <div class="value">${opts.ref}</div>
      <div class="label" style="margin-top:10px">Service</div>
      <div class="value">${opts.service}</div>
      ${opts.cashback != null && opts.cashback > 0 ? `
      <div class="label" style="margin-top:10px">Cashback Credited</div>
      <div class="amount" style="color:#16a34a">RM ${opts.cashback.toFixed(2)}</div>` : ""}
    </div>
    <p>Thank you for choosing Kynaz Enterprise. We look forward to serving you again!</p>
  `);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STAFF — Internal alert emails (to admin inbox)
// ═══════════════════════════════════════════════════════════════════════════════

export function emailStaffNewQuotation(opts: {
  ref: string;
  service: string;
  isGuest: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  formData: Record<string, unknown>;
  dashboardUrl: string;
}): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">
      ${opts.isGuest ? "🔔 New Guest Quotation" : "🔔 New Member Quotation"} Received
    </h2>
    <div class="alert-box">
      <strong>${opts.isGuest ? "Guest" : "Member"} submitted a new quotation — action required.</strong>
    </div>
    <div class="section">
      <div class="label">Reference</div>
      <div class="value">${opts.ref}</div>
      <div class="label" style="margin-top:10px">Service</div>
      <div class="value">${opts.service}</div>
      <div class="label" style="margin-top:10px">Customer Type</div>
      <div class="value">${opts.isGuest ? "Guest (No Account)" : "Registered Member"}</div>
      <div class="label" style="margin-top:10px">Name</div>
      <div class="value">${opts.customerName}</div>
      <div class="label" style="margin-top:10px">Email</div>
      <div class="value">${opts.customerEmail}</div>
      <div class="label" style="margin-top:10px">Phone</div>
      <div class="value">${opts.customerPhone}</div>
    </div>
    <p style="font-weight:600;margin-bottom:8px">Submission Details:</p>
    <table class="data-table">
      ${formDataRows(opts.formData)}
    </table>
    <br/>
    <a href="${opts.dashboardUrl}" class="btn">Open Admin Dashboard</a>
  `, "Staff Alert");
}

export function emailStaffNewUser(opts: { name: string; email: string; phone: string; role: string; referredBy?: string }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">👤 New User Registered</h2>
    <div class="section">
      <div class="label">Full Name</div>
      <div class="value">${opts.name}</div>
      <div class="label" style="margin-top:10px">Email</div>
      <div class="value">${opts.email}</div>
      <div class="label" style="margin-top:10px">Phone</div>
      <div class="value">${opts.phone}</div>
      <div class="label" style="margin-top:10px">Role</div>
      <div class="value" style="text-transform:capitalize">${opts.role}</div>
      ${opts.referredBy ? `
      <div class="label" style="margin-top:10px">Referred By (Code)</div>
      <div class="value">${opts.referredBy}</div>` : ""}
    </div>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/admin/users" class="btn">Manage Users</a>
  `, "Staff Alert");
}

export function emailStaffWithdrawalRequest(opts: { name: string; email: string; amount: number; type: "customer" | "agent"; bankName: string; accountName: string; accountNumber: string; dashboardUrl: string }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">💳 Withdrawal Request Submitted</h2>
    <div class="alert-box">
      A ${opts.type === "agent" ? "commission" : "cashback"} withdrawal request requires processing.
    </div>
    <div class="section">
      <div class="label">Request Type</div>
      <div class="value" style="text-transform:capitalize">${opts.type === "agent" ? "Agent Commission Withdrawal" : "Customer Cashback Withdrawal"}</div>
      <div class="label" style="margin-top:10px">Name</div>
      <div class="value">${opts.name}</div>
      <div class="label" style="margin-top:10px">Email</div>
      <div class="value">${opts.email}</div>
      <div class="label" style="margin-top:10px">Amount Requested</div>
      <div class="amount">RM ${opts.amount.toFixed(2)}</div>
      <div class="label" style="margin-top:10px">Bank</div>
      <div class="value">${opts.bankName}</div>
      <div class="label" style="margin-top:10px">Account Holder</div>
      <div class="value">${opts.accountName}</div>
      <div class="label" style="margin-top:10px">Account Number</div>
      <div class="value">${opts.accountNumber}</div>
    </div>
    <a href="${opts.dashboardUrl}" class="btn">Process in Admin</a>
  `, "Staff Alert");
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CUSTOMER — Account management notifications
// ═══════════════════════════════════════════════════════════════════════════════

export function emailAccountSuspended(opts: { name: string }): string {
  return baseLayout(`
    <h2 style="color:#ef4444;margin-top:0">Account Suspended</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>Your Kynaz Enterprise account has been <strong>suspended</strong> by our team.</p>
    <div class="section" style="border-left:4px solid #ef4444;background:#fef2f2">
      <p style="margin:0;color:#7f1d1d">You are currently unable to log in or access the member portal. If you believe this is an error, please contact our support team immediately.</p>
    </div>
    <p>Contact us at <a href="mailto:admin@kynazenterprise.my">admin@kynazenterprise.my</a> to resolve this matter.</p>
  `);
}

export function emailAccountUnsuspended(opts: { name: string }): string {
  return baseLayout(`
    <h2 style="color:#16a34a;margin-top:0">Account Reinstated</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>Good news! Your Kynaz Enterprise account has been <strong>reinstated</strong>. You may now log in and use all portal features as normal.</p>
    <div class="section" style="border-left:4px solid #16a34a;background:#f0fdf4">
      <p style="margin:0;color:#14532d">Your account is now active. All previous data, cashback balance, and quotations are intact.</p>
    </div>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/login" class="btn">Log In Now</a>
  `);
}

export function emailRoleChanged(opts: { name: string; oldRole: string; newRole: string }): string {
  const roleMessages: Record<string, string> = {
    admin: "You have been granted <strong>Administrator</strong> access to the Kynaz Enterprise portal. You can now manage quotations, users, and cashback settings.",
    agent: "You have been promoted to <strong>Agent</strong> status! You can now refer customers, track commissions, and access the agent dashboard.",
    customer: "Your account role has been updated to <strong>Customer</strong>. You can continue to request quotations and earn cashback rewards.",
    superadmin: "You have been granted <strong>Super Administrator</strong> access to the Kynaz Enterprise system.",
  };
  const msg = roleMessages[opts.newRole] ?? `Your account role has been updated from <em>${opts.oldRole}</em> to <strong>${opts.newRole}</strong>.`;
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Account Role Updated</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>${msg}</p>
    <div class="section">
      <div class="label">Previous Role</div>
      <div class="value" style="text-transform:capitalize">${opts.oldRole}</div>
      <div class="label" style="margin-top:10px">New Role</div>
      <div class="value" style="text-transform:capitalize;color:#0d1f3c">${opts.newRole}</div>
    </div>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/login" class="btn">Log In to Your Portal</a>
    <p style="color:#888;font-size:13px">If you have any questions about your new role or permissions, please contact the Kynaz Enterprise team.</p>
  `);
}

export function emailPasswordResetByAdmin(opts: { name: string; tempPassword: string }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Password Reset by Administrator</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>An administrator has reset your Kynaz Enterprise account password. Your temporary password is:</p>
    <div style="font-size:28px;font-weight:bold;letter-spacing:4px;color:#0d1f3c;text-align:center;padding:20px;background:#f5f5f5;border-radius:8px;border:2px solid #e5e7eb;margin:20px 0;font-family:monospace">
      ${opts.tempPassword}
    </div>
    <div class="alert-box">
      <strong>Important:</strong> Please log in immediately and change your password from your profile settings.
    </div>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/login" class="btn">Log In Now</a>
    <p style="color:#888;font-size:13px">If you did not request a password reset, please contact us immediately at admin@kynazenterprise.my.</p>
  `);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CASHBACK & WITHDRAWALS
// ═══════════════════════════════════════════════════════════════════════════════

export function emailCashbackCredited(opts: { name: string; amount: number; description: string; balance: number }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Cashback Credited to Your Wallet</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>Great news! Cashback has been added to your wallet.</p>
    <div class="section">
      <div class="label">Amount Credited</div>
      <div class="amount" style="color:#16a34a">+ RM ${opts.amount.toFixed(2)}</div>
      <div class="label" style="margin-top:10px">Description</div>
      <div class="value">${opts.description}</div>
      <div class="label" style="margin-top:10px">New Wallet Balance</div>
      <div class="amount">RM ${opts.balance.toFixed(2)}</div>
    </div>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/dashboard/cashback" class="btn">View Wallet</a>
  `);
}

export function emailWithdrawalSubmitted(opts: { name: string; amount: number; type: "cashback" | "commission" }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Withdrawal Request Received</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>We have received your ${opts.type} withdrawal request.</p>
    <div class="section">
      <div class="label">Amount Requested</div>
      <div class="amount">RM ${opts.amount.toFixed(2)}</div>
      <div class="label" style="margin-top:10px">Type</div>
      <div class="value" style="text-transform:capitalize">${opts.type === "commission" ? "Agent Commission" : "Cashback"} Withdrawal</div>
      <div class="label" style="margin-top:10px">Processing Time</div>
      <div class="value">3–5 business days</div>
    </div>
    <p>Our team will process your bank transfer within 3–5 business days. You will receive a confirmation email once completed.</p>
  `);
}

export function emailWithdrawalProcessed(opts: { name: string; amount: number; type: "cashback" | "commission"; status: "completed" | "approved" | "rejected"; adminNotes?: string }): string {
  const isApproved = opts.status === "completed" || opts.status === "approved";
  return baseLayout(`
    <h2 style="color:${isApproved ? "#16a34a" : "#ef4444"};margin-top:0">
      Withdrawal ${isApproved ? "Processed ✓" : "Rejected"}
    </h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>${isApproved
      ? `Your ${opts.type} withdrawal has been <strong>processed</strong>. The transfer has been initiated to your registered bank account.`
      : `Unfortunately, your ${opts.type} withdrawal request has been <strong>rejected</strong>. Any deducted amount has been refunded to your wallet.`}</p>
    <div class="section">
      <div class="label">Amount</div>
      <div class="amount" style="color:${isApproved ? "#16a34a" : "#ef4444"}">RM ${opts.amount.toFixed(2)}</div>
      <div class="label" style="margin-top:10px">Status</div>
      <div style="margin-top:4px">${statusBadge(opts.status)}</div>
      ${opts.adminNotes ? `<div class="label" style="margin-top:10px">Notes from Team</div>
      <div class="value">${opts.adminNotes}</div>` : ""}
    </div>
    ${isApproved
      ? "<p>Please allow 1–3 business days for the amount to reflect in your bank account.</p>"
      : "<p>Please contact our team at <a href='mailto:admin@kynazenterprise.my'>admin@kynazenterprise.my</a> if you have any questions.</p>"}
  `);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AGENT — Notifications
// ═══════════════════════════════════════════════════════════════════════════════

export function emailAgentNewCustomer(opts: { agentName: string; customerName: string; customerEmail: string }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">New Customer Registered via Your Referral</h2>
    <p>Hi <strong>${opts.agentName}</strong>,</p>
    <p>A new customer has registered using your referral code!</p>
    <div class="section">
      <div class="label">Customer Name</div>
      <div class="value">${opts.customerName}</div>
      <div class="label" style="margin-top:10px">Customer Email</div>
      <div class="value">${opts.customerEmail}</div>
    </div>
    <p>Log in to your agent dashboard to track this customer's activity and quotations.</p>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/agent/customers" class="btn">View Customers</a>
  `);
}

export function emailAgentQuotationUpdate(opts: { agentName: string; customerName: string; ref: string; status: string }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Customer Quotation Update</h2>
    <p>Hi <strong>${opts.agentName}</strong>,</p>
    <p>A quotation for one of your referred customers has been updated.</p>
    <div class="section">
      <div class="label">Customer</div>
      <div class="value">${opts.customerName}</div>
      <div class="label" style="margin-top:10px">Quotation Reference</div>
      <div class="value">${opts.ref}</div>
      <div class="label" style="margin-top:10px">New Status</div>
      <div style="margin-top:4px">${statusBadge(opts.status)}</div>
    </div>
    <p>Log in to your agent dashboard to follow up with this customer.</p>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/agent/quotations" class="btn">View Agent Dashboard</a>
  `);
}

export function emailAgentCommissionPayout(opts: { agentName: string; amount: number; newBalance: number }): string {
  return baseLayout(`
    <h2 style="color:#16a34a;margin-top:0">Commission Payout Processed ✓</h2>
    <p>Hi <strong>${opts.agentName}</strong>,</p>
    <p>A commission payout has been processed for your agent account.</p>
    <div class="section">
      <div class="label">Payout Amount</div>
      <div class="amount" style="color:#16a34a">RM ${opts.amount.toFixed(2)}</div>
      <div class="label" style="margin-top:10px">Remaining Commission Balance</div>
      <div class="amount">RM ${opts.newBalance.toFixed(2)}</div>
    </div>
    <p>Please allow 1–3 business days for the amount to reflect in your bank account.</p>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/agent/commissions" class="btn">View Commissions</a>
  `);
}

export function emailAgentBroadcast(opts: { agentName: string; title: string; message: string }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">📢 Agent Announcement</h2>
    <p>Hi <strong>${opts.agentName}</strong>,</p>
    <div class="section" style="border-left:4px solid #c9a84c;background:#fffbeb">
      <p style="font-weight:bold;font-size:16px;margin:0 0 8px">${opts.title}</p>
      <p style="margin:0;color:#555;line-height:1.6">${opts.message}</p>
    </div>
    <p>This message was sent by the Kynaz Enterprise management team. Log in to your dashboard for the latest updates.</p>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/agent" class="btn">Agent Dashboard</a>
  `, "Agent Broadcast");
}

export function emailWelcomeCustomer(opts: { name: string; referralCode: string; agentName?: string }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Welcome to Kynaz Enterprise!</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>Your account has been successfully created. Welcome to the Kynaz Enterprise member portal!</p>
    <div class="section">
      <div class="label">Your Referral Code</div>
      <div class="value" style="font-size:20px;letter-spacing:2px">${opts.referralCode}</div>
      ${opts.agentName ? `
      <div class="label" style="margin-top:10px">Your Agent</div>
      <div class="value">${opts.agentName}</div>` : ""}
    </div>
    <p>You can start requesting quotations, tracking your services, and earning cashback from your dashboard.</p>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/dashboard" class="btn">Go to Dashboard</a>
  `);
}

export function emailAgentWelcome(opts: { name: string; agentId: string; referralCode: string }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Welcome Aboard, Agent!</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>Your agent account has been approved. You can now start referring customers and earning commissions!</p>
    <div class="section">
      <div class="label">Agent ID</div>
      <div class="value">${opts.agentId}</div>
      <div class="label" style="margin-top:10px">Your Referral Code</div>
      <div class="value" style="font-size:20px;letter-spacing:2px">${opts.referralCode}</div>
    </div>
    <p>Share your referral code with potential customers. Every customer who registers and completes a service will earn you commission.</p>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/agent" class="btn">Go to Agent Dashboard</a>
  `);
}

export function emailWelcomeCreatedByAdmin(opts: { name: string; email: string; tempPassword: string; role: string; referralCode: string }): string {
  return baseLayout(`
    <h2 style="color:#0d1f3c;margin-top:0">Your Kynaz Enterprise Account is Ready</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>An administrator has created a Kynaz Enterprise account for you.</p>
    <div class="section">
      <div class="label">Email (Login)</div>
      <div class="value">${opts.email}</div>
      <div class="label" style="margin-top:10px">Temporary Password</div>
      <div class="value" style="font-size:18px;font-family:monospace;letter-spacing:2px">${opts.tempPassword}</div>
      <div class="label" style="margin-top:10px">Account Role</div>
      <div class="value" style="text-transform:capitalize">${opts.role}</div>
      <div class="label" style="margin-top:10px">Your Referral Code</div>
      <div class="value" style="font-size:18px;letter-spacing:2px">${opts.referralCode}</div>
    </div>
    <div class="alert-box">
      <strong>Action Required:</strong> Please log in and change your password immediately from your profile settings.
    </div>
    <a href="${process.env.APP_URL ?? "https://kynazenterprise.my"}/login" class="btn">Log In Now</a>
  `);
}
