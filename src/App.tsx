
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<UserLoginPage />} />
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
  );
}

export default App;
