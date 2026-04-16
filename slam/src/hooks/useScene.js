import { useContext } from 'react'
import { SceneContext } from '../context/SceneContext'

export const useScene = () => {
  return useContext(SceneContext)
}