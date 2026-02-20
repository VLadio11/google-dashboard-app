import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

if (!clientId) {
  console.warn(
    'VITE_GOOGLE_CLIENT_ID is not set. Create a .env file with your Google OAuth client ID. See README.md for setup instructions.'
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId ?? ''}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
