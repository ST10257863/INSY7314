import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Payment from './pages/Payment.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './styles.css'   

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/" element={<Navigate to="/payments" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/payments" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
