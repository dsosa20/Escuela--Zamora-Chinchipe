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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elementos del DOM
const gallery = document.getElementById('gallery');
const messagesContainer = document.getElementById('messages');

// Función para mostrar fotos
const displayPhotos = () => {
  const photosCollection = collection(db, 'images');
  const q = query(photosCollection, orderBy('timestamp', 'desc'));

  onSnapshot(q, snapshot => {
    gallery.innerHTML = ''; 
    snapshot.forEach(doc => {
      const photo = doc.data();
      const photoCard = document.createElement('div');
      photoCard.className = 'photo-card';

      const img = document.createElement('img');
      img.src = photo.url;
      img.className = 'photo';
      photoCard.appendChild(img);

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
};

// Función para mostrar mensajes de texto
const displayMessages = () => {
  const messagesCollection = collection(db, 'messages');
  const q = query(messagesCollection, orderBy('timestamp', 'desc'));

  onSnapshot(q, snapshot => {
    messagesContainer.innerHTML = ''; 
    snapshot.forEach(doc => {
      const message = doc.data();
      const messageCard = document.createElement('div');
      messageCard.className = 'message-card';

      const messageText = document.createElement('p');
      messageText.textContent = message.text;
      messageCard.appendChild(messageText);

      const sender = document.createElement('span');
      sender.className = 'sender';
      sender.textContent = `From: ${message.from}`;
      messageCard.appendChild(sender);

      const date = new Date(message.timestamp.seconds * 1000);
      const dateString = date.toLocaleDateString('es-ES');
      const timeString = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      const messageInfo = document.createElement('div');
      messageInfo.className = 'message-info';
      messageInfo.innerHTML = `<span class="date">${dateString}</span><span class="time">${timeString}</span>`;

      messageCard.appendChild(messageInfo);
      messagesContainer.appendChild(messageCard);
    });
  });
};

// Llamar a las funciones para mostrar fotos y mensajes
displayPhotos();
displayMessages();
