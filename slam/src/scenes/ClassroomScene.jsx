import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export class ClassroomScene {
  constructor(scene, sceneManager) {
    this.scene = scene
    this.sceneManager = sceneManager
    this.isSetup = false
    this.desksLoaded = 0
    this.postboxModel = null
    this.sideTableModel = null
    this.magicScrollModel = null
    this.giftBoxModel = null
    this.scrollMixer = null
    this.scrollActions = []
    this.postboxMixer = null
    this.postboxActions = []
    this.giftBoxMixer = null
    this.giftBoxActions = []
    this.isPostboxAnimating = false
    this.clickHandlerSetup = false
    this.scrollClickHandlerSetup = false
    this.giftBoxClickHandlerSetup = false
    this.santaBasePosition = new THREE.Vector3()
    this.animationTime = 0
    this.audioListener = null
    this.backgroundMusic = null
    this.unreadMessageCount = 0

    this.footballVelocity = new THREE.Vector3(0, 0, 0)
    this.footballIsMoving = false
    this.footballGravity = -0.015
    this.footballBounceDamping = 0.75
    this.footballFriction = 0.98
    this.footballBounceCount = 0
    this.footballMaxBounces = 20
    this.footballPosition = new THREE.Vector3(-6.5, 1, 6.5)
    console.log('🎓 ClassroomScene constructor called')
  }

  setup() {
    console.log('🎓 ClassroomScene setup starting')
    
    this.scene.clear()
    
    this.sceneManager.camera.position.set(0, 5, 5)
    this.sceneManager.camera.lookAt(0, 1, 0)
    
    this.scene.background = new THREE.Color(0xe8f4f8)
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    this.scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    this.scene.add(directionalLight)
    
    const floorGeometry = new THREE.PlaneGeometry(15, 15)
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)
    
    this.createWalls()
    this.loadDesks()
    this.loadPostbox()
    this.loadSideTable()
    this.loadMagicScroll()
    this.loadFootball()
    this.checkUnreadMessages()
    this.loadBackgroundMusic()
    this.displayUIButtons()
    
    this.isSetup = true
    console.log('✅ Classroom scene setup complete!')
  }

  async checkUnreadMessages() {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('https://slambook-q47h.onrender.com/api/messages/inbox', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        console.log('⚠️ Could not fetch inbox')
        return
      }

      // Count unread messages
      const unreadMessages = data.data.filter(msg => msg.status === 'received')
      this.unreadMessageCount = unreadMessages.length

      console.log(`📬 Unread messages: ${this.unreadMessageCount}`)

      if (this.unreadMessageCount > 0) {
        console.log('🎁 Loading gift box...')
        this.loadGiftBox()
      }
    } catch (error) {
      console.error('❌ Error checking messages:', error)
    }
  }

  openScrollModal() {
    const existingModal = document.getElementById('scrollModal')
    if (existingModal) {
      existingModal.remove()
    }

    const modalHTML = `
      <div id="scrollModal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(26, 0, 51, 0.8), rgba(77, 0, 153, 0.8));
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
      ">
        <div style="
          background: linear-gradient(135deg, #2d1b69 0%, #4d2fb8 50%, #6d3ff0 100%);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(157, 78, 221, 0.4), 0 0 20px rgba(147, 51, 255, 0.3);
          width: 90%;
          max-width: 500px;
          font-family: 'Arial', sans-serif;
          border: 2px solid rgba(200, 100, 255, 0.3);
          animation: fadeInScale 0.4s ease-out;
        ">
          <style>
            @keyframes fadeInScale {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          </style>
          
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
          ">
            <h2 style="
              margin: 0;
              color: #e0b0ff;
              font-size: 28px;
              text-shadow: 0 2px 10px rgba(157, 78, 221, 0.5);
              font-weight: bold;
              letter-spacing: 1px;
            ">✨ Write Message ✨</h2>
            <button id="closeScrollModal" style="
              background: linear-gradient(135deg, #ff6b9d 0%, #ff4d7d 100%);
              color: white;
              border: none;
              padding: 8px 15px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(255, 75, 125, 0.3);
            ">✕ Close</button>
          </div>

          <form id="scrollForm" style="display: flex; flex-direction: column;">
            <!-- Receiver Roll Number Input -->
            <label for="receiverRollNumber" style="
              margin-bottom: 8px;
              font-weight: bold;
              color: #e0b0ff;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">👤 Receiver Roll Number:</label>
            <input 
              type="text" 
              id="receiverRollNumber" 
              placeholder="e.g., 22n201" 
              style="
                padding: 12px 15px;
                margin-bottom: 18px;
                border: 2px solid rgba(200, 100, 255, 0.4);
                border-radius: 10px;
                font-size: 14px;
                background-color: rgba(255, 255, 255, 0.9);
                color: #333;
                transition: all 0.3s ease;
                box-shadow: 0 4px 10px rgba(157, 78, 221, 0.2);
              "
            />

            <!-- Message Textarea -->
            <label for="messageArea" style="
              margin-bottom: 8px;
              font-weight: bold;
              color: #e0b0ff;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">💬 Message:</label>
            <textarea 
              id="messageArea" 
              placeholder="Write your message here..." 
              rows="5"
              style="
                padding: 12px 15px;
                margin-bottom: 18px;
                border: 2px solid rgba(200, 100, 255, 0.4);
                border-radius: 10px;
                font-size: 14px;
                font-family: 'Arial', sans-serif;
                resize: vertical;
                background-color: rgba(255, 255, 255, 0.9);
                color: #333;
                transition: all 0.3s ease;
                box-shadow: 0 4px 10px rgba(157, 78, 221, 0.2);
              "
            ></textarea>

            <!-- Anonymous Checkbox -->
            <div style="
              display: flex;
              align-items: center;
              margin-bottom: 25px;
              padding: 12px;
              background: rgba(200, 100, 255, 0.1);
              border-radius: 10px;
              border: 1px solid rgba(200, 100, 255, 0.2);
            ">
              <input 
                type="checkbox" 
                id="anonymousCheckbox"
                style="
                  width: 18px;
                  height: 18px;
                  cursor: pointer;
                  margin-right: 12px;
                  accent-color: #cc66ff;
                "
              />
              <label for="anonymousCheckbox" style="
                cursor: pointer;
                color: #e0b0ff;
                margin: 0;
                font-weight: 500;
              ">🔒 Send it anonymously</label>
            </div>

            <!-- Submit Button -->
            <button 
              id="submitBtn"
              type="submit" 
              style="
                padding: 14px;
                background: linear-gradient(135deg, #6d3ff0 0%, #9d5fff 100%);
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 6px 20px rgba(157, 78, 221, 0.4);
              "
            >✨ Save Message ✨</button>
          </form>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', modalHTML)

    const modal = document.getElementById('scrollModal')
    const closeBtn = document.getElementById('closeScrollModal')
    const form = document.getElementById('scrollForm')
    const receiverRollNumberInput = document.getElementById('receiverRollNumber')
    const messageAreaInput = document.getElementById('messageArea')
    const anonymousCheckbox = document.getElementById('anonymousCheckbox')
    const submitBtn = document.getElementById('submitBtn')

    const closeModal = () => {
      modal.style.animation = 'fadeInScale 0.4s ease-out reverse'
      setTimeout(() => {
        modal.remove()
      }, 400)
    }

    closeBtn.addEventListener('click', closeModal)

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal()
      }
    })

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      
      const receiverRollNumber = receiverRollNumberInput.value
      const message = messageAreaInput.value
      const isAnonymous = anonymousCheckbox.checked

      console.log('✨ Message details:')
      console.log('Receiver:', receiverRollNumber)
      console.log('Message:', message)
      console.log('Anonymous:', isAnonymous)

      if (!receiverRollNumber.trim()) {
        alert('⚠️ Please enter receiver roll number')
        return
      }

      if (!message.trim()) {
        alert('⚠️ Please write a message')
        return
      }

      try {
        const token = localStorage.getItem('token')
        
        if (!token) {
          alert('⚠️ You must be logged in to submit a message')
          closeModal()
          return
        }

        submitBtn.disabled = true
        submitBtn.textContent = '🔄 Saving...'

        // Save as draft
        const response = await fetch('https://slambook-q47h.onrender.com/api/messages/draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            receiverRollNumber: receiverRollNumber.trim(),
            message: message.trim(),
            isAnonymous,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          alert(`⚠️ ${data.message || 'Failed to save message'}`)
          submitBtn.disabled = false
          submitBtn.textContent = '✨ Save Message ✨'
          return
        }

        alert('✨ Message saved to drafts! Use Santa to send it.')
        console.log('✅ Draft saved:', data.data)
        
        submitBtn.disabled = false
        submitBtn.textContent = '✨ Save Message ✨'
        closeModal()
      } catch (error) {
        console.error('❌ Error:', error)
        alert(`❌ Error: ${error.message}`)
        submitBtn.disabled = false
        submitBtn.textContent = '✨ Save Message ✨'
      }
    })

    receiverRollNumberInput.focus()
    console.log('✨ Scroll modal opened')
  }

  setupScrollClickHandler() {
    if (this.scrollClickHandlerSetup) {
      console.log('✨ Scroll click handler already setup')
      return
    }

    this.boundScrollClickHandler = (event) => {
      this.handleScrollClick(event)
    }
    
    window.addEventListener('click', this.boundScrollClickHandler)
    this.scrollClickHandlerSetup = true
    console.log('✨ Scroll click handler setup complete')
  }

  handleScrollClick(event) {
    if (!this.magicScrollModel) {
      console.log('⚠️ Magic scroll model not ready')
      return
    }

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    
    raycaster.setFromCamera(mouse, this.sceneManager.camera)
    const intersects = raycaster.intersectObjects(this.magicScrollModel.children, true)
    
    if (intersects.length > 0) {
      console.log('✨ Magic scroll clicked!')
      this.openScrollModal()
    }
  }

  setupPostboxClickHandler() {
    if (this.clickHandlerSetup) {
      console.log('📬 Click handler already setup')
      return
    }

    this.boundPostboxClickHandler = (event) => {
      this.handlePostboxClick(event)
    }
    
    window.addEventListener('click', this.boundPostboxClickHandler)
    this.clickHandlerSetup = true
    console.log('📬 Postbox click handler setup complete')
  }

  handlePostboxClick(event) {
    if (!this.postboxModel) {
      return
    }

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    
    raycaster.setFromCamera(mouse, this.sceneManager.camera)
    const intersects = raycaster.intersectObjects(this.postboxModel.children, true)
    
    if (intersects.length > 0) {
      console.log('🎅 Santa clicked!')
      this.openSantaModal()
    }
  }

  setupGiftBoxClickHandler() {
    if (this.giftBoxClickHandlerSetup) {
      console.log('🎁 Gift box click handler already setup')
      return
    }

    this.boundGiftBoxClickHandler = (event) => {
      this.handleGiftBoxClick(event)
    }
    
    window.addEventListener('click', this.boundGiftBoxClickHandler)
    this.giftBoxClickHandlerSetup = true
    console.log('🎁 Gift box click handler setup complete')
  }

  handleGiftBoxClick(event) {
    if (!this.giftBoxModel) {
      console.log('⚠️ Gift box model not ready')
      return
    }

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    
    raycaster.setFromCamera(mouse, this.sceneManager.camera)
    const intersects = raycaster.intersectObjects(this.giftBoxModel.children, true)
    
    if (intersects.length > 0) {
      console.log('🎁 Gift box clicked!')
      this.openGiftBoxModal()
    }
  }

  openGiftBoxModal() {
    const existingModal = document.getElementById('giftBoxModal')
    if (existingModal) {
      existingModal.remove()
    }

    const modalHTML = `
      <div id="giftBoxModal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(220, 20, 60, 0.8), rgba(255, 69, 0, 0.8));
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
      ">
        <div style="
          background: linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF6347 100%);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(220, 20, 60, 0.6), 0 0 30px rgba(255, 215, 0, 0.4);
          width: 90%;
          max-width: 600px;
          font-family: 'Arial', sans-serif;
          border: 3px solid #FFD700;
          animation: giftBounce 0.6s ease-out;
          max-height: 80vh;
          overflow-y: auto;
        ">
          <style>
            @keyframes giftBounce {
              0% {
                opacity: 0;
                transform: scale(0.5) rotateZ(-5deg);
              }
              50% {
                transform: scale(1.05) rotateZ(2deg);
              }
              100% {
                opacity: 1;
                transform: scale(1) rotateZ(0deg);
              }
            }
            .message-item {
              background: rgba(255, 255, 255, 0.95);
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 15px;
              border-left: 5px solid #FFD700;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            .message-item:hover {
              transform: translateX(5px);
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
            }
          </style>
          
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            text-align: center;
          ">
            <h2 style="
              margin: 0;
              color: #FFD700;
              font-size: 32px;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
              font-weight: bold;
              letter-spacing: 2px;
              flex: 1;
            ">🎁 Received Messages 🎁</h2>
            <button id="closeGiftBoxModal" style="
              background: linear-gradient(135deg, #32CD32 0%, #00FF00 100%);
              color: black;
              border: none;
              padding: 8px 15px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(50, 205, 50, 0.4);
            ">✕ Close</button>
          </div>

          <div id="receivedMessagesList" style="
            max-height: 500px;
            overflow-y: auto;
            margin-bottom: 20px;
          "></div>

          <div style="text-align: center;">
            <button 
              id="markAsReadBtn"
              style="
                padding: 14px 30px;
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: #000;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
              "
            >✨ Mark All as Read ✨</button>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', modalHTML)

    const modal = document.getElementById('giftBoxModal')
    const closeBtn = document.getElementById('closeGiftBoxModal')
    const messagesList = document.getElementById('receivedMessagesList')
    const markAsReadBtn = document.getElementById('markAsReadBtn')

    const closeModal = () => {
      modal.style.animation = 'giftBounce 0.6s ease-out reverse'
      setTimeout(() => {
        modal.remove()
      }, 600)
    }

    closeBtn.addEventListener('click', closeModal)

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal()
      }
    })

    // Fetch and display received messages
    this.loadReceivedMessages(messagesList)

    // Mark all as read
    markAsReadBtn.addEventListener('click', async () => {
      markAsReadBtn.disabled = true
      markAsReadBtn.textContent = '🔄 Marking as read...'

      const success = await this.markAllMessagesAsRead()

      if (success) {
        alert('✨ All messages marked as read!')
        this.unreadMessageCount = 0
        
        // Remove gift box from scene
        if (this.giftBoxModel && this.scene.children.includes(this.giftBoxModel)) {
          this.scene.remove(this.giftBoxModel)
          this.giftBoxModel = null
          this.giftBoxClickHandlerSetup = false
          console.log('🎁 Gift box removed from scene')
        }
        
        closeModal()
      } else {
        alert('❌ Error marking messages as read')
        markAsReadBtn.disabled = false
        markAsReadBtn.textContent = '✨ Mark All as Read ✨'
      }
    })

    console.log('🎁 Gift box modal opened')
  }

  async loadReceivedMessages(messagesList) {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch('https://slambook-q47h.onrender.com/api/messages/inbox', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        messagesList.innerHTML = `<p style="color: #FFD700;">⚠️ ${data.message}</p>`
        return
      }

      const messages = data.data

      if (messages.length === 0) {
        messagesList.innerHTML = `<p style="color: #FFD700; text-align: center;">📭 No messages received yet</p>`
        return
      }

      messagesList.innerHTML = messages.map((msg, index) => `
        <div class="message-item">
          <p style="
            margin: 0 0 8px 0;
            color: #8B0000;
            font-weight: bold;
            font-size: 16px;
          ">
            From: ${msg.isAnonymous ? '🔒 Anonymous' : msg.senderRollNumber}
            ${msg.status === 'received' ? '<span style="color: #FF6347; margin-left: 10px;">● NEW</span>' : ''}
          </p>
          <p style="
            margin: 0 0 12px 0;
            color: #333;
            font-size: 14px;
            line-height: 1.6;
          ">${msg.message}</p>
          <p style="
            margin: 0;
            color: #999;
            font-size: 12px;
          ">
            ${new Date(msg.createdAt).toLocaleString()}
          </p>
        </div>
      `).join('')
    } catch (error) {
      console.error('❌ Error loading received messages:', error)
      messagesList.innerHTML = `<p style="color: #FFD700;">❌ Error loading messages</p>`
    }
  }

  async markAllMessagesAsRead() {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch('https://slambook-q47h.onrender.com/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Mark as read failed:', data.message)
        return false
      }

      console.log('✅ All messages marked as read:', data.data)
      return true
    } catch (error) {
      console.error('❌ Error marking as read:', error)
      return false
    }
  }

  openSantaModal() {
    const existingModal = document.getElementById('santaModal')
    if (existingModal) {
      existingModal.remove()
    }

    const modalHTML = `
      <div id="santaModal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(26, 0, 51, 0.8), rgba(77, 0, 153, 0.8));
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
      ">
        <div style="
          background: linear-gradient(135deg, #2d1b69 0%, #4d2fb8 50%, #6d3ff0 100%);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(157, 78, 221, 0.4), 0 0 20px rgba(147, 51, 255, 0.3);
          width: 90%;
          max-width: 600px;
          font-family: 'Arial', sans-serif;
          border: 2px solid rgba(200, 100, 255, 0.3);
          animation: fadeInScale 0.4s ease-out;
          max-height: 80vh;
          overflow-y: auto;
        ">
          <style>
            @keyframes fadeInScale {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          </style>
          
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
          ">
            <h2 style="
              margin: 0;
              color: #e0b0ff;
              font-size: 28px;
              text-shadow: 0 2px 10px rgba(157, 78, 221, 0.5);
              font-weight: bold;
              letter-spacing: 1px;
            ">🎅 Send Messages 🎅</h2>
            <button id="closeSantaModal" style="
              background: linear-gradient(135deg, #ff6b9d 0%, #ff4d7d 100%);
              color: white;
              border: none;
              padding: 8px 15px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(255, 75, 125, 0.3);
            ">✕ Close</button>
          </div>

          <div id="draftMessagesList" style="
            max-height: 400px;
            overflow-y: auto;
            margin-bottom: 20px;
          "></div>

          <div style="text-align: center;">
            <button 
              id="sendSelectedBtn"
              style="
                padding: 14px 30px;
                background: linear-gradient(135deg, #6d3ff0 0%, #9d5fff 100%);
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 6px 20px rgba(157, 78, 221, 0.4);
              "
            >🎅 Send Selected Messages 🎅</button>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', modalHTML)

    const modal = document.getElementById('santaModal')
    const closeBtn = document.getElementById('closeSantaModal')
    const draftsList = document.getElementById('draftMessagesList')
    const sendBtn = document.getElementById('sendSelectedBtn')

    const closeModal = () => {
      modal.style.animation = 'fadeInScale 0.4s ease-out reverse'
      setTimeout(() => {
        modal.remove()
      }, 400)
    }

    closeBtn.addEventListener('click', closeModal)

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal()
      }
    })

    // Fetch and display draft messages
    this.loadDraftMessages(draftsList)

    // Send selected messages
    sendBtn.addEventListener('click', async () => {
      const selectedCheckboxes = Array.from(draftsList.querySelectorAll('input[type="checkbox"]:checked'))
      
      if (selectedCheckboxes.length === 0) {
        alert('⚠️ Please select at least one message to send')
        return
      }

      sendBtn.disabled = true
      sendBtn.textContent = '🔄 Sending...'

      let sentCount = 0
      for (const checkbox of selectedCheckboxes) {
        const draftId = checkbox.dataset.draftId
        await this.sendMessage(draftId)
        sentCount++
      }

      alert(`🎅 ${sentCount} message(s) sent successfully!`)
      sendBtn.disabled = false
      sendBtn.textContent = '🎅 Send Selected Messages 🎅'
      
      // Reload drafts
      this.loadDraftMessages(draftsList)
    })

    console.log('🎅 Santa modal opened')
  }

  async loadDraftMessages(draftsList) {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch('https://slambook-q47h.onrender.com/api/messages/drafts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        draftsList.innerHTML = `<p style="color: #e0b0ff;">⚠️ ${data.message}</p>`
        return
      }

      const drafts = data.data

      if (drafts.length === 0) {
        draftsList.innerHTML = `<p style="color: #e0b0ff; text-align: center;">📝 No draft messages. Write one using the scroll!</p>`
        return
      }

      draftsList.innerHTML = drafts.map(draft => `
        <div style="
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 12px;
          border: 1px solid rgba(200, 100, 255, 0.2);
        ">
          <div style="
            display: flex;
            align-items: flex-start;
            gap: 12px;
          ">
            <input 
              type="checkbox" 
              data-draft-id="${draft._id}"
              style="
                width: 20px;
                height: 20px;
                margin-top: 5px;
                cursor: pointer;
                accent-color: #cc66ff;
              "
            />
            <div style="flex: 1;">
              <p style="
                margin: 0 0 8px 0;
                color: #e0b0ff;
                font-weight: bold;
              ">
                To: ${draft.isAnonymous ? '🔒 Anonymous' : draft.receiverRollNumber}
              </p>
              <p style="
                margin: 0;
                color: #fff;
                font-size: 14px;
                line-height: 1.4;
              ">${draft.message}</p>
              <p style="
                margin: 8px 0 0 0;
                color: #b0a0ff;
                font-size: 12px;
              ">Created: ${new Date(draft.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      `).join('')
    } catch (error) {
      console.error('❌ Error loading drafts:', error)
      draftsList.innerHTML = `<p style="color: #e0b0ff;">❌ Error loading messages</p>`
    }
  }

  async sendMessage(draftId) {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch('https://slambook-q47h.onrender.com/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          draftMessageId: draftId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Send failed:', data.message)
        return false
      }

      console.log('✅ Message sent:', data.data)
      return true
    } catch (error) {
      console.error('❌ Error sending message:', error)
      return false
    }
  }

  createWalls() {
    const wallHeight = 8
    const roomWidth = 15
    const roomDepth = 15
    const wallThickness = 0.2
    
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })
    
    // Front wall (facing camera)
    const frontWallGeometry = new THREE.BoxGeometry(roomWidth, wallHeight, wallThickness)
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial)
    frontWall.position.set(0, wallHeight / 2, roomDepth / 2)
    frontWall.castShadow = true
    frontWall.receiveShadow = true
    this.scene.add(frontWall)
    
    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(roomWidth, wallHeight, wallThickness)
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial)
    backWall.position.set(0, wallHeight / 2, -roomDepth / 2)
    backWall.castShadow = true
    backWall.receiveShadow = true
    this.scene.add(backWall)
    
    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, roomDepth)
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial)
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0)
    leftWall.castShadow = true
    leftWall.receiveShadow = true
    this.scene.add(leftWall)
    
    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, roomDepth)
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial)
    rightWall.position.set(roomWidth / 2, wallHeight / 2, 0)
    rightWall.castShadow = true
    rightWall.receiveShadow = true
    this.scene.add(rightWall)
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth)
    const ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0xfafafa })
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.set(0, wallHeight, 0)
    ceiling.receiveShadow = true
    this.scene.add(ceiling)
    
    // Add blackboard to front wall
    this.createBlackboard()
    
    console.log('🏫 Classroom walls created')
  }

  createBlackboard() {
    // Load the group photo image once
    const textureLoader = new THREE.TextureLoader()
    
    // Right wall photo
    this.createPhotoFrame(
      { x: 7.4, y: 4, z: 0 },
      { x: 7.2, y: 4, z: 0 },
      -Math.PI / 2,
      textureLoader,
      'Right wall'
    )
    
    // Left wall photo
    this.createPhotoFrame(
      { x: -7.4, y: 4, z: 0 },
      { x: -7.2, y: 4, z: 0 },
      Math.PI / 2,
      textureLoader,
      'Left wall'
    )
    
    // Front wall photo
    this.createPhotoFrame(
      { x: 0, y: 4, z: 7.4 },
      { x: 0, y: 4, z: 7.2 },
      Math.PI,
      textureLoader,
      'Front wall'
    )
  }

  createPhotoFrame(framePos, photoPos, rotation, textureLoader, wallName) {
    // Photo frame (wooden)
    const frameGeometry = new THREE.BoxGeometry(7, 5, 0.2)
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.position.set(framePos.x, framePos.y, framePos.z)
    frame.rotation.y = rotation
    frame.castShadow = true
    frame.receiveShadow = true
    this.scene.add(frame)
    
    // Load the group photo image
    textureLoader.load(
      '/src/assets/images/group-photo.jpg',
      (texture) => {
        console.log(`📸 Texture loaded for ${wallName}`)
        
        // Create material with the loaded texture
        texture.magFilter = THREE.LinearFilter
        texture.minFilter = THREE.LinearFilter
        const photoMaterial = new THREE.MeshBasicMaterial({ 
          map: texture
        })
        
        // Photo surface
        const photoGeometry = new THREE.PlaneGeometry(6.6, 4.8)
        const photo = new THREE.Mesh(photoGeometry, photoMaterial)
        photo.position.set(photoPos.x, photoPos.y, photoPos.z)
        photo.rotation.y = rotation
        this.scene.add(photo)
        
        console.log(`📸 Class group photo displayed successfully on ${wallName}`)
      },
      (progress) => {
        console.log(`📸 Photo loading for ${wallName}: ${Math.round((progress.loaded / progress.total) * 100)}%`)
      },
      (error) => {
        console.error(`📸 Photo load error for ${wallName}:`, error)
        this.createFallbackPhoto(framePos, photoPos, rotation, wallName)
      }
    )
  }

  createFallbackPhoto(framePos, photoPos, rotation, wallName) {
    console.log(`📸 Creating fallback photo for ${wallName}...`)
    
    // Photo frame (wooden)
    const frameGeometry = new THREE.BoxGeometry(7, 5, 0.2)
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.position.set(framePos.x, framePos.y, framePos.z)
    frame.rotation.y = rotation
    frame.castShadow = true
    frame.receiveShadow = true
    this.scene.add(frame)
    
    // Fallback canvas photo
    const photoCanvas = document.createElement('canvas')
    photoCanvas.width = 800
    photoCanvas.height = 600
    const ctx = photoCanvas.getContext('2d')
    
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 600)
    gradient.addColorStop(0, '#87CEEB')
    gradient.addColorStop(0.5, '#E0F6FF')
    gradient.addColorStop(1, '#90EE90')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 800, 600)
    
    // Draw people silhouettes
    ctx.fillStyle = '#333333'
    
    const positions = [
      { x: 100, y: 150, size: 60 },
      { x: 220, y: 130, size: 70 },
      { x: 340, y: 150, size: 65 },
      { x: 460, y: 140, size: 68 },
      { x: 580, y: 150, size: 62 },
      { x: 700, y: 160, size: 58 }
    ]
    
    positions.forEach(pos => {
      // Head
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, pos.size * 0.35, 0, Math.PI * 2)
      ctx.fill()
      
      // Body
      ctx.fillRect(pos.x - pos.size * 0.3, pos.y + pos.size * 0.25, pos.size * 0.6, pos.size * 0.8)
      
      // Arms
      ctx.fillRect(pos.x - pos.size * 0.5, pos.y + pos.size * 0.3, pos.size, pos.size * 0.25)
    })
    
    // Add text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 60px Arial'
    ctx.textAlign = 'center'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.strokeText('Class Group Photo', 400, 80)
    ctx.fillText('Class Group Photo', 400, 80)
    
    ctx.font = '36px Arial'
    ctx.fillStyle = '#000000'
    ctx.strokeText('Memories Together', 400, 550)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('Memories Together', 400, 550)
    
    // Convert canvas to texture
    const photoTexture = new THREE.CanvasTexture(photoCanvas)
    const photoMaterial = new THREE.MeshBasicMaterial({ map: photoTexture })
    
    // Photo surface
    const photoGeometry = new THREE.PlaneGeometry(6.6, 4.8)
    const photo = new THREE.Mesh(photoGeometry, photoMaterial)
    photo.position.set(photoPos.x, photoPos.y, photoPos.z)
    photo.rotation.y = rotation
    this.scene.add(photo)
    
    console.log(`📸 Fallback photo created and displayed on ${wallName}`)
  }

  loadDesks() {
    const loader = new GLTFLoader()
    
    // Create 4 rows of desks with 4 desks per row
    const rows = 4
    const desksPerRow = 4
    const startX = -3
    const startZ = -2
    const spacingX = 2.2
    const spacingZ = 2.5
    
    for (let row = 0; row < rows; row++) {
      for (let desk = 0; desk < desksPerRow; desk++) {
        const xPos = startX + desk * spacingX
        const zPos = startZ + row * spacingZ
        
        loader.load(
          '/src/assets/models/desk.glb',
          (gltf) => {
            const deskModel = gltf.scene
            
            // Position the desk
            deskModel.position.set(xPos, 0, zPos)
            deskModel.scale.set(1, 1, 1)
            
            // Setup materials and shadows
            deskModel.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                
                if (child.material) {
                  child.material.needsUpdate = true
                }
              }
            })
            
            this.scene.add(deskModel)
            this.desksLoaded++
            
            console.log(`📚 Desk ${this.desksLoaded} loaded at (${xPos}, ${zPos})`)
          },
          (progress) => {
            // Loading progress
          },
          (error) => {
            console.error('📚 Desk load error:', error)
          }
        )
      }
    }
    
    // Also create teacher desk at front
    loader.load(
      '/src/assets/models/desk.glb',
      (gltf) => {
        const teacherDesk = gltf.scene
        
        // Position teacher desk at front, larger
        teacherDesk.position.set(0, 0, -5)
        teacherDesk.scale.set(1.3, 1.3, 1.3)
        
        teacherDesk.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            
            if (child.material) {
              child.material.needsUpdate = true
            }
          }
        })
        
        this.scene.add(teacherDesk)
        console.log('📚 Teacher desk loaded')
      }
    )
  }

  loadGiftBox() {
    const loader = new GLTFLoader()
    
    loader.load(
      '/src/assets/models/giftbox.glb',
      (gltf) => {
        const giftBoxModel = gltf.scene
        
        giftBoxModel.position.set(6.5, 2, -6.5)
        giftBoxModel.scale.set(1, 1, 1)
        giftBoxModel.rotation.y = 0
        
        if (gltf.animations && gltf.animations.length > 0) {
          this.giftBoxMixer = new THREE.AnimationMixer(giftBoxModel)
          console.log(`🎁 Animation mixer created for gift box`)
          
          gltf.animations.forEach((clip, index) => {
            const action = this.giftBoxMixer.clipAction(clip)
            action.loop = THREE.LoopRepeat
            action.clampWhenFinished = false
            this.giftBoxActions.push(action)
          })
          
          if (this.giftBoxActions.length > 0) {
            this.giftBoxActions[0].play()
            console.log('🎁 Gift box animation started')
          }
        }
        
        giftBoxModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            child.frustumCulled = false
            
            if (child.material) {
              child.material.needsUpdate = true
            }
          }
        })
        
        this.scene.add(giftBoxModel)
        this.giftBoxModel = giftBoxModel
        console.log('🎁 Gift box loaded')
        
        this.setupGiftBoxClickHandler()
      },
      (progress) => {
        console.log(`🎁 Gift box loading: ${Math.round((progress.loaded / progress.total) * 100)}%`)
      },
      (error) => {
        console.error('🎁 Gift box load error:', error)
      }
    )
  }

  loadPostbox() {
    const loader = new GLTFLoader()
    
    loader.load(
      '/src/assets/models/santa.glb',
      (gltf) => {
        const santaModel = gltf.scene
        
        santaModel.position.set(6.5, 0, 6.5)
        santaModel.scale.set(1, 1, 1)
        santaModel.rotation.y = Math.PI
        
        if (gltf.animations && gltf.animations.length > 0) {
          this.postboxMixer = new THREE.AnimationMixer(santaModel)
          console.log(`🎅 Animation mixer created for Santa`)
          
          gltf.animations.forEach((clip, index) => {
            const action = this.postboxMixer.clipAction(clip)
            action.loop = THREE.LoopRepeat
            action.clampWhenFinished = false
            this.postboxActions.push(action)
          })
          
          if (this.postboxActions.length > 0) {
            this.postboxActions[0].play()
            console.log('🎅 Santa animation started')
          }
        }
        
        santaModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            child.frustumCulled = false
            
            if (child.material) {
              child.material.needsUpdate = true
            }
          }
        })
        
        this.scene.add(santaModel)
        this.postboxModel = santaModel
        console.log('🎅 Santa loaded')
        
        this.setupPostboxClickHandler()
      },
      (progress) => {
        console.log(`🎅 Santa loading: ${Math.round((progress.loaded / progress.total) * 100)}%`)
      },
      (error) => {
        console.error('🎅 Santa load error:', error)
      }
    )
  }

  loadSideTable() {
    const loader = new GLTFLoader()
    
    loader.load(
      '/src/assets/models/side_table.glb',
      (gltf) => {
        const sideTableModel = gltf.scene
        
        sideTableModel.position.set(-6.5, 0, -6.5)
        sideTableModel.scale.set(1, 1, 1)
        sideTableModel.rotation.y = 0
        
        sideTableModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            child.frustumCulled = false
            
            if (child.material) {
              child.material.needsUpdate = true
            }
          }
        })
        
        this.scene.add(sideTableModel)
        this.sideTableModel = sideTableModel
        console.log('🪑 Side table loaded')
      },
      (progress) => {
        console.log(`🪑 Side table loading: ${Math.round((progress.loaded / progress.total) * 100)}%`)
      },
      (error) => {
        console.error('🪑 Side table load error:', error)
      }
    )
  }

  loadMagicScroll() {
    const loader = new GLTFLoader()
    
    loader.load(
      '/src/assets/models/magic_scroll.glb',
      (gltf) => {
        const magicScrollModel = gltf.scene
        
        magicScrollModel.position.set(-6.5, 2, -6.5)
        magicScrollModel.scale.set(1, 1, 1)
        magicScrollModel.rotation.y = Math.PI
        
        if (gltf.animations && gltf.animations.length > 0) {
          this.scrollMixer = new THREE.AnimationMixer(magicScrollModel)
          console.log(`✨ Animation mixer created for magic scroll`)
          
          gltf.animations.forEach((clip, index) => {
            const action = this.scrollMixer.clipAction(clip)
            action.loop = THREE.LoopRepeat
            action.clampWhenFinished = false
            this.scrollActions.push(action)
          })
          
          if (this.scrollActions.length > 0) {
            this.scrollActions[0].play()
            console.log('✨ Magic scroll animation started')
          }
        }
        
        magicScrollModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            child.frustumCulled = false
            
            if (child.material) {
              child.material.needsUpdate = true
            }
          }
        })
        
        this.scene.add(magicScrollModel)
        this.magicScrollModel = magicScrollModel
        console.log('✨ Magic scroll loaded')
        
        this.setupScrollClickHandler()
      },
      (progress) => {
        console.log(`✨ Magic scroll loading: ${Math.round((progress.loaded / progress.total) * 100)}%`)
      },
      (error) => {
        console.error('✨ Magic scroll load error:', error)
      }
    )
  }

  loadBackgroundMusic() {
    this.audioListener = new THREE.AudioListener()
    this.sceneManager.camera.add(this.audioListener)
    
    this.backgroundMusic = new THREE.Audio(this.audioListener)
    
    const audioLoader = new THREE.AudioLoader()
    audioLoader.load(
      '/src/assets/sounds/bgm.mp3',
      (audioBuffer) => {
        this.backgroundMusic.setBuffer(audioBuffer)
        this.backgroundMusic.setLoop(true)
        this.backgroundMusic.setVolume(0.5)
        this.backgroundMusic.play()
        console.log('🎵 Background music started')
      },
      (progress) => {
        console.log(`🎵 BGM loading: ${Math.round((progress.loaded / progress.total) * 100)}%`)
      },
      (error) => {
        console.error('🎵 BGM load error:', error)
      }
    )
  }

displayUIButtons() {
  // Check if UI container already exists
  const existingContainer = document.getElementById('classroom-ui')
  if (existingContainer) {
    console.log('🎨 UI buttons already exist, skipping creation')
    return
  }

  const uiContainer = document.createElement('div')
  uiContainer.id = 'classroom-ui'
  uiContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 15px;
    z-index: 500;
    flex-direction: column;
  `

  // Change Password button
  const changePasswordBtn = document.createElement('button')
  changePasswordBtn.textContent = '🔑 Change Password'
  changePasswordBtn.style.cssText = `
    padding: 12px 24px;
    background: linear-gradient(135deg, #9D4EDD 0%, #7209B7 100%);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(146, 78, 221, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `

  changePasswordBtn.addEventListener('mouseover', () => {
    changePasswordBtn.style.transform = 'translateY(-2px)'
    changePasswordBtn.style.boxShadow = '0 6px 20px rgba(146, 78, 221, 0.5)'
  })

  changePasswordBtn.addEventListener('mouseout', () => {
    changePasswordBtn.style.transform = 'translateY(0)'
    changePasswordBtn.style.boxShadow = '0 4px 15px rgba(146, 78, 221, 0.4)'
  })

  changePasswordBtn.addEventListener('click', () => {
    this.openChangePasswordModal()
  })

  // Download PDF button
  const downloadPdfBtn = document.createElement('button')
  downloadPdfBtn.textContent = '📥 Download PDF'
  downloadPdfBtn.style.cssText = `
    padding: 12px 24px;
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    color: #000;
    border: 2px solid #8B4513;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `

  downloadPdfBtn.addEventListener('mouseover', () => {
    downloadPdfBtn.style.transform = 'translateY(-2px)'
    downloadPdfBtn.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)'
  })

  downloadPdfBtn.addEventListener('mouseout', () => {
    downloadPdfBtn.style.transform = 'translateY(0)'
    downloadPdfBtn.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)'
  })

  downloadPdfBtn.addEventListener('click', () => {
    this.downloadMessagesPDF()
  })

  // Logout button
  const logoutBtn = document.createElement('button')
  logoutBtn.textContent = '🚪 Logout'
  logoutBtn.style.cssText = `
    padding: 12px 24px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ff4d4d 100%);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(255, 75, 75, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `

  logoutBtn.addEventListener('mouseover', () => {
    logoutBtn.style.transform = 'translateY(-2px)'
    logoutBtn.style.boxShadow = '0 6px 20px rgba(255, 75, 75, 0.4)'
  })

  logoutBtn.addEventListener('mouseout', () => {
    logoutBtn.style.transform = 'translateY(0)'
    logoutBtn.style.boxShadow = '0 4px 15px rgba(255, 75, 75, 0.3)'
  })

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token')
    window.location.href = '/'
  })

  uiContainer.appendChild(changePasswordBtn)
  uiContainer.appendChild(downloadPdfBtn)
  uiContainer.appendChild(logoutBtn)

  document.body.appendChild(uiContainer)

  console.log('🎨 UI buttons created')
}

openChangePasswordModal() {
  const existingModal = document.getElementById('changePasswordModal')
  if (existingModal) {
    existingModal.remove()
  }

  const modalHTML = `
    <div id="changePasswordModal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(146, 78, 221, 0.8), rgba(114, 9, 183, 0.8));
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
    ">
      <div style="
        background: linear-gradient(135deg, #4d148c 0%, #7209B7 50%, #9D4EDD 100%);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(146, 78, 221, 0.4), 0 0 30px rgba(157, 78, 221, 0.3);
        width: 90%;
        max-width: 450px;
        font-family: 'Arial', sans-serif;
        border: 2px solid rgba(200, 150, 255, 0.3);
        animation: slideInUp 0.4s ease-out;
      ">
        <style>
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          input:focus {
            outline: none;
            border-color: #9D4EDD !important;
            box-shadow: 0 0 15px rgba(157, 78, 221, 0.4) !important;
            background-color: rgba(255, 255, 255, 0.95) !important;
          }
        </style>
        
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        ">
          <h2 style="
            margin: 0;
            color: #E0D4FF;
            font-size: 28px;
            text-shadow: 0 2px 10px rgba(157, 78, 221, 0.5);
            font-weight: bold;
            letter-spacing: 1px;
          ">Change Password</h2>
          <button id="closeChangePasswordModal" style="
            background: linear-gradient(135deg, #ff6b9d 0%, #ff4d7d 100%);
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 75, 125, 0.3);
          ">✕ Close</button>
        </div>

        <form id="changePasswordForm" style="display: flex; flex-direction: column;">
          <!-- Current Password Input -->
          <label for="currentPassword" style="
            margin-bottom: 8px;
            font-weight: bold;
            color: #E0D4FF;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Current Password:</label>
          <input 
            type="password" 
            id="currentPassword" 
            placeholder="Enter current password" 
            style="
              padding: 12px 15px;
              margin-bottom: 18px;
              border: 2px solid rgba(200, 150, 255, 0.4);
              border-radius: 10px;
              font-size: 14px;
              background-color: rgba(255, 255, 255, 0.9);
              color: #333;
              transition: all 0.3s ease;
              box-shadow: 0 4px 10px rgba(157, 78, 221, 0.2);
            "
            required
          />

          <!-- New Password Input -->
          <label for="newPassword" style="
            margin-bottom: 8px;
            font-weight: bold;
            color: #E0D4FF;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">New Password:</label>
          <input 
            type="password" 
            id="newPassword" 
            placeholder="Enter new password" 
            style="
              padding: 12px 15px;
              margin-bottom: 18px;
              border: 2px solid rgba(200, 150, 255, 0.4);
              border-radius: 10px;
              font-size: 14px;
              background-color: rgba(255, 255, 255, 0.9);
              color: #333;
              transition: all 0.3s ease;
              box-shadow: 0 4px 10px rgba(157, 78, 221, 0.2);
            "
            required
          />

          <!-- Confirm Password Input -->
          <label for="confirmPassword" style="
            margin-bottom: 8px;
            font-weight: bold;
            color: #E0D4FF;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Confirm New Password:</label>
          <input 
            type="password" 
            id="confirmPassword" 
            placeholder="Confirm new password" 
            style="
              padding: 12px 15px;
              margin-bottom: 25px;
              border: 2px solid rgba(200, 150, 255, 0.4);
              border-radius: 10px;
              font-size: 14px;
              background-color: rgba(255, 255, 255, 0.9);
              color: #333;
              transition: all 0.3s ease;
              box-shadow: 0 4px 10px rgba(157, 78, 221, 0.2);
            "
            required
          />

          <!-- Submit Button -->
          <button 
            id="changePasswordSubmitBtn"
            type="submit" 
            style="
              padding: 14px;
              background: linear-gradient(135deg, #9D4EDD 0%, #7209B7 100%);
              color: white;
              border: none;
              border-radius: 10px;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              transition: all 0.3s ease;
              text-transform: uppercase;
              letter-spacing: 1px;
              box-shadow: 0 6px 20px rgba(157, 78, 221, 0.4);
            "
          >Update Password</button>
        </form>
      </div>
    </div>
  `

  document.body.insertAdjacentHTML('beforeend', modalHTML)

  const modal = document.getElementById('changePasswordModal')
  const closeBtn = document.getElementById('closeChangePasswordModal')
  const form = document.getElementById('changePasswordForm')
  const currentPasswordInput = document.getElementById('currentPassword')
  const newPasswordInput = document.getElementById('newPassword')
  const confirmPasswordInput = document.getElementById('confirmPassword')
  const submitBtn = document.getElementById('changePasswordSubmitBtn')

  const closeModal = () => {
    modal.style.animation = 'slideInUp 0.4s ease-out reverse'
    setTimeout(() => {
      modal.remove()
    }, 400)
  }

  closeBtn.addEventListener('click', closeModal)

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal()
    }
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const currentPassword = currentPasswordInput.value
    const newPassword = newPasswordInput.value
    const confirmPassword = confirmPasswordInput.value

    // Validation
    if (!currentPassword.trim()) {
      alert('⚠️ Please enter your current password')
      return
    }

    if (!newPassword.trim()) {
      alert('⚠️ Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      alert('⚠️ New password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('⚠️ New passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      alert('⚠️ New password must be different from current password')
      return
    }

    try {
      const token = localStorage.getItem('token')

      if (!token) {
        alert('⚠️ You must be logged in')
        closeModal()
        return
      }

      submitBtn.disabled = true
      submitBtn.textContent = '🔄 Updating...'

      const response = await fetch('https://slambook-q47h.onrender.com/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(`⚠️ ${data.message || 'Failed to change password'}`)
        submitBtn.disabled = false
        submitBtn.textContent = 'Update Password'
        return
      }

      alert('✨ Password changed successfully!')
      console.log('✅ Password updated:', data.message)

      submitBtn.disabled = false
      submitBtn.textContent = 'Update Password'
      closeModal()
    } catch (error) {
      console.error('❌ Error:', error)
      alert(`❌ Error: ${error.message}`)
      submitBtn.disabled = false
      submitBtn.textContent = 'Update Password'
    }
  })

  currentPasswordInput.focus()
  console.log('🔑 Change password modal opened')
}


  async downloadMessagesPDF() {
    try {
      const token = localStorage.getItem('token')

      if (!token) {
        alert('⚠️ You must be logged in to download PDF')
        return
      }

      console.log('📥 Starting PDF download...')

      const response = await fetch('https://slambook-q47h.onrender.com/api/messages/download-pdf', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      console.log('📊 Response status:', response.status)

      if (!response.ok) {
        try {
          const data = await response.json()
          alert(`⚠️ ${data.message || 'Failed to download PDF'}`)
        } catch (e) {
          alert(`⚠️ Failed to download PDF (Status: ${response.status})`)
        }
        return
      }

      // Get the blob
      const blob = await response.blob()

      if (blob.size === 0) {
        alert('⚠️ PDF is empty')
        return
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'messages.pdf'
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }

      // Create a temporary URL
      const url = window.URL.createObjectURL(blob)

      // Create a temporary link element
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)

      // Trigger download
      link.click()

      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)

      console.log(`✅ PDF downloaded: ${filename}`)
      alert('✨ PDF downloaded successfully!')
    } catch (error) {
      console.error('❌ Error downloading PDF:', error)
      alert(`❌ Error downloading PDF: ${error.message}`)
    }
  }


  loadFootball() {
    const loader = new GLTFLoader()
    
    loader.load(
      '/src/assets/models/football.glb',
      (gltf) => {
        const footballModel = gltf.scene
        
        footballModel.position.copy(this.footballPosition)
        footballModel.scale.set(0.001, 0.001, 0.001)
        footballModel.rotation.y = 0
        
        footballModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            child.frustumCulled = false
            
            if (child.material) {
              child.material.needsUpdate = true
            }
          }
        })
        
        this.scene.add(footballModel)
        this.footballModel = footballModel
        console.log('🏈 Football loaded')
        
        this.setupFootballClickHandler()
      },
      (progress) => {
        console.log(`🏈 Football loading: ${Math.round((progress.loaded / progress.total) * 100)}%`)
      },
      (error) => {
        console.error('🏈 Football load error:', error)
      }
    )
  }

  setupFootballClickHandler() {
    if (this.footballClickHandlerSetup) {
      console.log('🏈 Football click handler already setup')
      return
    }

    this.boundFootballClickHandler = (event) => {
      this.handleFootballClick(event)
    }
    
    window.addEventListener('click', this.boundFootballClickHandler)
    this.footballClickHandlerSetup = true
    console.log('🏈 Football click handler setup complete')
  }

  handleFootballClick(event) {
    if (!this.footballModel) {
      console.log('⚠️ Football model not ready')
      return
    }

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    
    raycaster.setFromCamera(mouse, this.sceneManager.camera)
    const intersects = raycaster.intersectObjects(this.footballModel.children, true)
    
    if (intersects.length > 0) {
      console.log('🏈 Football clicked! Kicking it...')
      this.kickFootball()
    }
  }

  kickFootball() {
    // Reset bounces
    this.footballBounceCount = 0
    this.footballIsMoving = true

    // Random direction within bounds
    const randomAngle = Math.random() * Math.PI * 2
    const randomForce = 0.15 + Math.random() * 0.15

    this.footballVelocity.x = Math.cos(randomAngle) * randomForce
    this.footballVelocity.y = 0.3 + Math.random() * 0.2 // Initial upward velocity
    this.footballVelocity.z = Math.sin(randomAngle) * randomForce

    console.log(`🏈 Football kicked! Velocity:`, this.footballVelocity)
  }

  updateFootball(deltaTime) {
    if (!this.footballModel || !this.footballIsMoving) {
      return
    }

    const roomBounds = 7.5
    const groundLevel = 0.35

    // Apply gravity
    this.footballVelocity.y += this.footballGravity

    // Apply friction
    this.footballVelocity.x *= this.footballFriction
    this.footballVelocity.z *= this.footballFriction

    // Update position
    this.footballModel.position.x += this.footballVelocity.x
    this.footballModel.position.y += this.footballVelocity.y
    this.footballModel.position.z += this.footballVelocity.z

    // Add rotation for visual effect
    const rotationAxis = new THREE.Vector3(
      this.footballVelocity.z,
      0,
      -this.footballVelocity.x
    ).normalize()
    const rotationAngle = this.footballVelocity.length() * 0.5
    
    const quaternion = new THREE.Quaternion()
    quaternion.setFromAxisAngle(rotationAxis, rotationAngle)
    this.footballModel.quaternion.multiplyQuaternions(quaternion, this.footballModel.quaternion)

    // Bounce off walls and floor
    let hasBounced = false

    // Floor bounce
    if (this.footballModel.position.y <= groundLevel && this.footballVelocity.y < 0) {
      this.footballModel.position.y = groundLevel
      this.footballVelocity.y *= -this.footballBounceDamping
      this.footballBounceCount++
      hasBounced = true

      // Add some side spin after bounce
      this.footballVelocity.x *= 0.95
      this.footballVelocity.z *= 0.95

      console.log(`🏈 Bounce ${this.footballBounceCount}`)
    }

    // Walls bounce - X axis
    if (Math.abs(this.footballModel.position.x) > roomBounds) {
      this.footballModel.position.x = Math.sign(this.footballModel.position.x) * roomBounds
      this.footballVelocity.x *= -this.footballBounceDamping
      hasBounced = true
      this.footballBounceCount++
      console.log(`🏈 Wall bounce X - Total: ${this.footballBounceCount}`)
    }

    // Walls bounce - Z axis
    if (Math.abs(this.footballModel.position.z) > roomBounds) {
      this.footballModel.position.z = Math.sign(this.footballModel.position.z) * roomBounds
      this.footballVelocity.z *= -this.footballBounceDamping
      hasBounced = true
      this.footballBounceCount++
      console.log(`🏈 Wall bounce Z - Total: ${this.footballBounceCount}`)
    }

    // Ceiling bounce
    if (this.footballModel.position.y > 7.5) {
      this.footballModel.position.y = 7.5
      this.footballVelocity.y *= -this.footballBounceDamping
      this.footballBounceCount++
      hasBounced = true
      console.log(`🏈 Ceiling bounce - Total: ${this.footballBounceCount}`)
    }

    // Check if ball should stop
    const velocityMagnitude = this.footballVelocity.length()
    const isBasicallyStill = velocityMagnitude < 0.01 && this.footballModel.position.y <= groundLevel + 0.05

    if (isBasicallyStill || this.footballBounceCount >= this.footballMaxBounces) {
      this.footballIsMoving = false
      this.footballModel.position.y = groundLevel
      this.footballVelocity.set(0, 0, 0)
      console.log(`🏈 Football stopped after ${this.footballBounceCount} bounces`)
    }
  }

  // ...existing methods...

  update(deltaTime) {
    if (this.postboxMixer) {
      this.postboxMixer.update(deltaTime)
    }
    
    if (this.scrollMixer) {
      this.scrollMixer.update(deltaTime)
    }

    if (this.giftBoxMixer) {
      this.giftBoxMixer.update(deltaTime)
    }

    // Update football physics
    this.updateFootball(deltaTime)
  }


}