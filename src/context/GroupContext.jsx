/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    subscribeToCollection, addToCollection,
    updateInCollection, deleteFromCollection,
} from '../utils/firestoreHelpers';

const GroupContext = createContext();
export const useGroup = () => useContext(GroupContext);

export const GroupProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!uid) {
            setProjects([]); setTeams([]); setUsers([]); setGoals([]);
            setLoaded(true);
            return;
        }

        let loadCount = 0;
        const checkLoaded = () => { loadCount++; if (loadCount >= 4) setLoaded(true); };

        const unsub1 = subscribeToCollection(uid, 'projects', (d) => { setProjects(d); checkLoaded(); }, { orderByField: 'createdAt', orderDir: 'desc' });
        const unsub2 = subscribeToCollection(uid, 'teams', (d) => { setTeams(d); checkLoaded(); }, { orderByField: 'createdAt', orderDir: 'desc' });
        const unsub3 = subscribeToCollection(uid, 'users', (d) => { setUsers(d); checkLoaded(); }, { orderByField: 'joinedAt', orderDir: 'desc' });
        const unsub4 = subscribeToCollection(uid, 'goals', (d) => { setGoals(d); checkLoaded(); }, { orderByField: 'createdAt', orderDir: 'desc' });

        return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
    }, [uid]);

    // ── Projects ──
    const addProject = async (p) => {
        if (!uid) return;
        await addToCollection(uid, 'projects', { createdAt: Date.now(), progress: 0, tasks: 0, members: [], ...p });
    };
    const updateProject = async (id, u) => { if (uid) await updateInCollection(uid, 'projects', id, u); };
    const deleteProject = async (id) => { if (uid) await deleteFromCollection(uid, 'projects', id); };

    // ── Teams ──
    const addTeam = async (t) => {
        if (!uid) return;
        await addToCollection(uid, 'teams', { createdAt: Date.now(), members: [], ...t });
    };
    const updateTeam = async (id, u) => { if (uid) await updateInCollection(uid, 'teams', id, u); };
    const deleteTeam = async (id) => { if (uid) await deleteFromCollection(uid, 'teams', id); };

    // ── Users ──
    const addUser = async (u) => {
        if (!uid) return;
        const initials = (u.name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        await addToCollection(uid, 'users', { joinedAt: Date.now(), initials, status: 'active', ...u });
    };
    const updateUser = async (id, u) => { if (uid) await updateInCollection(uid, 'users', id, u); };
    const deleteUser = async (id) => { if (uid) await deleteFromCollection(uid, 'users', id); };

    // ── Goals ──
    const addGoal = async (g) => {
        if (!uid) return;
        await addToCollection(uid, 'goals', { createdAt: Date.now(), progress: 0, keyResults: [], ...g });
    };
    const updateGoal = async (id, u) => { if (uid) await updateInCollection(uid, 'goals', id, u); };
    const deleteGoal = async (id) => { if (uid) await deleteFromCollection(uid, 'goals', id); };
    const toggleKeyResult = async (goalId, krIdx) => {
        if (!uid) return;
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        const krs = goal.keyResults.map((kr, i) => i === krIdx ? { ...kr, completed: !kr.completed } : kr);
        const done = krs.filter(kr => kr.completed).length;
        const progress = krs.length ? Math.round((done / krs.length) * 100) : 0;
        await updateInCollection(uid, 'goals', goalId, { keyResults: krs, progress });
    };

    const value = {
        projects, teams, users, goals,
        addProject, updateProject, deleteProject,
        addTeam, updateTeam, deleteTeam,
        addUser, updateUser, deleteUser,
        addGoal, updateGoal, deleteGoal, toggleKeyResult,
    };

    return <GroupContext.Provider value={value}>{loaded && children}</GroupContext.Provider>;
};
