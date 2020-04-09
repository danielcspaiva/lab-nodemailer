const express = require("express");
const passport = require('passport');
const router = express.Router();
const User = require("../models/User");
const nodemailer = require("nodemailer");

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


router.get("/login", (req, res, next) => {
  res.render("auth/login", {
    "message": req.flash("error")
  });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/auth/login",
  failureFlash: true,
  passReqToCallback: true
}));

router.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});

router.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  // let { email, subject, message } = req.body;
  var transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "c5b947550f1595",
      pass: "89856a66384d9f"
    }
  });

  let confirmationCode = '';
  for (let i = 0; i < 25; i++) {
    confirmationCode += characters[Math.floor(Math.random() * characters.length)];
  }
  console.log(username)
  console.log(password)
  console.log(email)
  console.log(confirmationCode)

  if (username === "" || password === "") {
    res.render("auth/signup", {
      message: "Indicate username and password"
    });
    return;
  }

  User.findOne({
      username
    }, "username", (err, user) => {
      if (user !== null) {
        res.render("auth/signup", {
          message: "The username already exists"
        });
        return;
      }

      const salt = bcrypt.genSaltSync(bcryptSalt);
      const hashPass = bcrypt.hashSync(password, salt);

      const newUser = new User({
        username,
        password: hashPass,
        confirmationCode,
        email
      });

      newUser.save()
        .then(() => {
          transport.sendMail({
              from: '"My Awesome Project " <test@ironhack.com>',
              to: email,
              subject: 'test',
              text: `http://localhost:3000/auth/confirm/${confirmationCode}`,
              // html: `<b>${message}</b>`
            })
            .catch(error => console.log(error));
        });
      console.log('NOVO USUARIO SALVO')
      res.redirect("/");
    })
    .catch(err => {
      console.log(err)
      res.render("auth/signup", {
        message: "Something went wrong"
      });
    })
});

router.get('/confirm/:confirmCode', (req, res, next) => {
  User.find({
      confirmationCode: req.params.confirmCode
    })
    .then(user => {
      user[0].status = 'Active',
      console.log(user)
      res.render("confirmation", user[0])
    })
    .catch(err => console.log(err))
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;