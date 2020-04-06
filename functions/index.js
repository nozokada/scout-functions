const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore();

const GeoFirestore = require('geofirestore').GeoFirestore;
const geoFirestore = new GeoFirestore(admin.firestore());
const spotsGeoCollection = geoFirestore.collection('spots_geo');

const spotsRef = firestore.collection('spots');

exports.onPhotoCreate = functions.firestore
    .document('photos/{id}')
    .onCreate((photoSnapshot, context) => {
        const photoData = photoSnapshot.data();
        const position = photoData['location']['position'];

        return spotsRef.where('position', '==', position).limit(1).get()
            .then(spotQuerySnapshot => {
                if (spotQuerySnapshot.empty) {
                    console.log(`Creating new spot for photo ${photoSnapshot.id}`);
                    return addSpot(photoSnapshot);
                }
                const spot = spotQuerySnapshot.docs[0];
                console.log(`Adding photo ${photoSnapshot.id} to existing spot ${spot.id}`);
                return addPhotoToSpot(photoSnapshot, spot.ref)
            });
    });

exports.onSpotCreate = functions.firestore
    .document('spots/{id}')
    .onCreate((snapshot, context) => {
        const position = snapshot.data()['position'];
        const latitude = position['latitude'];
        const longitude = position['longitude'];

        return spotsGeoCollection.doc(context.params.id).set({
            coordinates: new admin.firestore.GeoPoint(latitude, longitude)
        });
    });

function addSpot(photoSnapshot) {
    const photoData = photoSnapshot.data();
    return spotsRef.add({
        position: photoData['location']['position'],
        name: null,
    }).then(ref => {
        return addPhotoToSpot(photoSnapshot, ref)
    });
}

function addPhotoToSpot(photoSnapshot, ref) {
    const photoId = photoSnapshot.id;
    const photoData = photoSnapshot.data();

    return ref.collection('photos').doc(photoId).set(photoData)
}
