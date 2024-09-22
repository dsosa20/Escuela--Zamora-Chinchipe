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
  try {
    // Logging para el cuerpo de la solicitud
    console.log('Request Body:', event.body);

    // Verificar si el cuerpo de la solicitud está vacío
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Bad Request: Missing request body' }),
      };
    }

    const body = JSON.parse(event.body);
    console.log('Parsed Body:', body); // Agregado para verificar el cuerpo

    // Verificar si la solicitud proviene de Telegram y contiene un mensaje con una foto
    if (body.message && body.message.photo) {
      // Obtener el ID del archivo de la foto de la mayor resolución
      const fileId = body.message.photo[body.message.photo.length - 1].file_id;
      console.log('File ID:', fileId); // Agregado para verificar el fileId

      // Obtener la información del archivo desde Telegram
      const fileResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
      const fileData = await fileResponse.json();

      console.log('File Data:', fileData); // Agregado para verificar la respuesta de Telegram

      if (!fileData.ok) {
        throw new Error('Error getting file from Telegram');
      }

      const filePath = fileData.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
      const fileName = `images/${Date.now()}_${filePath.split('/').pop()}`;

      // Descargar el archivo desde Telegram
      console.log('Fetching file from Telegram:', fileUrl);
      const response = await fetch(fileUrl);
      const buffer = await response.buffer();
      console.log('File downloaded, size:', buffer.length);

      // Guardar el archivo en Firebase Storage
      console.log('Saving file to Firebase Storage:', fileName);
      const file = bucket.file(fileName);
      await file.save(buffer);
      console.log('File saved to Firebase Storage');

      // Generar la URL pública
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(fileName)}?alt=media`;
      console.log('Public URL:', publicUrl);

      // Guardar la URL en Firestore
      await db.collection('images').add({
        url: publicUrl,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('URL saved to Firestore');

      // Retornar una respuesta exitosa
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Image uploaded successfully' }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Bad Request: No photo found in the message' }),
      };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};
