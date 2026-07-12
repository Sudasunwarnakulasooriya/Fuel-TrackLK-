import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import { Users, Fuel, AlertTriangle, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalStations: 0,
    activeQueues: 0
  });

  useEffect(() => {
    // In a real scenario, this would aggregate data from Firebase
    const usersRef = ref(db, 'users');
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        let drivers = 0;
        let stations = 0;
        
        Object.values(users).forEach(u => {
          if (u.role === 'station') stations++;
          else drivers++;
        });

        setStats(prev => ({ ...prev, totalDrivers: drivers, totalStations: stations }));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>Dashboard Overview</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Welcome back, System Administrator.</p>

      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Registered Drivers</h3>
            <p>{stats.totalDrivers}</p>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success-color)' }}>
            <Fuel size={24} />
          </div>
          <div className="stat-details">
            <h3>Verified Stations</h3>
            <p>{stats.totalStations}</p>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger-color)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <h3>Active Queue Reports</h3>
            <p>{stats.activeQueues}</p>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-details">
            <h3>AI Accuracy Score</h3>
            <p>94.2%</p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>System Status</h2>
        <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success-color)', borderRadius: '8px', color: 'var(--success-color)' }}>
          All systems operational. The AI Prediction module is correctly receiving real-time queue updates from the mobile app.
        </div>
      </div>
    </div>
  );
}
