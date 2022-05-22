const BlackList = require("./models/blacklist");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
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
      { expiresIn: "2hr" }
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
      return res.json({
        message: "cannot decode token",
      });
    }
  } else return res.json({ message: "You are not authenticated" });
};

const deleteTokens = async (id, prevToken, res) => {
  try {
    const createQuery = await BlackList.create({
      user_id: mongoose.Types.ObjectId(id),
    });
  } catch (err) {
    if (err.code == 11000) {
      return;
    }
  } finally {
    const insertQuery = await BlackList.findOneAndUpdate(
      {
        user_id: mongoose.Types.ObjectId(id),
      },
      {
        $push: { expiredTokens: prevToken },
      }
    );
    // console.log(insertQuery);
  }
};

module.exports = {
  TokenGenerator,
  verify,
  deleteTokens,
};
