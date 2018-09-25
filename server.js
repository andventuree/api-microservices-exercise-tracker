const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const cors = require("cors");

const mongoose = require("mongoose");
require("./secrets");
mongoose.connect(process.env.MLAB_URI || "mongodb://localhost/exercise-track");

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Mongo DB schemas
const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: { type: String, required: true },
  exercises: []
});

const User = mongoose.model("User", userSchema);

// Helper Functions
const isValid = date => date.toString() !== "Invalid Date";

const formatDateStr = date => {
  if (!date) date = new Date();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const month = months[date.getMonth()];
  const day = days[date.getDay()];
  return `${day} ${month} ${date.getDate()} ${date.getFullYear()}`;
};

// ROUTES

// GET api/exercise/users
app.get("/api/exercise/users", (req, res, next) => {
  User.find().then(users => {
    const savedUsers = users.map(user => {
      return { username: user.username, _id: user._id };
    });
    res.status(200).json(savedUsers); //200 Ok
  });
});

// POST /api/exercise/new-user
app.post("/api/exercise/new-user", (req, res, next) => {
  User.create({ username: req.body.username }, (err, data) => {
    if (err) next(err);
    const savedUser = { username: data.username, _id: data._id };
    res.status(201).json(savedUser); //201 created
  });
});

// POST /api/exercise/add
app.post("/api/exercise/add", (req, res, next) => {
  let { userId, description, duration, date } = req.body;
  date = new Date(date);
  duration = parseInt(duration);
  const dateStr = isValid(date) ? formatDateStr(date) : formatDateStr();
  const exercise = { description, duration, date: dateStr };

  User.findByIdAndUpdate(
    { _id: userId },
    { $push: { exercises: exercise } },
    (err1, data) => {
      if (err1) next(err1);
      const loggedExercise = Object.assign(exercise, {
        username: data.username,
        _id: data._id
      });
      res.status(200).json(loggedExercise);
    }
  );
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
