
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/integrations/supabase/client';
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
    // Verificar sesión en Supabase al cargar
    const checkAuthSession = async () => {
      try {
        // Obtener la sesión actual desde Supabase
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[AUTH_DEBUG] Sesión obtenida de Supabase:", session);
        
        if (session?.user?.email) {
          // Consultar rol desde Supabase usando la función
          const { data: userData, error } = await supabase
            .from('usuarios_roles')
            .select('role, email')
            .eq('email', session.user.email)
            .single();
          
          if (error) {
            console.error("[AUTH_DEBUG] Error al obtener rol de usuario:", error);
          }
          
          if (userData) {
            const userInfo = {
              role: userData.role,
              email: userData.email
            };
            
            console.log("[AUTH_DEBUG] Usuario autenticado:", userInfo);
            setUser(userInfo);
            
            // Almacenar en localStorage para respaldo
            localStorage.setItem('user', JSON.stringify(userInfo));
          } else {
            // Si no hay datos de usuario en la tabla usuarios_roles
            console.warn("[AUTH_DEBUG] Usuario autenticado pero sin rol asignado:", session.user.email);
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          // Si no hay sesión activa
          console.log("[AUTH_DEBUG] No hay sesión activa");
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error("[AUTH_DEBUG] Error al verificar sesión:", error);
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Verificar sesión al cargar
    checkAuthSession();
    
    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AUTH_DEBUG] Cambio de estado de autenticación:", event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user?.email) {
        // Actualizar usuario al iniciar sesión
        try {
          const { data: userData, error } = await supabase
            .from('usuarios_roles')
            .select('role, email')
            .eq('email', session.user.email)
            .single();
          
          if (error) {
            console.error("[AUTH_DEBUG] Error al obtener rol de usuario:", error);
          }
          
          if (userData) {
            const userInfo = {
              role: userData.role,
              email: userData.email
            };
            
            console.log("[AUTH_DEBUG] Usuario identificado:", userInfo);
            setUser(userInfo);
            localStorage.setItem('user', JSON.stringify(userInfo));
          }
        } catch (error) {
          console.error("[AUTH_DEBUG] Error al procesar inicio de sesión:", error);
        }
      } else if (event === 'SIGNED_OUT') {
        // Limpiar al cerrar sesión
        console.log("[AUTH_DEBUG] Usuario cerró sesión");
        localStorage.removeItem('user');
        localStorage.removeItem('impersonatedRole');
        setUser(null);
      }
    });
    
    // Limpiar la suscripción al desmontar
    return () => {
      subscription.unsubscribe();
    };
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
    return <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">TopMarket</h1>
        <p className="text-lg mb-4">Cargando aplicación...</p>
      </div>
    </div>;
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
