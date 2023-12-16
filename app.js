import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
// Import storage function from the modular SDK
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

// Initialize Firebase

document.addEventListener('DOMContentLoaded', async () => {
    // Hardcoded data about Dubrovačke ljetne igre
    const data = {
        title: 'Dubrovačke ljetne igre',
        date: '15. srpnja - 25. kolovoza 2023.',
        description: 'Najpoznatiji festival kazališta i umjetnosti u Dubrovniku.',
    };

    const hardcodedImages = await displayImages();
    const firebaseImages = await fetchFirebaseImages();

    const captureButton = document.getElementById('captureButton');
    const capturedImage = document.getElementById('capturedImage');

    captureButton.addEventListener('click', () => {
        captureImage()
            .then(imageData => {
                // Display the captured image
                capturedImage.src = imageData;
                // Upload the image to Firebase or handle it as needed
                uploadImage(imageData);
            })
            .catch(error => {
                console.error('Error capturing image:', error);
            });
    });


    displayData(data, hardcodedImages, firebaseImages);

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

});

function captureImage() {
    return new Promise((resolve, reject) => {
        // Use the Camera API to capture an image
        navigator.mediaDevices.getUserMedia({
                video: true
            })
            .then(stream => {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();

                // Capture image from video stream
                video.addEventListener('loadedmetadata', () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const context = canvas.getContext('2d');
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // Stop the video stream
                    stream.getTracks().forEach(track => track.stop());

                    // Convert the canvas content to data URL as JPEG
                    const imageData = canvas.toDataURL('image/jpeg');
                    resolve(imageData);
                });
            })
            .catch(error => {
                reject(error);
            });
    });
}


let selectedImage;

async function displayImages() {
    // Relativne putanje do slika
    const imageUrls = ['images/dli1.jpg', 'images/dli2.jpg', 'images/dli3.jpg'];

    // Cacheiranje svake slike
    await Promise.all(imageUrls.map(cacheImage));

    // Rendering HTML za svaku sliku
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

    // Rendering HTML for hardcoded data
    const infoHtml = `
        <p>${data.title}</p>
        <p>${data.date}</p>
        <p>${data.description}</p>
    `;
    infoContainer.innerHTML = infoHtml;

    // Rendering HTML for hardcoded images
    hardcodedImagesContainer.innerHTML = hardcodedImages;

    // Rendering HTML for Firebase images
    const firebaseImagesHtml = firebaseImages.map(imageUrl => `<img src="${imageUrl}" alt="Firebase Image" style="max-width: 100%; height: auto;">`).join('');
    firebaseImagesContainer.innerHTML = firebaseImagesHtml;
}



// Inicijalizirajte Firebase
const firebase = initializeApp(firebaseConfig);

// Prijavite korisnika (možete implementirati vlastitu prijavu korisnika)
// Ovo je samo primjer, koristite odgovarajuću metodu prijave za svoju aplikaciju
//firebase.auth().signInWithEmailAndPassword('user@example.com', 'password');



// Implementirajte funkciju za slanje slike na Firebase Storage
async function uploadImage(imageData) {
    try {
        const storage = getStorage(firebase);
        const storageRef = ref(storage, `images/${generateFileName()}.jpg`);

        // Convert data URL to Blob
        const blob = await fetch(imageData).then(res => res.blob());

        // Pohranite sliku na Firebase Storage
        const snapshot = await uploadBytes(storageRef, blob);

        console.log('Slika uspješno pohranjena na Firebase Storage:', snapshot);
    } catch (error) {
        console.error('Greška prilikom pohrane slike:', error);
    }
}

function generateFileName() {
    // Generate a unique filename based on the current timestamp
    return new Date().toISOString().replace(/[-:]/g, '_');
}