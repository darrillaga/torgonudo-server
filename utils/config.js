const
    Promise = require('promise'),
    Fs = require('fs');

var readFile = Promise.denodeify(Fs.readFile);

exports.load = function (filename) {
  return readFile(filename, 'utf8').then(JSON.parse);
};

