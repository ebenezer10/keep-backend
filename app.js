/* eslint-disable no-underscore-dangle */
require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const passport = require('passport');

const jwt = require('jsonwebtoken');
const passportJWT = require('passport-jwt');
const UserModel = require('./models/user');

const { ExtractJwt } = passportJWT;
const JwtStrategy = passportJWT.Strategy;
const jwtOptions = {};

jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = process.env.APP_SECRET;
const strategy = new JwtStrategy(jwtOptions, (jwtPayload, next) => {
  UserModel.findById(jwtPayload.id, (error, user) => {
    if (error) console.log(error);
    if (user) {
      next(null, user);
    } else {
      next(null, false);
    }
  });
});

const Utility = require('./modules/utility');
const indexRouter = require('./routes/index');
const NoteModel = require('./models/note');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

passport.use(strategy);
app.use(passport.initialize());

app.get('/secret', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json('Success! You can not see this without a token');
});

app.post('/newNote', passport.authenticate('jwt', { session: false }), (req, res) => {
  const note = new NoteModel(req.body);
  if (Utility.noteIsNotEmpty(note)) {
    note.save((err) => {
      if (err) {
        res.status(500).json({
          status: 0,
          message: 'Internall server error',
          error: err,
        });
      } else {
        res.status(201).json({ status: 0, message: 'Note added successfully', note });
      }
    });
  } else {
    res.status(400).json({ status: -1, message: 'Note may be empty' });
  }
});

app.get('/getNotes', passport.authenticate('jwt', { session: false }), async (req, res) => {
  jwt.verify(
    req.headers.authorization.replace('Bearer ', ''),
    process.env.APP_SECRET,
    (err, decoded) => {
      if (err) {
        res.status(500).json({
          status: 0,
          message: 'Internall server error',
          error: err,
        });
      } else if (decoded) {
        NoteModel.find({ userId: req.query.userId }).then((value) => {
          if (value) {
            res.status(200).json({
              status: 0,
              message: 'All notes retrieve',
              notes: value,
            });
          } else {
            res.status(400).json({ status: -1, message: 'Error retrieving notes' });
          }
        });
      } else {
        res.status(402).json({ status: -1, message: 'Expired Token' });
      }
    },
  );
});

app.patch('/editNote', passport.authenticate('jwt', { session: false }), (req, res) => {
  const note = new NoteModel(req.body);
  if (Utility.noteIsNotEmpty(note)) {
    NoteModel.updateOne({ _id: note._id }, note, (err) => {
      if (err) {
        res.status(500).json({
          status: 0,
          message: 'Internall server error',
          error: err,
        });
      } else {
        NoteModel.findOne({ _id: note._id }, (error, obj) => {
          if (err) {
            res.status(500).json({
              status: 0,
              message: 'Internall server error',
              error,
            });
          } else {
            res.status(201).json({
              status: 0,
              message: 'Note edited successfully',
              note: obj,
            });
          }
        });
      }
    });
  } else {
    res.status(400).json({ status: -1, message: 'Note may be empty' });
  }
});

app.delete('/deleteNote', passport.authenticate('jwt', { session: false }), (req, res) => {
  const note = new NoteModel(req.body);
  if (Utility.noteIsNotEmpty(note)) {
    note.delete((err) => {
      if (err) {
        res.status(500).json({
          status: 0,
          message: 'Internall server error',
          error: err,
        });
      } else {
        res.status(204).json({ status: 0, message: 'Note deleted successfully' });
      }
    });
  } else {
    res.status(400).json({ status: -1, message: 'Note may be empty' });
  }
});

app.post('/login', (req, res) => {
  if (req.body.username && req.body.password) {
    const { username } = req.body;
    const { password } = req.body;

    const authenticate = UserModel.authenticate();
    authenticate(username, password, (error, user) => {
      if (error) {
        res.status(500).json({
          status: 0,
          message: 'Internall server error',
          error,
        });
      } else if (user) {
        const payload = { id: user.id };
        const token = jwt.sign(payload, jwtOptions.secretOrKey, {
          expiresIn: process.env.JWT_EXPIRES,
        });
        res.status(200).json({ message: 'User authentication successful', token, user });
      } else {
        res.status(401).json({ message: 'No such user found' });
      }
    });
  } else {
    res.status(400).json({ message: 'Bad request. Request body must not be empty.' });
  }
});

app.use('/', indexRouter);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
