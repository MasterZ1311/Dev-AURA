import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for managing global keyboard shortcuts.
 *
 * @param {Object} handlers - Map of action names to handler functions.
 * @param {Function} handlers.onToggleSettings - Function to open/close settings.
 * @param {Function} handlers.onToggleSearch - Function to open/close search.
 */
export const useKeyboardShortcuts = (handlers) => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e) => {
            const isMod = e.ctrlKey || e.metaKey;

            // Ctrl + K -> Search
            if (isMod && e.key === 'k') {
                e.preventDefault();
                handlers.onToggleSearch?.();
            }

            // Ctrl + \ -> Settings
            if (isMod && e.key === '\\') {
                e.preventDefault();
                handlers.onToggleSettings?.();
            }

            // Ctrl + N -> Focus Quick Add / New Task
            if (isMod && e.key === 'n') {
                e.preventDefault();
                // If not on tasks/dashboard, go to tasks
                if (!window.location.pathname.includes('tasks') && !window.location.pathname === '/') {
                    navigate('/tasks');
                }
                // Small delay to allow navigation if needed, then focus
                setTimeout(() => {
                    const quickAdd = document.querySelector('.quick-add-input, .new-task-input');
                    if (quickAdd) quickAdd.focus();
                }, 50);
            }

            // Ctrl + 1-4 -> Navigation
            if (isMod && e.key === '1') { e.preventDefault(); navigate('/'); }
            if (isMod && e.key === '2') { e.preventDefault(); navigate('/tasks'); }
            if (isMod && e.key === '3') { e.preventDefault(); navigate('/inbox'); }
            if (isMod && e.key === '4') { e.preventDefault(); navigate('/calendar'); }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, handlers]);
};
