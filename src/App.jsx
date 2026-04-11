import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TaskProvider } from './context/TaskContext';
import { InboxProvider } from './context/InboxContext';
import { GroupProvider } from './context/GroupContext';
import { CalendarProvider } from './context/CalendarContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { AdminProvider } from './context/AdminContext';
import { NotificationProvider } from './context/NotificationContext';

// Components & Pages
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Settings from './components/Settings';
import LoadingScreen from './components/LoadingScreen';
import LiveBackground from './components/LiveBackground';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Inbox from './pages/Inbox';
import GroupProductivity from './pages/GroupProductivity';
import CalendarPage from './pages/CalendarPage';
import WorkflowPage from './pages/WorkflowPage';
import AdminPage from './pages/AdminPage';
import ReportsPage from './pages/ReportsPage';

// A simple wrapper to protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Page transition wrapper — re-triggers animation on every route change
const PageTransition = ({ children }) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionKey, setTransitionKey] = useState(location.pathname);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransitionKey(location.pathname);
    setDisplayChildren(children);
  }, [location.pathname, children]);

  return (
    <div className="page-transition-wrapper" key={transitionKey}>
      {displayChildren}
    </div>
  );
};

// Layout component that includes Header and BottomNav
const AppLayout = ({ children }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="app-container">
      <LiveBackground />
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      <main className="main-content">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <BottomNav />
      {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
};

// Data providers that require a logged-in user
const DataProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <TaskProvider>
        <InboxProvider>
          <GroupProvider>
            <CalendarProvider>
              <WorkflowProvider>
                <AdminProvider>
                  <NotificationProvider>
                    {children}
                  </NotificationProvider>
                </AdminProvider>
              </WorkflowProvider>
            </CalendarProvider>
          </GroupProvider>
        </InboxProvider>
      </TaskProvider>
    </ThemeProvider>
  );
};

const AppContent = () => {
  const [showLoading, setShowLoading] = useState(true);

  if (showLoading) {
    return <LoadingScreen onFinish={() => setShowLoading(false)} />;
  }

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

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
