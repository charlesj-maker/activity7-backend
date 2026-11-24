require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.set("trust proxy", 1);
const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",").map(value => value.trim()).filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json());

app.get("/", (req, res) => {
  const base = req.protocol + "://" + req.get("host");
  res.type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Campus Maintenance Requests API</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#1d2430}
table{border-collapse:collapse;width:100%;margin:1rem 0}th,td{border:1px solid #ccd;padding:.4rem .6rem;text-align:left}
th{background:#eef1f5}pre{background:#f3f5f8;padding:1rem;overflow-x:auto}.w{overflow-x:auto}</style></head><body>
<h1>Campus Maintenance Requests API</h1>
<p><strong>Project name:</strong> Campus Maintenance Requests (ICT251 Activity 7 backend)<br>
<strong>Student number:</strong> 202509566</p>
<p>This API stores campus maintenance requests (broken lights, taps and furniture) in a SQLite database. All records are made up.</p>
<p><strong>Base URL:</strong> <a href="${base}">${base}</a><br>
Quick links: <a href="/health">/health</a> | <a href="/api/records">/api/records</a></p>
<p><em>Note: an idle free service may need up to a minute to wake up on the first request.</em></p>
<h2>Routes</h2><div class="w"><table>
<tr><th>Method</th><th>Route</th><th>Purpose</th></tr>
<tr><td>GET</td><td>/</td><td>This guide</td></tr>
<tr><td>GET</td><td>/health</td><td>Check server and database</td></tr>
<tr><td>GET</td><td>/api/records</td><td>Read all records</td></tr>
<tr><td>GET</td><td>/api/records/:id</td><td>Read one record</td></tr>
<tr><td>POST</td><td>/api/records</td><td>Create a record</td></tr>
<tr><td>PUT</td><td>/api/records/:id</td><td>Update a record (all four fields)</td></tr>
<tr><td>DELETE</td><td>/api/records/:id</td><td>Delete a record</td></tr></table></div>
<h2>Fields (POST and PUT body, do not send id)</h2>
<ul><li><strong>title</strong>: text, 3 to 80 characters</li><li><strong>category</strong>: text, 2 to 40 characters</li>
<li><strong>description</strong>: text, 5 to 300 characters</li>
<li><strong>status</strong>: exactly Pending, In progress or Completed</li></ul>
<pre>{
  "title": "Broken classroom light",
  "category": "Electrical",
  "description": "The light in Room B12 does not switch on.",
  "status": "Pending"
}</pre>
<p>Send with header <code>Content-Type: application/json</code>.</p>
<h2>Status codes</h2><div class="w"><table>
<tr><th>Request</th><th>Success</th><th>Errors</th></tr>
<tr><td>GET all</td><td>200 array (or [])</td><td>500</td></tr>
<tr><td>GET one</td><td>200 record</td><td>400 bad id, 404 not found</td></tr>
<tr><td>POST</td><td>201 saved record with new id</td><td>400 invalid input or malformed JSON</td></tr>
<tr><td>PUT</td><td>200 updated record, same id</td><td>400 invalid, 404 not found</td></tr>
<tr><td>DELETE</td><td>200 {"message":"Record deleted."}</td><td>400 bad id, 404 not found</td></tr>
<tr><td>GET /health</td><td>200</td><td>503 database failure</td></tr></table></div>
<p>Errors return JSON like <code>{"message":"Title must have 3 to 80 characters."}</code>.</p>
</body></html>`);
});

app.get("/health", (req, res) => {
  try {
    db.prepare("SELECT 1").get();
    res.status(200).json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ status: "error", database: "unavailable", message: "Database is not responding." });
  }
});

app.use("/api/records", require("./routes/records"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed" || error instanceof SyntaxError) {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server." });
});

try {
  db.initDb();
} catch (error) {
  console.error("Database setup failed:", error.message);
}

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
