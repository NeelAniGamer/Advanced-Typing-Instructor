import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { useGameStore } from './stores/useGameStore';

// Global Python evaluate_js bridge for Google OAuth PKCE callback
(window as any).useGameStore = useGameStore;
(window as any).receiveGoogleUser = (payload: any) => {
  if (payload?.user) {
    const u = payload.user;
    try {
      localStorage.setItem('tq_google_user', JSON.stringify(u));
    } catch {}
    useGameStore.setState((s) => ({
      user: {
        ...s.user,
        id: u.id || s.user.id,
        name: u.name || s.user.name,
        email: u.email,
        avatar: u.picture || s.user.avatar,
      }
    }));
    useGameStore.getState().savePlayerData();
    useGameStore.getState().updateProfile(u.name, u.picture || useGameStore.getState().user.avatar);
  }
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
