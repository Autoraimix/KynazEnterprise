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

const FROM = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@kynazenteprise.my";

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

// ─── Email Templates ─────────────────────────────────────────────────────────

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; max-width: 560px; margin: 0 auto; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: bold; color: #1a1a2e; font-family: Georgia, serif; }
    .badge { display: inline-block; background: #1a1a2e; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 4px; }
    .section { background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .label { color: #888; font-size: 12px; margin-bottom: 2px; }
    .value { font-weight: bold; color: #1a1a2e; font-size: 15px; }
    .amount { font-size: 22px; color: #1a1a2e; font-weight: bold; }
    .footer { margin-top: 28px; font-size: 12px; color: #aaa; text-align: center; }
    .btn { display: inline-block; background: #1a1a2e; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">Kynaz Enterprise</div>
      <div class="badge">Member Portal</div>
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

export function emailQuotationSubmitted(opts: { name: string; ref: string; service: string }): string {
  return baseLayout(`
    <h2 style="color:#1a1a2e;margin-top:0">Quotation Submitted Successfully</h2>
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

export function emailQuotationReady(opts: { name: string; ref: string; service: string; price?: number; dashboardUrl: string }): string {
  return baseLayout(`
    <h2 style="color:#1a1a2e;margin-top:0">Your Quotation is Ready!</h2>
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

export function emailPaymentProofReceived(opts: { name: string; ref: string; service: string; amount?: number }): string {
  return baseLayout(`
    <h2 style="color:#1a1a2e;margin-top:0">Payment Proof Received</h2>
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
    <h2 style="color:#1a1a2e;margin-top:0">Payment Verified ✓</h2>
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

export function emailCashbackCredited(opts: { name: string; amount: number; description: string; balance: number }): string {
  return baseLayout(`
    <h2 style="color:#1a1a2e;margin-top:0">Cashback Credited to Your Wallet</h2>
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
  `);
}

export function emailAgentNewCustomer(opts: { agentName: string; customerName: string; customerEmail: string }): string {
  return baseLayout(`
    <h2 style="color:#1a1a2e;margin-top:0">New Customer Registered via Your Referral</h2>
    <p>Hi <strong>${opts.agentName}</strong>,</p>
    <p>A new customer has registered using your referral code!</p>
    <div class="section">
      <div class="label">Customer Name</div>
      <div class="value">${opts.customerName}</div>
      <div class="label" style="margin-top:10px">Customer Email</div>
      <div class="value">${opts.customerEmail}</div>
    </div>
    <p>Log in to your agent dashboard to track this customer's activity and quotations.</p>
  `);
}

export function emailAgentQuotationUpdate(opts: { agentName: string; customerName: string; ref: string; status: string }): string {
  return baseLayout(`
    <h2 style="color:#1a1a2e;margin-top:0">Customer Quotation Update</h2>
    <p>Hi <strong>${opts.agentName}</strong>,</p>
    <p>A quotation for one of your referred customers has been updated.</p>
    <div class="section">
      <div class="label">Customer</div>
      <div class="value">${opts.customerName}</div>
      <div class="label" style="margin-top:10px">Quotation Reference</div>
      <div class="value">${opts.ref}</div>
      <div class="label" style="margin-top:10px">New Status</div>
      <div class="value" style="text-transform:capitalize">${opts.status}</div>
    </div>
    <p>Log in to your agent dashboard to follow up with this customer.</p>
  `);
}

export function emailWelcomeCustomer(opts: { name: string; referralCode: string; agentName?: string }): string {
  return baseLayout(`
    <h2 style="color:#1a1a2e;margin-top:0">Welcome to Kynaz Enterprise!</h2>
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
  `);
}

export function emailAgentWelcome(opts: { name: string; agentId: string; referralCode: string }): string {
  return baseLayout(`
    <h2 style="color:#1a1a2e;margin-top:0">Welcome Aboard, Agent!</h2>
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>Your agent account has been approved. You can now start referring customers and earning commissions!</p>
    <div class="section">
      <div class="label">Agent ID</div>
      <div class="value">${opts.agentId}</div>
      <div class="label" style="margin-top:10px">Your Referral Code</div>
      <div class="value" style="font-size:20px;letter-spacing:2px">${opts.referralCode}</div>
    </div>
    <p>Share your referral code with potential customers. Every customer who registers and completes a service will earn you commission.</p>
    <p>Log in to your agent dashboard to get started!</p>
  `);
}
