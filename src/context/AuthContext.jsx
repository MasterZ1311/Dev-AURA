/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch extra profile data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid, 'settings', 'profile');
        const userSnap = await getDoc(userDocRef);
        const profileData = userSnap.exists() ? userSnap.data() : {};

        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || profileData.name || 'User',
          status: profileData.status || 'Active',
          role: profileData.role || 'admin',
          ...profileData,
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const signup = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Set display name on Firebase Auth profile
    await fbUpdateProfile(cred.user, { displayName: name });
    // Create Firestore profile document
    const profileRef = doc(db, 'users', cred.user.uid, 'settings', 'profile');
    await setDoc(profileRef, {
      name,
      email,
      status: 'Active',
      role: 'admin',
      createdAt: Date.now(),
    });
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (updates) => {
    if (!currentUser) return;
    // Update Firebase Auth display name if name changed
    if (updates.name && auth.currentUser) {
      await fbUpdateProfile(auth.currentUser, { displayName: updates.name });
    }
    // Update Firestore profile
    const profileRef = doc(db, 'users', currentUser.uid, 'settings', 'profile');
    await updateDoc(profileRef, updates).catch(async () => {
      // If doc doesn't exist yet, create it
      await setDoc(profileRef, { ...currentUser, ...updates });
    });
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
