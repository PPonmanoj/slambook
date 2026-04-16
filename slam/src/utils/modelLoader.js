import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const gltfLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()

export const loadModel = (path) => {
  return new Promise((resolve, reject) => {
    gltfLoader.load(path, resolve, undefined, reject)
  })
}

export const loadTexture = (path) => {
  return new Promise((resolve, reject) => {
    textureLoader.load(path, resolve, undefined, reject)
  })
}

export const disposeModel = (model) => {
  model.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => mat.dispose())
      } else {
        child.material.dispose()
      }
    }
  })
}