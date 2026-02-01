import {useFrame} from '@react-three/fiber'
import {useWorld} from 'koota/react'
import {useEffect, useRef} from 'react'
import {IsPlayerVehicle, VehicleInput} from './traits'

interface KeyboardState {
  [key: string]: boolean | undefined
}

interface VehicleInputManagerState {
  keyboard: KeyboardState
  gamepadIndex: number | null
}

/**
 * Manages vehicle-specific input (keyboard + gamepad)
 * Updates VehicleInput trait on the player vehicle entity
 */
export function VehicleInputManager() {
  const world = useWorld()
  const stateRef = useRef<VehicleInputManagerState>({
    keyboard: {},
    gamepadIndex: null,
  })

  // Track jump press for single-frame detection
  const jumpPressedRef = useRef(false)
  const prevJumpRef = useRef(false)

  // Keyboard event handlers
  useEffect(() => {
    const state = stateRef.current

    const handleKeyDown = (event: KeyboardEvent) => {
      state.keyboard[event.code] = true

      // Track jump press edge
      if (event.code === 'Space' && !prevJumpRef.current) {
        jumpPressedRef.current = true
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      state.keyboard[event.code] = false
    }

    const handleBlur = () => {
      state.keyboard = {}
    }

    window.addEventListener('keydown', handleKeyDown, {passive: true})
    window.addEventListener('keyup', handleKeyUp, {passive: true})
    window.addEventListener('blur', handleBlur, {passive: true})

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Gamepad connection handlers
  useEffect(() => {
    const state = stateRef.current

    const handleConnect = (event: GamepadEvent) => {
      console.log('Gamepad connected:', event.gamepad.id)
      if (state.gamepadIndex === null) {
        state.gamepadIndex = event.gamepad.index
      }
    }

    const handleDisconnect = (event: GamepadEvent) => {
      if (event.gamepad.index === state.gamepadIndex) {
        state.gamepadIndex = null
      }
    }

    window.addEventListener('gamepadconnected', handleConnect, {passive: true})
    window.addEventListener('gamepaddisconnected', handleDisconnect, {passive: true})

    return () => {
      window.removeEventListener('gamepadconnected', handleConnect)
      window.removeEventListener('gamepaddisconnected', handleDisconnect)
    }
  }, [])

  // Sync input to ECS each frame (before physics)
  useFrame(() => {
    const state = stateRef.current
    const kb = state.keyboard

    // Find player vehicle entity
    const playerVehicles = world.query(IsPlayerVehicle, VehicleInput)
    if (playerVehicles.length === 0) return

    const entity = playerVehicles[0]!

    // Calculate input from keyboard
    let throttle = 0
    let steer = 0
    let airRoll = 0

    // Throttle: W/Up = forward, S/Down = reverse
    if (kb.KeyW || kb.ArrowUp) throttle += 1
    if (kb.KeyS || kb.ArrowDown) throttle -= 1

    // Steering: A/Left = left, D/Right = right
    if (kb.KeyA || kb.ArrowLeft) steer -= 1
    if (kb.KeyD || kb.ArrowRight) steer += 1

    // Air roll: Q = left, E = right
    if (kb.KeyQ) airRoll -= 1
    if (kb.KeyE) airRoll += 1

    const jumpHeld = kb.Space ?? false
    const boost = kb.ShiftLeft ?? kb.ShiftRight ?? false
    const handbrake = kb.ControlLeft ?? kb.ControlRight ?? false

    // Override with gamepad if connected
    if (state.gamepadIndex !== null) {
      const gamepad = navigator.getGamepads()[state.gamepadIndex]
      if (gamepad) {
        // Left stick Y for throttle (inverted)
        const gpThrottle = applyDeadzone(-gamepad.axes[1]!)
        if (gpThrottle !== 0) throttle = gpThrottle

        // Left stick X for steering
        const gpSteer = applyDeadzone(gamepad.axes[0]!)
        if (gpSteer !== 0) steer = gpSteer

        // Right trigger (axis 5 or button 7) for throttle
        // Left trigger (axis 4 or button 6) for reverse
        // Bumpers for air roll
      }
    }

    // Detect jump press (single frame)
    const jumpPressed = jumpPressedRef.current
    jumpPressedRef.current = false
    prevJumpRef.current = jumpHeld

    // Update entity
    entity.set(VehicleInput, {
      throttle,
      steer,
      jump: jumpPressed,
      jumpHeld,
      boost,
      airRoll,
      handbrake,
    })
  }, -1) // Run before physics

  return null
}

function applyDeadzone(value: number, threshold = 0.15): number {
  const magnitude = Math.abs(value)
  if (magnitude < threshold) return 0
  const normalized = (magnitude - threshold) / (1 - threshold)
  return normalized * Math.sign(value)
}
