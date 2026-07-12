import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { ref, onValue, update } from 'firebase/database';
import { Shield, ShieldAlert } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setUsers(usersList);
      } else {
        setUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleVerifyStation = async (userId, currentStatus) => {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, {
      isVerified: !currentStatus
    });
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>Manage Users & Stations</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Verify fuel stations and monitor registered drivers.</p>

      <div className="glass-panel glass-table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>City</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{user.displayName || user.name || 'N/A'}</div>
                  {user.registrationNumber && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.registrationNumber}</div>}
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${user.role}`}>
                    {user.role === 'station' ? 'Fuel Station' : 'Driver'}
                  </span>
                </td>
                <td>{user.city || 'N/A'}</td>
                <td>
                  {user.role === 'station' && (
                    <button 
                      onClick={() => handleVerifyStation(user.id, user.isVerified)}
                      className="btn-primary" 
                      style={{ 
                        padding: '6px 12px', 
                        width: 'auto', 
                        fontSize: '0.875rem',
                        background: user.isVerified ? 'var(--surface-color)' : 'var(--primary-color)',
                        color: user.isVerified ? 'var(--success-color)' : 'white',
                        border: user.isVerified ? '1px solid var(--success-color)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {user.isVerified ? <><Shield size={14}/> Verified</> : <><ShieldAlert size={14} /> Verify</>}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No users found. Connect to the real Firebase database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
