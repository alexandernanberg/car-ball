import type {World} from 'koota'
import {RigidBodyRef} from '~/ecs/physics'
import {IsGameBall} from '../ball'
import {IsPlayerVehicle} from '../vehicle'
import {BallCameraConfig, BallCameraState, IsBallCamera} from './traits'

const FIXED_TIMESTEP = 1 / 60

/**
 * Ball camera system - follows player car and looks at ball
 */
export function ballCameraSystem(world: World) {
  // Find camera entity
  const cameras = world.query(IsBallCamera, BallCameraConfig, BallCameraState)
  if (cameras.length === 0) return

  const cameraEntity = cameras[0]!
  const config = cameraEntity.get(BallCameraConfig)!
  const state = cameraEntity.get(BallCameraState)!

  // Find player vehicle
  const playerVehicles = world.query(IsPlayerVehicle, RigidBodyRef)
  if (playerVehicles.length === 0) return

  const playerEntity = playerVehicles[0]!
  const playerBody = playerEntity.get(RigidBodyRef)!.body
  if (!playerBody) return

  // Find ball
  const balls = world.query(IsGameBall, RigidBodyRef)
  const ballBody = balls.length > 0 ? balls[0]!.get(RigidBodyRef)!.body : null

  // Get player position and rotation
  const carPos = playerBody.translation()
  const carRot = playerBody.rotation()

  // Calculate car forward direction
  const forward = rotateVector({x: 0, y: 0, z: 1}, carRot)

  let targetCamPos: Vec3
  let targetLookAt: Vec3

  if (config.enabled && ballBody) {
    // Ball cam mode
    const ballPos = ballBody.translation()

    // Camera behind car, looking toward ball
    // Direction from car to ball
    const carToBall = {
      x: ballPos.x - carPos.x,
      y: 0, // Keep horizontal
      z: ballPos.z - carPos.z,
    }
    const distToBall = Math.sqrt(
      carToBall.x * carToBall.x + carToBall.z * carToBall.z,
    )

    if (distToBall > 0.1) {
      // Normalize
      carToBall.x /= distToBall
      carToBall.z /= distToBall
    }

    // Position camera behind car (opposite of ball direction)
    targetCamPos = {
      x: carPos.x - carToBall.x * config.distance,
      y: carPos.y + config.height,
      z: carPos.z - carToBall.z * config.distance,
    }

    // Look at ball
    targetLookAt = {
      x: ballPos.x,
      y: ballPos.y,
      z: ballPos.z,
    }
  } else {
    // Car cam mode - follow behind car using car's forward direction
    targetCamPos = {
      x: carPos.x - forward.x * config.distance,
      y: carPos.y + config.height,
      z: carPos.z - forward.z * config.distance,
    }

    // Look at point in front of car
    targetLookAt = {
      x: carPos.x + forward.x * 5,
      y: carPos.y + 1,
      z: carPos.z + forward.z * 5,
    }
  }

  // Smooth camera position
  const posSmooth = 1 - Math.exp(-config.followSmoothing * FIXED_TIMESTEP)
  const lookSmooth = 1 - Math.exp(-config.lookSmoothing * FIXED_TIMESTEP)

  const newState = {
    positionX: lerp(state.positionX, targetCamPos.x, posSmooth),
    positionY: lerp(state.positionY, targetCamPos.y, posSmooth),
    positionZ: lerp(state.positionZ, targetCamPos.z, posSmooth),
    lookAtX: lerp(state.lookAtX, targetLookAt.x, lookSmooth),
    lookAtY: lerp(state.lookAtY, targetLookAt.y, lookSmooth),
    lookAtZ: lerp(state.lookAtZ, targetLookAt.z, lookSmooth),
    yaw: state.yaw,
  }

  cameraEntity.set(BallCameraState, newState)
}

// ============================================
// MATH HELPERS
// ============================================

interface Vec3 {
  x: number
  y: number
  z: number
}

interface Quat {
  x: number
  y: number
  z: number
  w: number
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function rotateVector(v: Vec3, q: Quat): Vec3 {
  const qx = q.x,
    qy = q.y,
    qz = q.z,
    qw = q.w
  const vx = v.x,
    vy = v.y,
    vz = v.z

  const ix = qw * vx + qy * vz - qz * vy
  const iy = qw * vy + qz * vx - qx * vz
  const iz = qw * vz + qx * vy - qy * vx
  const iw = -qx * vx - qy * vy - qz * vz

  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx,
  }
}
