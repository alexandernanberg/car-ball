import {trait} from 'koota'

/** Marks an entity as the game ball */
export const IsGameBall = trait()

/** Ball runtime state */
export const BallState = trait(() => ({
  /** ID of last player to touch the ball */
  lastTouchedBy: null as string | null,
  /** Team of last player to touch */
  lastTouchedTeam: null as 'blue' | 'orange' | null,
  /** Current speed (m/s) */
  speed: 0,
  /** Time since last touch */
  timeSinceTouch: 0,
}))

/** Ball configuration */
export const BallConfig = trait(() => ({
  /** Ball radius (meters) */
  radius: 1.0,
  /** Mass */
  mass: 30,
  /** Bounciness (restitution) */
  restitution: 0.6,
  /** Friction */
  friction: 0.3,
  /** Max speed cap (m/s) */
  maxSpeed: 60,
  /** Gravity scale */
  gravityScale: 1,
}))
