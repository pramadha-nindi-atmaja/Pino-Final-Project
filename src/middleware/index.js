import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import cookieParser from "cookie-parser";
import session from "express-session";
import expressEjsLayouts from "express-ejs-layouts";
import flash from "express-flash";
import path from "path";
import url from "url";
import { logger } from "../logs/pino.js";
import { pinoHttp } from "pino-http";

const appMidleware = express();
const upload = multer();
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Logging request → first middleware
appMidleware.use(
  pinoHttp({
    logger,
  })
);

// EJS Layout
appMidleware.use(expressEjsLayouts);

// Serve public
appMidleware.use(express.static(path.join(__dirname, "../../public")));

// Body Parser
appMidleware.use(express.json());
appMidleware.use(express.urlencoded({ extended: true }));

// Multer — jika hanya menerima form tanpa files
appMidleware.use(upload.none());

// Cookie + Session
appMidleware.use(cookieParser());
appMidleware.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1h
      secure: false, // set true if https
    },
  })
);

// Flash Message
appMidleware.use(flash());

// contoh log (jalankan sekali di startup, bukan tiap request)
logger.info("Middleware loaded successfully");

export default appMidleware;
