// Authentication logic
export const loginStudent = async (studentId, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentId, password })
    })
    return await response.json()
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}