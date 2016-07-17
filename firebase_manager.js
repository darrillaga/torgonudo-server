var firebase = require('firebase');

var firebaseApp = firebase.initializeApp({
    serviceAccount: "./Config/serviceAccountCredentials.json",
    databaseURL: "https://torconudo-1273c.firebaseio.com"
});

exports.firebase = firebase;
exports.firebaseApp = firebaseApp;
