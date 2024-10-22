const admin = require('firebase-admin');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

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

exports.handler = async function (event, context) {
  try {
    console.log('Request Body:', event.body);

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Bad Request: Missing request body' }),
      };
    }

    const body = JSON.parse(event.body);
    console.log('Parsed Body:', body);

    // Proceso para fotos
    if (body.message && body.message.photo) {
      const fileId = body.message.photo[body.message.photo.length - 1].file_id;
      console.log('File ID:', fileId);

      const fileResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
      const fileData = await fileResponse.json();
      console.log('File Data:', fileData);

      if (!fileData.ok) {
        throw new Error('Error getting file from Telegram');
      }

      const filePath = fileData.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
      const fileName = `images/${Date.now()}_${filePath.split('/').pop()}`;

      console.log('Fetching file from Telegram:', fileUrl);
      const response = await fetch(fileUrl);
      const buffer = await response.buffer();
      console.log('File downloaded, size:', buffer.length);

      console.log('Saving file to Firebase Storage:', fileName);
      const file = bucket.file(fileName);
      await file.save(buffer);
      console.log('File saved to Firebase Storage');

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(fileName)}?alt=media`;
      console.log('Public URL:', publicUrl);

      // Guardar la URL de la imagen y la descripción en Firestore
      await db.collection('images').add({
        url: publicUrl,
        description: body.message.caption || '', // Guarda la descripción si está disponible, o una cadena vacía si no
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('URL and description saved to Firestore');

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Image uploaded successfully' }),
      };
    }

    // Proceso para texto
    if (body.message && body.message.text) {
      const textMessage = body.message.text;
      console.log('Text Message:', textMessage);

      // Guardar el mensaje de texto en Firestore
      await db.collection('messages').add({
        text: textMessage,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        from: body.message.from.username || body.message.from.first_name, // Guarda el nombre del usuario
      });
      console.log('Text message saved to Firestore');

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Text message processed successfully' }),
      };
    }

    // Si no hay ni foto ni texto en el mensaje
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Bad Request: No photo or text found in the message' }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};
