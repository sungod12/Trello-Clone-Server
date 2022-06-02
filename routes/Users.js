const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const Kanban = require("../models/kanban");
const jwt = require("jsonwebtoken");
const env = require("dotenv");
const { TokenGenerator, deleteTokens } = require("../TokenMethods");
const mongoose = require("mongoose");
const tokenGenerator = new TokenGenerator();
const networkInterfaces = require("os").networkInterfaces();
env.config();
const JWT_SECRET = process.env.JWT_SECRET;

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

const insertQuery = async (user, token, req) => {
  return await User.findOneAndUpdate(
    {
      _id: mongoose.Types.ObjectId(user._id),
    },
    {
      $set: {
        ipAddr: networkInterfaces.Ethernet[1].address,
        userAgent: req.headers["user-agent"],
        authToken: token,
      },
    }
  ).lean();
};

const findPrevToken = async (user) => {
  const { authToken } = await User.findOne(
    {
      _id: mongoose.Types.ObjectId(user._id),
    },
    { _id: 0, authToken: 1 }
  ).lean();
  return authToken;
};

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username }).lean();
    const token = tokenGenerator.generateAccessToken(user);

    if (!user) {
      return res.json({ status: "error", error: "Invalid username/password" });
    }

    if (await bcrypt.compare(password, user.password)) {
      // the username, password combination is successful

      const authToken = await findPrevToken(user);

      if (authToken) {
        deleteTokens(user._id, authToken);
        insertQuery(user, token, req);
      } else {
        insertQuery(user, token, req);
      }

      addUserDetails(username, user._id);

      return res.json({
        status: "ok",
        token,
      });
    }
  } catch (error) {
    return res.json({ status: "error", error: "Invalid username/password" });
  }
});

router.post("/register", async (req, res) => {
  const { username, password: plainTextPassword } = req.body;

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
    const response = await User.create({
      username,
      password,
      ipAddr: networkInterfaces.Ethernet[1].address,
      userAgent: req.headers["user-agent"],
    });
    // console.log("User created successfully: ");
    return res.json({ status: "ok" });
  } catch (error) {
    if (error.code === 11000) {
      // duplicate username
      return res.json({ status: "error", error: "Username already in use" });
    }
    throw error;
  }
});

router.get("/verify", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      jwt.verify(token, JWT_SECRET, (err, userInfo) => {
        if (err) {
          return res.json({
            message: "You are not authenticated!",
          });
        } else {
          return res.json({
            message: "ok",
          });
        }
      });
    } catch (err) {
      return res.json({
        message: "cannot decode token",
      });
    }
  } else return res.json({ message: "You are not authenticated!" });
});

router.post("/logout", async (req, res) => {
  if (req.body.token) {
    const { id } = jwt.decode(req.body.token);
  }
  const id = null;
  const update = await User.findOneAndUpdate(
    {
      _id: mongoose.Types.ObjectId(id),
    },
    {
      $set: { loggedStatus: false },
      $unset: { ipAddr: "", userAgent: "" },
    }
  );
  res.json({ message: "You logged out successfully" });
});

module.exports = { router };
