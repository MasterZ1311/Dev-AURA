import { useEffect } from 'react';

/**
 * Hook to focus elements or trigger actions based on keyboard shortcuts.
 */
export const usePageShortcuts = (handlers) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      if (e.key === 'n') {
        e.preventDefault();
        handlers.onNew?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};
