import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import PDFDocument from 'pdfkit'
import { Buffer } from 'buffer'

dotenv.config()

const app = express()

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://lustrous-gnome-c2c5ae.netlify.app', // Your Netlify frontend URL
  'https://your-domain.com' // Add your custom domain if you have one
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}))

app.use(express.json())

// MongoDB Connection with better error handling
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log('✅ MongoDB Connected Successfully')
    return true
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message)
    return false
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Draft Message Schema (messages saved in scroll before sending)
const draftMessageSchema = new mongoose.Schema({
  senderRollNumber: {
    type: String,
    required: true,
  },
  receiverRollNumber: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['draft', 'sent'],
    default: 'draft',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Received Message Schema (messages sent through santa to inbox)
const receivedMessageSchema = new mongoose.Schema({
  senderRollNumber: {
    type: String,
    required: true,
  },
  receiverRollNumber: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['received', 'read'],
    default: 'received',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

const User = mongoose.model('User', userSchema)
const DraftMessage = mongoose.model('DraftMessage', draftMessageSchema)
const ReceivedMessage = mongoose.model('ReceivedMessage', receivedMessageSchema)

// Helper function to create users
const initializeUsers = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Waiting for database connection...')
      await new Promise(resolve => {
        mongoose.connection.once('open', resolve)
      })
    }

    console.log('🔍 Checking existing users...')
    const count = await User.countDocuments()
    
    if (count > 0) {
      console.log(`✅ Database already has ${count} users`)
      return
    }

    console.log('🔄 Creating 75 users...')
    const users = []

    // 22n201 to 22n269 (69 users)
    for (let i = 201; i <= 269; i++) {
      const rollNumber = `22n${i}`
      users.push({
        rollNumber: rollNumber,
        password: rollNumber,
      })
    }

    // 23n431 to 23n436 (6 users)
    for (let i = 431; i <= 436; i++) {
      const rollNumber = `23n${i}`
      users.push({
        rollNumber: rollNumber,
        password: rollNumber,
      })
    }

    const createdUsers = await User.insertMany(users)
    console.log(`✅ Created ${createdUsers.length} users successfully`)
  } catch (error) {
    console.error('❌ Error initializing users:', error.message)
  }
}

// Routes

// Health Check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'
  res.status(200).json({ 
    message: 'Server is running',
    database: dbStatus,
  })
})

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { rollNumber, password } = req.body

    console.log(`🔐 Login attempt for roll number: ${rollNumber}`)

    if (!rollNumber || !password) {
      return res.status(400).json({
        message: 'Roll number and password are required',
      })
    }

    const normalizedRollNumber = rollNumber.trim().toLowerCase()
    
    const user = await User.findOne({ 
      rollNumber: { $regex: `^${normalizedRollNumber}$`, $options: 'i' }
    })

    if (!user) {
      console.log(`❌ User not found: ${rollNumber}`)
      return res.status(401).json({
        message: 'Invalid roll number or password',
      })
    }

    console.log(`✅ User found: ${user.rollNumber}`)

    const isPasswordValid = await bcrypt.compare(password.trim(), user.password)

    if (!isPasswordValid) {
      console.log(`❌ Invalid password for: ${rollNumber}`)
      return res.status(401).json({
        message: 'Invalid roll number or password',
      })
    }

    const token = jwt.sign(
      { userId: user._id, rollNumber: user.rollNumber },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    )

    console.log(`✅ Login successful for: ${rollNumber}`)

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        rollNumber: user.rollNumber,
      },
    })
  } catch (error) {
    console.error('❌ Login error:', error)
    return res.status(500).json({
      message: 'Server error during login',
      error: error.message,
    })
  }
})

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      message: 'No token provided',
    })
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key'
    )
    req.userId = decoded.userId
    req.rollNumber = decoded.rollNumber
    next()
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token',
    })
  }
}

// Save Draft Message (from scroll modal)
app.post('/api/messages/draft', verifyToken, async (req, res) => {
  try {
    const { receiverRollNumber, message, isAnonymous } = req.body

    console.log(`💬 Draft message from ${req.rollNumber} to ${receiverRollNumber}`)

    if (!receiverRollNumber || !message || message.trim().length === 0) {
      return res.status(400).json({
        message: 'Receiver roll number and message are required',
      })
    }

    // Verify receiver exists
    const receiver = await User.findOne({
      rollNumber: { $regex: `^${receiverRollNumber.trim().toLowerCase()}$`, $options: 'i' }
    })

    if (!receiver) {
      return res.status(400).json({
        message: 'Receiver roll number does not exist',
      })
    }

    const draftMessage = new DraftMessage({
      senderRollNumber: req.rollNumber,
      receiverRollNumber: receiver.rollNumber,
      message: message.trim(),
      isAnonymous,
      status: 'draft',
    })

    const savedDraft = await draftMessage.save()

    console.log(`✅ Draft message saved: ${savedDraft._id}`)

    return res.status(201).json({
      message: 'Draft message saved successfully',
      data: savedDraft,
    })
  } catch (error) {
    console.error('❌ Draft message error:', error)
    return res.status(500).json({
      message: 'Server error while saving draft',
      error: error.message,
    })
  }
})

// Get Draft Messages (for santa modal)
app.get('/api/messages/drafts', verifyToken, async (req, res) => {
  try {
    const drafts = await DraftMessage.find({
      senderRollNumber: req.rollNumber,
      status: 'draft'
    }).sort({ createdAt: -1 })

    console.log(`📝 Retrieved ${drafts.length} draft messages for: ${req.rollNumber}`)

    return res.status(200).json({
      message: 'Draft messages retrieved successfully',
      data: drafts,
    })
  } catch (error) {
    console.error('❌ Error retrieving drafts:', error)
    return res.status(500).json({
      message: 'Server error while retrieving drafts',
      error: error.message,
    })
  }
})

// Send Message (from santa modal - move from draft to received)
app.post('/api/messages/send', verifyToken, async (req, res) => {
  try {
    const { draftMessageId } = req.body

    console.log(`🎅 Sending message from draft: ${draftMessageId}`)

    if (!draftMessageId) {
      return res.status(400).json({
        message: 'Draft message ID is required',
      })
    }

    // Find the draft message
    const draftMessage = await DraftMessage.findById(draftMessageId)

    if (!draftMessage) {
      return res.status(404).json({
        message: 'Draft message not found',
      })
    }

    // Verify sender matches logged-in user
    if (draftMessage.senderRollNumber !== req.rollNumber) {
      return res.status(403).json({
        message: 'You can only send your own messages',
      })
    }

    // Create received message in receiver's inbox
    const receivedMessage = new ReceivedMessage({
      senderRollNumber: draftMessage.senderRollNumber,
      receiverRollNumber: draftMessage.receiverRollNumber,
      message: draftMessage.message,
      isAnonymous: draftMessage.isAnonymous,
      status: 'received',
    })

    await receivedMessage.save()

    // Update draft status to sent
    draftMessage.status = 'sent'
    await draftMessage.save()

    console.log(`✅ Message sent successfully to: ${draftMessage.receiverRollNumber}`)

    return res.status(200).json({
      message: 'Message sent successfully',
      data: {
        draft: draftMessage,
        received: receivedMessage,
      },
    })
  } catch (error) {
    console.error('❌ Message send error:', error)
    return res.status(500).json({
      message: 'Server error while sending message',
      error: error.message,
    })
  }
})

// Get Received Messages (inbox for receiver's end)
app.get('/api/messages/inbox', verifyToken, async (req, res) => {
  try {
    const messages = await ReceivedMessage.find({
      receiverRollNumber: req.rollNumber
    }).sort({ createdAt: -1 })

    console.log(`📬 Retrieved ${messages.length} received messages for: ${req.rollNumber}`)

    return res.status(200).json({
      message: 'Received messages retrieved successfully',
      data: messages,
    })
  } catch (error) {
    console.error('❌ Error retrieving inbox:', error)
    return res.status(500).json({
      message: 'Server error while retrieving inbox',
      error: error.message,
    })
  }
})

// Mark all messages as read
app.post('/api/messages/mark-read', verifyToken, async (req, res) => {
  try {
    console.log(`📖 Marking messages as read for: ${req.rollNumber}`)

    const result = await ReceivedMessage.updateMany(
      { 
        receiverRollNumber: req.rollNumber,
        status: 'received'
      },
      { 
        status: 'read'
      }
    )

    console.log(`✅ ${result.modifiedCount} messages marked as read`)

    return res.status(200).json({
      message: 'Messages marked as read',
      data: {
        modifiedCount: result.modifiedCount,
      },
    })
  } catch (error) {
    console.error('❌ Error marking as read:', error)
    return res.status(500).json({
      message: 'Server error while marking messages as read',
      error: error.message,
    })
  }
})

// Download Messages as PDF
app.get('/api/messages/download-pdf', verifyToken, async (req, res) => {
  try {
    console.log(`📥 Generating PDF for: ${req.rollNumber}`)

    const messages = await ReceivedMessage.find({
      receiverRollNumber: req.rollNumber
    }).sort({ createdAt: -1 })

    if (messages.length === 0) {
      return res.status(400).json({
        message: 'No messages to download',
      })
    }

    // Create PDF in memory using a buffer
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
    })

    // Collect chunks
    const chunks = []

    doc.on('data', (chunk) => {
      chunks.push(chunk)
    })

    doc.on('end', () => {
      // Combine all chunks
      const pdfBuffer = Buffer.concat(chunks)

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="farewell_messages_${req.rollNumber}_${Date.now()}.pdf"`)
      res.setHeader('Content-Length', pdfBuffer.length)

      // Send the PDF
      res.end(pdfBuffer)

      console.log(`✅ PDF sent successfully to: ${req.rollNumber}`)
    })

    doc.on('error', (err) => {
      console.error('❌ PDF generation error:', err)
      if (!res.headersSent) {
        res.status(500).json({
          message: 'Error generating PDF',
          error: err.message,
        })
      }
    })

    // Define colors
    const primaryColor = '#8B0000'      // Dark Red
    const accentColor = '#FFD700'       // Gold
    const lightAccent = '#FFA500'       // Orange
    const textColor = '#2C3E50'         // Dark Blue-Gray
    const lightBg = '#F8F9FA'           // Light Gray
    const borderColor = '#E8E8E8'       // Border Gray

    // Add decorative header
    doc.rect(0, 0, doc.page.width, 100)
    doc.fillColor(primaryColor)
    doc.fill()

    // Main title
    doc.fontSize(36)
    doc.fillColor(accentColor)
    doc.font('Helvetica-Bold')
    doc.text('Your Slambook', { align: 'center', y: 30 })
    
    // Subtitle
    doc.fontSize(12)
    doc.fillColor('#FFFFFF')
    doc.font('Helvetica')
    doc.text('A Collection of Memories from Your Classmates', { align: 'center', y: 68 })

    // Reset position
    doc.y = 120

    // Student info section
    doc.fontSize(11)
    doc.fillColor(textColor)
    doc.font('Helvetica')
    
    const infoY = doc.y
    doc.text(`Student Roll Number: ${req.rollNumber}`, 50, infoY)
    doc.text(`Total Messages: ${messages.length}`, 50, infoY + 20)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 50, infoY + 40)

    // Line separator
    doc.moveTo(50, infoY + 60)
    doc.lineTo(doc.page.width - 50, infoY + 60)
    doc.strokeColor(accentColor)
    doc.lineWidth(2)
    doc.stroke()

    doc.moveDown(2)

    // Add messages
    messages.forEach((msg, index) => {
      // Check if we need a new page
      if (doc.y > doc.page.height - 120) {
        doc.addPage()
        doc.y = 50
      }

      // Message box background
      const boxX = 40
      const boxWidth = doc.page.width - 80
      const messageBoxY = doc.y

      doc.rect(boxX, messageBoxY, boxWidth, 3)
      doc.fillColor(accentColor)
      doc.fill()

      doc.moveDown(0.5)

      // Message header
      const senderText = msg.isAnonymous ? 'ANONYMOUS' : msg.senderRollNumber.toUpperCase()
      
      doc.fontSize(10)
      doc.fillColor(primaryColor)
      doc.font('Helvetica-Bold')
      doc.text(`Message ${index + 1}`, 50)
      doc.fontSize(9)
      doc.text(`From: ${senderText}`, 50)

      // Message content box
      doc.fontSize(10)
      doc.fillColor(textColor)
      doc.font('Helvetica')
      
      const textOptions = {
        width: boxWidth - 20,
        align: 'left',
        lineGap: 4,
      }

      doc.text(msg.message, 50, doc.y, textOptions)

      // Message date
      doc.fontSize(8)
      doc.fillColor('#999999')
      doc.font('Helvetica-Oblique')
      doc.text(`Date: ${new Date(msg.createdAt).toLocaleDateString()} at ${new Date(msg.createdAt).toLocaleTimeString()}`, 50)

      // Message status
      const status = msg.status === 'received' ? 'NEW' : 'READ'
      const statusColor = msg.status === 'received' ? lightAccent : '#27AE60'
      
      doc.fontSize(8)
      doc.fillColor(statusColor)
      doc.font('Helvetica-Bold')
      doc.text(`[${status}]`, 50)

      // Spacing between messages
      doc.moveDown(1)

      // Separator line between messages
      doc.strokeColor(borderColor)
      doc.lineWidth(1)
      doc.moveTo(50, doc.y)
      doc.lineTo(doc.page.width - 50, doc.y)
      doc.stroke()

      doc.moveDown(1)
    })

    // Footer on last page
    doc.fontSize(10)
    doc.fillColor(textColor)
    doc.font('Helvetica')
    
    const footerY = doc.page.height - 80
    doc.moveTo(50, footerY)
    doc.lineTo(doc.page.width - 50, footerY)
    doc.strokeColor(accentColor)
    doc.lineWidth(2)
    doc.stroke()

    doc.y = footerY + 15
    doc.fontSize(11)
    doc.fillColor(primaryColor)
    doc.font('Helvetica-Bold')
    doc.text('Thank You', { align: 'center' })

    doc.fontSize(9)
    doc.fillColor(textColor)
    doc.font('Helvetica-Oblique')
    doc.text('Cherish these memories from your classmates', { align: 'center' })
    doc.text('This is your personal record of farewell messages', { align: 'center' })

    // END the document - this triggers the 'end' event
    doc.end()

  } catch (error) {
    console.error('❌ Error in PDF endpoint:', error)
    if (!res.headersSent) {
      return res.status(500).json({
        message: 'Server error while generating PDF',
        error: error.message,
      })
    }
  }
})

// Change Password Route
app.post('/api/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    console.log(`🔑 Password change attempt for: ${req.rollNumber}`)

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required',
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters long',
      })
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: 'New password must be different from current password',
      })
    }

    // Find the user
    const user = await User.findById(req.userId)

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordValid) {
      console.log(`❌ Invalid current password for: ${req.rollNumber}`)
      return res.status(401).json({
        message: 'Current password is incorrect',
      })
    }

    // Hash new password BEFORE saving
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password using findByIdAndUpdate to bypass pre-save hook
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { password: hashedPassword },
      { new: true }
    )

    console.log(`✅ Password changed successfully for: ${req.rollNumber}`)

    return res.status(200).json({
      message: 'Password changed successfully',
      user: {
        id: updatedUser._id,
        rollNumber: updatedUser.rollNumber,
      },
    })
  } catch (error) {
    console.error('❌ Password change error:', error)
    return res.status(500).json({
      message: 'Server error during password change',
      error: error.message,
    })
  }
})

// Start Server
const PORT = process.env.PORT || 5000

const startServer = async () => {
  const isConnected = await connectDB()

  if (isConnected) {
    await initializeUsers()

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  } else {
    console.error('❌ Failed to connect to MongoDB. Server not started.')
    process.exit(1)
  }
}

startServer()