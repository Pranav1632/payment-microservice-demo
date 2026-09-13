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
    console.error("Crash:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => console.log("Service running"));
