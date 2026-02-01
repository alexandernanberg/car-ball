import {trait} from 'koota'

// ============================================
// Vehicle Tag
// ============================================

/** Marks an entity as a vehicle */
export const IsVehicle = trait()

/** Marks an entity as the player-controlled vehicle */
export const IsPlayerVehicle = trait()

// ============================================
// Vehicle Input
// ============================================

/** Input state for vehicle control */
export const VehicleInput = trait(() => ({
  /** Throttle: -1 (reverse) to 1 (forward) */
  throttle: 0,
  /** Steering: -1 (left) to 1 (right) */
  steer: 0,
  /** Jump button pressed this frame */
  jump: false,
  /** Jump button held */
  jumpHeld: false,
  /** Boost button held */
  boost: false,
  /** Air roll: -1 (left) to 1 (right) */
  airRoll: 0,
  /** Handbrake/powerslide */
  handbrake: false,
}))

// ============================================
// Vehicle State
// ============================================

/** Runtime state for vehicle */
export const VehicleState = trait(() => ({
  /** Current forward speed (m/s) */
  speed: 0,
  /** Whether vehicle is touching ground */
  isGrounded: true,
  /** Surface normal when grounded */
  groundNormalX: 0,
  groundNormalY: 1,
  groundNormalZ: 0,
  /** Current boost amount (0-100) */
  boostAmount: 33, // Start with 33 boost like RL
  /** Time since last grounded (for coyote time) */
  airTime: 0,
  /** Number of jumps available (0, 1, or 2) */
  jumpsRemaining: 2,
  /** Time since first jump (for double jump window) */
  jumpTime: 0,
  /** Whether currently in a dodge/flip */
  isDodging: false,
  /** Dodge direction (normalized) */
  dodgeDirX: 0,
  dodgeDirY: 0,
  /** Dodge timer */
  dodgeTime: 0,
  /** Whether the car is currently supersonic (max boost speed) */
  isSupersonic: false,
}))

// ============================================
// Vehicle Configuration
// ============================================

/** Configuration for vehicle physics (tweak these for feel) */
export const VehicleConfig = trait(() => ({
  // Movement
  /** Max speed without boost (m/s) */
  maxSpeed: 23,
  /** Max speed while boosting (m/s) */
  maxBoostSpeed: 34,
  /** Ground acceleration (m/s^2) */
  groundAcceleration: 16,
  /** Boost acceleration (m/s^2) */
  boostAcceleration: 20,
  /** Brake deceleration (m/s^2) */
  brakeDeceleration: 35,
  /** Coast deceleration (no input) (m/s^2) */
  coastDeceleration: 2,

  // Turning
  /** Base turn rate (rad/s at low speed) */
  turnRateMin: 2.5,
  /** Turn rate at max speed (rad/s) */
  turnRateMax: 1.2,
  /** Speed at which turn rate transitions */
  turnSpeedThreshold: 15,

  // Jumping
  /** Initial jump impulse */
  jumpImpulse: 6,
  /** Double jump impulse */
  doubleJumpImpulse: 6,
  /** Time window for double jump (seconds) */
  doubleJumpWindow: 1.5,

  // Dodge/Flip
  /** Dodge impulse strength */
  dodgeImpulse: 10,
  /** Dodge rotation speed (rad/s) */
  dodgeRotationSpeed: 6,
  /** Dodge duration (seconds) */
  dodgeDuration: 0.65,

  // Boost
  /** Boost consumption rate (units/second) */
  boostConsumption: 33,
  /** Max boost capacity */
  maxBoost: 100,

  // Physics
  /** Vehicle mass */
  mass: 150,
  /** Gravity scale */
  gravityScale: 1,
  /** Air control multiplier */
  airControlMultiplier: 0.5,
}))

// ============================================
// Team
// ============================================

export type TeamId = 'blue' | 'orange'

/** Team assignment for vehicle */
export const Team = trait(() => ({
  team: 'blue' as TeamId,
}))
