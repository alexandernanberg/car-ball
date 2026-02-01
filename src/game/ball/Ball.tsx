import type {Entity} from 'koota'
import {useLayoutEffect, useRef} from 'react'
import {RigidBody, BallCollider, type RigidBodyApi} from '~/ecs/physics'
import {IsGameBall, BallState, BallConfig} from './traits'

interface GameBallProps {
  position?: [number, number, number]
  entityRef?: React.MutableRefObject<Entity | null>
}

/**
 * The game ball - a bouncy sphere that players hit into goals
 */
export function GameBall({position = [0, 2, 0], entityRef}: GameBallProps) {
  const rigidBodyRef = useRef<RigidBodyApi>(null)

  useLayoutEffect(() => {
    const rb = rigidBodyRef.current
    if (!rb?.entity) return

    const entity = rb.entity

    if (entityRef) {
      entityRef.current = entity
    }

    // Add ball traits
    entity.add(IsGameBall)
    entity.add(BallState)
    entity.add(BallConfig)
  }, [entityRef])

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type="dynamic"
      linearDamping={0.1}
      angularDamping={0.1}
      ccd
    >
      <BallCollider
        radius={1.0}
        friction={0.3}
        restitution={0.6}
        density={0.3} // Lighter than car
      >
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1.0, 32, 32]} />
          <meshPhongMaterial
            color="#ffffff"
            emissive="#333333"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Ball pattern - hexagon/pentagon pattern hint */}
        <mesh>
          <sphereGeometry args={[1.01, 32, 32]} />
          <meshPhongMaterial
            color="#111111"
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      </BallCollider>
    </RigidBody>
  )
}
