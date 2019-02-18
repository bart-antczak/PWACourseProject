var functions = require('firebase-functions');
var admin = require("firebase-admin");
var cors = require('cors')({origin: true});
var webpush = require('web-push');
var busboy = require('busboy');
var fs = require('fs');
var UUID = require('uuid-v4');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

var serviceAccount = require("./pwacourse-e3e2b-firebase-adminsdk-nycf0-637edbff26.json");

var gcconfig = {
    projectId: 'pwacourse-e3e2b',
    keyFilename: 'pwacourse-e3e2b-firebase-adminsdk-nycf0-637edbff26.json'
};

var gcs = require('@google-cloud/storage')(gcconfig);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pwacourse-e3e2b.firebaseio.com"
});

exports.storePostData = functions.https.onRequest(function(request, response) {
    cors(request, response, function() {
        var uuid = UUID();
        var formData = new busboy.IncomingForm();
        formData.parse(request, function(err, fields, files) {
            fs.rename(files.file.path, '/tmp/' + files.file.name);
            var bucket = gcs.bucket('pwacourse-e3e2b.appspot.com');
            bucket.upload('/tmp/' + files.file.name, {
                uploadType: 'media',
                metadata: {
                    metadata: {
                        contentType: files.file.type,
                        firebaseStorageDownloadTokens: uuid
                    }
                }
            }, function(err, file) {
                if (!err) {
                    admin.database().ref('posts').push({
                        id: fields.id,
                        title: fields.title,
                        location: fields.location,
                        // Publicznie dostępny url do zdjęcia uploadowanego do firebase
                        image: 'https://firebasestorage.googleapis.com/v0/b/' + bucket.name + '/o/' + encodeURIComponent(file.name) + '?alt=media&token=' + uuid
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
                } else {
                    console.log(err);
                }
            });
        });

    });
});