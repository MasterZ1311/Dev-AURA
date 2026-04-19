/**
 * Chronos Engine - Temporal Folding & Energy Topology
 */

export const generateTimeRiver = (events, tasks) => {
    const slots = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        events: [],
        tasks: [],
        energyDensity: 0,
        capacity: calculateCapacity(i),
        isParadox: false,
        pockets: []
    }));

    // Merge events
    events.forEach(ev => {
        if (!ev.startTime) return;
        const hour = parseInt(ev.startTime.split(':')[0]);
        if (slots[hour]) {
            slots[hour].events.push(ev);
            slots[hour].energyDensity += 40; // Base meeting weight
        }
    });

    // Merge scheduled tasks
    tasks.forEach(task => {
        if (task.completed || !task.startTime) return;
        const hour = parseInt(task.startTime.split(':')[0]);
        if (slots[hour]) {
            slots[hour].tasks.push(task);
            const taskWeight = task.energyType === 'Deep Focus' ? 60 : 30;
            slots[hour].energyDensity += taskWeight;
        }
    });

    // Detect Paradoxes (density > capacity)
    slots.forEach(slot => {
        if (slot.energyDensity > slot.capacity + 20) {
            slot.isParadox = true;
        }
    });

    return slots;
};

const calculateCapacity = (hour) => {
    // Capacity based purely on typical circadian rhythms 
    const base = (Math.sin((hour - 8) * (Math.PI / 12)) + 1) * 40 + 20;
    return Math.min(100, base);
};

export const findEnergyPockets = (river, pocketType = 'Focus') => {
    return river
        .filter(slot => slot.energyDensity < 20 && slot.capacity > 50)
        .map(slot => ({
            hour: slot.hour,
            type: pocketType,
            label: `${pocketType} Pocket`
        }));
};

export const suggestFolding = (tasks) => {
    const categories = {};
    tasks.forEach(t => {
        if (!t.completed && t.energyType) {
            if (!categories[t.energyType]) categories[t.energyType] = [];
            categories[t.energyType].push(t);
        }
    });

    const suggestions = [];
    Object.entries(categories).forEach(([type, list]) => {
        if (list.length >= 3) {
            suggestions.push({
                type,
                count: list.length,
                message: `Temporal Fold: Batch ${list.length} ${type} tasks into one flow block.`
            });
        }
    });
    return suggestions;
};
