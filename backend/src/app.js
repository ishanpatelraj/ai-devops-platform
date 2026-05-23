const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const logRoutes = require("./routes/logRoutes");
const metricRoutes = require("./routes/metricRoutes");
const alertRoutes = require("./routes/alertRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const serverRoutes = require("./routes/serverRoutes");
const chatRoutes = require("./routes/chatRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === process.env.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // for cookies
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/metrics", metricRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running 🚀" });
});
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
// 4 parameters (err, req, res, next)
app.use(errorMiddleware);

module.exports = app;