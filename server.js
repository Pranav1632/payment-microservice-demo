require("dotenv").config();
const express = require("express");
const Sentry = require("@sentry/node");

const app = express();
app.use(express.json());

// Initialize Official Sentry SDK
// You can supply your actual Sentry DSN via environment variable: SENTRY_DSN
const SENTRY_DSN = process.env.SENTRY_DSN || "";
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: "production"
  });
  console.log("[+] Official Sentry SDK initialized with DSN:", SENTRY_DSN.substring(0, 15) + "...");
} else {
  console.log("[*] Running in Local Sentry Mode (Set SENTRY_DSN to stream directly to Sentry cloud dashboard)");
}

app.get("/health", (req, res) => res.json({ status: "ok" }));

// 🚨 BUG INTRODUCED IN COMMIT #6:
// Unsafe nested property access on customer string ID
app.post("/api/webhook/stripe", async (req, res) => {
  const payload = req.body;
  try {
    const country = payload.customer.billing_address.country;
    res.json({ status: "success", country });
  } catch (err) {
    console.error(`🚨 [CRASH CAPTURED BY SENTRY]: ${err.stack}`);

    // 1. Send exception to live Sentry Cloud (if DSN provided)
    if (SENTRY_DSN) {
      Sentry.captureException(err);
    }

    // 2. Dispatch Sentry alert payload to Incident Commander Webhook Gateway
    try {
      await fetch("http://localhost:8000/api/webhook/sentry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: "Pranav1632/payment-microservice-demo",
          project: "payment-microservice-demo",
          error_type: "TypeError",
          message: `${err.name}: ${err.message}`,
          culprit: "server.js:26 in handle_stripe_webhook",
          timestamp: new Date().toISOString(),
          stack_trace: [
            {
              file: "server.js",
              line: 26,
              function: "handle_stripe_webhook",
              code: "const country = payload.customer.billing_address.country;"
            }
          ]
        })
      });
      console.log("[+] Dispatched crash alert to Incident Commander webhook at http://localhost:8000/api/webhook/sentry");
    } catch (dispatchErr) {
      console.error("[-] Could not dispatch to Incident Commander:", dispatchErr.message);
    }

    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => console.log("Payment microservice listening on http://localhost:4000"));
