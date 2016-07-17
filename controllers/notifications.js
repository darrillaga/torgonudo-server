const
    FirebaseManager = require('../firebase_manager'),
    FCM = require('fcm-push'),
    Config = require('../utils/config');

var firebaseApp = FirebaseManager.firebaseApp;
var db = firebaseApp.database();
var deliveries = db.ref("/deliveries");
var devices = db.ref("/notifications/devices");

var fcmPromise = Config.load('config/globalCredentials.json').then(function (config) {
    console.log("fcm added");
    return new FCM(config.server_key);
});

function createMessage(token) {
    return {
        to: token, // required
        data: {
            your_custom_data_key: 'your_custom_data_value'
        },
        notification: {
            title: 'Hi',
            body: 'Body of your push notification'
        }
    };
}

function sendNotification(message) {
    console.log("attempt sending message");
    fcmPromise.then(
        function (fcm) {
            console.log("sending message");
            fcm.send(message, function(err, response) {
                if (err) {
                    console.log("Something has gone wrong!");
                } else {
                    console.log("Successfully sent with response: ", response);
                }
            });
        }
    );
}

// MODELS
//
// DeliveryOrder - key id
// id : String
// orderText: String
// price: Double
// status: String (waiting, delivering, delivered, cancelled)
// createdAt: Long - server timestamp
// lastStatusUpdate: Long - server timestamp
//

// Firebase db
//
// viewerAppId -> { key, authId }
// notifications/devices -> {authId, token}
// /deliveries/{pendingDeliveryId} -> {user, text, pendingDeliveryId, status(PENDING, DELIVERED, EXPIRED), date, expiryPeriod}
// /deliveryRequests/{?} -> {pendingDeliveryId, date}
//
// Events
//
// On /deliveries/{pendingDeliveryId} Inserted send notification to viewerAppId
// On /deliveries/{pendingDeliveryId} status PENDING send notification to viewerAppId
// On /deliveries/{pendingDeliveryId} status DELIVERED send notification to viewerAppId
// On /deliveries/{pendingDeliveryId} status EXPIRED send notification to viewerAppId
//
// On /deliveryRequests/{?} added send notification to pendingDelivery -> authId
const TIMESTAMP = "timestamp"

const viewersAppIds = db.ref("viewersAppId");

viewersAppIds.on("child_added", snapshot => {
    let viewerAppId = snapshot.val().authId;
    let notifications = registerNotifications(viewerAppId);
    viewersAppIds.child(snapshot.key).once("child_removed", snapshot =>
        notifications.forEach(notification => unregisterFirebaseCallback(notification))
    );
})

function registerNotifications(viewerToken) {
    return [
        registerFirebaseQueryCallback(
            deliveries.orderByChild("createdAt").startAt(TIMESTAMP),
            "child_added",
            snapshot => {
                var newDelivery = snapshot.val();
                sendNotification(createMessage(viewerToken));
            }
        ),
        registerFirebaseQueryCallback(
            deliveries,
            "child_changed",
            snapshot => {
                var newDelivery = snapshot.val();
                devices.child(newDelivery.user).once("value", snapshot => sendNotification(createMessage(snapshot.val().token)));
            }
        )
    ];
}

function unregisterFirebaseCallback(firebaseQueryCallback) {
    firebaseQueryCallback.ref.off(firebaseQueryCallback.eventType, firebaseQueryCallback.callback);
}

function registerFirebaseQueryCallback(ref, eventType, callback) {
    ref.on(eventType, callback);
    return {ref, eventType, callback};
}