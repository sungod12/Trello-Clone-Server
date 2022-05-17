const mongoose = require("mongoose");

const BlackListSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Types.ObjectId, unique: true },
    expiredTokens: {
      type: Array,
    },
  },
  {
    collection: "BlackList",
  }
);

const model = mongoose.model("BlackListSchema", BlackListSchema);

module.exports = model;
