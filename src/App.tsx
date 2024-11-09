import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import RestaurantsPage from './pages/RestaurantsPage';
import PlanPage from './pages/PlanPage';
import SavedPage from './pages/SavedPage';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/saved" element={<SavedPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;