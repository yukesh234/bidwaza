import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './Context/Authcontext.jsx';
import { SocketProvider } from './Context/SocketContext.jsx';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')).render(

    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" reverseOrder={false} />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  
);

