import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsEdjaZ3UeLoDyMzVhDjXKIDz3BSgcfc4",
  authDomain: "bot-telegram-c6ce2.firebaseapp.com",
  projectId: "bot-telegram-c6ce2",
  storageBucket: "bot-telegram-c6ce2.appspot.com",
  messagingSenderId: "901206605305",
  appId: "1:901206605305:web:cc9a0753e6d234ddfd1128"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const gallery = document.getElementById('gallery');
const photosCollection = collection(db, 'images');
const q = query(photosCollection, orderBy('timestamp', 'desc'));

onSnapshot(q, snapshot => {
  gallery.innerHTML = ''; 
  snapshot.forEach(doc => {
    const photo = doc.data();
    const photoCard = document.createElement('div');
    photoCard.className = 'photo-card';

    // Crear elemento de imagen
    const img = document.createElement('img');
    img.src = photo.url;
    img.className = 'photo';
    photoCard.appendChild(img);

    // Mostrar la descripción si está disponible
    if (photo.description) {
      const descriptionElem = document.createElement('p');
      descriptionElem.className = 'photo-description';
      descriptionElem.textContent = photo.description;
      photoCard.appendChild(descriptionElem);
    }

    // Mostrar fecha y hora
    const date = new Date(photo.timestamp.seconds * 1000);
    const dateString = date.toLocaleDateString('es-ES');
    const timeString = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const photoInfo = document.createElement('div');
    photoInfo.className = 'photo-info';
    photoInfo.innerHTML = `<span class="date">${dateString}</span><span class="time">${timeString}</span>`;

    photoCard.appendChild(photoInfo);
    gallery.appendChild(photoCard);
  });
});
