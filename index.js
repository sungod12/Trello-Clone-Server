const express = require("express");
const app = express();
const cors = require("cors");
const { router: UserRouter } = require("./routes/Users");
const KanbanRouter = require("./routes/KanbanBoard");
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
const PORT = 3001;
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

try {
  mongoose.connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jwhcr.mongodb.net/test2`
  );
} catch (err) {
  console.log("error connecting");
}

app.use(UserRouter);
app.use(KanbanRouter);
app.listen(process.env.PORT || PORT, () => console.log("server is running"));
// res.cookie("_at", token, { maxAge: 10000, httpOnly: true });
