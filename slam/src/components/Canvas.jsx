import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { SceneManager } from '../utils/sceneManager'
import { DoorScene } from '../scenes/DoorScene'
import { ClassroomScene } from '../scenes/ClassroomScene'

export const Canvas = () => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const currentSceneRef = useRef(null)
  const clockRef = useRef(new THREE.Clock())
  const keysPressed = useRef({})
  const skyboxRef = useRef(null)
  const skyboxTextureRef = useRef(null)
  const animationTimeRef = useRef(0)
  const [currentScene, setCurrentScene] = useState('door')
  const [showJoystick, setShowJoystick] = useState(false)
  
  // Joystick state
  const joystickRef = useRef({
    active: false,
    x: 0,
    y: 0,
    centerX: 0,
    centerY: 0,
    maxDistance: 50
  })
  
  // First-person camera controls
  const cameraControls = useRef({
    pitch: 0,
    yaw: 0,
    isDragging: false,
    isTouch: false,
    previousMousePosition: { x: 0, y: 0 }
  })

  // Movement input
  const movementInput = useRef({
    x: 0,
    y: 0
  })

  const createAnimatedTexture = (time) => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    // Create purple gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#1a0033')
    gradient.addColorStop(0.3, '#4d0099')
    gradient.addColorStop(0.7, '#9933ff')
    gradient.addColorStop(1, '#cc66ff')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)
    
    // Animate bubble 1
    const bubble1Y = 100 + Math.sin(time * 0.5) * 50
    const bubble1Size = 80 + Math.cos(time * 0.7) * 15
    ctx.fillStyle = 'rgba(255, 200, 255, 0.3)'
    ctx.beginPath()
    ctx.arc(100, bubble1Y, bubble1Size, 0, Math.PI * 2)
    ctx.fill()
    
    // Animate bubble 2
    const bubble2Y = 300 + Math.sin(time * 0.4 + 2) * 60
    const bubble2Size = 120 + Math.cos(time * 0.6 + 2) * 20
    ctx.fillStyle = 'rgba(200, 150, 255, 0.2)'
    ctx.beginPath()
    ctx.arc(400, bubble2Y, bubble2Size, 0, Math.PI * 2)
    ctx.fill()
    
    // Additional animated bubble
    const bubble3X = 256 + Math.sin(time * 0.3) * 100
    const bubble3Y = 256 + Math.cos(time * 0.35) * 100
    const bubble3Size = 50 + Math.sin(time * 0.8) * 20
    ctx.fillStyle = 'rgba(220, 180, 255, 0.25)'
    ctx.beginPath()
    ctx.arc(bubble3X, bubble3Y, bubble3Size, 0, Math.PI * 2)
    ctx.fill()
    
    return new THREE.CanvasTexture(canvas)
  }

  const createSkybox = (scene, time) => {
    if (skyboxRef.current) {
      return
    }

    const texture = createAnimatedTexture(time)
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearFilter
    skyboxTextureRef.current = texture

    const geometry = new THREE.BoxGeometry(500, 500, 500)
    
    const materials = []
    for (let i = 0; i < 6; i++) {
      materials.push(
        new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide
        })
      )
    }

    const skybox = new THREE.Mesh(geometry, materials)
    scene.add(skybox)
    skyboxRef.current = skybox
    console.log('✅ Skybox created')
  }

  const updateSkyboxTexture = (time) => {
    if (!skyboxRef.current) return

    if (Math.floor(time * 60) % 6 === 0) {
      const newTexture = createAnimatedTexture(time)
      
      if (skyboxRef.current.material && Array.isArray(skyboxRef.current.material)) {
        skyboxRef.current.material.forEach(mat => {
          mat.map = newTexture
          mat.needsUpdate = true
        })
      }
    }
  }

  const updateCameraRotation = (camera, pitch, yaw) => {
    // Limit pitch to prevent flipping
    const maxPitch = Math.PI / 2.5
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch))
    
    // Create rotation matrix
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ')
    camera.quaternion.setFromEuler(euler)
  }

  const handleSceneChange = (sceneName) => {
    console.log(`🎬 Switching to ${sceneName} scene`)
    setCurrentScene(sceneName)
  }

  const initScene = (sceneManager, sceneName) => {
    console.log(`🎬 Initializing ${sceneName} scene`)
    
    if (sceneName === 'door') {
      const doorScene = new DoorScene(
        sceneRef.current,
        sceneManager,
        handleSceneChange
      )
      currentSceneRef.current = doorScene
    } else if (sceneName === 'classroom') {
      const classroomScene = new ClassroomScene(
        sceneRef.current,
        sceneManager
      )
      classroomScene.setup()
      currentSceneRef.current = classroomScene
    }
  }

  // Joystick handlers
  const handleJoystickStart = (e) => {
    const touch = e.touches[0]
    const joystickElement = e.currentTarget
    const rect = joystickElement.getBoundingClientRect()
    
    joystickRef.current.centerX = rect.width / 2
    joystickRef.current.centerY = rect.height / 2
    joystickRef.current.active = true

    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    handleJoystickMove(x, y, rect)
  }

  const handleJoystickMove = (x, y, rect) => {
    if (!joystickRef.current.active) return

    const centerX = joystickRef.current.centerX
    const centerY = joystickRef.current.centerY
    
    let deltaX = x - centerX
    let deltaY = y - centerY
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const maxDist = joystickRef.current.maxDistance
    
    if (distance > maxDist) {
      const angle = Math.atan2(deltaY, deltaX)
      deltaX = Math.cos(angle) * maxDist
      deltaY = Math.sin(angle) * maxDist
    }
    
    joystickRef.current.x = deltaX
    joystickRef.current.y = deltaY
    
    // FIXED: Inverted Y axis and swapped left/right
    // Positive Y should move forward, negative Y backward
    movementInput.current.x = -deltaX / maxDist  // Inverted X
    movementInput.current.y = -deltaY / maxDist  // Inverted Y
  }

  const handleJoystickTouchMove = (e) => {
    if (!joystickRef.current.active) return
    
    const touch = e.touches[0]
    const joystickElement = e.currentTarget
    const rect = joystickElement.getBoundingClientRect()
    
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    handleJoystickMove(x, y, rect)
  }

  const handleJoystickEnd = () => {
    joystickRef.current.active = false
    joystickRef.current.x = 0
    joystickRef.current.y = 0
    movementInput.current.x = 0
    movementInput.current.y = 0
  }

  const initThreeJs = () => {
    if (!containerRef.current) return

    const width = window.innerWidth
    const height = window.innerHeight

    // Show joystick on mobile
    if (width <= 768) {
      setShowJoystick(true)
    }

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(0, 5, 5)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    console.log('✅ Renderer created')

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(10, 10, 10)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0xffffff, 1.2)
    pointLight.position.set(-5, 5, 5)
    scene.add(pointLight)

    const pointLight2 = new THREE.PointLight(0xff66cc, 0.6)
    pointLight2.position.set(5, 3, 3)
    scene.add(pointLight2)

    // Create skybox
    createSkybox(scene, 0)

    // Scene Manager
    const sceneManager = new SceneManager(scene, camera, renderer)

    // Initialize door scene
    initScene(sceneManager, 'door')

    // Keyboard controls
    const handleKeyDown = (event) => {
      keysPressed.current[event.key.toLowerCase()] = true
    }

    const handleKeyUp = (event) => {
      keysPressed.current[event.key.toLowerCase()] = false
    }

    // Mouse controls for first-person camera
    const handleMouseDown = (event) => {
      // Prevent camera rotation if clicking on UI elements
      if (event.target !== renderer.domElement) {
        return
      }
      
      cameraControls.current.isDragging = true
      cameraControls.current.isTouch = false
      cameraControls.current.previousMousePosition = { x: event.clientX, y: event.clientY }
    }

    const handleMouseMove = (event) => {
      if (cameraControls.current.isDragging && !cameraControls.current.isTouch) {
        const deltaX = event.clientX - cameraControls.current.previousMousePosition.x
        const deltaY = event.clientY - cameraControls.current.previousMousePosition.y

        const rotationSpeed = 0.005

        cameraControls.current.yaw -= deltaX * rotationSpeed
        cameraControls.current.pitch -= deltaY * rotationSpeed

        cameraControls.current.previousMousePosition = { x: event.clientX, y: event.clientY }
      }
    }

    const handleMouseUp = () => {
      cameraControls.current.isDragging = false
    }

    // Touch controls for mobile camera rotation
    const handleTouchStart = (event) => {
      if (event.touches.length === 1) {
        cameraControls.current.isDragging = true
        cameraControls.current.isTouch = true
        cameraControls.current.previousMousePosition = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        }
      }
    }

    const handleTouchMove = (event) => {
      if (cameraControls.current.isDragging && cameraControls.current.isTouch && event.touches.length === 1) {
        const deltaX = event.touches[0].clientX - cameraControls.current.previousMousePosition.x
        const deltaY = event.touches[0].clientY - cameraControls.current.previousMousePosition.y

        const rotationSpeed = 0.005

        cameraControls.current.yaw -= deltaX * rotationSpeed
        cameraControls.current.pitch -= deltaY * rotationSpeed

        cameraControls.current.previousMousePosition = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        }
      }
    }

    const handleTouchEnd = (event) => {
      if (event.touches.length === 0) {
        cameraControls.current.isDragging = false
        cameraControls.current.isTouch = false
      }
    }

    const handleTouchCancel = () => {
      cameraControls.current.isDragging = false
      cameraControls.current.isTouch = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: false })
    window.addEventListener('touchcancel', handleTouchCancel, { passive: false })

    // Handle resize
    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
      
      // Show/hide joystick based on screen size
      if (newWidth <= 768) {
        setShowJoystick(true)
      } else {
        setShowJoystick(false)
      }
    }

    window.addEventListener('resize', handleResize)

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      
      const deltaTime = clockRef.current.getDelta()
      animationTimeRef.current += deltaTime
      
      // Update skybox texture animation
      updateSkyboxTexture(animationTimeRef.current)
      
      // Update camera rotation
      updateCameraRotation(camera, cameraControls.current.pitch, cameraControls.current.yaw)
      
      // Handle movement from keyboard + joystick
      const moveSpeed = 0.05
      const groundHeight = 1
      const moveDirection = new THREE.Vector3(0, 0, 0)
      
      // Get camera direction (where it's looking)
      const cameraDirection = new THREE.Vector3(0, 0, -1)
      cameraDirection.applyQuaternion(camera.quaternion)
      cameraDirection.y = 0
      cameraDirection.normalize()
      
      // Get camera right vector
      const rightVector = new THREE.Vector3()
      rightVector.crossVectors(camera.up, cameraDirection).normalize()
      
      // Forward/backward from keyboard
      if (keysPressed.current['arrowup'] || keysPressed.current['w']) {
        moveDirection.addScaledVector(cameraDirection, moveSpeed)
      }
      if (keysPressed.current['arrowdown'] || keysPressed.current['s']) {
        moveDirection.addScaledVector(cameraDirection, -moveSpeed)
      }
      
      // Left/right from keyboard
      if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
        moveDirection.addScaledVector(rightVector, -moveSpeed)
      }
      if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
        moveDirection.addScaledVector(rightVector, moveSpeed)
      }

      // Forward/backward from joystick
      if (movementInput.current.y !== 0) {
        moveDirection.addScaledVector(cameraDirection, movementInput.current.y * moveSpeed)
      }

      // Left/right from joystick
      if (movementInput.current.x !== 0) {
        moveDirection.addScaledVector(rightVector, movementInput.current.x * moveSpeed)
      }
      
      // Apply movement with boundary collision
      const newX = camera.position.x + moveDirection.x
      const newZ = camera.position.z + moveDirection.z
      
      // Classroom boundaries (room is 15x15, centered at 0,0)
      const roomBounds = 7.4  // Slightly less than 7.5 to keep camera away from walls
      const cameraRadius = 0.5 // Buffer zone around camera
      
      // Check X boundary
      if (newX > roomBounds - cameraRadius) {
        camera.position.x = roomBounds - cameraRadius
      } else if (newX < -roomBounds + cameraRadius) {
        camera.position.x = -roomBounds + cameraRadius
      } else {
        camera.position.x = newX
      }
      
      // Check Z boundary
      if (newZ > roomBounds - cameraRadius) {
        camera.position.z = roomBounds - cameraRadius
      } else if (newZ < -roomBounds + cameraRadius) {
        camera.position.z = -roomBounds + cameraRadius
      } else {
        camera.position.z = newZ
      }
      
      camera.position.y = groundHeight
      
      // Update current scene
      if (currentSceneRef.current && currentSceneRef.current.update) {
        currentSceneRef.current.update(deltaTime)
      }
      
      renderer.render(scene, camera)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchCancel)
    }
  }

  useEffect(() => {
    initThreeJs()

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (currentSceneRef.current && currentScene !== 'door') {
      console.log(`🎬 Scene state changed to: ${currentScene}`)
      initScene(new SceneManager(sceneRef.current, cameraRef.current, rendererRef.current), currentScene)
    }
  }, [currentScene])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {/* Mobile Joystick */}
      {showJoystick && (
        <div
          style={{
            position: 'fixed',
            bottom: 130,
            left: 30,
            width: 140,
            height: 140,
            backgroundColor: 'rgba(77, 0, 153, 0.4)',
            border: '3px solid rgba(157, 78, 221, 0.6)',
            borderRadius: '50%',
            zIndex: 100,
            touchAction: 'none',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(157, 78, 221, 0.5), inset 0 0 20px rgba(157, 78, 221, 0.2)',
          }}
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
        >
          {/* Joystick stick */}
          <div
            style={{
              width: 50,
              height: 50,
              backgroundColor: 'rgba(157, 78, 221, 0.8)',
              border: '2px solid rgba(200, 150, 255, 0.8)',
              borderRadius: '50%',
              position: 'absolute',
              transform: `translate(${joystickRef.current.x}px, ${joystickRef.current.y}px)`,
              transition: joystickRef.current.active ? 'none' : 'all 0.3s ease',
              pointerEvents: 'none',
              boxShadow: '0 0 20px rgba(157, 78, 221, 0.6), inset 0 0 10px rgba(255, 200, 255, 0.4)',
            }}
          />
          
          {/* Direction indicators */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
              pointerEvents: 'none',
              fontSize: '11px',
              color: 'rgba(200, 150, 255, 0.6)',
              fontWeight: 'bold',
            }}
          >
            <div>↑</div>
            <div>↓</div>
          </div>
          
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              pointerEvents: 'none',
              fontSize: '11px',
              color: 'rgba(200, 150, 255, 0.6)',
              fontWeight: 'bold',
            }}
          >
            <div>←</div>
            <div>→</div>
          </div>
        </div>
      )}
    </div>
  )
}