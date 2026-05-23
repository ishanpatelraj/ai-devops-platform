const express = require("express")
const router = express.Router();
const {getLogs, getLogById, createLog, deleteLog} = require("../controllers/logController");

const {protect, authorize} = require("../middleware/authMiddleware");

// Unprotected ingestion route
router.post("/", createLog);

router.use(protect);
router.get("/", getLogs);

router.route("/:id")
.get(getLogById)
.delete(authorize("Admin"), deleteLog);

module.exports = router;