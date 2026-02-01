import type {World, Entity} from 'koota'
import {createActions} from 'koota'
import {RigidBodyRef, ColliderRef} from '~/ecs/physics'
import {IsGoal, GoalConfig, ARENA} from '../arena'
import {IsGameBall, resetBall} from '../ball'
import {IsVehicle, VehicleState, Team} from '../vehicle'
import {MatchState, MatchConfig, IsMatch, type MatchPhase} from './traits'

const FIXED_TIMESTEP = 1 / 60

/**
 * Match system - handles game flow, scoring, and timers
 */
export function matchSystem(world: World) {
  // Get match entity
  const matches = world.query(IsMatch, MatchState, MatchConfig)
  if (matches.length === 0) return

  const matchEntity = matches[0]!
  const state = matchEntity.get(MatchState)!
  const config = matchEntity.get(MatchConfig)!

  const newState = {...state}

  switch (state.phase) {
    case 'countdown': {
      newState.countdownTimer -= FIXED_TIMESTEP
      if (newState.countdownTimer <= 0) {
        newState.phase = 'playing'
        newState.countdownTimer = 0
      }
      break
    }

    case 'playing': {
      // Update timer
      newState.timeRemaining -= FIXED_TIMESTEP

      // Check for match end
      if (newState.timeRemaining <= 0) {
        if (
          newState.blueScore === newState.orangeScore &&
          config.overtimeEnabled
        ) {
          // Go to overtime
          newState.phase = 'overtime'
          newState.isOvertime = true
          newState.timeRemaining = 0 // Sudden death
        } else {
          // Match ended
          newState.phase = 'ended'
        }
      }

      // Check for goals
      checkGoals(world, matchEntity, newState)
      break
    }

    case 'overtime': {
      // Sudden death - check for goals
      checkGoals(world, matchEntity, newState)
      break
    }

    case 'goal': {
      // Goal celebration
      newState.goalTimer -= FIXED_TIMESTEP
      if (newState.goalTimer <= 0) {
        // Reset for next kickoff
        resetForKickoff(world)

        // Resume play or end if overtime goal
        if (newState.isOvertime) {
          newState.phase = 'ended'
        } else {
          newState.phase = 'countdown'
          newState.countdownTimer = config.countdownDuration
        }
      }
      break
    }

    case 'ended': {
      // Match over - do nothing
      break
    }
  }

  matchEntity.set(MatchState, newState)
}

/** Match state shape */
type MatchStateData = {
  phase: MatchPhase
  timeRemaining: number
  blueScore: number
  orangeScore: number
  countdownTimer: number
  goalTimer: number
  lastGoalTeam: 'blue' | 'orange' | null
  isOvertime: boolean
}

/**
 * Check if ball is in any goal
 */
function checkGoals(world: World, _matchEntity: Entity, state: MatchStateData) {
  // Get ball position
  const balls = world.query(IsGameBall, RigidBodyRef)
  if (balls.length === 0) return

  const ballEntity = balls[0]!
  const ballBody = ballEntity.get(RigidBodyRef)!.body
  if (!ballBody) return

  const ballPos = ballBody.translation()

  // Check against goal positions
  const {goal, length} = ARENA
  const halfLength = length / 2

  // Orange goal (positive Z)
  if (
    ballPos.z > halfLength &&
    ballPos.z < halfLength + goal.depth &&
    Math.abs(ballPos.x) < goal.width / 2 &&
    ballPos.y < goal.height
  ) {
    // Blue team scores!
    state.blueScore += 1
    state.phase = 'goal'
    state.goalTimer = 3
    state.lastGoalTeam = 'blue'
  }

  // Blue goal (negative Z)
  if (
    ballPos.z < -halfLength &&
    ballPos.z > -halfLength - goal.depth &&
    Math.abs(ballPos.x) < goal.width / 2 &&
    ballPos.y < goal.height
  ) {
    // Orange team scores!
    state.orangeScore += 1
    state.phase = 'goal'
    state.goalTimer = 3
    state.lastGoalTeam = 'orange'
  }
}

/**
 * Reset ball and vehicles for kickoff
 */
function resetForKickoff(world: World) {
  // Reset ball to center
  resetBall(world, {x: 0, y: 2, z: 0})

  // Reset vehicles to spawn positions
  const vehicles = world.query(IsVehicle, Team, RigidBodyRef)

  for (const entity of vehicles) {
    const team = entity.get(Team)!
    const bodyRef = entity.get(RigidBodyRef)!
    if (!bodyRef.body) continue

    const body = bodyRef.body

    // Spawn position based on team
    const spawnZ = team.team === 'blue' ? -30 : 30
    const spawnRotation = team.team === 'blue' ? 0 : Math.PI

    body.setTranslation({x: 0, y: 1, z: spawnZ}, true)
    body.setRotation(
      {
        x: 0,
        y: Math.sin(spawnRotation / 2),
        z: 0,
        w: Math.cos(spawnRotation / 2),
      },
      true,
    )
    body.setLinvel({x: 0, y: 0, z: 0}, true)
    body.setAngvel({x: 0, y: 0, z: 0}, true)

    // Reset boost
    entity.set(VehicleState, {
      ...entity.get(VehicleState)!,
      boostAmount: 33,
      jumpsRemaining: 2,
      isGrounded: true,
    })
  }
}

/**
 * Create match actions
 */
export const matchActions = createActions((world) => ({
  /** Start a new match */
  startMatch: () => {
    // Find or create match entity
    let matchEntity: Entity
    const matches = world.query(IsMatch)

    if (matches.length > 0) {
      matchEntity = matches[0]!
    } else {
      matchEntity = world.spawn(IsMatch, MatchState, MatchConfig)
    }

    // Reset match state
    const config = matchEntity.get(MatchConfig)!
    matchEntity.set(MatchState, {
      phase: 'countdown',
      timeRemaining: config.duration,
      blueScore: 0,
      orangeScore: 0,
      countdownTimer: config.countdownDuration,
      goalTimer: 0,
      lastGoalTeam: null,
      isOvertime: false,
    })

    // Reset for kickoff
    resetForKickoff(world)
  },

  /** Skip to playing phase (for testing) */
  skipCountdown: () => {
    for (const entity of world.query(IsMatch, MatchState)) {
      entity.set(MatchState, {
        ...entity.get(MatchState)!,
        phase: 'playing',
        countdownTimer: 0,
      })
    }
  },

  /** Add time (for testing) */
  addTime: (seconds: number) => {
    for (const entity of world.query(IsMatch, MatchState)) {
      const state = entity.get(MatchState)!
      entity.set(MatchState, {
        ...state,
        timeRemaining: state.timeRemaining + seconds,
      })
    }
  },

  /** Force a goal (for testing) */
  forceGoal: (team: 'blue' | 'orange') => {
    for (const entity of world.query(IsMatch, MatchState)) {
      const state = entity.get(MatchState)!
      entity.set(MatchState, {
        ...state,
        blueScore: team === 'blue' ? state.blueScore + 1 : state.blueScore,
        orangeScore:
          team === 'orange' ? state.orangeScore + 1 : state.orangeScore,
        phase: 'goal',
        goalTimer: 3,
        lastGoalTeam: team,
      })
    }
  },
}))
