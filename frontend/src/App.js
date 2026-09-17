import React from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';

// Pages
import LandingPage from './pages/LandingPage';
import BirthPlanPage from './pages/BirthPlanPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/birth-plan" element={<BirthPlanPage />} />
            <Route path="/birth-plan/:planId" element={<BirthPlanPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
