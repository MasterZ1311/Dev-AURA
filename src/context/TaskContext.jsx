/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    subscribeToCollection, addToCollection,
    updateInCollection, deleteFromCollection, logActivity,
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
    const [unlockedCategories, setUnlockedCategories] = useState(() => {
        const saved = localStorage.getItem('aura_unlocked_categories');
        const lastReset = localStorage.getItem('aura_ritual_reset');
        const today = new Date().toDateString();
        
        if (lastReset !== today) {
            localStorage.setItem('aura_ritual_reset', today);
            localStorage.setItem('aura_unlocked_categories', JSON.stringify([]));
            return [];
        }
        return saved ? JSON.parse(saved) : [];
    });
    const [ritualData, setRitualData] = useState(null); // { taskId, category }

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
            energyType: 'Deep Focus',
            rescheduleCount: 0,
            ...task,
        });
        logActivity(uid, `Created task: "${task.title || 'Untitled'}"`, 'task');
    };

    const updateTask = async (id, updates) => {
        if (!uid) return;
        
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        let finalUpdates = { ...updates };

        // Logic for Procrastination Breaking: Increment reschedule count if date changes
        if (updates.dueDate && updates.dueDate !== task.dueDate) {
            finalUpdates.rescheduleCount = (task.rescheduleCount || 0) + 1;
        }

        await updateInCollection(uid, 'tasks', id, finalUpdates);
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
        logActivity(uid, `${nowCompleted ? 'Completed' : 'Reopened'} task: "${task.title}"`, 'task');
    };

    const deleteTask = async (id) => {
        if (!uid) return;
        const task = tasks.find(t => t.id === id);
        await deleteFromCollection(uid, 'tasks', id);
        logActivity(uid, `Deleted task: "${task?.title || id}"`, 'task');
    };

    const batchTasksToHour = async (taskIds, targetTime) => {
        if (!uid) return;
        // Batch move tasks to a target start time
        for (const id of taskIds) {
            await updateInCollection(uid, 'tasks', id, { startTime: targetTime });
        }
        logActivity(uid, `Performed Temporal Fold: Batched ${taskIds.length} tasks to ${targetTime}`, 'task');
    };

    // ── Overdue detection ──
    const today = todayStr();
    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today);

    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        pending: tasks.filter(t => !t.completed).length,
        overdue: overdueTasks.length,
        // Energy distribution for completed tasks today
        energyDistribution: tasks
            .filter(t => {
                if (!t.completed || !t.completedAt) return false;
                const d = new Date(t.completedAt);
                return d.toDateString() === new Date().toDateString();
            })
            .reduce((acc, t) => {
                const type = t.energyType || 'Deep Focus';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {})
    };

    // ── Rituals ──
    const startRitual = (taskId, category) => {
        setRitualData({ taskId, category });
    };

    const completeRitual = () => {
        if (!ritualData) return;
        const cat = ritualData.category;
        if (!unlockedCategories.includes(cat)) {
            const next = [...unlockedCategories, cat];
            setUnlockedCategories(next);
            localStorage.setItem('aura_unlocked_categories', JSON.stringify(next));
        }
        setRitualData(null);
        logActivity(uid, `Completed threshold ritual for: ${cat}`, 'task');
    };

    const cancelRitual = () => setRitualData(null);

    const value = {
        tasks, addTask, updateTask, toggleTaskCompletion, deleteTask, batchTasksToHour,
        stats, overdueTasks, loading,
        unlockedCategories, ritualData, startRitual, completeRitual, cancelRitual,
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
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
