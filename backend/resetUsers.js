import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

dotenv.config()

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

const resetUsers = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('✅ MongoDB Connected')

    console.log('🗑️ Deleting all existing users...')
    const deleteResult = await User.deleteMany({})
    console.log(`✅ Deleted ${deleteResult.deletedCount} users`)

    console.log('🔄 Creating 75 new users (password = roll number)...')
    const users = []

    // 22n201 to 22n269 (69 users) - password = roll number
    for (let i = 201; i <= 269; i++) {
      const rollNumber = `22n${i}`
      users.push({
        rollNumber: rollNumber,
        password: rollNumber,  // Password same as roll number
      })
    }

    // 23n431 to 23n436 (6 users) - password = roll number
    for (let i = 431; i <= 436; i++) {
      const rollNumber = `23n${i}`
      users.push({
        rollNumber: rollNumber,
        password: rollNumber,  // Password same as roll number
      })
    }

    // Save users one by one to trigger pre-save hook
    for (const userData of users) {
      const user = new User(userData)
      await user.save()
    }

    console.log(`✅ Created ${users.length} users`)
    console.log('')
    console.log('📋 Sample Credentials:')
    console.log('   Roll: 22n201  | Password: 22n201')
    console.log('   Roll: 22n237  | Password: 22n237')
    console.log('   Roll: 22n269  | Password: 22n269')
    console.log('   Roll: 23n431  | Password: 23n431')
    console.log('   Roll: 23n436  | Password: 23n436')
    console.log('')

    // Verify users
    const testUser1 = await User.findOne({ rollNumber: '22n237' })
    const testUser2 = await User.findOne({ rollNumber: '23n431' })
    console.log(`✅ Test user 22n237 found: ${testUser1 ? 'Yes' : 'No'}`)
    console.log(`✅ Test user 23n431 found: ${testUser2 ? 'Yes' : 'No'}`)

    console.log('✅ User reset complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

resetUsers()