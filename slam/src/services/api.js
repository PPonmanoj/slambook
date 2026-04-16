// API calls for backend communication
export const sendScroll = async (fromStudent, toStudent, message) => {
  try {
    const response = await fetch('/api/scrolls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromStudent,
        to: toStudent,
        message,
        timestamp: new Date()
      })
    })
    return await response.json()
  } catch (error) {
    console.error('Error sending scroll:', error)
    throw error
  }
}

export const getStudentScrolls = async (studentId) => {
  try {
    const response = await fetch(`/api/scrolls/${studentId}`)
    return await response.json()
  } catch (error) {
    console.error('Error fetching scrolls:', error)
    throw error
  }
}