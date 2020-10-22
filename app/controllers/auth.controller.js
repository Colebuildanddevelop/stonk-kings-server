const config = require("../config/auth.config");
const User = require("../models/user");

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
  });

  try {
    const result = await user.save();
    var token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: 86400, // 24 hours
    });
    res.status(200).send({
      ...result._doc,
      accessToken: token,
    });
  } catch (ex) {
    const errMessages = [];
    for (let field in ex.errors) {
      errMessages.push(ex.errors[field].message);
    }
    res.status(400).send(errMessages);
  }
};

exports.signin = (req, res) => {
  User.findOne({
    username: req.body.username,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    var token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: 86400, // 24 hours
    });

    res.status(200).send({
      id: user._id,
      avatar: user.avatar,
      username: user.username,
      accountBalance: user.accountBalance,
      friends: user.friends,
      entries: user.entries,
      email: user.email,
      accessToken: token,
    });
  });
};

exports.getUserWithToken = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.send({ error: "token expired" });
  var token = jwt.sign({ id: user.id }, config.secret, {
    expiresIn: 86400, // 24 hours
  });

  res.status(200).send({
    id: user._id,
    avatar: user.avatar,
    username: user.username,
    accountBalance: user.accountBalance,
    friends: user.friends,
    entries: user.entries,
    email: user.email,
    accessToken: token,
  });
};
