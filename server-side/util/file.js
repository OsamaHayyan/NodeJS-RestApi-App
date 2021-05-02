const fs = require("fs");
const path = require("path");
const deleteFile = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    if (err) {
      throw new Error(err);
    }
  });
};

// const deleteFile = (filePath) => {
//     fs.unlink(filePath, (err) => {
//         if (err) {
//             throw new Error(err);
//         }
//     })
// }

exports.deleteFile = deleteFile;
