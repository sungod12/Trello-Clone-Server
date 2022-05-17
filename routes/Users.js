const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const Kanban = require("../models/kanban");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const { TokenGenerator, deleteTokens } = require("../TokenMethods");
const mongoose = require("mongoose");
const tokenGenerator = new TokenGenerator();

const addUserDetails = async (username, id) => {
  try {
    const userDetails = await User.findOne(
      {
        username,
      },
      { password: 0 }
    );
    // console.log(userDetails);
    const response = await Kanban.create({
      userDetails: { id: userDetails._id, name: userDetails.username },
    });

    // console.log("successfully created blacklist" + createQuery);
    // console.log("data added successfully:" + response);
    // return res.json({ status: "ok", response: "Successfully Created" });
  } catch (err) {
    // console.log(err);
    if (err.code == 11000) {
      return;
    }
  } finally {
    const update = await User.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(id),
      },
      {
        $set: { loggedStatus: true },
      }
    );
  }
};

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).lean();

  if (!user) {
    return res.json({ status: "error", error: "Invalid username/password" });
  }

  if (await bcrypt.compare(password, user.password)) {
    // the username, password combination is successful

    const token = tokenGenerator.generateAccessToken(user);
    // console.log(refreshToken);

    const { authTokens } = await User.findOneAndUpdate(
      {
        _id: user._id,
      },
      { $push: { authTokens: token } }
    ).lean();
    deleteTokens(user._id, token, res);

    // console.log(networkInterfaces.Ethernet[1].address);
    addUserDetails(username, user._id);

    return res.json({
      status: "ok",
      token,
    });
  }
  res.json({ status: "error", error: "Invalid username/password" });
});

router.post("/register", async (req, res) => {
  const { username, password: plainTextPassword } = req.body;
  const networkInterfaces = require("os").networkInterfaces();
  if (!username || typeof username !== "string") {
    return res.json({ status: "error", error: "Invalid username" });
  }

  if (!plainTextPassword || typeof plainTextPassword !== "string") {
    return res.json({ status: "error", error: "Invalid password" });
  }

  if (plainTextPassword.length < 5) {
    return res.json({
      status: "error",
      error: "Password too small. Should be atleast 6 characters",
    });
  }
  const password = await bcrypt.hash(plainTextPassword, 10);

  try {
    // console.log(networkInterfaces);
    const response = await User.create({
      username,
      password,
      // ipAddr: networkInterfaces.Ethernet[0].address,
      userAgent: req.headers["user-agent"],
    });

    console.log("User created successfully: ");
  } catch (error) {
    if (error.code === 11000) {
      // duplicate key
      return res.json({ status: "error", error: "Username already in use" });
    }
    throw error;
  }

  res.json({ status: "ok" });
});

router.post("/logout", async (req, res) => {
  const { id } = jwt.decode(req.body.token);
  const networkInterfaces = require("os").networkInterfaces();
  const update = await User.findOneAndUpdate(
    {
      _id: mongoose.Types.ObjectId(id),
    },
    {
      $set: { loggedStatus: false },
    }
  );
  // scheduler(req.user.id);
  res.json({ message: "You logged out successfully" });
});

router.post("/verify", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      jwt.verify(token, JWT_SECRET, (err, userInfo) => {
        if (err)
          return res.json({
            message: "Token is not valid!",
          });
        else
          return res.json({
            message: "ok",
          });
      });
    } catch (err) {
      return res.json({
        message: "cannot decode token",
      });
    }
  } else return res.json({ message: "You are not authenticated" });
});

module.exports = { router };
