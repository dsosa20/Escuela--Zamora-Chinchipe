import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDsEdjaZ3UeLoDyMzVhDjXKIDz3BSgcfc4",
  authDomain: "bot-telegram-c6ce2.firebaseapp.com",
  projectId: "bot-telegram-c6ce2",
  storageBucket: "bot-telegram-c6ce2.appspot.com",
  messagingSenderId: "901206605305",
  appId: "1:901206605305:web:cc9a0753e6d234ddfd1128"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Selecciona la galería y configura la consulta
const gallery = document.getElementById('gallery');
const photosCollection = collection(db, 'images');
const q = query(photosCollection, orderBy('timestamp', 'desc'));

// Observa los cambios en la colección de fotos
onSnapshot(q, snapshot => {
  gallery.innerHTML = ''; // Limpiar la galería antes de agregar las nuevas imágenes
  snapshot.forEach(doc => {
    const photo = doc.data();
    const img = document.createElement('img');
    img.src = photo.url;
    img.className = 'photo';
    gallery.appendChild(img);
  });
});
