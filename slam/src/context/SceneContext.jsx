import React, { createContext, useState } from 'react'

export const SceneContext = createContext()

export const SceneProvider = ({ children }) => {
  const [currentScene, setCurrentScene] = useState('door')
  const [sceneReady, setSceneReady] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  return (
    <SceneContext.Provider 
      value={{ 
        currentScene, 
        setCurrentScene, 
        sceneReady, 
        setSceneReady,
        isTransitioning,
        setIsTransitioning
      }}
    >
      {children}
    </SceneContext.Provider>
  )
}