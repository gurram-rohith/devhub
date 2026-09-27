import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Workspaces from './pages/Workspaces';
import WorkspaceDetail from './pages/WorkspaceDetail';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/workspaces" element={<ProtectedRoute><Workspaces /></ProtectedRoute>} />
        <Route path="/workspaces/:id" element={<ProtectedRoute><WorkspaceDetail /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/workspaces" replace />} />
      </Routes>
    </>
  );
}

export default App;