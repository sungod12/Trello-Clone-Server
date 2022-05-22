const mongoose = require("mongoose");

const KanbanSchema = new mongoose.Schema(
  {
    BoardData: {
      type: Array,
      board: {
        type: Array,
      },
    },

    userDetails: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      name: {
        type: String,
        unique: true,
      },
    },
  },
  { collection: "KanbanBoard" }
);

const model = mongoose.model("KanbanSchema", KanbanSchema);

module.exports = model;
