import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as path from 'path';

export function initializeFirebase() {
  const firebaseConfigPath =
    process.env.FIREBASE_CONFIG_PATH ||
    path.join(process.cwd(), 'firebase-config.json');

  if (!getApps().length) {
    initializeApp({
      credential: cert(firebaseConfigPath),
    });
  }
}

export function getMessagingInstance() {
  initializeFirebase();
  return getMessaging();
}
