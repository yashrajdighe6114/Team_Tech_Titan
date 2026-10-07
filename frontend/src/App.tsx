import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AssetList } from './pages/AssetList';
import { AssetCreate } from './pages/AssetCreate';
import { AssetDetail } from './pages/AssetDetail';
import { DocumentVerification } from './pages/DocumentVerification';
import { TokenizationWizard } from './pages/TokenizationWizard';
import { TokenHoldings } from './pages/TokenHoldings';
import { Settlements } from './pages/Settlements';
import { Compliance } from './pages/Compliance';
import { Admin } from './pages/Admin';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
        Authenticating institutional session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            }
          />

          <Route
            path="/assets"
            element={
              <ProtectedLayout>
                <AssetList />
              </ProtectedLayout>
            }
          />

          <Route
            path="/assets/new"
            element={
              <ProtectedLayout>
                <AssetCreate />
              </ProtectedLayout>
            }
          />

          <Route
            path="/assets/:id"
            element={
              <ProtectedLayout>
                <AssetDetail />
              </ProtectedLayout>
            }
          />

          <Route
            path="/assets/:id/verification"
            element={
              <ProtectedLayout>
                <DocumentVerification />
              </ProtectedLayout>
            }
          />

          <Route
            path="/assets/:id/tokenization"
            element={
              <ProtectedLayout>
                <TokenizationWizard />
              </ProtectedLayout>
            }
          />

          <Route
            path="/tokens"
            element={
              <ProtectedLayout>
                <TokenHoldings />
              </ProtectedLayout>
            }
          />

          <Route
            path="/portfolio"
            element={
              <ProtectedLayout>
                <TokenHoldings />
              </ProtectedLayout>
            }
          />

          <Route
            path="/settlements"
            element={
              <ProtectedLayout>
                <Settlements />
              </ProtectedLayout>
            }
          />

          <Route
            path="/compliance"
            element={
              <ProtectedLayout>
                <Compliance />
              </ProtectedLayout>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedLayout>
                <Admin />
              </ProtectedLayout>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
