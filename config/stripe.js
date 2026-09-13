module.exports = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "whsec_demo123",
  timeoutMs: 5000
};
