require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite"); // SQLite built into Node.js, nothing to install

const file = process.env.DB_PATH || path.join(__dirname, "data", "records.db");
fs.mkdirSync(path.dirname(file), { recursive: true });
const db = new DatabaseSync(file);

// Creates the table and inserts the starting records only when the table is new.
function initDb() {
  const existed = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='records'").get();
  db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  if (!existed) {
    db.exec(fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8"));
    console.log("Created records table and inserted starting records.");
  }
}

module.exports = db;
module.exports.initDb = initDb;
