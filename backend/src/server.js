const http = require("http");
const app = require("./app");
require("dotenv").config();
const connectDB = require("./config/db")
const {initSocket} = require("./config/socket");
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    });
});

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Promise Rejection:", err.message);
    server.close(() => process.exit(1));
})