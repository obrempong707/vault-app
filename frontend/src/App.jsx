import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import TrackingPage from './pages/TrackingPage';
import VaultPage from './pages/VaultPage';
import VaultDetailPage from './pages/VaultDetailPage';
import AdminPage from './pages/AdminPage';
import './index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/vault" element={<VaultPage />} />
          <Route
            path="/vault/:assetId"
            element={
              <ProtectedRoute>
                <VaultDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
