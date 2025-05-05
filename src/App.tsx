
import React from 'react';
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
import { useAuth } from '@/hooks/use-auth';

function App() {
  // Function to determine where to redirect based on user role
  const getRedirectPath = (userRole: string | null, userEmail: string | null) => {
    if (!userRole || !userEmail) return null;
    
    if (userEmail.toLowerCase().includes('sergio.t@topmarket.com.mx') || userRole === 'admin') {
      return '/admin';
    }
    
    switch(userRole) {
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

  const AppRoutes = () => {
    const { user, userRole, loading } = useAuth();
    
    if (loading) {
      return <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">TopMarket</h1>
          <p className="text-lg mb-4">Cargando aplicación...</p>
        </div>
      </div>;
    }

    return (
      <Routes>
        {/* Home route with conditional redirect for authenticated users */}
        <Route path="/" element={
          user && getRedirectPath(userRole, user.email) 
            ? <Navigate to={getRedirectPath(userRole, user.email) as string} replace /> 
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
    );
  };

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
