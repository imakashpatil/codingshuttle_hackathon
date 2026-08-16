import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import Templates from './pages/Templates';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Batches from './pages/Batches';
import Files from './pages/Files';
import QueueMonitor from './pages/QueueMonitor';
import Reports from './pages/Reports';
import TemplateEditor from './pages/TemplateEditor';
import CommDefinitions from './pages/CommDefinitions';
import CommDefinitionEditor from './pages/CommDefinitionEditor';

function AppContent() {
  const location = useLocation();
  const token = localStorage.getItem('auth_token');
  const isLoginPage = location.pathname === '/login';

  // Redirect to login if unauthenticated
  if (!token && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard home if already authenticated
  if (token && isLoginPage) {
    return <Navigate to="/" replace />;
  }

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background text-foreground antialiased font-sans">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased font-sans">
      {/* Sidebar and Header layout for dashboard routes only */}
      <Sidebar />
      
      <div className="flex flex-col min-h-screen pl-64">
        <Header />
        <main className="flex-1 w-full mx-auto max-w-7xl pt-24 px-8 pb-8">
          <Routes>
            <Route path="/" element={<Navigate to="/files" replace />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/new/:type" element={<TemplateEditor />} />
            <Route path="/templates/edit/:type/:id" element={<TemplateEditor />} />
            <Route path="/comm-definitions" element={<CommDefinitions />} />
            <Route path="/comm-definitions/new" element={<CommDefinitionEditor />} />
            <Route path="/comm-definitions/edit/:id" element={<CommDefinitionEditor />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetails />} />
            <Route path="/files" element={<Files />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/queues" element={<QueueMonitor />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/files" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Router>
  );
}

export default App;
