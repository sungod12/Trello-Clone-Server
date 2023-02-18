const express = require("express");
const router = express.Router();
const Kanban = require("../models/kanban");
const mongoose = require("mongoose");
const { verify: VerifyToken } = require("../TokenMethods");

router.get("/getData/:id", VerifyToken, async (req, res) => {
  try {
    const id = req.user.id;
    const boardId = req.params.id;
    const { BoardData } = await Kanban.findOne(
      {
        "userDetails.id": mongoose.Types.ObjectId(id),
      },
      {
        _id: 0,
        BoardData: { $elemMatch: { id: mongoose.Types.ObjectId(boardId) } },
      }
    ).lean();
    res
      .status(200)
      .json({ items: BoardData[0].board.data, boardId: BoardData[0].id });
  } catch (err) {
    res.json("error fetching");
  }
});

router.get("/getBoardTitle/:id", VerifyToken, async (req, res) => {
  try {
    const id = req.user.id;
    const boardId = req.params.id;
    let { BoardData } = await Kanban.findOne(
      { "userDetails.id": mongoose.Types.ObjectId(id) },
      {
        _id: 0,
        BoardData: { $elemMatch: { id: mongoose.Types.ObjectId(boardId) } },
      },
      { _id: 0, BoardData: 1 }
    ).lean();
    res.json({ title: BoardData[0].board.boardName });
  } catch (err) {
    console.log("error fetching");
  }
});

router.get("/getBoards", VerifyToken, async (req, res) => {
  try {
    const id = req.user.id;
    const response = await Kanban.findOne(
      {
        "userDetails.id": mongoose.Types.ObjectId(id),
      },
      { _id: 1, BoardData: 1 }
    );
    if (response) return res.json({ boardData: response.BoardData });
    else return res.json("No Data Found");
  } catch (err) {
    console.log(err);
  }
});

router.post("/addBoard", VerifyToken, async (req, res) => {
  try {
    const id = req.user.id;
    const boards = req.body.boards;
    if (boards.length <= 0) return res.json("nothing");
    const response = await Kanban.findOneAndUpdate(
      {
        "userDetails.id": mongoose.Types.ObjectId(id),
      },
      {
        $push: {
          BoardData: {
            id: new mongoose.Types.ObjectId(),
            board: boards[0],
          },
        },
      }
    );
    return res.json("board added");
  } catch (err) {
    console.log(err.message);
  }
});

router.post("/addColumn/:id", VerifyToken, async (req, res) => {
  try {
    const id = req.user.id;
    const column = req.body.column;
    const boardId = req.params.id;

    const response = await Kanban.findOneAndUpdate(
      {
        "userDetails.id": mongoose.Types.ObjectId(id),
        "BoardData.id": mongoose.Types.ObjectId(boardId),
      },
      {
        $push: {
          "BoardData.$.board.data": {
            column,
            cards: [],
          },
        },
      }
    ).lean();
    // console.log(response);
    if (response)
      return res.json({ status: "ok", response: "successfully added" });
    else
      return res.json({ status: "error", response: "column already exists" });
  } catch (error) {
    console.log("error" + error);
  }
});

//Work in Progress ⚠
router.post("/addCard/:id", VerifyToken, async (req, res) => {
  try {
    const id = req.user.id;
    const boardId = req.params.id;
    const { card, column } = req.body;

    // console.log(count);
    const response = await Kanban.findOneAndUpdate(
      {
        "userDetails.id": mongoose.Types.ObjectId(id),
        "BoardData.id": mongoose.Types.ObjectId(boardId),
      },
      {
        $push: {
          "BoardData.$.board.data.$[elem].cards": "test",
        },
      },
      {
        $arrayFilters: [{ "elem.column": column }],
      }
    ).lean();
    console.log(response);
    return res.json({ message: "successfully added" });
  } catch (err) {
    console.log("error" + err);
  } finally {
    count++;
  }
});

router.put("/updateColumnName", VerifyToken, async (req, res) => {
  try {
    const id = req.user.id;
    const { oldColumnName, newColumnName } = req.body;
    const column = await Kanban.findOneAndUpdate(
      {
        "userDetails.id": mongoose.Types.ObjectId(id),
        "BoardData.column": oldColumnName,
      },
      { $set: { "BoardData.$.column": newColumnName } }
    ).lean();
    // console.log(column.cards);
    res.json({ message: "successfully updated name" });
  } catch (error) {
    res.json({ message: "title exists" });
  }
});

router.put("/updateBoardTitle/:id", VerifyToken, async (req, res) => {
  try {
    const id = req.user.id;
    const title = req.body.title;
    const boardId = req.params.id;
    const { BoardData } = await Kanban.findOneAndUpdate(
      {
        "userDetails.id": mongoose.Types.ObjectId(id),
        "BoardData.id": mongoose.Types.ObjectId(boardId),
      },
      {
        $set: { "BoardData.$.board.boardName": title },
      },
      {
        projection: { _id: 0, "BoardData.$": 1 },
      }
    ).lean();
    const updatedTitle = BoardData[0].board.boardName;
    if (updatedTitle === title) throw Error("already updated!");
    return res.json({ message: "successfully updated Title" });
  } catch (err) {
    const error = err.toString();
    const message = error.split(":")[1].trim();
    if (error.split(":")[1]) return res.json({ message });
    return res.json(err);
  }
});

router.put("/updateColumns/:id", VerifyToken, async (req, res) => {
  try {
    const id = req.user.id;
    const columns = req.body.columns;
    const boardId = req.params.id;

    const response = await Kanban.findOneAndUpdate(
      {
        "userDetails.id": mongoose.Types.ObjectId(id),
        "BoardData.id": mongoose.Types.ObjectId(boardId),
      },
      {
        $set: {
          "BoardData.$.board.data": columns,
        },
      }
    );

    res.json({ message: "successfully updated columns" });
  } catch (err) {
    console.log(err);
  }
});

router.put("/updateCards", VerifyToken, async (req, res) => {
  try {
    const id = req.user.id;
    const { card, column } = req.body;
    // console.log(card + req.body.column);
    // const deleteColumnsQuery = await Kanban.findOneAndUpdate(
    //   {
    //     "userDetails.id": mongoose.Types.ObjectId(id),
    //     "BoardData.column": column,
    //     "BoardData.cards": { $elemMatch: { name: card } },
    //   },
    //   {

    //     $pull: { "BoardData.$.cards": card },
    //   }
    // ).lean();
    // console.log(deleteColumnsQuery);
    // const updateColumnsQuery = await Kanban.findOneAndUpdate(
    //   {
    //     "userDetails.id": mongoose.Types.ObjectId(id),
    //     "BoardData.column": column,
    //     // "BoardData.cards": { $nin: [card] },
    //   },
    //   {
    //     $push: {
    //       "BoardData.$.cards": {
    //         _id: new mongoose.Types.ObjectId(),
    //         name: card,
    //       },
    //     },
    //   }
    // ).lean();
    //

    // console.log("updated data" + updateColumnsQuery);

    // console.log(find);
    return res.json({ message: "successfully updated " });
    // console.log(updateColumnsQuery);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
