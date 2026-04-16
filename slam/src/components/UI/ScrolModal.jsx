import React, { useState } from 'react'

export const ScrollModal = ({ isOpen, onClose, onSend }) => {
  const [message, setMessage] = useState('')

  if (!isOpen) return null

  const handleSend = () => {
    if (message.trim()) {
      onSend(message)
      setMessage('')
      onClose()
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: '#222',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '500px',
        color: '#fff'
      }}>
        <h2>Write on Scroll</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message..."
          style={{
            width: '100%',
            height: '150px',
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '5px',
            border: 'none'
          }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSend} style={{ flex: 1, padding: '10px' }}>Send</button>
          <button onClick={onClose} style={{ flex: 1, padding: '10px' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}