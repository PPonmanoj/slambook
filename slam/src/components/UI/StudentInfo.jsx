import React from 'react'

export const StudentInfo = ({ student, isOpen, onClose }) => {
  if (!isOpen || !student) return null

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#222',
      padding: '20px',
      borderRadius: '10px',
      color: '#fff',
      maxWidth: '300px',
      zIndex: 100
    }}>
      <h3>{student.name}</h3>
      <p>Desk: {student.deskIndex}</p>
      <button onClick={onClose}>Close</button>
    </div>
  )
}