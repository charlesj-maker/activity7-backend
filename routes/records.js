const router = require("express").Router();
const db = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const COLS = "id, title, category, description, status";

function parseId(value) {
  if (!/^[1-9][0-9]*$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

function validate(body) {
  const b = body && typeof body === "object" ? body : {};
  const rules = [
    ["title", "Title", 3, 80],
    ["category", "Category", 2, 40],
    ["description", "Description", 5, 300]
  ];
  const out = {};
  for (const [key, label, min, max] of rules) {
    if (typeof b[key] !== "string") return { error: label + " is required and must be text." };
    const v = b[key].trim();
    if (v.length < min || v.length > max) return { error: label + " must have " + min + " to " + max + " characters." };
    out[key] = v;
  }
  if (typeof b.status !== "string" || !STATUSES.includes(b.status.trim()))
    return { error: "Status must be Pending, In progress or Completed." };
  out.status = b.status.trim();
  return { value: out };
}

// Returns a valid id, or sends the error response and returns null.
function checkId(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ message: "Id must be a positive whole number." });
    return null;
  }
  return id;
}

router.get("/", (req, res, next) => {
  try {
    const rows = db.prepare("SELECT " + COLS + " FROM records ORDER BY id").all();
    res.status(200).json(rows);
  } catch (error) { next(error); }
});

router.get("/:id", (req, res, next) => {
  try {
    const id = checkId(req, res);
    if (id === null) return;
    const row = db.prepare("SELECT " + COLS + " FROM records WHERE id = ?").get(id);
    if (!row) return res.status(404).json({ message: "Record not found." });
    res.status(200).json(row);
  } catch (error) { next(error); }
});

router.post("/", (req, res, next) => {
  try {
    const { value, error } = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    const row = db.prepare(
      "INSERT INTO records (title, category, description, status) VALUES (?, ?, ?, ?) RETURNING " + COLS
    ).get(value.title, value.category, value.description, value.status);
    res.status(201).json(row);
  } catch (error) { next(error); }
});

router.put("/:id", (req, res, next) => {
  try {
    const id = checkId(req, res);
    if (id === null) return;
    const { value, error } = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    const row = db.prepare(
      "UPDATE records SET title = ?, category = ?, description = ?, status = ? WHERE id = ? RETURNING " + COLS
    ).get(value.title, value.category, value.description, value.status, id);
    if (!row) return res.status(404).json({ message: "Record not found." });
    res.status(200).json(row);
  } catch (error) { next(error); }
});

router.delete("/:id", (req, res, next) => {
  try {
    const id = checkId(req, res);
    if (id === null) return;
    const row = db.prepare("DELETE FROM records WHERE id = ? RETURNING id").get(id);
    if (!row) return res.status(404).json({ message: "Record not found." });
    res.status(200).json({ message: "Record deleted." });
  } catch (error) { next(error); }
});

module.exports = router;
