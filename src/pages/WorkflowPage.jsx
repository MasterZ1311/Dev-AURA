import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    GitBranch, Plus, X, Trash2, Edit3, ChevronRight,
    Flag, User, Calendar, Tag, Columns
} from 'lucide-react';
import '../styles/WorkflowPage.css';

const priorityColors = { low: 'var(--success-color)', medium: 'var(--warning-color)', high: 'var(--danger-color)' };

const StrictModeDroppable = ({ children, ...props }) => {
    const [enabled, setEnabled] = useState(false);
    React.useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);
    if (!enabled) return null;
    return <Droppable {...props}>{children}</Droppable>;
};

const WorkflowPage = () => {
    const ctx = useWorkflow();
    const [selectedWfId, setSelectedWfId] = useState(null);
    const [showWfForm, setShowWfForm] = useState(false);
    const [wfForm, setWfForm] = useState({});
    const [cardForm, setCardForm] = useState(null); // { stageId, card? }
    const [newStageName, setNewStageName] = useState('');

    const selectedWf = ctx.workflows.find(w => w.id === selectedWfId) || null;

    // Workflow CRUD
    const handleWfSubmit = (e) => {
        e.preventDefault();
        if (!wfForm.name) return;
        if (wfForm.id) { ctx.updateWorkflow(wfForm.id, { name: wfForm.name, description: wfForm.description || '' }); }
        else { ctx.addWorkflow({ name: wfForm.name, description: wfForm.description || '' }); }
        setWfForm({}); setShowWfForm(false);
    };

    // Card CRUD
    const handleCardSubmit = (e) => {
        e.preventDefault();
        if (!cardForm || !cardForm.title) return;
        if (cardForm.cardId) { ctx.updateCard(selectedWfId, cardForm.stageId, cardForm.cardId, { title: cardForm.title, description: cardForm.description || '', priority: cardForm.priority || 'medium', assignee: cardForm.assignee || '', dueDate: cardForm.dueDate || '' }); }
        else { ctx.addCard(selectedWfId, cardForm.stageId, { title: cardForm.title, description: cardForm.description || '', priority: cardForm.priority || 'medium', assignee: cardForm.assignee || '', dueDate: cardForm.dueDate || '' }); }
        setCardForm(null);
    };

    const handleAddStage = () => {
        if (!newStageName.trim() || !selectedWfId) return;
        ctx.addStage(selectedWfId, { name: newStageName.trim() });
        setNewStageName('');
    };

    const handleDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        ctx.moveCardDnD(
            selectedWfId,
            source.droppableId,         // From stage ID
            destination.droppableId,    // To stage ID
            source.index,               // From index
            destination.index           // To index
        );
    };

    return (
        <div className="wf-page">
            {/* LEFT — Workflow list */}
            <aside className="wf-left">
                <div className="wf-left-header">
                    <GitBranch size={20} className="accent-icon" />
                    <h2>Workflows</h2>
                </div>

                <button className="btn-primary wf-create-btn tour-workflows-create" onClick={() => { setWfForm({}); setShowWfForm(true); }}>
                    <Plus size={16} /> New Workflow
                </button>

                <div className="wf-list">
                    {ctx.workflows.map(wf => (
                        <button key={wf.id} className={`wf-list-item ${selectedWfId === wf.id ? 'active' : ''}`} onClick={() => { setSelectedWfId(wf.id); setCardForm(null); }}>
                            <Columns size={16} />
                            <span className="wf-list-name">{wf.name}</span>
                            <span className="wf-list-count">{wf.stages?.reduce((s, st) => s + (st.cards?.length || 0), 0)}</span>
                        </button>
                    ))}
                    {ctx.workflows.length === 0 && <p className="wf-no-items">No workflows yet.</p>}
                </div>
            </aside>

            {/* CENTER — Kanban board */}
            <main className="wf-center">
                {showWfForm ? (
                    <form className="wf-form glass-panel" onSubmit={handleWfSubmit}>
                        <div className="gp-form-header"><Edit3 size={18} className="accent-icon" /><h3>{wfForm.id ? 'Edit Workflow' : 'New Workflow'}</h3><button type="button" className="detail-close" onClick={() => setShowWfForm(false)}><X size={16} /></button></div>
                        <label>Name *<input className="gp-input" value={wfForm.name || ''} onChange={e => setWfForm({ ...wfForm, name: e.target.value })} required /></label>
                        <label>Description<textarea className="gp-textarea" rows={3} value={wfForm.description || ''} onChange={e => setWfForm({ ...wfForm, description: e.target.value })} /></label>
                        <button type="submit" className="btn-primary">{wfForm.id ? 'Save' : 'Create Workflow'}</button>
                    </form>
                ) : selectedWf ? (
                    <>
                        <div className="wf-board-header">
                            <h2>{selectedWf.name}</h2>
                            <div className="wf-board-actions">
                                <button className="icon-btn" onClick={() => { setWfForm({ ...selectedWf }); setShowWfForm(true); }}><Edit3 size={16} /></button>
                                <button className="icon-btn danger" onClick={() => { ctx.deleteWorkflow(selectedWf.id); setSelectedWfId(null); }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                        {selectedWf.description && <p className="wf-board-desc">{selectedWf.description}</p>}

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <div className="wf-board">
                                {selectedWf.stages.map(stage => (
                                    <div key={stage.id} className="wf-column">
                                        <div className="wf-column-header" style={{ borderTopColor: stage.color }}>
                                            <h3>{stage.name}</h3>
                                            <span className="wf-col-count">{stage.cards?.length || 0}</span>
                                            <button className="icon-btn danger wf-col-delete" onClick={() => ctx.deleteStage(selectedWfId, stage.id)} title="Delete stage"><Trash2 size={12} /></button>
                                        </div>
                                        <StrictModeDroppable droppableId={stage.id}>
                                            {(provided, snapshot) => (
                                                <div 
                                                    className={`wf-cards ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                >
                                                    {(stage.cards || []).map((card, index) => (
                                                        <Draggable key={card.id} draggableId={card.id} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div 
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`wf-card ${snapshot.isDragging ? 'dragging' : ''}`} 
                                                                    onClick={() => setCardForm({ stageId: stage.id, cardId: card.id, ...card })}
                                                                >
                                                                    <div className="wf-card-header">
                                                                        <span className="wf-card-title">{card.title}</span>
                                                                        <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); ctx.deleteCard(selectedWfId, stage.id, card.id); }}><Trash2 size={12} /></button>
                                                                    </div>
                                                                    {card.description && <p className="wf-card-desc">{card.description}</p>}
                                                                    <div className="wf-card-meta">
                                                                        <span className="wf-card-priority" style={{ color: priorityColors[card.priority] || priorityColors.medium }}><Flag size={12} /> {card.priority}</span>
                                                                        {card.assignee && <span className="wf-card-assignee"><User size={12} /> {card.assignee}</span>}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                    <button className="wf-add-card-btn" onClick={() => setCardForm({ stageId: stage.id })}>
                                                        <Plus size={14} /> Add Card
                                                    </button>
                                                </div>
                                            )}
                                        </StrictModeDroppable>
                                    </div>
                                ))}

                                {/* Add Stage */}
                                <div className="wf-add-stage">
                                    <input className="gp-input" placeholder="New stage name..." value={newStageName} onChange={e => setNewStageName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddStage()} />
                                    <button className="btn-primary" onClick={handleAddStage} disabled={!newStageName.trim()}><Plus size={14} /></button>
                                </div>
                            </div>
                        </DragDropContext>
                    </>
                ) : (
                    <div className="wf-empty-board">
                        <GitBranch size={48} />
                        <h3>Select or create a workflow</h3>
                        <p>Choose a workflow from the sidebar or create a new one to get started with your Kanban board.</p>
                    </div>
                )}
            </main>

            {/* Card form overlay */}
            {cardForm && selectedWf && (
                <aside className="wf-right">
                    <form className="wf-card-form glass-panel" onSubmit={handleCardSubmit}>
                        <div className="gp-form-header"><Edit3 size={18} className="accent-icon" /><h3>{cardForm.cardId ? 'Edit Card' : 'New Card'}</h3><button type="button" className="detail-close" onClick={() => setCardForm(null)}><X size={16} /></button></div>
                        <label>Title *<input className="gp-input" value={cardForm.title || ''} onChange={e => setCardForm({ ...cardForm, title: e.target.value })} required /></label>
                        <label>Description<textarea className="gp-textarea" rows={3} value={cardForm.description || ''} onChange={e => setCardForm({ ...cardForm, description: e.target.value })} /></label>
                        <label>Priority<select className="gp-select" value={cardForm.priority || 'medium'} onChange={e => setCardForm({ ...cardForm, priority: e.target.value })}>
                            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                        </select></label>
                        <label>Assignee<input className="gp-input" value={cardForm.assignee || ''} onChange={e => setCardForm({ ...cardForm, assignee: e.target.value })} /></label>
                        <label>Due Date<input type="date" className="gp-input" value={cardForm.dueDate || ''} onChange={e => setCardForm({ ...cardForm, dueDate: e.target.value })} /></label>
                        <button type="submit" className="btn-primary">{cardForm.cardId ? 'Save' : 'Add Card'}</button>
                    </form>
                </aside>
            )}
        </div>
    );
};

export default WorkflowPage;
