const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { sendMessage } = require("../controllers/chatController");

// POST /api/chat — send a question, get an AI answer
router.post("/", protect, sendMessage);

module.exports = router;
