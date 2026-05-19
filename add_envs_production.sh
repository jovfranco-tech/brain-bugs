#!/bin/bash
set -e

echo "Añadiendo variables de entorno de producción a Vercel..."

vars=(
  "VITE_FIREBASE_API_KEY:AIzaSyAv4BZxj40iimCS8CFHrjvqlVferz-e434"
  "VITE_FIREBASE_AUTH_DOMAIN:brain-bugs.firebaseapp.com"
  "VITE_FIREBASE_PROJECT_ID:brain-bugs"
  "VITE_FIREBASE_STORAGE_BUCKET:brain-bugs.firebasestorage.app"
  "VITE_FIREBASE_MESSAGING_SENDER_ID:574091777962"
  "VITE_FIREBASE_APP_ID:1:574091777962:web:681ef61254990640e77dd3"
)

for item in "${vars[@]}"; do
  name="${item%%:*}"
  value="${item#*:}"
  
  echo "Registrando $name en producción..."
  vercel env add "$name" production --value "$value" --force --yes
done

echo "¡Redesplegando en Vercel para aplicar los cambios!"
vercel --prod --yes
