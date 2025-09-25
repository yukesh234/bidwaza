import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter , RouterProvider} from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './Context/Authcontext.jsx'
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')).render(
  
  <StrictMode>
    <Toaster  
     position="top-right"
  reverseOrder={false} />
    <AuthProvider>
    <BrowserRouter>
    <App />
    </BrowserRouter>
        </AuthProvider>
       
  </StrictMode>,
)
