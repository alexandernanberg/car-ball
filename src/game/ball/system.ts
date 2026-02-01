import type {World} from 'koota'
import {RigidBodyRef} from '~/ecs/physics'
import {IsGameBall, BallState, BallConfig} from './traits'

const FIXED_TIMESTEP = 1 / 60

/**
 * Ball physics system - runs during physics step
 * Handles speed capping and state tracking
 */
export function ballPhysicsSystem(world: World) {
  for (const entity of world.query(
    IsGameBall,
    BallState,
    BallConfig,
    RigidBodyRef,
  )) {
    const state = entity.get(BallState)!
    const config = entity.get(BallConfig)!
    const bodyRef = entity.get(RigidBodyRef)!

    if (!bodyRef.body) continue

    const body = bodyRef.body
    const linvel = body.linvel()

    // Calculate current speed
    const speed = Math.sqrt(
      linvel.x * linvel.x + linvel.y * linvel.y + linvel.z * linvel.z,
    )

    // Cap max speed
    if (speed > config.maxSpeed) {
      const scale = config.maxSpeed / speed
      body.setLinvel(
        {
          x: linvel.x * scale,
          y: linvel.y * scale,
          z: linvel.z * scale,
        },
        true,
      )
    }

    // Update state
    entity.set(BallState, {
      ...state,
      speed,
      timeSinceTouch: state.timeSinceTouch + FIXED_TIMESTEP,
    })
  }
}

/**
 * Reset ball to center position
 */
export function resetBall(
  world: World,
  position: {x: number; y: number; z: number} = {x: 0, y: 2, z: 0},
) {
  for (const entity of world.query(IsGameBall, RigidBodyRef)) {
    const bodyRef = entity.get(RigidBodyRef)!
    if (!bodyRef.body) continue

    const body = bodyRef.body
    body.setTranslation(position, true)
    body.setLinvel({x: 0, y: 0, z: 0}, true)
    body.setAngvel({x: 0, y: 0, z: 0}, true)

    // Reset state
    entity.set(BallState, {
      lastTouchedBy: null,
      lastTouchedTeam: null,
      speed: 0,
      timeSinceTouch: 0,
    })
  }
}
