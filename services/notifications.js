async function sendReceipt(email, amount) {
  console.log(`Sending receipt to ${email} for $${amount}`);
  return true;
}
module.exports = { sendReceipt };
