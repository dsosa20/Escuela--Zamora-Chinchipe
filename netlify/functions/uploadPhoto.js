const admin = require('firebase-admin');

// Importación dinámica de node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

admin.initializeApp({
  credential: admin.credential.cert({
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

exports.handler = async function(event, context) {
  const body = JSON.parse(event.body);
  const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${body.file_path}`;
  const fileName = `images/${Date.now()}_${body.file_name}`;

  // Descargar el archivo desde Telegram
  const response = await fetch(fileUrl);
  const buffer = await response.buffer();

  // Guardar el archivo en Firebase Storage
  const file = bucket.file(fileName);
  await file.save(buffer);

  // Generar la URL pública
  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(fileName)}?alt=media`;

  // Guardar la URL en Firestore
  await db.collection('images').add({
    url: publicUrl,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  // Retornar una respuesta exitosa
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Image uploaded successfully' }),
  };
};
