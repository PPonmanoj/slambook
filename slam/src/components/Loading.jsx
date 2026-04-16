import React from 'react'

export const Loading = () => {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9999,
      color: '#fff',
      fontSize: '24px',
      fontWeight: 'bold'
    }}>
      Loading...
    </div>
  )
}