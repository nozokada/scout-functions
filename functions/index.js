const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const GeoFirestore = require('geofirestore').GeoFirestore;

exports.createGeoFirestoreLocation = functions.firestore
    .document('photos/{photoId}')
    .onWrite((change, context) => {
        const geofirestore = new GeoFirestore(admin.firestore());
        const geocollection = geofirestore.collection('locations');
        const position = change.after.data()['location']['position'];
        const latitude = position['latitude'];
        const longitude = position['longitude'];
        return geocollection.doc(context.params.photoId).set({
            coordinates: new admin.firestore.GeoPoint(latitude, longitude)
        });
});
