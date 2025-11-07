import { logger } from "../logs/pino.js";
import LogInCollection from "../models/users.js";
import { encript } from "../utils/bcript.js";
import validation from "../validator/user.validator.js";

const viewSignup = (req, res) => {
  try {
    const flashMsg = req.flash("message");
    const flashData = req.flash("data");

    res.render("signup", {
      title: "Sign Up",
      layout: "layout/main-layout",
      message: flashMsg?.[0],
      data: flashData?.[0],
    });
  } catch (error) {
    logger.error(error);
    res.redirect("/signup");
  }
};

const signup = async (req, res) => {
  try {
    const hasil = await validation(req.body);

    // Validasi gagal
    if (hasil.message.length > 0) {
      req.flash("message", ["error", "Error!", hasil.message[0]]);
      req.flash("data", hasil.data);
      return res.status(400).redirect("/signup");
    }

    // Cek email duplikat
    const existingUser = await LogInCollection.findOne({ email: hasil.data.email });

    if (existingUser) {
      req.flash("message", ["error", "Error!", "Email already exists"]);
      req.flash("data", hasil.data);
      return res.status(400).redirect("/signup");
    }

    // Enkripsi password
    const hashedPass = await encript(hasil.data.password);

    const newUser = {
      nama: hasil.data.nama.trim(),
      email: hasil.data.email.trim(),
      password: hashedPass,
    };

    await LogInCollection.insertOne(newUser);

    req.session.user = {
      nama: newUser.nama,
      email: newUser.email,
    };

    return res.redirect("/protected-page");
  } catch (error) {
    logger.error(error);
    req.flash("message", ["error", "Error!", error.message || "Signup Error"]);
    req.flash("data", req.body);
    return res.status(500).redirect("/signup");
  }
};

const protectedPage = (req, res) => {
  res.render("protected-page", {
    title: "Protected Page",
    layout: "layout/main-layout",
    message: `Welcome ${req.session?.user?.nama || ""}`,
  });
};

const isLoggedIn = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  const err = new Error("Anda belum login!");
  next(err);
};

const errorHandling = (err, req, res) => {
  logger.error(err, "Request Error");
  req.flash("message", ["error", "Error!", err.message]);
  res.redirect("/login");
};

export { viewSignup, signup, protectedPage, isLoggedIn, errorHandling };
