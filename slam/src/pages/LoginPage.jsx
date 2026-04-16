import React, { useState } from 'react'
import './LoginPage.css'

export const LoginPage = ({ onLoginSuccess }) => {
  const [rollNumber, setRollNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Call backend login endpoint
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rollNumber: rollNumber.trim(),
          password: password.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Login failed')
        setLoading(false)
        return
      }

      // Save token to localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('rollNumber', data.user.rollNumber)

      console.log('✅ Login successful:', data.user.rollNumber)

      // Call success callback
      onLoginSuccess(data.user)
    } catch (err) {
      setError('Error connecting to server: ' + err.message)
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a0033 0%, #4d0099 50%, #9933ff 100%)',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{
          color: '#333',
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '28px',
        }}>🚪 Slambook Classroom</h1>

        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ef5350',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
        }}>
          <label style={{
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333',
          }}>Roll Number:</label>
          <input
            type="text"
            placeholder="e.g., 22n201 or 23n431"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            style={{
              padding: '12px',
              marginBottom: '20px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              transition: 'all 0.3s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#9933ff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />

          <label style={{
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333',
          }}>Password:</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: '12px',
              marginBottom: '30px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              transition: 'all 0.3s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#9933ff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #6d3ff0 0%, #9d5fff 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
            }}
          >
            {loading ? '🔄 Logging in...' : '✨ Enter Classroom'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          color: '#666',
          fontSize: '14px',
        }}>
          Default password: <code style={{ background: '#f0f0f0', padding: '2px 6px' }}>farewell@2024</code>
        </p>
      </div>
    </div>
  )
}