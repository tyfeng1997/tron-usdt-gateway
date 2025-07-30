const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
  console.log("✅ Webhook received!");
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on http://localhost:${PORT}/webhook`);
});
