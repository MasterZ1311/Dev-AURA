/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    subscribeToCollection, addToCollection,
    updateInCollection, deleteFromCollection,
} from '../utils/firestoreHelpers';

const TaskContext = createContext();
export const useTasks = () => useContext(TaskContext);

const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const TaskProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Subscribe to Firestore
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!uid) { setTasks([]); setLoading(false); return; }
        setLoading(true);
        const unsub = subscribeToCollection(uid, 'tasks', (data) => {
            setTasks(data);
            setLoading(false);
        }, { orderByField: 'createdAt', orderDir: 'desc' });
        return unsub;
    }, [uid]);

    // ── CRUD ──
    const addTask = async (task) => {
        if (!uid) return;
        await addToCollection(uid, 'tasks', {
            completed: false,
            createdAt: Date.now(),
            dueDate: '',
            recurrence: 'none',
            ...task,
        });
    };

    const updateTask = async (id, updates) => {
        if (!uid) return;
        await updateInCollection(uid, 'tasks', id, updates);
    };

    const toggleTaskCompletion = async (id) => {
        if (!uid) return;
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const nowCompleted = !task.completed;

        // If completing a recurring task, auto-create next occurrence
        if (nowCompleted && task.recurrence && task.recurrence !== 'none' && task.dueDate) {
            const next = getNextDate(task.dueDate, task.recurrence);
            await addTask({
                title: task.title,
                priority: task.priority,
                project: task.project,
                dueDate: next,
                date: formatShortDate(next),
                recurrence: task.recurrence,
                isFocus: task.isFocus,
            });
        }

        await updateInCollection(uid, 'tasks', id, {
            completed: nowCompleted,
            completedAt: nowCompleted ? Date.now() : null,
        });
    };

    const deleteTask = async (id) => {
        if (!uid) return;
        await deleteFromCollection(uid, 'tasks', id);
    };

    // ── Overdue detection ──
    const today = todayStr();
    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today);

    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        pending: tasks.filter(t => !t.completed).length,
        overdue: overdueTasks.length,
    };

    const value = {
        tasks, addTask, updateTask, toggleTaskCompletion, deleteTask,
        stats, overdueTasks,
    };

    return (
        <TaskContext.Provider value={value}>
            {!loading && children}
        </TaskContext.Provider>
    );
};

/* ── Helpers ── */
function getNextDate(dateStr, recurrence) {
    const d = new Date(dateStr + 'T00:00:00');
    if (recurrence === 'daily') d.setDate(d.getDate() + 1);
    else if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
    else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
}

function formatShortDate(isoStr) {
    const d = new Date(isoStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
