import * as THREE from 'three'

export class SceneManager {
  constructor(scene, camera, renderer) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.activeScene = null
  }

  // Camera transition with easing
  transitionCamera(targetPosition, targetLookAt, duration = 2000, easing = 'easeInOutCubic') {
    return new Promise((resolve) => {
      const startPos = this.camera.position.clone()
      const startTime = Date.now()

      const easeFunction = this.getEasingFunction(easing)

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easeFunction(progress)

        this.camera.position.lerpVectors(startPos, targetPosition, easedProgress)
        this.camera.lookAt(targetLookAt)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          this.camera.position.copy(targetPosition)
          this.camera.lookAt(targetLookAt)
          resolve()
        }
      }

      animate()
    })
  }

  // Fade out scene
  fadeOutScene(duration = 1000) {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const canvas = this.renderer.domElement

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        canvas.style.opacity = 1 - progress

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          canvas.style.opacity = 0
          resolve()
        }
      }

      animate()
    })
  }

  // Fade in scene
  fadeInScene(duration = 1000) {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const canvas = this.renderer.domElement
      canvas.style.opacity = 0

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        canvas.style.opacity = progress

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          canvas.style.opacity = 1
          resolve()
        }
      }

      animate()
    })
  }

  // Clear scene
  clearScene() {
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0]
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose())
        } else {
          child.material.dispose()
        }
      }
      this.scene.remove(child)
    }
  }

  getEasingFunction(easing) {
    const easings = {
      linear: (t) => t,
      easeInCubic: (t) => t * t * t,
      easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
      easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    }
    return easings[easing] || easings.linear
  }
}