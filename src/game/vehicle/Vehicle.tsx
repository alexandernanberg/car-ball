import type {Entity} from 'koota'
import {useLayoutEffect, useRef} from 'react'
import type {Group} from 'three'
import {RigidBody, CuboidCollider, type RigidBodyApi} from '~/ecs/physics'
import {
  IsVehicle,
  IsPlayerVehicle,
  VehicleInput,
  VehicleState,
  VehicleConfig,
  Team,
  type TeamId,
} from './traits'

// Team colors
const TEAM_COLORS = {
  blue: '#3B82F6',
  orange: '#F97316',
} as const

interface VehicleProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  team?: TeamId
  isPlayer?: boolean
  entityRef?: React.MutableRefObject<Entity | null>
}

/**
 * Vehicle component - renders a car with physics
 *
 * Uses a box collider for simplified arcade physics.
 * The visual mesh shows a simple car shape.
 */
export function Vehicle({
  position = [0, 1, 0],
  rotation = [0, 0, 0],
  team = 'blue',
  isPlayer = false,
  entityRef,
}: VehicleProps) {
  const rigidBodyRef = useRef<RigidBodyApi>(null)
  const meshRef = useRef<Group>(null)
  const internalEntityRef = useRef<Entity | null>(null)

  // Add vehicle traits when entity is created
  useLayoutEffect(() => {
    const rb = rigidBodyRef.current
    if (!rb?.entity) return

    const entity = rb.entity
    internalEntityRef.current = entity

    if (entityRef) {
      entityRef.current = entity
    }

    // Add vehicle traits
    entity.add(IsVehicle)
    entity.add(VehicleInput)
    entity.add(VehicleState)
    entity.add(VehicleConfig)
    entity.add(Team({team}))

    if (isPlayer) {
      entity.add(IsPlayerVehicle)
    }

    return () => {
      // Traits are auto-removed on entity destroy
    }
  }, [team, isPlayer, entityRef])

  const color = TEAM_COLORS[team]

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={rotation}
      type="dynamic"
      linearDamping={0.1}
      angularDamping={0.5}
      ccd
    >
      <CuboidCollider
        args={[0.9, 0.25, 0.6]} // Half-extents: 1.8m x 0.5m x 1.2m
        friction={1}
        restitution={0.1}
        density={2}
      >
        <group ref={meshRef}>
          {/* Car body */}
          <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
            <boxGeometry args={[1.8, 0.4, 1.2]} />
            <meshPhongMaterial color={color} />
          </mesh>

          {/* Car cabin/roof */}
          <mesh castShadow receiveShadow position={[0, 0.45, -0.1]}>
            <boxGeometry args={[1.4, 0.3, 0.8]} />
            <meshPhongMaterial color={color} />
          </mesh>

          {/* Front bumper */}
          <mesh castShadow position={[0, 0, 0.55]}>
            <boxGeometry args={[1.6, 0.2, 0.15]} />
            <meshPhongMaterial color="#333" />
          </mesh>

          {/* Wheels (visual only) */}
          <Wheel position={[0.7, -0.1, 0.45]} />
          <Wheel position={[-0.7, -0.1, 0.45]} />
          <Wheel position={[0.7, -0.1, -0.45]} />
          <Wheel position={[-0.7, -0.1, -0.45]} />
        </group>
      </CuboidCollider>
    </RigidBody>
  )
}

function Wheel({position}: {position: [number, number, number]}) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
      <meshPhongMaterial color="#222" />
    </mesh>
  )
}
