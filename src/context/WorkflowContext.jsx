/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    subscribeToCollection, addToCollection,
    updateInCollection, deleteFromCollection, logActivity,
} from '../utils/firestoreHelpers';

const WorkflowContext = createContext();
export const useWorkflow = () => useContext(WorkflowContext);

export const WorkflowProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const [workflows, setWorkflows] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!uid) { setWorkflows([]); setLoaded(true); return; }
        const unsub = subscribeToCollection(uid, 'workflows', (data) => {
            setWorkflows(data);
            setLoaded(true);
        }, { orderByField: 'createdAt', orderDir: 'desc' });
        return unsub;
    }, [uid]);

    const addWorkflow = async (wf) => {
        if (!uid) return;
        const defaultStages = [
            { id: `s${Date.now()}a`, name: 'To Do', color: '#6b7280', cards: [] },
            { id: `s${Date.now()}b`, name: 'In Progress', color: '#d97706', cards: [] },
            { id: `s${Date.now()}c`, name: 'Done', color: '#059669', cards: [] },
        ];
        await addToCollection(uid, 'workflows', { createdAt: Date.now(), stages: defaultStages, ...wf });
        logActivity(uid, `Created workflow: "${wf.name || 'Untitled'}"`, 'workflow');
    };

    const updateWorkflow = async (id, updates) => {
        if (uid) await updateInCollection(uid, 'workflows', id, updates);
    };

    const deleteWorkflow = async (id) => {
        const wf = workflows.find(w => w.id === id);
        if (uid) await deleteFromCollection(uid, 'workflows', id);
        logActivity(uid, `Deleted workflow: "${wf?.name || id}"`, 'workflow');
    };

    // Stage & card operations update the workflow document directly
    const _updateStages = async (wfId, updater) => {
        const wf = workflows.find(w => w.id === wfId);
        if (!wf || !uid) return;
        const newStages = updater(wf.stages);
        await updateInCollection(uid, 'workflows', wfId, { stages: newStages });
    };

    const addStage = async (wfId, stage) => {
        await _updateStages(wfId, (stages) => [
            ...stages,
            { id: Date.now().toString(), cards: [], color: '#6b7280', ...stage }
        ]);
    };

    const updateStage = async (wfId, stageId, updates) => {
        await _updateStages(wfId, (stages) =>
            stages.map(s => s.id === stageId ? { ...s, ...updates } : s)
        );
    };

    const deleteStage = async (wfId, stageId) => {
        await _updateStages(wfId, (stages) =>
            stages.filter(s => s.id !== stageId)
        );
    };

    const addCard = async (wfId, stageId, card) => {
        await _updateStages(wfId, (stages) =>
            stages.map(s => {
                if (s.id !== stageId) return s;
                return { ...s, cards: [...s.cards, { id: Date.now().toString(), createdAt: Date.now(), ...card }] };
            })
        );
        logActivity(uid, `Added card: "${card.title || 'Untitled'}"`, 'workflow');
    };

    const updateCard = async (wfId, stageId, cardId, updates) => {
        await _updateStages(wfId, (stages) =>
            stages.map(s => {
                if (s.id !== stageId) return s;
                return { ...s, cards: s.cards.map(c => c.id === cardId ? { ...c, ...updates } : c) };
            })
        );
    };

    const deleteCard = async (wfId, stageId, cardId) => {
        await _updateStages(wfId, (stages) =>
            stages.map(s => {
                if (s.id !== stageId) return s;
                return { ...s, cards: s.cards.filter(c => c.id !== cardId) };
            })
        );
        logActivity(uid, `Deleted a workflow card`, 'workflow');
    };

    const moveCard = async (wfId, fromStageId, cardId, toStageId) => {
        await _updateStages(wfId, (stages) => {
            let card = null;
            return stages.map(s => {
                if (s.id === fromStageId) {
                    card = s.cards.find(c => c.id === cardId);
                    return { ...s, cards: s.cards.filter(c => c.id !== cardId) };
                }
                return s;
            }).map(s => {
                if (s.id === toStageId && card) {
                    return { ...s, cards: [...s.cards, card] };
                }
                return s;
            });
        });
    };

    const moveCardDnD = async (wfId, sourceStageId, destStageId, sourceIndex, destIndex) => {
        // Optimistic local update for instant header count sync
        setWorkflows(prev => prev.map(wf => {
            if (wf.id !== wfId) return wf;
            const stages = wf.stages.map(s => ({ ...s, cards: [...s.cards] }));
            const srcIdx = stages.findIndex(s => s.id === sourceStageId);
            const dstIdx = stages.findIndex(s => s.id === destStageId);
            if (srcIdx === -1 || dstIdx === -1) return wf;
            const [moved] = stages[srcIdx].cards.splice(sourceIndex, 1);
            stages[dstIdx].cards.splice(destIndex, 0, moved);
            return { ...wf, stages };
        }));

        await _updateStages(wfId, (stages) => {
            const newStages = [...stages];
            const sourceStageIndex = newStages.findIndex(s => s.id === sourceStageId);
            const destStageIndex = newStages.findIndex(s => s.id === destStageId);

            if (sourceStageIndex === -1 || destStageIndex === -1) return stages;

            // Always create independent copies — same-stage move must not alias objects
            const sourceStage = { ...newStages[sourceStageIndex], cards: [...newStages[sourceStageIndex].cards] };
            // If same stage, start from the already-modified sourceStage copy; otherwise fresh copy of dest
            const destStage = sourceStageId === destStageId
                ? sourceStage
                : { ...newStages[destStageIndex], cards: [...newStages[destStageIndex].cards] };

            const [movedCard] = sourceStage.cards.splice(sourceIndex, 1);
            destStage.cards.splice(destIndex, 0, movedCard);

            newStages[sourceStageIndex] = sourceStage;
            if (sourceStageId !== destStageId) {
                newStages[destStageIndex] = destStage;
            } else {
                // Same stage: sourceStage IS destStage; assignment already done above
                newStages[sourceStageIndex] = sourceStage;
            }

            return newStages;
        });
        logActivity(uid, `Moved a card between workflow stages`, 'workflow');
    };

    const value = {
        workflows,
        addWorkflow, updateWorkflow, deleteWorkflow,
        addStage, updateStage, deleteStage,
        addCard, updateCard, deleteCard, moveCard, moveCardDnD,
    };

    return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
};
