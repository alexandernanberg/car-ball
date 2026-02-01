import {useQuery, useTrait} from 'koota/react'
import {MatchState, IsMatch} from '~/game/match'
import {VehicleState, IsPlayerVehicle} from '~/game/vehicle'

/**
 * In-game HUD overlay
 * Shows score, timer, and boost meter
 */
export function HUD() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        fontFamily: 'system-ui, sans-serif',
        color: 'white',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      }}
    >
      <ScoreDisplay />
      <BoostMeter />
      <Countdown />
      <GoalCelebration />
      <MatchEnd />
      <Controls />
    </div>
  )
}

function ScoreDisplay() {
  const matches = useQuery(IsMatch, MatchState)
  const matchEntity = matches[0]

  const state = useTrait(matchEntity, MatchState)
  if (!state) return null

  const minutes = Math.floor(Math.max(0, state.timeRemaining) / 60)
  const seconds = Math.floor(Math.max(0, state.timeRemaining) % 60)
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 40,
        fontSize: 48,
        fontWeight: 'bold',
      }}
    >
      {/* Blue score */}
      <div
        style={{
          color: '#3B82F6',
          minWidth: 60,
          textAlign: 'right',
        }}
      >
        {state.blueScore}
      </div>

      {/* Timer */}
      <div
        style={{
          fontSize: 32,
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '8px 20px',
          borderRadius: 8,
          minWidth: 100,
          textAlign: 'center',
        }}
      >
        {state.isOvertime ? (
          <span style={{color: '#ef4444', fontSize: 24}}>+{timeStr}</span>
        ) : (
          timeStr
        )}
        {state.isOvertime && (
          <div style={{fontSize: 14, color: '#ef4444'}}>OVERTIME</div>
        )}
      </div>

      {/* Orange score */}
      <div
        style={{
          color: '#F97316',
          minWidth: 60,
          textAlign: 'left',
        }}
      >
        {state.orangeScore}
      </div>
    </div>
  )
}

function BoostMeter() {
  const vehicles = useQuery(IsPlayerVehicle, VehicleState)
  const playerEntity = vehicles[0]

  const state = useTrait(playerEntity, VehicleState)
  if (!state) return null

  const boostPercent = Math.round(state.boostAmount)
  const boostFill = state.boostAmount / 100

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {/* Boost number */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: boostFill > 0.8 ? '#fbbf24' : '#fff',
        }}
      >
        {boostPercent}
      </div>

      {/* Boost bar */}
      <div
        style={{
          width: 150,
          height: 20,
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: 10,
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.3)',
        }}
      >
        <div
          style={{
            width: `${boostFill * 100}%`,
            height: '100%',
            background: boostFill > 0.8
              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            transition: 'width 0.1s ease-out',
          }}
        />
      </div>

      <div style={{fontSize: 12, opacity: 0.7}}>BOOST</div>
    </div>
  )
}

function Countdown() {
  const matches = useQuery(IsMatch, MatchState)
  const matchEntity = matches[0]

  const state = useTrait(matchEntity, MatchState)
  if (!state || state.phase !== 'countdown') return null

  const count = Math.ceil(state.countdownTimer)

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 120,
        fontWeight: 'bold',
        color: count === 0 ? '#22c55e' : '#fff',
        animation: 'pulse 1s ease-in-out infinite',
      }}
    >
      {count === 0 ? 'GO!' : count}
    </div>
  )
}

function GoalCelebration() {
  const matches = useQuery(IsMatch, MatchState)
  const matchEntity = matches[0]

  const state = useTrait(matchEntity, MatchState)
  if (!state || state.phase !== 'goal') return null

  const teamColor = state.lastGoalTeam === 'blue' ? '#3B82F6' : '#F97316'
  const teamName = state.lastGoalTeam === 'blue' ? 'BLUE' : 'ORANGE'

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 'bold',
          color: teamColor,
          textShadow: `0 0 20px ${teamColor}`,
        }}
      >
        GOAL!
      </div>
      <div
        style={{
          fontSize: 36,
          color: teamColor,
          marginTop: 10,
        }}
      >
        {teamName} TEAM
      </div>
    </div>
  )
}

function MatchEnd() {
  const matches = useQuery(IsMatch, MatchState)
  const matchEntity = matches[0]

  const state = useTrait(matchEntity, MatchState)
  if (!state || state.phase !== 'ended') return null

  const winner = state.blueScore > state.orangeScore ? 'BLUE' : 'ORANGE'
  const winnerColor = winner === 'BLUE' ? '#3B82F6' : '#F97316'
  const isDraw = state.blueScore === state.orangeScore

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '40px 60px',
        borderRadius: 20,
      }}
    >
      <div style={{fontSize: 48, fontWeight: 'bold', marginBottom: 20}}>
        {isDraw ? 'DRAW!' : `${winner} WINS!`}
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'center',
          gap: 30,
        }}
      >
        <span style={{color: '#3B82F6'}}>{state.blueScore}</span>
        <span>-</span>
        <span style={{color: '#F97316'}}>{state.orangeScore}</span>
      </div>
      <div style={{marginTop: 30, fontSize: 18, opacity: 0.7}}>
        Press R to restart
      </div>
    </div>
  )
}

function Controls() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        fontSize: 12,
        opacity: 0.5,
        textAlign: 'right',
        lineHeight: 1.6,
      }}
    >
      <div>WASD - Drive</div>
      <div>Space - Jump</div>
      <div>Shift - Boost</div>
      <div>Q/E - Air Roll</div>
      <div>Y - Toggle Ball Cam</div>
    </div>
  )
}
