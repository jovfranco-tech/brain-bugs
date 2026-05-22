# Firebase Setup Guide

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it "Brain Bugs".
3. Disable Google Analytics (optional, for COPPA compliance).
4. Once created, click the **Web** icon (</>) to register the web app.
5. Copy the configuration object provided.

## 2. Environment Variables (Vercel)
Add the following variables to your `.env.local` for local development, and to your Vercel project settings for production deployment:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 3. Configure Authentication
1. In the Firebase Console, go to **Authentication** > **Sign-in method**.
2. Click **Email/Password** and enable it.
3. Save the changes.
4. Go to the **Settings** tab in Authentication > **Authorized domains**.
5. Add your Vercel production domain (e.g., `brain-bugs.vercel.app`) to ensure authentication works in production.

## 4. Configure Firestore Database
1. Go to **Firestore Database** in the Firebase Console.
2. Click **Create database** and start in **Production mode**.
3. Choose a location closest to your users.
4. The application uses the following collections automatically:
   - `parents`: Stores parent accounts. Document ID = User UID.
   - `children`: Stores child profiles. Document ID = generated child ID.
   - `progress`: Stores gameplay progress per child. Document ID = generated child ID.

## 5. Security Rules
For security, copy the contents of `firestore.rules` into your Firestore Rules tab. This ensures that:
- Parents can only read/write their own account data.
- Parents can only manage child profiles that belong to them (`parent_id`).
- Parents can only access progress records for their own children.

## 6. Firestore Indexes
Most queries in the app use single-field filters (e.g., fetching children where `parent_id == uid`). If complex queries are added later, you can import `firestore.indexes.json` using the Firebase CLI:
```bash
firebase deploy --only firestore:indexes
```

## 7. Configurar Envío de Reportes por Correo (Trigger Email Extension)
Para que el botón "Enviar reporte a mi correo" en el AI Coach envíe reportes por correo real en producción:
1. Ve a la sección **Extensions** en el Firebase Console.
2. Busca la extensión oficial **Trigger Email** (desarrollada por Firebase).
3. Haz clic en **Install** (Instalar).
4. Configura los siguientes parámetros durante el asistente de instalación:
   - **SMTP connection URI:** Tu URI de conexión SMTP del proveedor (ej. Gmail, SendGrid, Mailgun, Postmark, etc.).
   - **Email documents collection:** `mail` (coincide exactamente con la colección donde escribe nuestra app).
   - **Default FROM address:** Tu dirección de correo electrónico remitente autorizada.
   - **Default FROM name:** "AI Coach de Brain Bugs 🧠"
5. Haz clic en **Install extension**.
6. Con esta extensión, cada vez que un padre pulse sobre "Enviar reporte a mi correo", la app guardará un documento en la colección `mail` y Firebase enviará el reporte interactivo y premium de desarrollo cognitivo directamente a la bandeja de entrada del padre.
