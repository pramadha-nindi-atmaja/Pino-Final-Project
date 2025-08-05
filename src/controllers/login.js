import LogInCollection from "../models/users.js";
import { compare } from "../utils/bcript.js";
import validation from "../validator/user.validator.js";
const loginView = (req, res) => {
  const data = {
    title: "Login",
    layout: "layout/main-layout",
    message: req.flash("message"),
    data: req.flash("data")[0],
  };
  res.render("login", data);
};

const login = async (req, res) => {
  const hasil = await validation(req.body);
  if (hasil.message.length > 0) {
    res.status(400);
    req.flash("message", ["error", "Error!", hasil.message[0]]);
    req.flash("data", hasil.data);
    res.redirect("/login");
  } else {
    const checking = await LogInCollection.findOne({ email: req.body.email });
    if (checking) {
      let password = req.body.password;
      if (await compare(password, checking.password)) {
        req.session.user = {
          nama: checking.nama,
          email: checking.email,
        };
        res.redirect("/protected-page");
      } else {
        res.status(400);
        req.flash("message", ["error", "Error!", "Invalid credentials"]);
        req.flash("data", hasil.data);
        res.redirect("/login");
      }
    } else {
      req.flash("message", ["error", "Error!", "Login gagal"]);
      req.flash("data", hasil.data);
      res.redirect("/login");
    }
  }
};

const logout = (req, res) => {
  req.session.destroy();
  res.redirect("/login");
};

export { loginView, login, logout };
