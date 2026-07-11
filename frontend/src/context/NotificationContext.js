import React, { createContext, useState, useContext, useRef, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Track previous state of the nearest 3 stations to detect changes
  const monitoredStationsRef = useRef({});

  // Helper to calculate distance
  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const addNotification = useCallback((title, body, type = 'info') => {
    let icon = 'notifications';
    let color = '#3B82F6'; // default blue

    if (type === 'success') {
      icon = 'local-gas-station';
      color = '#10B981'; // green
    } else if (type === 'warning') {
      icon = 'warning-amber';
      color = '#F59E0B'; // orange
    } else if (type === 'error' || type === 'closed') {
      icon = 'block';
      color = '#EF4444'; // red
    }

    const newNotification = {
      id: Date.now().toString() + Math.random().toString(),
      icon,
      title,
      body,
      time: 'Just now',
      color,
      isRead: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const monitorNearestStations = useCallback((driverCoords, stations) => {
    if (!driverCoords || !stations || stations.length === 0) return;

    // 1. Find 3 nearest stations
    const stationsWithDistance = stations.map(s => {
      const distance = getDistance(
        driverCoords.lat, driverCoords.lng,
        s.location?.lat, s.location?.lng
      );
      return { ...s, _distance: distance };
    });

    // Sort and take top 3
    const nearest3 = stationsWithDistance
      .sort((a, b) => a._distance - b._distance)
      .slice(0, 3);

    // 2. Compare with previous state
    const currentMonitored = monitoredStationsRef.current;
    
    nearest3.forEach(station => {
      const prev = currentMonitored[station.id];
      const name = station.displayName || station.name || 'A nearby station';

      if (prev) {
        // Check for Open/Closed changes
        const wasOpen = prev.isOpen !== undefined ? prev.isOpen : true;
        const isNowOpen = station.isOpen !== undefined ? station.isOpen : true;

        if (wasOpen && !isNowOpen) {
          addNotification('Station Closed', `${name} has just closed.`, 'closed');
        } else if (!wasOpen && isNowOpen) {
          addNotification('Station Opened', `${name} is now open for business.`, 'success');
        }

        // Check for fuel availability changes
        const prevAvail = prev.availability || {};
        const currAvail = station.availability || {};

        const fuels = [
          { key: 'petrol92', name: 'Petrol 92' },
          { key: 'petrol95', name: 'Petrol 95' },
          { key: 'diesel', name: 'Diesel' },
          { key: 'superdiesel', name: 'Super Diesel' },
          { key: 'kerosene', name: 'Kerosene' },
        ];

        fuels.forEach(f => {
          // If it was false/undefined and is now true
          if (!prevAvail[f.key] && currAvail[f.key]) {
            addNotification('Fuel Available', `${f.name} is now available at ${name}!`, 'success');
          }
          // If it was true and is now false
          else if (prevAvail[f.key] && !currAvail[f.key]) {
            addNotification('Fuel Finished', `${f.name} is now out of stock at ${name}.`, 'warning');
          }
        });
      }
    });

    // 3. Update snapshot
    const newSnapshot = {};
    nearest3.forEach(s => {
      // Create a deep copy of relevant state to prevent reference mutations
      newSnapshot[s.id] = {
        isOpen: s.isOpen !== undefined ? s.isOpen : true,
        availability: s.availability ? { ...s.availability } : {},
      };
    });
    
    monitoredStationsRef.current = newSnapshot;

  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAllAsRead,
      monitorNearestStations
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
