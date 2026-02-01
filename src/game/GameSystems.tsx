import {useWorld} from 'koota/react'
import {useCallback} from 'react'
import {usePhysicsUpdate} from '~/ecs/physics'
import {vehiclePhysicsSystem} from './vehicle'
import {ballPhysicsSystem} from './ball'
import {matchSystem} from './match'
import {ballCameraSystem} from './camera'

/**
 * Game systems component - registers all game systems to run during physics step
 */
export function GameSystems() {
  const world = useWorld()

  // Early stage systems (before physics step) - apply forces/controls
  const earlyUpdate = useCallback(() => {
    vehiclePhysicsSystem(world)
  }, [world])

  // Late stage systems (after physics step) - game logic
  const lateUpdate = useCallback(() => {
    ballPhysicsSystem(world)
    matchSystem(world)
    ballCameraSystem(world)
  }, [world])

  usePhysicsUpdate(earlyUpdate, 'early')
  usePhysicsUpdate(lateUpdate, 'late')

  return null
}
