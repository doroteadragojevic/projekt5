import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
    getStorage,
    ref,
    uploadBytes,
    listAll,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";
const firebaseConfig = {
    apiKey: "AIzaSyBLoNJm9wZ4YvhHlbIWIAeqXqgT2H--myU",
    authDomain: "projekt5-d8fa5.firebaseapp.com",
    projectId: "projekt5-d8fa5",
    storageBucket: "projekt5-d8fa5.appspot.com",
    messagingSenderId: "51419902048",
    appId: "1:51419902048:web:9cb6a70cd1f631504cd305",
    measurementId: "G-ER97R77EFR"
};

const firebase = initializeApp(firebaseConfig);

document.addEventListener('DOMContentLoaded', async () => {
    const dli = {
        date: '10. srpnja - 25. kolovoza 2024.',
        description: 'Dubrovačke ljetne igre su festival utemeljen 1950. godine. U jedinstvenom ambijentu zatvorenih i otvorenih scenskih prostora gotičko-renesansno-baroknog grada Dubrovnika – primjerice Knežev dvor, tvrđava Lovrjenac, tvrđava Minčeta, tvrđava Revelin, otok Lokrum, Gundulićeva poljana, Park Umjetničke škole i dr.[1] – u vremenu od 10. srpnja do 25. kolovoza održavaju se brojne glazbene, dramske i plesne priredbe, te izložbe i popratni program. Jedan je od najprestižnijih ljetnih festivala takve vrste u Hrvatskoj na kojem je nastupala većina hrvatskih kazališnih i glazbenih umjetnika te mnogi strani ugledni ansambli, solisti i glasovite družine.',
    };

    const hardcodedImages = await displayImages();
    const firebaseImages = await fetchFirebaseImages();

    const captureButton = document.getElementById('captureButton');

    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const confirmButton = document.getElementById('confirmButton');

    captureButton.addEventListener('click', () => {
        captureImage()
            .then(imageData => {
                displayCapturedImage(imageData);

                imagePreviewContainer.style.display = 'block';
                confirmButton.addEventListener('click', () => {
                    uploadImage(imageData);
                    imagePreviewContainer.style.display = 'none';
                });
            })
            .catch(error => {
                console.error('Error capturing image:', error);
            });
    });

    function displayCapturedImage(imageData) {
        imagePreview.src = imageData;
    }


    displayData(dli, hardcodedImages, firebaseImages);



});

async function fetchFirebaseImages() {
    try {
        const storageRef = ref(getStorage(firebase), 'images');
        const items = await listAll(storageRef);

        const downloadURLs = await Promise.all(
            items.items.map(async item => {
                return getDownloadURL(item);
            })
        );

        return downloadURLs;
    } catch (error) {
        console.error('Error fetching images from Firebase Storage:', error);
        return [];
    }
}

function captureImage() {
    return new Promise((resolve, reject) => {
        navigator.mediaDevices.getUserMedia({
                video: true
            })
            .then(stream => {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();

                video.addEventListener('loadedmetadata', () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const context = canvas.getContext('2d');
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);

                    stream.getTracks().forEach(track => track.stop());

                    const imageData = canvas.toDataURL('image/jpeg');
                    resolve(imageData);
                });
            })
            .catch(error => {
                reject(error);
            });
    });
}



async function displayImages() {
    const imageUrls = ['images/dli1.jpg', 'images/dli2.jpg', 'images/dli3.jpg'];

    await Promise.all(imageUrls.map(cacheImage));

    const imagesHtml = imageUrls.map(imageUrl => `<img src="${imageUrl}" alt="Dubrovačke ljetne igre" style="max-width: 100%; height: auto;">`).join('');

    return imagesHtml;
}

async function cacheImage(imageUrl) {
    try {
        const cache = await caches.open('dubrovacke-ljetne-igre-cache-v1');
        const response = await fetch(imageUrl);
        await cache.put(imageUrl, response.clone());
    } catch (error) {
        console.error(`Error caching image (${imageUrl}):`, error);
    }
}

function displayData(data, hardcodedImages, firebaseImages) {
    const infoContainer = document.getElementById('info-container');
    const hardcodedImagesContainer = document.getElementById('hardcoded-images-container');
    const firebaseImagesContainer = document.getElementById('firebase-images-container');

    const infoHtml = `
        <p>${data.date}</p>
        <p>${data.description}</p>
    `;
    infoContainer.innerHTML = infoHtml;

    hardcodedImagesContainer.innerHTML = hardcodedImages;

    const firebaseImagesHtml = firebaseImages.map(imageUrl => `<img src="${imageUrl}" alt="Firebase Image" style="max-width: 100%; height: auto;">`).join('');
    firebaseImagesContainer.innerHTML = firebaseImagesHtml;
}



async function uploadImage(imageData) {
    try {
        const storage = getStorage(firebase);
        const storageRef = ref(storage, `images/${generateFileName()}.jpg`);

        const blob = await fetch(imageData).then(res => res.blob());

        const snapshot = await uploadBytes(storageRef, blob);

        console.log('Image successfully uploaded to Firebase Storage:', snapshot);
        requestNotificationPermission();
        sendNotification('Uspješno dodavanje slike', {
            body: 'Uspješno ste dodali novu sliku.',
            icon: 'images/notif-icon.png',
        });

    } catch (error) {
        console.error('Greška prilikom pohrane slike:', error);
    }
}

function generateFileName() {
    return new Date().toISOString().replace(/[-:]/g, '_');
}

async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission status:', permission);
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
}

function sendNotification(title, options) {
    if (Notification.permission === 'granted') {
        new Notification(title, options);
    }
}