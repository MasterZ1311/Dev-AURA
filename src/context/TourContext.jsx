import React, { createContext, useContext, useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { tourSteps } from '../data/tourSteps';

const TourContext = createContext();

export const useTour = () => useContext(TourContext);

export const TourProvider = ({ children }) => {
  const { currentUser, updateProfile } = useAuth();
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const [currentSection, setCurrentSection] = useState(null);

  const getSectionFromPath = (path) => {
    if (path === '/') return 'dashboard';
    if (path.startsWith('/tasks')) return 'tasks';
    if (path.startsWith('/inbox')) return 'inbox';
    if (path.startsWith('/projects')) return 'projects';
    if (path.startsWith('/calendar')) return 'calendar';
    if (path.startsWith('/workflows')) return 'workflows';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/reports')) return 'reports';
    return null;
  };

  useEffect(() => {
    if (!currentUser) return;

    // Small delay to ensure route transition finishes and elements are rendered
    const timer = setTimeout(() => {
      const section = getSectionFromPath(location.pathname);
      if (section && tourSteps[section]) {
        const completedTours = currentUser.completedTours || [];
        if (!completedTours.includes(section)) {
          setSteps(tourSteps[section]);
          setCurrentSection(section);
          setRun(true);
        } else {
          setRun(false);
        }
      } else {
        setRun(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [location.pathname, currentUser]);

  const handleJoyrideCallback = async (data) => {
    const { status, type } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    // Listen for tour completion
    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (currentSection && currentUser) {
        const completedTours = currentUser.completedTours || [];
        if (!completedTours.includes(currentSection)) {
          await updateProfile({
            completedTours: [...completedTours, currentSection]
          });
        }
      }
    }
  };

  return (
    <TourContext.Provider value={{ run, setRun }}>
      {children}
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        run={run}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={steps}
        styles={{
          options: {
            arrowColor: 'var(--surface-color)',
            backgroundColor: 'var(--surface-color)',
            overlayColor: 'var(--glass-bg)',
            primaryColor: 'var(--accent-color)',
            textColor: 'var(--text-color)',
            zIndex: 10000,
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          buttonNext: {
            backgroundColor: 'var(--accent-color)',
            color: 'var(--bg-color)', // to ensure contrast
            borderRadius: '20px',
            fontWeight: '600',
            padding: '8px 16px'
          },
          buttonBack: {
            color: 'var(--text-muted)'
          },
          buttonSkip: {
            color: 'var(--text-muted)'
          }
        }}
      />
    </TourContext.Provider>
  );
};
