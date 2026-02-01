import type {Entity} from 'koota'
import {useLayoutEffect, useRef} from 'react'
import {RigidBody, CuboidCollider, type RigidBodyApi} from '~/ecs/physics'
import {ARENA, IsGoal, GoalConfig} from './traits'

// Colors
const FLOOR_COLOR = '#1a472a' // Dark green grass-like
const WALL_COLOR = '#2d3748' // Dark gray
const GOAL_BLUE_COLOR = '#1e40af'
const GOAL_ORANGE_COLOR = '#c2410c'
const LINE_COLOR = '#ffffff'

/**
 * The game arena - floor, walls, ceiling, and goals
 */
export function Arena() {
  const {length, width, height, wallThickness} = ARENA
  const halfLength = length / 2
  const halfWidth = width / 2
  const {goal} = ARENA

  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed" position={[0, -0.5, 0]}>
        <CuboidCollider
          args={[halfWidth, 0.5, halfLength]}
          friction={1}
          restitution={0.1}
        >
          <mesh receiveShadow>
            <boxGeometry args={[width, 1, length]} />
            <meshPhongMaterial color={FLOOR_COLOR} />
          </mesh>
        </CuboidCollider>
      </RigidBody>

      {/* Field markings */}
      <FieldMarkings />

      {/* Side walls (X axis) */}
      <Wall
        position={[halfWidth + wallThickness / 2, height / 2, 0]}
        size={[wallThickness, height, length]}
      />
      <Wall
        position={[-halfWidth - wallThickness / 2, height / 2, 0]}
        size={[wallThickness, height, length]}
      />

      {/* Back walls (behind goals) - with goal cutouts */}
      <BackWallWithGoal
        position={[0, 0, halfLength + goal.depth / 2]}
        team="orange"
      />
      <BackWallWithGoal
        position={[0, 0, -halfLength - goal.depth / 2]}
        team="blue"
      />

      {/* Ceiling */}
      <RigidBody type="fixed" position={[0, height + 0.5, 0]}>
        <CuboidCollider
          args={[halfWidth, 0.5, halfLength]}
          friction={0.5}
          restitution={0.3}
        >
          <mesh>
            <boxGeometry args={[width, 1, length]} />
            <meshPhongMaterial color={WALL_COLOR} transparent opacity={0.3} />
          </mesh>
        </CuboidCollider>
      </RigidBody>

      {/* Goals */}
      <Goal position={[0, 0, halfLength]} team="orange" />
      <Goal position={[0, 0, -halfLength]} team="blue" />
    </group>
  )
}

function Wall({
  position,
  size,
}: {
  position: [number, number, number]
  size: [number, number, number]
}) {
  return (
    <RigidBody type="fixed" position={position}>
      <CuboidCollider
        args={[size[0] / 2, size[1] / 2, size[2] / 2]}
        friction={0.3}
        restitution={0.5}
      >
        <mesh receiveShadow>
          <boxGeometry args={size} />
          <meshPhongMaterial color={WALL_COLOR} />
        </mesh>
      </CuboidCollider>
    </RigidBody>
  )
}

function BackWallWithGoal({
  position,
  team,
}: {
  position: [number, number, number]
  team: 'blue' | 'orange'
}) {
  const {width, height, wallThickness, goal} = ARENA
  const halfWidth = width / 2
  const goalHalfWidth = goal.width / 2

  // Wall sections on either side of goal
  const sideWidth = (width - goal.width) / 2

  return (
    <group position={position}>
      {/* Left section */}
      <RigidBody
        type="fixed"
        position={[-halfWidth + sideWidth / 2, height / 2, 0]}
      >
        <CuboidCollider
          args={[sideWidth / 2, height / 2, wallThickness / 2]}
          friction={0.3}
          restitution={0.5}
        >
          <mesh receiveShadow>
            <boxGeometry args={[sideWidth, height, wallThickness]} />
            <meshPhongMaterial color={WALL_COLOR} />
          </mesh>
        </CuboidCollider>
      </RigidBody>

      {/* Right section */}
      <RigidBody
        type="fixed"
        position={[halfWidth - sideWidth / 2, height / 2, 0]}
      >
        <CuboidCollider
          args={[sideWidth / 2, height / 2, wallThickness / 2]}
          friction={0.3}
          restitution={0.5}
        >
          <mesh receiveShadow>
            <boxGeometry args={[sideWidth, height, wallThickness]} />
            <meshPhongMaterial color={WALL_COLOR} />
          </mesh>
        </CuboidCollider>
      </RigidBody>

      {/* Top section (above goal) */}
      <RigidBody
        type="fixed"
        position={[0, goal.height + (height - goal.height) / 2, 0]}
      >
        <CuboidCollider
          args={[goalHalfWidth, (height - goal.height) / 2, wallThickness / 2]}
          friction={0.3}
          restitution={0.5}
        >
          <mesh receiveShadow>
            <boxGeometry
              args={[goal.width, height - goal.height, wallThickness]}
            />
            <meshPhongMaterial color={WALL_COLOR} />
          </mesh>
        </CuboidCollider>
      </RigidBody>

      {/* Goal back wall (inside goal, further back) */}
      <RigidBody
        type="fixed"
        position={[
          0,
          goal.height / 2,
          team === 'orange' ? goal.depth / 2 : -goal.depth / 2,
        ]}
      >
        <CuboidCollider
          args={[goalHalfWidth, goal.height / 2, wallThickness / 2]}
          friction={0.3}
          restitution={0.8}
        >
          <mesh receiveShadow>
            <boxGeometry args={[goal.width, goal.height, wallThickness]} />
            <meshPhongMaterial
              color={team === 'blue' ? GOAL_BLUE_COLOR : GOAL_ORANGE_COLOR}
            />
          </mesh>
        </CuboidCollider>
      </RigidBody>
    </group>
  )
}

interface GoalProps {
  position: [number, number, number]
  team: 'blue' | 'orange'
}

function Goal({position, team}: GoalProps) {
  const {goal} = ARENA
  const entityRef = useRef<Entity | null>(null)
  const rigidBodyRef = useRef<RigidBodyApi>(null)

  // Flip goal depth direction based on team
  const zOffset = team === 'orange' ? goal.depth / 2 : -goal.depth / 2

  useLayoutEffect(() => {
    const rb = rigidBodyRef.current
    if (!rb?.entity) return

    const entity = rb.entity
    entityRef.current = entity

    // Add goal traits
    entity.add(IsGoal)
    entity.add(GoalConfig({team}))
  }, [team])

  const goalColor = team === 'blue' ? GOAL_BLUE_COLOR : GOAL_ORANGE_COLOR

  return (
    <group position={position}>
      {/* Goal trigger zone (sensor - detects ball entering) */}
      <RigidBody
        ref={rigidBodyRef}
        type="fixed"
        position={[0, goal.height / 2, zOffset]}
      >
        <CuboidCollider
          args={[
            goal.width / 2 - 0.1,
            goal.height / 2 - 0.1,
            goal.depth / 2 - 0.1,
          ]}
          sensor
        >
          {/* Visual indicator (semi-transparent) */}
          <mesh>
            <boxGeometry
              args={[goal.width - 0.2, goal.height - 0.2, goal.depth - 0.2]}
            />
            <meshPhongMaterial color={goalColor} transparent opacity={0.15} />
          </mesh>
        </CuboidCollider>
      </RigidBody>

      {/* Goal frame (visual) */}
      <GoalFrame team={team} />

      {/* Goal floor */}
      <RigidBody type="fixed" position={[0, -0.05, zOffset]}>
        <CuboidCollider
          args={[goal.width / 2, 0.05, goal.depth / 2]}
          friction={1}
        >
          <mesh receiveShadow>
            <boxGeometry args={[goal.width, 0.1, goal.depth]} />
            <meshPhongMaterial color={goalColor} />
          </mesh>
        </CuboidCollider>
      </RigidBody>

      {/* Goal side walls */}
      <RigidBody
        type="fixed"
        position={[-goal.width / 2 - 0.05, goal.height / 2, zOffset]}
      >
        <CuboidCollider
          args={[0.05, goal.height / 2, goal.depth / 2]}
          friction={0.3}
          restitution={0.5}
        >
          <mesh>
            <boxGeometry args={[0.1, goal.height, goal.depth]} />
            <meshPhongMaterial color={goalColor} />
          </mesh>
        </CuboidCollider>
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[goal.width / 2 + 0.05, goal.height / 2, zOffset]}
      >
        <CuboidCollider
          args={[0.05, goal.height / 2, goal.depth / 2]}
          friction={0.3}
          restitution={0.5}
        >
          <mesh>
            <boxGeometry args={[0.1, goal.height, goal.depth]} />
            <meshPhongMaterial color={goalColor} />
          </mesh>
        </CuboidCollider>
      </RigidBody>

      {/* Goal ceiling */}
      <RigidBody type="fixed" position={[0, goal.height + 0.05, zOffset]}>
        <CuboidCollider
          args={[goal.width / 2, 0.05, goal.depth / 2]}
          friction={0.3}
          restitution={0.5}
        >
          <mesh>
            <boxGeometry args={[goal.width, 0.1, goal.depth]} />
            <meshPhongMaterial color={goalColor} />
          </mesh>
        </CuboidCollider>
      </RigidBody>
    </group>
  )
}

function GoalFrame({team}: {team: 'blue' | 'orange'}) {
  const {goal} = ARENA
  const color = team === 'blue' ? '#60a5fa' : '#fb923c'
  const zOffset = team === 'orange' ? 0.1 : -0.1

  // Frame posts and crossbar
  const postRadius = 0.15

  return (
    <group position={[0, 0, zOffset]}>
      {/* Left post */}
      <mesh position={[-goal.width / 2, goal.height / 2, 0]} castShadow>
        <cylinderGeometry args={[postRadius, postRadius, goal.height, 8]} />
        <meshPhongMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Right post */}
      <mesh position={[goal.width / 2, goal.height / 2, 0]} castShadow>
        <cylinderGeometry args={[postRadius, postRadius, goal.height, 8]} />
        <meshPhongMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Crossbar */}
      <mesh
        position={[0, goal.height, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[postRadius, postRadius, goal.width, 8]} />
        <meshPhongMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  )
}

function FieldMarkings() {
  const {length, width} = ARENA
  const halfLength = length / 2

  return (
    <group position={[0, 0.01, 0]}>
      {/* Center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, 0.3]} />
        <meshBasicMaterial color={LINE_COLOR} />
      </mesh>

      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.8, 10, 64]} />
        <meshBasicMaterial color={LINE_COLOR} />
      </mesh>

      {/* Goal lines */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, halfLength - 0.15]}
      >
        <planeGeometry args={[width, 0.3]} />
        <meshBasicMaterial color={LINE_COLOR} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, -halfLength + 0.15]}
      >
        <planeGeometry args={[width, 0.3]} />
        <meshBasicMaterial color={LINE_COLOR} />
      </mesh>
    </group>
  )
}
