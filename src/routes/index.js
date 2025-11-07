import express from "express";
import {
  errorHandling,
  isLoggedIn,
  protectedPage,
  signup,
  viewSignup,
} from "../controllers/register.js";
import { login, loginView, logout } from "../controllers/login.js";

const routes = express.Router();

/* ------------------------------- Root Route ------------------------------- */
routes.get("/", (req, res) => {
  res.send("Hello World");
});

/* --------------------------- Authentication Routes ------------------------ */
// Show signup page
routes.get("/signup", viewSignup);
// Handle signup submission
routes.post("/signup", signup);

// Show login page
routes.get("/login", loginView);
// Handle login submission
routes.post("/login", login);

// Logout
routes.get("/logout", logout);

/* ----------------------------- Protected Routes --------------------------- */
// Protected page; only accessible when logged in
routes.get("/protected-page", isLoggedIn, protectedPage);

/* ----------------------------- Global Error Handler ----------------------- */
// Error handling middleware (must come last)
routes.use(errorHandling);

export default routes;
