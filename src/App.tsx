import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserLoginPage from "./pages/auth/UserLoginPage";
import VentasPage from "./pages/dashboard/VentasPage";
import PxrCerradosPage from "./pages/dashboard/PxrCerradosPage";
import HhCerradosPage from "./pages/dashboard/HhCerradosPage";
import CobranzaPage from "./pages/dashboard/CobranzaPage";
import AdminPage from "./pages/dashboard/AdminPage";
import GastosTdcPage from "./pages/dashboard/GastosTdcPage";
import HistorialPage from "./pages/dashboard/HistorialPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login/:role" element={<UserLoginPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/prospecciones" element={<VentasPage />} />
          <Route path="/pxr-cerrados" element={<PxrCerradosPage />} />
          <Route path="/hh-cerrados" element={<HhCerradosPage />} />
          <Route path="/cobranza" element={<CobranzaPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/gastos-tdc" element={<GastosTdcPage />} />
          <Route path="/historial" element={<HistorialPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
