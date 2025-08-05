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

// Root route
routes.get("/", (req, res) => {
  res.send("Hello World");
});

// Authentication routes
routes.get("/signup", viewSignup);
routes.post("/signup", signup);
routes.get("/login", loginView);
routes.post("/login", login);
routes.get("/logout", logout);

// Protected routes
routes.get("/protected-page", isLoggedIn, protectedPage);

// Error handling middleware for protected page
routes.use("/protected-page", errorHandling);

export default routes;
