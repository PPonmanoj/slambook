import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export const useRaycaster = (camera, scene, onIntersection) => {
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())

  useEffect(() => {
    const onMouseClick = (event) => {
      const width = window.innerWidth
      const height = window.innerHeight

      mouseRef.current.x = (event.clientX / width) * 2 - 1
      mouseRef.current.y = -(event.clientY / height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const intersects = raycasterRef.current.intersectObjects(scene.children, true)

      intersects.forEach((intersection) => {
        if (intersection.object.userData.clickable) {
          onIntersection(intersection)
        }
      })
    }

    window.addEventListener('click', onMouseClick)
    return () => window.removeEventListener('click', onMouseClick)
  }, [camera, scene, onIntersection])

  return raycasterRef
}