import type {Entity} from 'koota'
import {useLayoutEffect, useRef} from 'react'
import {RigidBody, CylinderCollider, type RigidBodyApi} from '~/ecs/physics'
import {IsBoostPad, BoostPadConfig, BoostPadState} from './traits'

interface BoostPadProps {
  position: [number, number, number]
  isLarge?: boolean
}

/**
 * Boost pad - gives boost when driven over
 */
export function BoostPad({position, isLarge = false}: BoostPadProps) {
  const rigidBodyRef = useRef<RigidBodyApi>(null)
  const entityRef = useRef<Entity | null>(null)

  useLayoutEffect(() => {
    const rb = rigidBodyRef.current
    if (!rb?.entity) return

    const entity = rb.entity
    entityRef.current = entity

    // Add boost pad traits
    entity.add(IsBoostPad)
    entity.add(
      BoostPadConfig({
        amount: isLarge ? 100 : 12,
        respawnTime: isLarge ? 10 : 4,
        isLarge,
      }),
    )
    entity.add(
      BoostPadState({
        isActive: true,
        respawnTimer: 0,
      }),
    )
  }, [isLarge])

  const radius = isLarge ? 1.5 : 0.8
  const height = isLarge ? 0.5 : 0.3
  const color = isLarge ? '#fbbf24' : '#fde047' // Gold / Yellow
  const glowColor = isLarge ? '#f59e0b' : '#facc15'

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="fixed"
      position={[position[0], position[1] + height / 2, position[2]]}
    >
      <CylinderCollider args={[radius, height]} sensor>
        {/* Base */}
        <mesh receiveShadow>
          <cylinderGeometry args={[radius, radius, height, isLarge ? 6 : 16]} />
          <meshPhongMaterial
            color={color}
            emissive={glowColor}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Glow effect (visual only) */}
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry
            args={[radius * 0.6, radius * 0.3, height * 2, isLarge ? 6 : 16]}
          />
          <meshPhongMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={1}
            transparent
            opacity={0.6}
          />
        </mesh>
      </CylinderCollider>
    </RigidBody>
  )
}

/**
 * Boost pad layout for the arena
 * Based on Rocket League-style boost pad placement
 */
export function BoostPadLayout() {
  const {length, width} = {length: 100, width: 70}
  const halfLength = length / 2
  const halfWidth = width / 2

  // Large boost pads (corners and mid-field)
  const largePads: [number, number, number][] = [
    // Corners
    [-halfWidth + 5, 0, -halfLength + 5],
    [halfWidth - 5, 0, -halfLength + 5],
    [-halfWidth + 5, 0, halfLength - 5],
    [halfWidth - 5, 0, halfLength - 5],
    // Mid-field sides
    [-halfWidth + 5, 0, 0],
    [halfWidth - 5, 0, 0],
  ]

  // Small boost pads (scattered across field)
  const smallPads: [number, number, number][] = []

  // Generate small pads in rows
  const rows = [-30, -15, 0, 15, 30]
  const cols = [-25, -12, 0, 12, 25]

  for (const z of rows) {
    for (const x of cols) {
      // Skip positions near large pads
      const nearLarge = largePads.some(
        ([lx, , lz]) => Math.abs(x - lx) < 10 && Math.abs(z - lz) < 10,
      )
      if (!nearLarge && !(x === 0 && z === 0)) {
        smallPads.push([x, 0, z])
      }
    }
  }

  return (
    <group>
      {largePads.map((pos, i) => (
        <BoostPad key={`large-${i}`} position={pos} isLarge />
      ))}
      {smallPads.map((pos, i) => (
        <BoostPad key={`small-${i}`} position={pos} />
      ))}
    </group>
  )
}
