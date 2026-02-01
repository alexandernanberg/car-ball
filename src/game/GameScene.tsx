import type {Entity} from 'koota'
import {useWorld, useActions} from 'koota/react'
import {useLayoutEffect, useRef, useEffect} from 'react'
import {Arena, BoostPadLayout} from './arena'
import {GameBall} from './ball'
import {BallCamera} from './camera'
import {GameSystems} from './GameSystems'
import {IsMatch, MatchState, MatchConfig, matchActions} from './match'
import {Vehicle, VehicleInputManager} from './vehicle'

/**
 * Main game scene - contains all game entities
 */
export function GameScene() {
  const world = useWorld()
  const matchEntityRef = useRef<Entity | null>(null)
  const {startMatch} = useActions(matchActions)

  // Create match entity on mount
  useLayoutEffect(() => {
    const entity = world.spawn(IsMatch, MatchState, MatchConfig)
    matchEntityRef.current = entity

    // Start the match
    startMatch()

    return () => {
      if (entity.isAlive()) {
        entity.destroy()
      }
    }
  }, [world, startMatch])

  // Handle restart key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyR') {
        startMatch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [startMatch])

  return (
    <>
      {/* Game systems (physics callbacks) */}
      <GameSystems />

      {/* Input management */}
      <VehicleInputManager />

      {/* Camera */}
      <BallCamera />

      {/* Arena */}
      <Arena />
      <BoostPadLayout />

      {/* Ball */}
      <GameBall position={[0, 3, 0]} />

      {/* Player vehicle (blue team) */}
      <Vehicle
        position={[0, 1, -30]}
        rotation={[0, 0, 0]}
        team="blue"
        isPlayer
      />

      {/* Opponent vehicle (orange team) - AI placeholder */}
      <Vehicle
        position={[0, 1, 30]}
        rotation={[0, Math.PI, 0]}
        team="orange"
        isPlayer={false}
      />
    </>
  )
}
