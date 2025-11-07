import express from "express";
import "dotenv/config";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import https from "https";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import winston from "winston";

import routes from "./routes/index.js";
import appMiddleware from "./middleware/index.js";
import User from "./models/User.js";

// ───────────────────────────────────────────────────────────
// Logger
// ───────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ───────────────────────────────────────────────────────────
// Paths
// ───────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ───────────────────────────────────────────────────────────
// App setup
// ───────────────────────────────────────────────────────────
const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// ───────────────────────────────────────────────────────────
// MongoDB
// ───────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("✅ MongoDB connected"))
  .catch((err) => logger.error("❌ MongoDB error:", err));

// ───────────────────────────────────────────────────────────
// Swagger
// ───────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express API Documentation",
      version: "1.0.0",
      description: "API docs for the Express application"
    },
    servers: [{ url: `http://localhost:${port}` }]
  },
  apis: ["./routes/*.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// ───────────────────────────────────────────────────────────
// View engine
// ───────────────────────────────────────────────────────────
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ───────────────────────────────────────────────────────────
// Middleware
// ───────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: isProduction
  })
);

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  })
);

app.use(compression());

// Logging
if (isProduction) {
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "access.log"),
    { flags: "a" }
  );
  app.use(morgan("combined", { stream: accessLogStream }));
} else {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ───────────────────────────────────────────────────────────
// Session
// ───────────────────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60
    }),
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60 * 1000
    }
  })
);

// ───────────────────────────────────────────────────────────
// Passport
// ───────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user)
          return done(null, false, { message: "Incorrect email." });

        const isMatch = await user.comparePassword(password);
        return isMatch
          ? done(null, user)
          : done(null, false, { message: "Incorrect password." });
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    done(null, await User.findById(id));
  } catch (err) {
    done(err);
  }
});

// ───────────────────────────────────────────────────────────
// Rate limit
// ───────────────────────────────────────────────────────────
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, try again later."
  })
);

// ───────────────────────────────────────────────────────────
// Static
// ───────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Custom middleware
app.use(appMiddleware);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

// Routes
app.use(routes);

// ───────────────────────────────────────────────────────────
// Error handling
// ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  res.status(err.statusCode ?? 500).render("error", {
    title: "Error",
    message: err.message,
    error: isProduction ? {} : err
  });
});

// 404
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// ───────────────────────────────────────────────────────────
// HTTPS (optional)
// ───────────────────────────────────────────────────────────
let server =
  isProduction && process.env.USE_HTTPS === "true"
    ? https.createServer(
        {
          key: fs.readFileSync(process.env.SSL_KEY_PATH),
          cert: fs.readFileSync(process.env.SSL_CERT_PATH)
        },
        app
      )
    : app;

// ───────────────────────────────────────────────────────────
// Start
// ───────────────────────────────────────────────────────────
server.listen(port, () => {
  logger.info(`✅ Server running in ${process.env.NODE_ENV || "development"}`);
  logger.info(
    `🔗 Listening at http${isProduction ? "s" : ""}://localhost:${port}`
  );
  logger.info(
    `📄 Docs at http${isProduction ? "s" : ""}://localhost:${port}/api-docs`
  );
});

// ───────────────────────────────────────────────────────────
// Graceful shutdown
// ───────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info("MongoDB closed");
      process.exit(0);
    });
  });
});

export default app;
