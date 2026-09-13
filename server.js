const express = require("express");
const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

// 🚨 BUG INTRODUCED IN COMMIT #6:
// Unsafe nested property access on customer string ID
app.post("/api/webhook/stripe", async (req, res) => {
  const payload = req.body;
  try {
    const country = payload.customer.billing_address.country;
    res.json({ status: "success", country });
  } catch (err) {
    console.error(`🚨 [CRASH TRIGGERED IN PAYMENT-MICROSERVICE]: ${err.stack}`);
    
    // Automatically forwards crash to Incident Commander Webhook Gateway!
    try {
      await fetch("http://localhost:8000/api/webhook/sentry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: "payment-microservice-demo",
          error_type: "TypeError",
          message: `${err.name}: ${err.message}`,
          culprit: "server.js:12 in handle_stripe_webhook",
          timestamp: new Date().toISOString(),
          stack_trace: [
            {
              file: "server.js",
              line: 12,
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
