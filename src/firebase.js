import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
export { GoogleAuthProvider };

const firebaseConfig = {
    apiKey: "AIzaSyCiivODufgzOAL12hLv8TYFtByc4rq_ke0",
    authDomain: "aura-a0d6f.firebaseapp.com",
    projectId: "aura-a0d6f",
    storageBucket: "aura-a0d6f.firebasestorage.app",
    messagingSenderId: "1064673271549",
    appId: "1:1064673271549:web:dfdcc0de3f8f5a5ac5e894",
    measurementId: "G-GFZ33609CN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
