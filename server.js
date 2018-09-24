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
let Schema = mongoose.Schema;
let userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  exercises: []
});

let User = mongoose.model("User", userSchema);

// ROUTES

// GET api/exercise/users
app.get("/api/exercise/users", (req, res, next) => {
  User.find().then(users => {
    console.log(users);
    let savedUsers = users.map(user => {
      return { username: user.username, _id: user._id };
    });
    res.status(200).json(savedUsers); //200 Ok
  });
});

// POST /api/exercise/new-user
app.post("/api/exercise/new-user", (req, res, next) => {
  let username = req.body.username;
  User.create({ username: username }, (err, data) => {
    if (err) next(err);
    let savedUser = { username: data.username, _id: data._id };
    res.status(201).json(savedUser); //201 created
  });
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
