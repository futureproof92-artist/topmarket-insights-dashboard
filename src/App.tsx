
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Index from './pages/Index';
import UserLoginPage from './pages/auth/UserLoginPage';
import AdminPage from './pages/dashboard/AdminPage';
import VentasPage from './pages/dashboard/VentasPage';
import HistorialPage from './pages/dashboard/HistorialPage';
import CobranzaPage from './pages/dashboard/CobranzaPage';
import GastosTdcPage from './pages/dashboard/GastosTdcPage';
import HhCerradosPage from './pages/dashboard/HhCerradosPage';
import PxrCerradosPage from './pages/dashboard/PxrCerradosPage';
import NotFound from './pages/NotFound';
import ReclutamientoPage from './pages/dashboard/ReclutamientoPage';

function App() {
  const [user, setUser] = useState<{role: string, email: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Function to determine where to redirect based on user role
  const getRedirectPath = () => {
    if (!user) return null;
    
    if (user.email.toLowerCase().includes('sergio.t@topmarket.com.mx') || user.role === 'admin') {
      return '/admin';
    }
    
    switch(user.role) {
      case 'evelyn':
        return '/ventas';
      case 'davila':
        return '/pxr-cerrados';
      case 'lilia':
        return '/hh-cerrados';
      case 'karla':
        return '/reclutamiento';
      case 'nataly':
      case 'cobranza':
        return '/cobranza';
      default:
        return null;
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Home route with conditional redirect for authenticated users */}
          <Route path="/" element={
            user && getRedirectPath() 
              ? <Navigate to={getRedirectPath() as string} replace /> 
              : <Index />
          } />
          
          <Route path="/login/:role" element={<UserLoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/historial" element={<HistorialPage />} />
          <Route path="/cobranza" element={<CobranzaPage />} />
          <Route path="/gastos-tdc" element={<GastosTdcPage />} />
          <Route path="/hh-cerrados" element={<HhCerradosPage />} />
          <Route path="/pxr-cerrados" element={<PxrCerradosPage />} />
          <Route path="/reclutamiento" element={<ReclutamientoPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
