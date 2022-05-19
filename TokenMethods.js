const BlackList = require("./models/blacklist");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const cron = require("node-cron");
const dotenv = require("dotenv");
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

class TokenGenerator {
  generateAccessToken = (user) => {
    return jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "12h" }
    );
  };
}

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      jwt.verify(token, JWT_SECRET, (err, userInfo) => {
        if (err)
          return res.json({
            message: "Token is not valid!",
          });
        req.user = userInfo;
        next();
      });
    } catch (err) {
      res.json({
        message: "cannot decode token",
      });
    }
  } else res.json({ message: "You are not authenticated" });
  // console.log(
  //     req.headers.host +
  //     " " +
  //     req.header("x-forwarded-for") || req.connection.remoteAddress
  // );
  // next();
};

const deleteTokens = async (id, authToken, res) => {
  try {
    const createQuery = await BlackList.create({ user_id: id });
  } catch (err) {
    if (err.code == 11000) {
      return;
    }
  } finally {
    const { authTokens } = await User.findOne(
      {
        _id: mongoose.Types.ObjectId(id),
      },
      { _id: 0, authTokens: 1 }
    ).lean();

    const updatedTokens = authTokens.filter((token) => token !== authToken);
    // console.log(updatedTokens);
    const insertQuery = await BlackList.findOneAndUpdate(
      {
        user_id: mongoose.Types.ObjectId(id),
      },
      {
        $push: { expiredTokens: updatedTokens },
      }
    );
    // console.log(insertQuery);
    const updateQuery = await User.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(id),
      },
      {
        $set: { authTokens: authToken },
      }
    );
  }
};

const scheduler = (id) => {
  cron.schedule("* * * * *", async function () {
    console.log("!");
    const expiredTokens = await BlackList.findOne(
      {
        user_id: mongoose.Types.ObjectId(id),
      },
      { _id: 0, expiredTokens: 1 }
    ).lean();
    console.log(typeof expiredTokens);
    // if (expiredTokens.length > 5) {
    //   const oldTokens = expiredTokens.slice(0, 4);
    //   const deleteQuery = await BlackList.findOneAndUpdate(
    //     {
    //       user_id: mongoose.Types.ObjectId(id),
    //     },
    //     {
    //       $set: { authTokens: oldTokens },
    //     }
    //   ).lean();
    //   // console.log(deleteQuery);
    // }
  });
};

module.exports = {
  TokenGenerator,
  verify,
  deleteTokens,
  scheduler,
};

// const logger = [verify, rateLimiter];
// const rateLimiter = (req, res, next) => {
//   const ratelimit = require("express-rate-limit");
//   ratelimit({
//     windowMs: 1 * 60 * 1000, // 1 minute
//     max: 1, // limit each IP to 100 requests per windowMs
//     skipSuccessfulRequests: false,
//     handler: (req, res) => {
//       if (req.rateLimit > 2)
//         // return res.status(429).json({
//         //   error: "You sent too many requests. Please wait a while then try again",
//         // });
//         console.log(
//           "You sent too many requests. Please wait a while then try again"
//         );
//     },
//   });
//   next();
//   console.log("in ratelimter");
// };
