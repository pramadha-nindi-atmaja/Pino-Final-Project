import express from "express";
import "dotenv/config";
import helmet from "helmet"; // Security middleware
import compression from "compression"; // Response compression
import cors from "cors"; // Cross-Origin Resource Sharing
import morgan from "morgan"; // HTTP request logger
import rateLimit from "express-rate-limit"; // Rate limiting
import cookieParser from "cookie-parser"; // Parse cookies
import session from "express-session"; // Session management
import MongoStore from "connect-mongo"; // MongoDB session store
import passport from "passport"; // Authentication
import { Strategy as LocalStrategy } from "passport-local"; // Local auth strategy
import mongoose from "mongoose"; // MongoDB connection
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import https from "https";
import swaggerUi from "swagger-ui-express"; // API documentation
import swaggerJsDoc from "swagger-jsdoc"; // API documentation generator
import winston from "winston"; // Logging
import routes from "./routes/index.js";
import appMiddleware from "./middleware/index.js";
import User from "./models/User.js"; // Assuming you have a User model

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ES Module dirname equivalent
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Express application',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Basic security settings
app.use(helmet({
  contentSecurityPolicy: isProduction,
}));

// Enable CORS with custom options
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));

// Compression middleware
app.use(compression());

// Request logging
if (isProduction) {
  // Create a write stream for access logs
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
} else {
  app.use(morgan('dev'));
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: 'native'
  }),
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      if (!user) return done(null, false, { message: 'Incorrect email.' });
      
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return done(null, false, { message: 'Incorrect password.' });
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later"
});
app.use("/api", limiter);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Apply custom middleware
app.use(appMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Routes
app.use(routes);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  
  res.status(statusCode).render("error", {
    title: "Error",
    message: err.message,
    error: isProduction ? {} : err
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// Start server
let server;

// Use HTTPS in production
if (isProduction && process.env.USE_HTTPS === 'true') {
  const httpsOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };
  server = https.createServer(httpsOptions, app);
} else {
  server = app;
}

server.listen(port, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || "development"} mode`);
  logger.info(`Listening at http${isProduction && process.env.USE_HTTPS === 'true' ? 's' : ''}://localhost:${port}`);
  logger.info(`API Documentation available at http${isProduction && process.env.USE_HTTPS === 'true' ? 's' : ''}://localhost:${port}/api-docs`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  });
});

export default app;