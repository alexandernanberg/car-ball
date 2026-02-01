import type {World} from 'koota'
import {RigidBodyRef} from '~/ecs/physics'
import {IsVehicle, VehicleConfig, VehicleInput, VehicleState} from './traits'

const FIXED_TIMESTEP = 1 / 60

/**
 * Vehicle physics system - runs during physics step
 * Implements arcade-style car physics inspired by Rocket League
 */
export function vehiclePhysicsSystem(world: World) {
  for (const entity of world.query(
    IsVehicle,
    VehicleInput,
    VehicleState,
    VehicleConfig,
    RigidBodyRef,
  )) {
    const input = entity.get(VehicleInput)!
    const state = entity.get(VehicleState)!
    const config = entity.get(VehicleConfig)!
    const bodyRef = entity.get(RigidBodyRef)!

    if (!bodyRef.body) continue

    const body = bodyRef.body

    // Get current velocity
    const linvel = body.linvel()
    const angvel = body.angvel()

    // Get body rotation as quaternion
    const rot = body.rotation()

    // Calculate forward direction from rotation
    // Forward is +Z in local space for our car
    const forward = rotateVector({x: 0, y: 0, z: 1}, rot)
    const up = rotateVector({x: 0, y: 1, z: 0}, rot)
    const right = rotateVector({x: 1, y: 0, z: 0}, rot)

    // Project velocity onto forward direction
    const forwardSpeed = dot(linvel, forward)
    const lateralSpeed = dot(linvel, right)

    // Update state
    const speed = Math.sqrt(linvel.x * linvel.x + linvel.z * linvel.z)
    const newState = {...state, speed}

    // Ground detection using raycast
    // Cast a short ray downward from the car
    const pos = body.translation()
    const groundCheckDistance = 0.5 // Half car height + margin

    // For now, assume grounded if close to y=0 (we'll improve this with raycasts)
    // TODO: Use actual raycast for proper ground detection
    const isGrounded = pos.y < 1.0

    newState.isGrounded = isGrounded

    if (isGrounded) {
      newState.airTime = 0
      newState.jumpsRemaining = 2
      newState.groundNormalX = 0
      newState.groundNormalY = 1
      newState.groundNormalZ = 0
    } else {
      newState.airTime += FIXED_TIMESTEP
    }

    // Jump time tracking
    if (newState.jumpsRemaining < 2) {
      newState.jumpTime += FIXED_TIMESTEP
    }

    // ============================================
    // GROUNDED MOVEMENT
    // ============================================
    if (isGrounded) {
      // Steering
      if (Math.abs(input.steer) > 0.01 && speed > 0.5) {
        // Turn rate decreases with speed
        const speedFactor = Math.min(1, speed / config.turnSpeedThreshold)
        const turnRate = lerp(
          config.turnRateMin,
          config.turnRateMax,
          speedFactor,
        )

        // Reverse steering direction when going backwards
        const steerDir = forwardSpeed >= 0 ? input.steer : -input.steer

        // Apply angular velocity for turning
        body.setAngvel(
          {
            x: angvel.x,
            y: -steerDir * turnRate,
            z: angvel.z,
          },
          true,
        )
      } else {
        // Dampen angular velocity when not steering
        body.setAngvel(
          {
            x: angvel.x * 0.9,
            y: angvel.y * 0.9,
            z: angvel.z * 0.9,
          },
          true,
        )
      }

      // Acceleration/Braking
      let targetAccel = 0
      const maxSpeed =
        input.boost && newState.boostAmount > 0
          ? config.maxBoostSpeed
          : config.maxSpeed

      if (input.throttle > 0) {
        // Forward
        if (forwardSpeed < 0) {
          // Braking (going backward but pressing forward)
          targetAccel = config.brakeDeceleration * input.throttle
        } else if (forwardSpeed < maxSpeed) {
          // Accelerating
          const baseAccel =
            input.boost && newState.boostAmount > 0
              ? config.boostAcceleration
              : config.groundAcceleration
          targetAccel = baseAccel * input.throttle
        }
      } else if (input.throttle < 0) {
        // Reverse
        if (forwardSpeed > 0) {
          // Braking (going forward but pressing reverse)
          targetAccel = config.brakeDeceleration * input.throttle
        } else if (forwardSpeed > -config.maxSpeed * 0.5) {
          // Reversing (slower max speed)
          targetAccel = config.groundAcceleration * input.throttle * 0.5
        }
      } else {
        // Coasting - apply friction
        if (Math.abs(forwardSpeed) > 0.1) {
          targetAccel = -Math.sign(forwardSpeed) * config.coastDeceleration
        }
      }

      // Apply acceleration as force along forward direction
      const accelForce = scaleVector(forward, targetAccel * config.mass)
      body.applyImpulse(scaleVector(accelForce, FIXED_TIMESTEP), true)

      // Lateral friction - prevent sliding
      const lateralFriction = 0.95
      const lateralVel = scaleVector(right, lateralSpeed)
      const correctionImpulse = scaleVector(
        lateralVel,
        -lateralFriction * config.mass,
      )
      body.applyImpulse(scaleVector(correctionImpulse, FIXED_TIMESTEP), true)

      // Boost consumption
      if (input.boost && newState.boostAmount > 0) {
        newState.boostAmount = Math.max(
          0,
          newState.boostAmount - config.boostConsumption * FIXED_TIMESTEP,
        )
      }

      // Jumping
      if (input.jump && newState.jumpsRemaining > 0) {
        // First jump
        body.applyImpulse(
          {
            x: 0,
            y: config.jumpImpulse * config.mass,
            z: 0,
          },
          true,
        )
        newState.jumpsRemaining -= 1
        newState.jumpTime = 0
        newState.isGrounded = false
      }
    }
    // ============================================
    // AERIAL MOVEMENT
    // ============================================
    else {
      // Air steering (reduced)
      if (Math.abs(input.steer) > 0.01) {
        const airTurnRate = config.turnRateMin * config.airControlMultiplier
        body.setAngvel(
          {
            x: angvel.x,
            y: -input.steer * airTurnRate,
            z: angvel.z,
          },
          true,
        )
      }

      // Air roll
      if (Math.abs(input.airRoll) > 0.01) {
        const rollRate = 3.0
        body.setAngvel(
          {
            x: angvel.x,
            y: angvel.y,
            z: -input.airRoll * rollRate,
          },
          true,
        )
      }

      // Pitch control (when boosting or just in air)
      if (Math.abs(input.throttle) > 0.01) {
        const pitchRate = 2.0 * config.airControlMultiplier
        body.setAngvel(
          {
            x: input.throttle * pitchRate,
            y: angvel.y,
            z: angvel.z,
          },
          true,
        )
      }

      // Double jump / Dodge
      if (
        input.jump &&
        newState.jumpsRemaining > 0 &&
        newState.jumpTime < config.doubleJumpWindow
      ) {
        if (Math.abs(input.throttle) > 0.3 || Math.abs(input.steer) > 0.3) {
          // Dodge in input direction
          const dodgeDirX = input.steer
          const dodgeDirZ = input.throttle
          const dodgeMag = Math.sqrt(
            dodgeDirX * dodgeDirX + dodgeDirZ * dodgeDirZ,
          )

          if (dodgeMag > 0.1) {
            // Normalize dodge direction
            const normX = dodgeDirX / dodgeMag
            const normZ = dodgeDirZ / dodgeMag

            // Calculate world-space dodge direction
            const worldDodge = addVectors(
              scaleVector(right, normX),
              scaleVector(forward, normZ),
            )

            // Apply dodge impulse
            body.applyImpulse(
              {
                x: worldDodge.x * config.dodgeImpulse * config.mass,
                y: config.doubleJumpImpulse * config.mass * 0.3, // Small upward component
                z: worldDodge.z * config.dodgeImpulse * config.mass,
              },
              true,
            )

            newState.isDodging = true
            newState.dodgeTime = 0
            newState.dodgeDirX = normX
            newState.dodgeDirY = normZ
          }
        } else {
          // Double jump (straight up)
          body.applyImpulse(
            {
              x: 0,
              y: config.doubleJumpImpulse * config.mass,
              z: 0,
            },
            true,
          )
        }

        newState.jumpsRemaining -= 1
      }

      // Boost in air
      if (input.boost && newState.boostAmount > 0) {
        // Apply force in forward direction
        const boostForce = scaleVector(
          forward,
          config.boostAcceleration * config.mass,
        )
        body.applyImpulse(scaleVector(boostForce, FIXED_TIMESTEP), true)
        newState.boostAmount = Math.max(
          0,
          newState.boostAmount - config.boostConsumption * FIXED_TIMESTEP,
        )
      }
    }

    // ============================================
    // DODGE ROTATION
    // ============================================
    if (newState.isDodging) {
      newState.dodgeTime += FIXED_TIMESTEP
      if (newState.dodgeTime > config.dodgeDuration) {
        newState.isDodging = false
      } else {
        // Apply flip rotation
        const flipProgress = newState.dodgeTime / config.dodgeDuration
        if (flipProgress < 0.5) {
          // Flip rotation based on dodge direction
          const flipAngVelX = newState.dodgeDirY * config.dodgeRotationSpeed
          const flipAngVelZ = -newState.dodgeDirX * config.dodgeRotationSpeed
          body.setAngvel(
            {
              x: flipAngVelX,
              y: angvel.y * 0.5,
              z: flipAngVelZ,
            },
            true,
          )
        }
      }
    }

    // Supersonic check
    newState.isSupersonic = speed >= config.maxBoostSpeed * 0.95

    // Update entity state
    entity.set(VehicleState, newState)
  }
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

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function scaleVector(v: Vec3, s: number): Vec3 {
  return {x: v.x * s, y: v.y * s, z: v.z * s}
}

function addVectors(a: Vec3, b: Vec3): Vec3 {
  return {x: a.x + b.x, y: a.y + b.y, z: a.z + b.z}
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function rotateVector(v: Vec3, q: Quat): Vec3 {
  // Rotate vector by quaternion
  const qx = q.x,
    qy = q.y,
    qz = q.z,
    qw = q.w
  const vx = v.x,
    vy = v.y,
    vz = v.z

  // Calculate quaternion * vector
  const ix = qw * vx + qy * vz - qz * vy
  const iy = qw * vy + qz * vx - qx * vz
  const iz = qw * vz + qx * vy - qy * vx
  const iw = -qx * vx - qy * vy - qz * vz

  // Calculate result * inverse quaternion
  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx,
  }
}
