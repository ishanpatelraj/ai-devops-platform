const express = require("express");
const router = express.Router();
const {getAlerts, getAlertById, createAlert, resolveAlert} = require("../controllers/alertController");
const {protect} = require("../middleware/authMiddleware");

router.use(protect);
router.route("/").get(getAlerts).post(createAlert);
router.route("/:id").get(getAlertById);
router.patch("/:id/resolve", resolveAlert);

module.exports = router;