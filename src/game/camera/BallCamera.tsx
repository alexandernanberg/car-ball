import {useFrame, useThree} from '@react-three/fiber'
import type {Entity} from 'koota'
import {useWorld} from 'koota/react'
import {useLayoutEffect, useRef, useEffect} from 'react'
import {BallCameraConfig, BallCameraState, IsBallCamera} from './traits'

/**
 * Ball camera component - creates camera entity and syncs to Three.js camera
 */
export function BallCamera() {
  const world = useWorld()
  const {camera} = useThree()
  const entityRef = useRef<Entity | null>(null)

  // Create camera entity
  useLayoutEffect(() => {
    const entity = world.spawn(IsBallCamera, BallCameraConfig, BallCameraState)
    entityRef.current = entity

    return () => {
      if (entity.isAlive()) {
        entity.destroy()
      }
    }
  }, [world])

  // Handle ball cam toggle (Y key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyY' && entityRef.current) {
        const config = entityRef.current.get(BallCameraConfig)!
        entityRef.current.set(BallCameraConfig, {
          ...config,
          enabled: !config.enabled,
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Sync camera state to Three.js camera
  useFrame(() => {
    const entity = entityRef.current
    if (!entity) return

    const state = entity.get(BallCameraState)!
    const config = entity.get(BallCameraConfig)!

    // Update camera position
    camera.position.set(state.positionX, state.positionY, state.positionZ)

    // Look at target
    camera.lookAt(state.lookAtX, state.lookAtY, state.lookAtZ)

    // Update FOV if it changed
    if ('fov' in camera && (camera as any).fov !== config.fov) {
      ;(camera as any).fov = config.fov
      ;(camera as any).updateProjectionMatrix()
    }
  })

  return null
}
