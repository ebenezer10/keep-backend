const consts = require('../modules/consts');
console.log(process.env.DB_URL);

const { Schema } = consts.mongoose;

const note = new Schema({
  title: String,
  content: String,
  createdDate : Number,
  editedDate : Number
});

module.exports = consts.mongoose.model('NoteModel', note, 'notes');