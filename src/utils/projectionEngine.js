/**
 * FutureSelf Projection Engine
 * Calculates energy trajectory and destiny aura.
 */

export const calculateProjectedDestiny = (tasks, events) => {
    let projectedCapacity = 100; // Base 100 capacity
    const breakdown = {
        base: 100,
        penalties: [],
        boosts: []
    };
    
    // Impact calculation
    const pendingHighTasks = tasks.filter(t => !t.completed && t.priority === 'High');
    const pendingMedTasks = tasks.filter(t => !t.completed && t.priority === 'Medium');
    const upcomingEvents = events.filter(ev => {
        const [h] = (ev.startTime || '00:00').split(':');
        return parseInt(h) >= new Date().getHours();
    });

    if (upcomingEvents.length > 0) {
        breakdown.penalties.push({ label: 'Meeting Load', value: `-${upcomingEvents.length * 20}%` });
    }

    // Applying refined penalties
    const tasksPenalty = (pendingHighTasks.length * 15) + (pendingMedTasks.length * 8);
    const eventsPenalty = (upcomingEvents.length * 20);
    
    if (tasksPenalty > 0) {
        breakdown.penalties.push({ label: 'Task Load', value: `-${tasksPenalty}%` });
    }

    projectedCapacity -= tasksPenalty;
    projectedCapacity -= eventsPenalty;

    // Natural Breaks
    const currentHour = new Date().getHours();
    if (currentHour < 13) {
        projectedCapacity += 15;
        breakdown.boosts.push({ label: 'Mid-day Gap', value: '+15%' });
    }
    if (currentHour < 18) {
        projectedCapacity += 10;
        breakdown.boosts.push({ label: 'Evening Buffer', value: '+10%' });
    }

    projectedCapacity = Math.round(Math.max(5, Math.min(100, projectedCapacity)));

    const projectionDistribution = tasks.filter(t => !t.completed).reduce((acc, t) => {
        const type = t.energyType || 'Deep Focus';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    return {
        projectedCapacity,
        projectionDistribution,
        status: getDestinyStatus(projectedCapacity),
        breakdown
    };
};

const getDestinyStatus = (capacity) => {
    if (capacity > 60) return { label: 'Optimal Finish', color: '#fbbf24', aura: '#fbbf24' };
    if (capacity > 30) return { label: 'Stretched Workflow', color: '#10b981', aura: '#10b981' };
    return { label: 'Overloaded', color: '#ef4444', aura: '#64748b' };
};
