import React, { useEffect } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export class DoorScene {
  constructor(scene, sceneManager, onSceneChange) {
    this.scene = scene
    this.sceneManager = sceneManager
    this.onSceneChange = onSceneChange  // Callback for scene change
    this.doorModel = null
    this.mixer = null
    this.actions = []
    this.isOpening = false
    this.isZoomingIn = false
    this.initialPosition = new THREE.Vector3(2, -3, 0)
    this.initialCameraPos = new THREE.Vector3(0, 1, 5)
    this.floatTime = 0
    this.zoomTime = 0
    console.log('🚪 DoorScene constructor called')
    this.setup()
  }

  setup() {
    console.log('🚪 DoorScene setup starting')
    
    // Set camera position
    this.sceneManager.camera.position.set(0, 1, 5)
    this.sceneManager.camera.lookAt(0, 0, 0)
    this.initialCameraPos.copy(this.sceneManager.camera.position)
    console.log('🚪 Camera positioned')
    
    // Load door model
    this.loadDoorModel()

    // Setup click handler
    this.setupClickHandler()
  }

  loadDoorModel() {
    const loader = new GLTFLoader()
    
    loader.load(
      '/src/assets/models/door.glb',
      (gltf) => {
        console.log('🚪 Door model loaded successfully!')
        
        const doorModel = gltf.scene
        console.log('🚪 Door scene:', doorModel)
        console.log('🚪 Animations:', gltf.animations)
        
        // Set initial position
        doorModel.position.copy(this.initialPosition)
        doorModel.scale.set(0.01, 0.01, 0.01)
        
        // Setup animation mixer
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(doorModel)
          console.log(`🚪 Animation mixer created with ${gltf.animations.length} animations`)
          
          // Create actions for each animation
          gltf.animations.forEach((clip, index) => {
            console.log(`🚪 Animation ${index}: ${clip.name} (duration: ${clip.duration}s)`)
            const action = this.mixer.clipAction(clip)
            action.clampWhenFinished = true
            action.loop = THREE.LoopOnce
            this.actions.push(action)
          })
        }
        
        // Process all meshes
        let meshCount = 0
        doorModel.traverse((child) => {
          if (child.isMesh) {
            meshCount++
            
            if (child.material) {
              child.material.metalness = 0.3
              child.material.roughness = 0.6
              child.material.side = THREE.DoubleSide
              child.material.transparent = false
              child.material.opacity = 1
              child.material.needsUpdate = true
            }
            
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                mat.metalness = 0.3
                mat.roughness = 0.6
                mat.side = THREE.DoubleSide
                mat.transparent = false
                mat.opacity = 1
                mat.needsUpdate = true
              })
            }
            
            child.castShadow = true
            child.receiveShadow = true
            child.userData.clickable = true
            child.userData.type = 'door'
          }
        })
        
        console.log(`🚪 Total meshes found: ${meshCount}`)
        
        // Add to scene
        this.scene.add(doorModel)
        this.doorModel = doorModel
        
        console.log('🚪 Door is static, waiting for click...')
        console.log('✅ Door added to scene!')
      },
      (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100)
        console.log(`🚪 Loading: ${percent}%`)
      },
      (error) => {
        console.error('🚪 Door load error:', error)
        this.createTestSphere()
      }
    )
  }

  setupClickHandler() {
    window.addEventListener('click', (event) => {
      this.handleDoorClick(event)
    })
  }

  handleDoorClick(event) {
    if (this.isOpening || !this.doorModel) return

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    
    raycaster.setFromCamera(mouse, this.sceneManager.camera)
    const intersects = raycaster.intersectObjects(this.doorModel.children, true)
    
    if (intersects.length > 0) {
      console.log('🚪 Door clicked!')
      this.openDoor()
    }
  }

  openDoor() {
    if (this.isOpening || !this.mixer || this.actions.length < 1) {
      console.log('🚪 Cannot open door - conditions not met')
      return
    }

    this.isOpening = true
    this.isZoomingIn = true
    this.zoomTime = 0
    console.log('🚪 Opening door...')

    const openAction = this.actions[0]
    openAction.reset()
    openAction.clampWhenFinished = true
    openAction.loop = THREE.LoopOnce
    openAction.play()

    console.log('🚪 Open animation playing (once)')
    console.log('🚪 Starting zoom-in effect...')

    // Get animation duration
    const animationDuration = openAction.getClip().duration * 1000
    const zoomDuration = animationDuration  // 2 seconds zoom
    const totalDuration = Math.max(animationDuration, zoomDuration)
    
    // Navigate to classroom after zoom completes
    setTimeout(() => {
      console.log('🚪 Zoom complete, switching to classroom')
      this.isZoomingIn = false
      if (this.onSceneChange) {
        this.onSceneChange('classroom')  // Call the callback with scene name
      }
    }, totalDuration + 500)  // Add 500ms buffer
  }

  // Update method to be called from Canvas animation loop
  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime)
    }

    // Zoom-in effect
    if (this.isZoomingIn) {
      this.zoomTime += deltaTime
      const zoomDuration = 2  // 2 seconds
      
      // Clamp progress between 0 and 1
      const progress = Math.min(this.zoomTime / zoomDuration, 1)
      
      // Easing function for smooth zoom (ease-in-out cubic)
      const easeProgress = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
      
      // Get door center position
      const doorWorldPos = new THREE.Vector3()
      if (this.doorModel) {
        // Get bounding box to find center
        const box = new THREE.Box3().setFromObject(this.doorModel)
        box.getCenter(doorWorldPos)
      }
      
      console.log(`🚪 Door center position: ${doorWorldPos.x.toFixed(2)}, ${doorWorldPos.y.toFixed(2)}, ${doorWorldPos.z.toFixed(2)}`)
      
      // Target position: zoom towards door center
      const direction = doorWorldPos.clone().sub(this.initialCameraPos).normalize()
      const targetPos = doorWorldPos.clone().sub(direction.multiplyScalar(1.5))
      
      // Interpolate camera position towards door
      this.sceneManager.camera.position.lerpVectors(
        this.initialCameraPos,
        targetPos,
        easeProgress
      )
      
      // Always look at door center
      this.sceneManager.camera.lookAt(doorWorldPos)
      
      console.log(`🚪 Zooming... ${Math.round(progress * 100)}%`)
    }

    // Floating bouncing effect
    if (this.doorModel && !this.isOpening) {
      this.floatTime += deltaTime
      
      // Sine wave for smooth bobbing
      const bounceHeight = Math.sin(this.floatTime * 2) * 0.3
      const rotation = Math.sin(this.floatTime * 0.5) * 0.1
      
      this.doorModel.position.y = this.initialPosition.y + bounceHeight
      this.doorModel.rotation.z = rotation
    }
  }

  createTestSphere() {
    console.log('🔴 Creating fallback sphere')
    
    const geometry = new THREE.SphereGeometry(1, 32, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide
    })
    
    const sphere = new THREE.Mesh(geometry, material)
    sphere.castShadow = true
    sphere.receiveShadow = true
    sphere.userData.clickable = true
    sphere.userData.type = 'door'
    
    this.scene.add(sphere)
    this.doorModel = sphere
    console.log('✅ Fallback sphere added')
  }
}