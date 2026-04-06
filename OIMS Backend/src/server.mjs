import "dotenv/config";
import express from "express";
import cors from "cors";
import rootRouter from "./routes/index.mjs";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { errorHandler } from "./middleware/errorMiddleware.mjs";
import helmet from "helmet";
import morgan from "morgan";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an Express server instance
const server = express();
// Trust proxy (needed when behind reverse proxies for correct IP/HTTPS detection)
server.set("trust proxy", 1);

// Define the server port (from .env or default 5001)
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === "production";

// Security headers
server.use(helmet());

// HTTP request logging
server.use(morgan(isProduction ? "combined" : "dev"));

// Strict CORS configuration
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition"],
  optionsSuccessStatus: 204,
};

server.use(cors(corsOptions));
server.options("*", cors(corsOptions));

// Middleware to parse JSON request bodies
server.use(express.json());

// Middleware to parse URL-encoded request bodies
server.use(express.urlencoded({ extended: true }));

// Middleware to use cookies
server.use(cookieParser());

// Serve static uploaded files ---
const staticUploadsPath = path.join(__dirname, "..", "public", "uploads");
server.use("/uploads", express.static(staticUploadsPath));

// Health and readiness probes
server.get("/healthz", (req, res) => res.sendStatus(200));
server.get("/readyz", (req, res) => res.sendStatus(200));

// Use main API routes (all routes start with /api/v1)
server.use("/api/v1", rootRouter);

// Error handler
server.use(errorHandler);

// Start the server and listen on the defined port
const httpServer = server.listen(PORT, () =>
  console.log(`Server is running........on port ${PORT}  :)`)
);

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} received: closing server...`);
  httpServer.close((err) => {
    if (err) {
      console.error("Error during HTTP server close", err);
      process.exit(1);
    }
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
