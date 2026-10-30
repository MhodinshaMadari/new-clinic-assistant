import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Configuration from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gpslocationfortravellers",
  appId: "1:636698830604:web:f58b1f50421dc43b074b29",
  apiKey: "AIzaSyDu7lH6I02Beanznw9V8ZLRpP8giKVVAEc",
  authDomain: "gpslocationfortravellers.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-dentalclinicsche-a8e7add1-2304-43a4-bdbd-fb178b060b74",
  storageBucket: "gpslocationfortravellers.firebasestorage.app",
  messagingSenderId: "636698830604"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Connection check as required by Firebase Integration guidelines
export async function testFirestoreConnection() {
  try {
    // Attempt to read a non-existent or dummy document from server
    await getDocFromServer(doc(db, 'test_connection', 'ping'));
    console.log("Firebase connection established successfully.");
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.error("Please check your Firebase configuration or network connection. Client is offline.");
    } else {
      console.warn("Firestore test document read completed (this is expected to fail or succeed silently). Status: ", error.message);
    }
    return false;
  }
}

// Execute connection check
testFirestoreConnection();
