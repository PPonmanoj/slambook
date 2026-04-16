import React from 'react'

export const PostBoxModal = ({ isOpen, onClose, onSelectStudent }) => {
  if (!isOpen) return null

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
        <h2>PostBox</h2>
        <p>Select a student to send a scroll</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}