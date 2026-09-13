async function triggerLiveCrash() {
  const url = "http://localhost:4000/api/webhook/stripe";
  console.log(`[*] Sending real Stripe transaction payload to ${url}...`);

  const payload = {
    id: "evt_3N4x98284kjas",
    object: "event",
    type: "invoice.payment_succeeded",
    customer: "cus_10482", 
    amount: 4900,
    currency: "usd"
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Server response:", data);
  } catch (err) {
    console.error("Trigger error:", err.message);
  }
}

triggerLiveCrash();
