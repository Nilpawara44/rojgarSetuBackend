require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./src/config/db");
const jobRoutes = require("./src/routes/jobRoutes");
const authRoutes = require("./src/routes/authRoutes");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");

connectDB();

const app = express();

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// --- CORS ---------------------------------------------------------------
// CORS_ORIGIN in .env is a comma-separated list, e.g.
// "https://rojgar-setu-puce.vercel.app,http://127.0.0.1:5500"
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow tools like curl/Postman (no origin header) and any whitelisted origin
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin "${origin}" is not allowed`));
    }
  })
);

// --- Routes ---------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

app.get("/", (req, res) => {
  res.json({ message: "RojgarSetu API is running. See /api/health and /api/jobs." });
});

app.use(notFound);
app.use(errorHandler);

// --- Start ---------------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[server] Listening on port ${PORT} (${process.env.NODE_ENV || "development"})`);
});
