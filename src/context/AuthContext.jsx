/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

/* ─── AURA-XXXX UID Generator ─────────────────────────────────────── */
const AURA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable chars
const generateAuraUID = () => {
  let code = 'AURA-';
  for (let i = 0; i < 4; i++) code += AURA_CHARS[Math.floor(Math.random() * AURA_CHARS.length)];
  return code;
};

/** Check if an AURA-XXXX code is already taken in the global index */
const isAuraUIDTaken = async (code) => {
  const indexRef = doc(db, 'aura_uid_index', code);
  const snap = await getDoc(indexRef);
  return snap.exists();
};

/** Generate a unique AURA-XXXX code with collision checking */
const createUniqueAuraUID = async () => {
  let code;
  let attempts = 0;
  do {
    code = generateAuraUID();
    attempts++;
  } while (await isAuraUIDTaken(code) && attempts < 20);
  return code;
};

/** Register in global aura_uid_index */
const registerAuraUIDIndex = async (auraUID, uid, displayName, photoURL) => {
  const indexRef = doc(db, 'aura_uid_index', auraUID);
  await setDoc(indexRef, { uid, displayName: displayName || 'User', photoURL: photoURL || null, auraUID });
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid, 'settings', 'profile');
        const userSnap = await getDoc(userDocRef);
        const profileData = userSnap.exists() ? userSnap.data() : {};

        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || profileData.name || 'User',
          photoURL: firebaseUser.photoURL || profileData.photoURL || null,
          status: profileData.status || 'Active',
          role: profileData.role || 'admin',
          auraUID: profileData.auraUID || null,
          ...profileData,
        });
      } else {
        setCurrentUser(null);
        setGoogleAccessToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /* ─── Email Login ─── */
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  /* ─── Email Signup ─── */
  const signup = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await fbUpdateProfile(cred.user, { displayName: name });

    // Generate unique AURA-XXXX
    const auraUID = await createUniqueAuraUID();

    const profileRef = doc(db, 'users', cred.user.uid, 'settings', 'profile');
    await setDoc(profileRef, {
      name,
      email,
      status: 'Active',
      role: 'admin',
      auraUID,
      createdAt: Date.now(),
    });

    // Register in global index
    await registerAuraUIDIndex(auraUID, cred.user.uid, name, null);

    setCurrentUser(prev => prev ? { ...prev, auraUID } : null);
    return cred.user;
  };

  /* ─── Google Sign-In ─── */
  const loginWithGoogle = async () => {
    // Request Gmail + Calendar scopes
    googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Extract the Google OAuth access token
    const credential = result._tokenResponse;
    const accessToken = credential?.oauthAccessToken || null;
    if (accessToken) setGoogleAccessToken(accessToken);

    // Check if this is a first-time user
    const profileRef = doc(db, 'users', user.uid, 'settings', 'profile');
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      // First-time Google user — create profile + AURA-XXXX
      const auraUID = await createUniqueAuraUID();
      await setDoc(profileRef, {
        name: user.displayName || 'User',
        email: user.email,
        photoURL: user.photoURL || null,
        status: 'Active',
        role: 'admin',
        auraUID,
        googleConnected: true,
        createdAt: Date.now(),
      });
      await registerAuraUIDIndex(auraUID, user.uid, user.displayName, user.photoURL);
    } else {
      // Existing user — just mark Google as connected
      await updateDoc(profileRef, {
        googleConnected: true,
        photoURL: user.photoURL || profileSnap.data().photoURL || null,
      });
    }

    return result;
  };

  /* ─── Silent Google Reauth (for expired API tokens) ─── */
  const silentGoogleReauth = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = result._tokenResponse;
      const newToken = credential?.oauthAccessToken || null;
      if (newToken) setGoogleAccessToken(newToken);
      return newToken;
    } catch (err) {
      console.warn('[Aura] Silent reauth failed:', err.code);
      return null;
    }
  };

  /* ─── Logout ─── */
  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setGoogleAccessToken(null);
  };

  /* ─── Reset Password ─── */
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  /* ─── Update Profile ─── */
  const updateProfile = async (updates) => {
    if (!currentUser) return;
    if (updates.name && auth.currentUser) {
      await fbUpdateProfile(auth.currentUser, { displayName: updates.name });
    }
    const profileRef = doc(db, 'users', currentUser.uid, 'settings', 'profile');
    await updateDoc(profileRef, updates).catch(async () => {
      await setDoc(profileRef, { ...currentUser, ...updates });
    });
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  /* ─── Find user by AURA-XXXX code ─── */
  const findUserByAuraUID = async (auraUID) => {
    const code = auraUID.trim().toUpperCase();
    const indexRef = doc(db, 'aura_uid_index', code);
    const snap = await getDoc(indexRef);
    if (!snap.exists()) return null;
    return snap.data(); // { uid, displayName, photoURL, auraUID }
  };

  const value = {
    currentUser,
    googleAccessToken,
    setGoogleAccessToken,
    login,
    signup,
    loginWithGoogle,
    silentGoogleReauth,
    logout,
    resetPassword,
    updateProfile,
    findUserByAuraUID,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
