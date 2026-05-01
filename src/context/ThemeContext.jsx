/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ThemeContext = createContext();

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('OLED Dark');
    const [liveBg, setLiveBg] = useState(true);
    const [liveBgIntensity, setLiveBgIntensity] = useState(70); // 0-100
    const [lowGraphics, setLowGraphics] = useState(false);
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;

    // Load preferences
    useEffect(() => {
        const loadPrefs = async () => {
            let savedTheme = null;
            let savedLiveBg = null;
            let savedIntensity = null;

            if (uid) {
                try {
                    const prefRef = doc(db, 'users', uid, 'settings', 'preferences');
                    const snap = await getDoc(prefRef);
                    if (snap.exists()) {
                        const d = snap.data();
                        if (d.theme) savedTheme = d.theme;
                        if (d.liveBg !== undefined) savedLiveBg = d.liveBg;
                        if (d.liveBgIntensity !== undefined) savedIntensity = d.liveBgIntensity;
                        if (d.lowGraphics !== undefined) {
                            setLowGraphics(d.lowGraphics);
                            localStorage.setItem('aura_lowGraphics', String(d.lowGraphics));
                        }
                    }
                } catch (e) {
                    console.error('Failed to load prefs from Firestore:', e);
                }
            }

            if (!savedTheme) savedTheme = localStorage.getItem('aura_theme');
            if (savedLiveBg === null) {
                const stored = localStorage.getItem('aura_liveBg');
                savedLiveBg = stored === null ? true : stored === 'true';
            }
            if (savedIntensity === null) {
                const stored = localStorage.getItem('aura_liveBgIntensity');
                savedIntensity = stored ? parseInt(stored, 10) : 70;
            }

            const storedLowGraphics = localStorage.getItem('aura_lowGraphics');
            const savedLowGraphics = storedLowGraphics === 'true';

            if (savedTheme) {
                setTheme(savedTheme);
                document.documentElement.setAttribute('data-theme', savedTheme);
            } else {
                document.documentElement.setAttribute('data-theme', 'OLED Dark');
            }

            setLiveBg(savedLiveBg);
            setLiveBgIntensity(savedIntensity);
            setLowGraphics(savedLowGraphics);
        };

        loadPrefs();
    }, [uid]);

    const _saveToFirestore = async (updates) => {
        if (!uid) return;
        try {
            const prefRef = doc(db, 'users', uid, 'settings', 'preferences');
            await setDoc(prefRef, updates, { merge: true });
        } catch (e) {
            console.error('Failed to save prefs to Firestore:', e);
        }
    };

    const changeTheme = async (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('aura_theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        await _saveToFirestore({ theme: newTheme });
    };

    const toggleLiveBg = async () => {
        const newVal = !liveBg;
        setLiveBg(newVal);
        localStorage.setItem('aura_liveBg', String(newVal));
        await _saveToFirestore({ liveBg: newVal });
    };

    const toggleLowGraphics = async () => {
        const newVal = !lowGraphics;
        setLowGraphics(newVal);
        localStorage.setItem('aura_lowGraphics', String(newVal));
        await _saveToFirestore({ lowGraphics: newVal });
    };

    const changeLiveBgIntensity = async (val) => {
        const num = parseInt(val, 10);
        setLiveBgIntensity(num);
        localStorage.setItem('aura_liveBgIntensity', String(num));
        await _saveToFirestore({ liveBgIntensity: num });
    };

    const value = {
        theme,
        changeTheme,
        liveBg,
        toggleLiveBg,
        liveBgIntensity,
        changeLiveBgIntensity,
        lowGraphics,
        toggleLowGraphics
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
