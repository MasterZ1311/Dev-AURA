/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    subscribeToCollection, addToCollection,
    updateInCollection, deleteFromCollection,
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
    };

    const updateWorkflow = async (id, updates) => {
        if (uid) await updateInCollection(uid, 'workflows', id, updates);
    };

    const deleteWorkflow = async (id) => {
        if (uid) await deleteFromCollection(uid, 'workflows', id);
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
        await _updateStages(wfId, (stages) => {
            const newStages = [...stages];
            const sourceStageIndex = newStages.findIndex(s => s.id === sourceStageId);
            const destStageIndex = newStages.findIndex(s => s.id === destStageId);

            if (sourceStageIndex === -1 || destStageIndex === -1) return stages;

            const sourceStage = { ...newStages[sourceStageIndex], cards: [...newStages[sourceStageIndex].cards] };
            const destStage = sourceStageId === destStageId ? sourceStage : { ...newStages[destStageIndex], cards: [...newStages[destStageIndex].cards] };

            const [movedCard] = sourceStage.cards.splice(sourceIndex, 1);
            destStage.cards.splice(destIndex, 0, movedCard);

            newStages[sourceStageIndex] = sourceStage;
            if (sourceStageId !== destStageId) {
                newStages[destStageIndex] = destStage;
            }

            return newStages;
        });
    };

    const value = {
        workflows,
        addWorkflow, updateWorkflow, deleteWorkflow,
        addStage, updateStage, deleteStage,
        addCard, updateCard, deleteCard, moveCard, moveCardDnD,
    };

    return <WorkflowContext.Provider value={value}>{loaded && children}</WorkflowContext.Provider>;
};
