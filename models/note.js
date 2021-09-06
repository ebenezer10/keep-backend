const consts = require('../modules/consts');

const { Schema } = consts.mongoose;

const note = new Schema({
  title: String,
  content: String,
  color: String,
  createdDate: Number,
  editedDate: Number,
  userId: String,
});

module.exports = consts.mongoose.model('NoteModel', note, 'notes');
