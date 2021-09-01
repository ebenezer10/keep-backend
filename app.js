/* eslint-disable no-underscore-dangle */
require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

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

app.post('/newNote', (req, res) => {
  const note = new NoteModel(req.body);
  if (Utility.noteIsNotEmpty(note)) {
    note.save((err) => {
      if (err) throw err;
      res.status(201).json({ status: 0, message: 'Note added successfully', note });
    });
  } else {
    res.status(400).json({ status: -1, message: 'Note may be empty' });
  }
});

app.get('/getNotes', (req, res) => {
  NoteModel.find({}).then((value) => {
    if (value) {
      res.status(200).json({ status: 0, message: 'All notes retrieve', notes: value });
    } else {
      res.status(400).json({ status: -1, message: 'Error retrieving notes' });
    }
  });
});

app.patch('/editNote', (req, res) => {
  const note = new NoteModel(req.body);
  if (Utility.noteIsNotEmpty(note)) {
    NoteModel.updateOne({ _id: note._id }, note, (err) => {
      if (err) throw err;
      NoteModel.findOne({ _id: note._id }, (error, obj) => {
        if (err) throw error;
        res.status(201).json({
          status: 0,
          message: 'Note edited successfully',
          note: obj,
        });
      });
    });
  } else {
    res.status(400).json({ status: -1, message: 'Note may be empty' });
  }
});

app.delete('/deleteNote', (req, res) => {
  const note = new NoteModel(req.body);
  if (Utility.noteIsNotEmpty(note)) {
    note.delete((err) => {
      if (err) throw err;
      res.status(204).json({ status: 0, message: 'Note deleted successfully' });
    });
  } else {
    res.status(400).json({ status: -1, message: 'Note may be empty' });
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
