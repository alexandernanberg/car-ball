import {trait} from 'koota'

/** Marks an entity as a goal trigger zone */
export const IsGoal = trait()

/** Goal configuration */
export const GoalConfig = trait(() => ({
  /** Which team this goal belongs to (scoring here = point for other team) */
  team: 'blue' as 'blue' | 'orange',
}))

/** Marks an entity as a boost pad */
export const IsBoostPad = trait()

/** Boost pad configuration */
export const BoostPadConfig = trait(() => ({
  /** Boost amount given (12 for small, 100 for large) */
  amount: 12,
  /** Respawn time in seconds */
  respawnTime: 4,
  /** Whether this is a large (full) boost pad */
  isLarge: false,
}))

/** Boost pad state */
export const BoostPadState = trait(() => ({
  /** Whether the pad is active (can be picked up) */
  isActive: true,
  /** Time until respawn */
  respawnTimer: 0,
}))

// Arena dimensions (exported for use in other systems)
export const ARENA = {
  length: 100, // Goal to goal (Z axis)
  width: 70, // Side to side (X axis)
  height: 20, // Ceiling height

  goal: {
    width: 8,
    height: 4,
    depth: 3,
  },

  // Wall thickness
  wallThickness: 1,
} as const
