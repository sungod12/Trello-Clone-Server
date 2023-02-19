const express = require("express");
const app = express();
const cors = require("cors");
const { router: UserRouter } = require("./routes/Users");
const KanbanRouter = require("./routes/KanbanBoard");
const rateLimit = require("express-rate-limit");
app.use(cors);
app.use(express.json());
const PORT = 3001;
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const rateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5000,
  handler: function (req, res) {
    return res.status(429).json({
      error: "You sent too many requests. Please wait a while then try again",
    });
  },
});

const connectDb=()=>{
  mongoose.connect(
      `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jwhcr.mongodb.net/test2`
    ).then((val)=>console.log("db connected successfully")).catch((err)=>console.log("error connecting due to "+err));
}


app.use(rateLimiter);
app.use(UserRouter);
app.use(KanbanRouter);
app.listen(process.env.PORT || PORT, () => console.log("server is running"));
app.get("/",(req,res)=>res.json("Trello server initialized"));
connectDb();