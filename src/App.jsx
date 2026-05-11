import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TaskProvider } from './context/TaskContext';
import { InboxProvider } from './context/InboxContext';
import { GroupProvider } from './context/GroupContext';
import { CalendarProvider } from './context/CalendarContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { AdminProvider } from './context/AdminContext';
import { NotificationProvider } from './context/NotificationContext';
import { MessagingProvider } from './context/MessagingContext';
import { NotesProvider } from './context/NotesContext';
import { AISettingsProvider } from './context/AISettingsContext';
import { TourProvider } from './context/TourContext';
import { SplashScreen } from '@capacitor/splash-screen';

// Components & Pages
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Settings from './components/Settings';
import LoadingScreen from './components/LoadingScreen';
import LiveBackground from './components/LiveBackground';
import ThresholdRitual from './components/ThresholdRitual';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Inbox from './pages/Inbox';
import GroupProductivity from './pages/GroupProductivity';
import CalendarPage from './pages/CalendarPage';
import WorkflowPage from './pages/WorkflowPage';
import AdminPage from './pages/AdminPage';
import ReportsPage from './pages/ReportsPage';
import Messages from './pages/Messages';
import NotesPage from './pages/NotesPage';
import ErrorBoundary from './components/ErrorBoundary';
import SearchModal from './components/SearchModal';
import { useKeyboardShortcuts } from './utils/useKeyboardShortcuts';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <div className="page-transition-wrapper" key={location.pathname}>
      {children}
    </div>
  );
};

const AppLayout = ({ children }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useKeyboardShortcuts({
    onToggleSettings: () => setIsSettingsOpen(prev => !prev),
    onToggleSearch: () => setIsSearchOpen(prev => !prev),
  });

  useEffect(() => {
    if (searchParams.get('settings') === 'true') {
      setIsSettingsOpen(true);
    }
  }, [searchParams]);

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    searchParams.delete('settings');
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className="app-container">
      <LiveBackground />
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
      <main className="main-content">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
      <ThresholdRitual />
      {isSettingsOpen && <Settings onClose={handleCloseSettings} />}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

const DataProviders = ({ children }) => (
  <ErrorBoundary message="A data provider crashed. Try refreshing the page.">
    <AISettingsProvider>
      <ThemeProvider>
        <TaskProvider>
          <InboxProvider>
            <GroupProvider>
              <CalendarProvider>
                <WorkflowProvider>
                  <AdminProvider>
                    <NotificationProvider>
                      <MessagingProvider>
                        <NotesProvider>
                          <TourProvider>
                            {children}
                          </TourProvider>
                        </NotesProvider>
                      </MessagingProvider>
                    </NotificationProvider>
                  </AdminProvider>
                </WorkflowProvider>
              </CalendarProvider>
            </GroupProvider>
          </InboxProvider>
        </TaskProvider>
      </ThemeProvider>
    </AISettingsProvider>
  </ErrorBoundary>
);

const AppContent = () => {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (!showLoading) {
      SplashScreen.hide().catch(() => {});
    }
  }, [showLoading]);

  if (showLoading) return <LoadingScreen onFinish={() => setShowLoading(false)} />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DataProviders>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/projects" element={<GroupProductivity />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/workflows" element={<WorkflowPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                </Routes>
              </AppLayout>
            </DataProviders>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
