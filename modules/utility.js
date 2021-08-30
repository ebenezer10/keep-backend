/**
* @author Ebenezer Nikabou <nikaboue10@gmail.com>
* Utility module for some process
* @summary Utility module for some process
* @param {Object} param
* @return {Boolean}
*/

const noteIsNotEmpty = function (note) {
  if (note.title.trim() !== '' && note.content.trim() !== '') {
    return true;
  }
  return false;
};

module.exports = { noteIsNotEmpty };
