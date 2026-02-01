import {trait} from 'koota'

export type MatchPhase =
  | 'countdown' // Pre-match countdown
  | 'playing' // Active gameplay
  | 'goal' // Goal scored, celebration
  | 'overtime' // Sudden death
  | 'ended' // Match ended

/** Match state - singleton trait */
export const MatchState = trait(() => ({
  /** Current phase */
  phase: 'countdown' as MatchPhase,
  /** Time remaining in seconds (counts down) */
  timeRemaining: 300, // 5 minutes
  /** Blue team score */
  blueScore: 0,
  /** Orange team score */
  orangeScore: 0,
  /** Countdown timer (for countdown phase) */
  countdownTimer: 3,
  /** Goal celebration timer */
  goalTimer: 0,
  /** Which team just scored (for celebration) */
  lastGoalTeam: null as 'blue' | 'orange' | null,
  /** Whether in overtime */
  isOvertime: false,
}))

/** Match configuration */
export const MatchConfig = trait(() => ({
  /** Match duration in seconds */
  duration: 300, // 5 minutes
  /** Countdown duration */
  countdownDuration: 3,
  /** Goal celebration duration */
  goalCelebrationDuration: 3,
  /** Whether overtime is enabled */
  overtimeEnabled: true,
}))

/** Tag for the match entity */
export const IsMatch = trait()
