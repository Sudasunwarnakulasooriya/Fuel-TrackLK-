import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './config/firebase';
import { Settings, Users, LogOut, Activity } from 'lucide-react';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageUsers from './pages/ManageUsers';

const AdminLayout = ({ onLogout }) => {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2><Activity className="text-primary" /> FuelTrack Admin</h2>
        
        <nav className="nav-links" style={{ flex: 1 }}>
          <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Activity size={20} /> Dashboard
          </NavLink>
          <NavLink to="/users" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Users size={20} /> Manage Users
          </NavLink>
        </nav>

        <button onClick={onLogout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}>
          <LogOut size={20} /> Sign Out
        </button>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        <Route element={user ? <AdminLayout onLogout={handleLogout} /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<ManageUsers />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
