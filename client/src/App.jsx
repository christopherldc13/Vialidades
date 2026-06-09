import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import AuthContext, { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import CreateReport from './pages/CreateReport';
import Profile from './pages/Profile';
import ModerateReports from './pages/ModerateReports';
import SuperModDashboard from './pages/SuperModDashboard';
import SuperModModerators from './pages/SuperModModerators';
import SuperModSupport from './pages/SuperModSupport';
import SuperModReports from './pages/SuperModReports';
import SupportPage from './pages/SupportPage';
import LandingPage from './pages/LandingPage';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';

/* ─── Splash de recarga global ─── */
const SplashScreen = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 1400;
    const tick = (now) => {
      const pct = Math.min(((now - start) / duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(tick);
      else {
        setFadeOut(true);
        setTimeout(onDone, 400);
      }
    };
    requestAnimationFrame(tick);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'var(--bg-page)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
      transition: 'opacity 0.4s ease',
      opacity: fadeOut ? 0 : 1,
      pointerEvents: fadeOut ? 'none' : 'all',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '20px',
        background: 'linear-gradient(135deg, var(--primary), #818cf8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 20px 40px rgba(99,102,241,0.35)',
        animation: 'splashPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <img src="/Icono Sistema.png" alt="logo" style={{ width: 44, height: 44, objectFit: 'contain', filter: 'brightness(10)' }} />
      </div>

      <div style={{ textAlign: 'center', animation: 'splashFadeUp 0.5s 0.15s ease both' }}>
        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>Vialidades</p>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Vialidades de Tránsito</p>
      </div>

      <div style={{ width: 180, height: 3, borderRadius: 99, background: 'var(--border-color)', overflow: 'hidden', animation: 'splashFadeUp 0.5s 0.25s ease both' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg, var(--primary), #818cf8)',
          width: `${progress}%`, transition: 'width 0.05s linear',
        }} />
      </div>

      <style>{`
        @keyframes splashPop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes splashFadeUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'AQUI_TU_CLIENT_ID.apps.googleusercontent.com';
  const [showSplash] = useState(() => {
    sessionStorage.removeItem('showSplash');
    return true;
  });
  const [splashDone, setSplashDone] = useState(false);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider>
        <AuthProvider>
          {showSplash && !splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
          <Router>
            <div className="app-container">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/create-report" element={
                <PrivateRoute>
                  <CreateReport />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/moderate" element={
                <PrivateRoute>
                  <ModerateReports />
                </PrivateRoute>
              } />
              <Route path="/supermoderador" element={
                <PrivateRoute>
                  <SuperModDashboard />
                </PrivateRoute>
              } />
              <Route path="/supermoderador/moderadores" element={
                <PrivateRoute>
                  <SuperModModerators />
                </PrivateRoute>
              } />
              <Route path="/supermoderador/soporte" element={
                <PrivateRoute>
                  <SuperModSupport />
                </PrivateRoute>
              } />
              <Route path="/supermoderador/reportes" element={
                <PrivateRoute>
                  <SuperModReports />
                </PrivateRoute>
              } />
              <Route path="/soporte" element={<SupportPage />} />
            </Routes>
          </div>
          <div className="fixed-footer">
            <div className="footer-content">
              <span className="footer-dot"></span>
              © 2026 VIALIDADES DE TRÁNSITO. TODOS LOS DERECHOS RESERVADOS.
              <span className="footer-dot"></span>
            </div>
          </div>
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
