/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    subscribeToCollection, addToCollection,
    updateInCollection, deleteFromCollection, logActivity,
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

        const unsub1 = subscribeToCollection(uid, 'global/projects', (d) => { setProjects(d); checkLoaded(); }, { orderByField: 'createdAt', orderDir: 'desc' });
        const unsub2 = subscribeToCollection(uid, 'global/teams', (d) => { setTeams(d); checkLoaded(); }, { orderByField: 'createdAt', orderDir: 'desc' });
        const unsub3 = subscribeToCollection(uid, 'global/users', (d) => { setUsers(d); checkLoaded(); }, { orderByField: 'joinedAt', orderDir: 'desc' });
        const unsub4 = subscribeToCollection(uid, 'global/goals', (d) => { setGoals(d); checkLoaded(); }, { orderByField: 'createdAt', orderDir: 'desc' });

        return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
    }, [uid]);

    // ── Projects ──
    const addProject = async (p) => {
        if (!uid) return;
        await addToCollection(uid, 'global/projects', { createdAt: Date.now(), progress: 0, tasks: 0, members: [], ...p });
        logActivity(uid, `Created project: "${p.name || 'Untitled'}"`, 'group');
    };
    const updateProject = async (id, u) => { if (uid) await updateInCollection(uid, 'global/projects', id, u); };
    const deleteProject = async (id) => {
        if (uid) await deleteFromCollection(uid, 'global/projects', id);
        logActivity(uid, `Deleted a project`, 'group');
    };

    // ── Teams ──
    const addTeam = async (t) => {
        if (!uid) return;
        const members = (t.members || []).map(m => ({
            ...m,
            vibrationalState: m.vibrationalState || 'Calm'
        }));
        await addToCollection(uid, 'global/teams', { createdAt: Date.now(), ...t, members });
        logActivity(uid, `Created team: "${t.name || 'Untitled'}"`, 'group');
    };
    const updateTeam = async (id, u) => { if (uid) await updateInCollection(uid, 'global/teams', id, u); };
    const deleteTeam = async (id) => {
        if (uid) await deleteFromCollection(uid, 'global/teams', id);
        logActivity(uid, `Deleted a team`, 'group');
    };

    // ── Users ──
    const addUser = async (u) => {
        if (!uid) return;
        const initials = (u.name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        await addToCollection(uid, 'global/users', { joinedAt: Date.now(), initials, status: 'active', ...u });
    };
    const updateUser = async (id, u) => { if (uid) await updateInCollection(uid, 'global/users', id, u); };
    const deleteUser = async (id) => { if (uid) await deleteFromCollection(uid, 'global/users', id); };

    // ── Goals ──
    const addGoal = async (g) => {
        if (!uid) return;
        await addToCollection(uid, 'global/goals', { createdAt: Date.now(), progress: 0, keyResults: [], ...g });
        logActivity(uid, `Created goal: "${g.title || 'Untitled'}"`, 'group');
    };
    const updateGoal = async (id, u) => { if (uid) await updateInCollection(uid, 'global/goals', id, u); };
    const deleteGoal = async (id) => {
        if (uid) await deleteFromCollection(uid, 'global/goals', id);
        logActivity(uid, `Deleted a goal`, 'group');
    };
    const toggleKeyResult = async (goalId, krIdx) => {
        if (!uid) return;
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        const krs = goal.keyResults.map((kr, i) => i === krIdx ? { ...kr, completed: !kr.completed } : kr);
        const done = krs.filter(kr => kr.completed).length;
        const progress = krs.length ? Math.round((done / krs.length) * 100) : 0;
        await updateInCollection(uid, 'global/goals', goalId, { keyResults: krs, progress });
    };

    // ── Harmony Logic ──
    const calculateHarmony = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        if (!team || !team.members || team.members.length === 0) return 100;

        const stateWeights = {
            'Focused': 100,
            'Creative': 95,
            'Calm': 80,
            'High-Stress': 40,
            'Overloaded': 15
        };

        const total = team.members.reduce((acc, m) => acc + (stateWeights[m.vibrationalState] || 80), 0);
        let baseHarmony = Math.round(total / team.members.length);

        // Resonance Boost: if multiple members share an focus ID
        const focusGroups = {};
        team.members.forEach(m => {
            if (m.activeFocusId) {
                focusGroups[m.activeFocusId] = (focusGroups[m.activeFocusId] || 0) + 1;
            }
        });
        const inResonance = Object.values(focusGroups).some(count => count >= 2);
        if (inResonance) baseHarmony = Math.min(100, baseHarmony + 10);

        return baseHarmony;
    };

    const value = {
        projects, teams, users, goals,
        addProject, updateProject, deleteProject,
        addTeam, updateTeam, deleteTeam,
        addUser, updateUser, deleteUser,
        addGoal, updateGoal, deleteGoal, toggleKeyResult,
        calculateHarmony,
    };

    return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
};
