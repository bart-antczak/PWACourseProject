var functions = require('firebase-functions');
var admin = require("firebase-admin");
var cors = require('cors')({origin: true});
var webpush = require('web-push');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

var serviceAccount = require("./pwacourse-e3e2b-firebase-adminsdk-nycf0-637edbff26.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pwacourse-e3e2b.firebaseio.com"
});

exports.storePostData = functions.https.onRequest(function(request, response) {
    cors(request, response, function() {
        admin.database().ref('posts').push({
            id: request.body.id,
            title: request.body.title,
            location: request.body.location,
            image: request.body.image
        })
            .then(function() {
                webpush.setVapidDetails(
                    'mailto:antczak.bar@gmail.com',
                    'BLXBI1UPncvFYfKOfqlHc6upNhNLmOYnroAKRiYT5zg4u68Ah6el02P3Rd4o8MXp6CoyJlnb-fvilJLMDpZpytk',
                    'xU6BSlcva7mMTySmmx6QwZ-o7dFCbyzwtjoD4Xi_OLA'
                );
                return admin.database().ref('subscribtions').once('value');
            })
            .then(function(subscribtions) {
                subscribtions.forEach(function (sub) {
                    var pushConfig = {
                        endpoint: sub.val().endpoint,
                        keys: {
                            auth: sub.val().keys.auth,
                            p256dh: sub.val().keys.p256dh
                        }
                    };
                    webpush.sendNotification(pushConfig, JSON.stringify(
                        {
                            title: 'New Post',
                            content: 'New post added!',
                            openUrl: '/help'
                        }))
                        .catch(function (err) {
                            console.log(err);
                        })
                });
                response.status(201).json({message: 'Data stored', id: request.body.id});
            })
            .catch(function(err) {
                response.status(500).json({error: err});
            });
    });
});