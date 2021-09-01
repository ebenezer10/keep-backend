require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const passport = require("passport");

const jwt = require("jsonwebtoken");
const passportJWT = require("passport-jwt");
const Utility = require("./modules/utility");
const indexRouter = require("./routes/index");
const NoteModel = require("./models/note");

const app = express();

const { ExtractJwt } = passportJWT;
const JwtStrategy = passportJWT.Strategy;
const jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = "tasmanianDevil";
const strategy = new JwtStrategy(jwtOptions, (jwtPayload, next) => {
  userModel.findById(jwtPayload.id, (error, user) => {
    if (error) throw error;
    if (user) {
      next(null, user);
    } else {
      next(null, false);
    }
  });
});
passport.use(strategy);
app.use(passport.initialize());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.post("/newNote", (req, res) => {
  const note = new NoteModel(req.body);
  if (Utility.noteIsNotEmpty(note)) {
    note.save(function (err) {
      if (err) throw err;
      res.status(201).json({ status: 0, message: "Note added successfully", note });
    });
  }
  res.status(400).json({ status: -1, message: "Note may be empty" });
});

app.get("/getNotes", (req, res) => {
  NoteModel.find({}).then((value) => {
    if (value) {
      res.status(200).json({ status: 0, message: "All notes retrieve", notes: value });
    }
    res.status(400).json({ status: -1, message: "Error retrieving notes" });
  });
});

app.patch("/editNote", (req, res) => {
  const note = new NoteModel(req.body);
  if (Utility.noteIsNotEmpty(note)) {
    NoteModel.updateOne({ _id: note._id }, note, function (err, doc) {
      if (err) throw err;
      NoteModel.findOne({ _id: note._id }, function (err, obj) {
        if (err) throw err;
        res.status(201).json({
          status: 0,
          message: "Note edited successfully",
          note: obj,
        });
      });
    });
  } else {
    res.status(400).json({ status: -1, message: "Note may be empty" });
  }
});

app.delete("/deleteNote", (req, res) => {
  console.log(req.body);
  const note = new NoteModel(req.body);
  if (Utility.noteIsNotEmpty(note)) {
    note.delete(function (err) {
      if (err) throw err;
      res.status(204).json({ status: 0, message: "Note deleted successfully" });
    });
  } else {
    res.status(400).json({ status: -1, message: "Note may be empty" });
  }
});

app.use("/", indexRouter);

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/login");
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
