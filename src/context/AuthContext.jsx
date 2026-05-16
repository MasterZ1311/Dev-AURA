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

import { api } from '../utils/apiClient';

/** Check if an AURA-XXXX code is already taken in the global index */
const isAuraUIDTaken = async (code) => {
  try {
    await api.get(`/user/aura-code/${code}`);
    return true;
  } catch (e) {
    return false; // 404 means it's available
  }
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
  try {
    await api.post('/user/aura-code', { auraUID, displayName, photoURL });
  } catch (e) {
    console.error('[Auth] Error registering UID index:', e.message);
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState(() => {
    return sessionStorage.getItem('aura_google_token') || null;
  });

  useEffect(() => {
    if (googleAccessToken) {
      sessionStorage.setItem('aura_google_token', googleAccessToken);
    } else {
      sessionStorage.removeItem('aura_google_token');
    }
  }, [googleAccessToken]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          let profileData = {};
          try {
            const res = await api.get('/user/settings/profile');
            if (res) profileData = res;
          } catch (e) {
            console.warn('[Auth] Profile fetch failed via API:', e.message);
          }

          // If user exists but lacks an auraUID, generate and save it
          if (!profileData.auraUID) {
            const newAuraUID = await createUniqueAuraUID();
            const updates = {
              auraUID: newAuraUID,
              name: profileData.name || firebaseUser.displayName || 'User',
              email: profileData.email || firebaseUser.email,
              status: profileData.status || 'Active',
              role: profileData.role || 'admin',
            };
            await api.post('/user/settings/profile', updates).catch(e => console.error('[Auth] API post profile failed:', e));
            await registerAuraUIDIndex(newAuraUID, firebaseUser.uid, updates.name, firebaseUser.photoURL).catch(e => console.error('[Auth] registerIndex failed:', e));
            profileData = { ...profileData, ...updates };
          }

          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || profileData.name || 'User',
            photoURL: firebaseUser.photoURL || profileData.photoURL || null,
            status: profileData.status || 'Active',
            role: profileData.role || 'admin',
            auraUID: profileData.auraUID,
            ...profileData,
          });
        } else {
          setCurrentUser(null);
          setGoogleAccessToken(null);
        }
      } catch (err) {
        console.error('[Auth] Initialization error:', err);
      } finally {
        setLoading(false);
      }
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

    await api.post('/user/settings/profile', {
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
    let profileData = null;
    try {
      const res = await api.get('/user/settings/profile');
      if (res && res.id) profileData = res;
    } catch (e) {
      // 404 means first-time user
    }

    if (!profileData) {
      // First-time Google user — create profile + AURA-XXXX
      const auraUID = await createUniqueAuraUID();
      await api.post('/user/settings/profile', {
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
      await api.post('/user/settings/profile', {
        googleConnected: true,
        photoURL: user.photoURL || profileData.photoURL || null,
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
    sessionStorage.removeItem('aura_google_token');
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
    await api.post('/user/settings/profile', updates).catch(e => {
        console.error('[Auth] Failed to update profile', e);
    });
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  /* ─── Find user by AURA-XXXX code ─── */
  const findUserByAuraUID = async (auraUID) => {
    const code = auraUID.trim().toUpperCase();
    try {
      return await api.get(`/user/aura-code/${code}`);
    } catch (e) {
      return null;
    }
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
