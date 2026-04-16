import React, { useState, useEffect } from 'react'
import { SceneProvider } from './context/SceneContext'
import { LoginPage } from './pages/LoginPage'
import { Canvas } from './components/Canvas'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  // Check if user is already logged in (token in localStorage)
  useEffect(() => {
    const token = localStorage.getItem('token')
    const rollNumber = localStorage.getItem('rollNumber')
    
    if (token && rollNumber) {
      setIsLoggedIn(true)
      setUser({ rollNumber })
      console.log('✅ User already logged in:', rollNumber)
    }
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setIsLoggedIn(true)
    console.log('✅ Login successful, welcome:', userData.rollNumber)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('rollNumber')
    setIsLoggedIn(false)
    setUser(null)
    console.log('👋 Logged out successfully')
  }

  return (
    <SceneProvider>
      <div>
        {!isLoggedIn ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <Canvas />
            
    
          </div>
        )}
      </div>
    </SceneProvider>
  )
}

export default App
