import { logger } from "../logs/pino.js";
import LogInCollection from "../models/users.js";
import { encript } from "../utils/bcript.js";
import validation from "../validator/user.validator.js";
const viewSignup = (req, res) => {
  try {
    // throw new Error("Contoh error");
    const data = {
      title: "Sign Up",
      layout: "layout/main-layout",
      message: req.flash("message"),
      data: req.flash("data")[0],
    };
    res.render("signup", data);
  } catch (error) {
    logger.error(error);
  }
};

const signup = async (req, res) => {
  const hasil = await validation(req.body);
  if (hasil.message.length > 0) {
    res.status(400);
    req.flash("message", ["error", "Error!", hasil.message[0]]);
    req.flash("data", hasil.data);
    res.redirect("/signup");
  } else {
    const checking = await LogInCollection.findOne({ email: req.body.email });
    try {
      if (checking) {
        res.status(400);
        req.flash("message", ["error", "Error!", "Email already exists"]);
        req.flash("data", hasil.data);
        res.redirect("/signup");
      } else {
        const newUser = {
          nama: hasil.data.nama,
          email: hasil.data.email,
          password: encript(hasil.data.password),
        };
        await LogInCollection.insertMany([newUser]);
        req.session.user = {
          nama: newUser.nama,
          email: newUser.email,
        };
        res.redirect("/protected-page");
      }
    } catch (e) {
      req.flash("message", ["error", "Error!", e.Error.message]);
      req.flash("data", hasil.data);
      res.redirect("/signup");
    }
  }
};

const protectedPage = (req, res) => {
  const data = {
    title: "Protected Page",
    layout: "layout/main-layout",
    message: "Welcome " + req.session.user.nama,
  };
  res.render("protected-page", data);
};

const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    let err = new Error("Anda belum login !");
    next(err);
  }
};

const errorHandling = (err, req, res) => {
  req.log.error(err, "Request Error");
  req.flash("message", ["error", "Error!", err.message]);
  res.redirect("/login");
};

export { viewSignup, signup, protectedPage, isLoggedIn, errorHandling };
