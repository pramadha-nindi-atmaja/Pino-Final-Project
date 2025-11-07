import LogInCollection from "../models/users.js";
import { compare } from "../utils/bcript.js";
import validation from "../validator/user.validator.js";

const loginView = (req, res) => {
  const flashMsg = req.flash("message");
  const flashData = req.flash("data");

  res.render("login", {
    title: "Login",
    layout: "layout/main-layout",
    message: flashMsg?.[0],
    data: flashData?.[0],
  });
};

const login = async (req, res) => {
  try {
    const hasil = await validation(req.body);

    // Validasi gagal
    if (hasil.message.length > 0) {
      req.flash("message", ["error", "Error!", hasil.message[0]]);
      req.flash("data", hasil.data);
      return res.status(400).redirect("/login");
    }

    // Cari user
    const user = await LogInCollection.findOne({ email: req.body.email });

    if (!user) {
      req.flash("message", ["error", "Error!", "Email tidak ditemukan"]);
      req.flash("data", hasil.data);
      return res.status(400).redirect("/login");
    }

    // Cek password
    const isMatch = await compare(req.body.password, user.password);

    if (!isMatch) {
      req.flash("message", ["error", "Error!", "Password salah"]);
      req.flash("data", hasil.data);
      return res.status(400).redirect("/login");
    }

    // Login success
    req.session.user = {
      nama: user.nama,
      email: user.email,
    };

    return res.redirect("/protected-page");
  } catch (error) {
    console.error(error);
    req.flash("message", ["error", "Error!", "Terjadi kesalahan"]);
    return res.status(500).redirect("/login");
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};

export { loginView, login, logout };
