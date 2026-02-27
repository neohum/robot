'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { degToRad } from '@/lib/constants'
import { HumanoidJointAngles, Position3D } from '@/lib/types/robot'

interface HumanoidRobotProps {
  jointAngles: HumanoidJointAngles;
  position?: Position3D;
}

// 건담 색상 스키마
const COLORS = {
  white: '#f5f5f5',
  blue: '#1e40af',
  red: '#dc2626',
  yellow: '#fbbf24',
  darkGray: '#374151',
  lightGray: '#9ca3af',
  green: '#22c55e',
}

export default function HumanoidRobot({ jointAngles, position = { x: 0, y: 0, z: 0 } }: HumanoidRobotProps) {
  const torsoRef = useRef<THREE.Group>(null)
  const neckYawRef = useRef<THREE.Group>(null)
  const neckPitchRef = useRef<THREE.Group>(null)
  const leftShoulderPitchRef = useRef<THREE.Group>(null)
  const leftShoulderYawRef = useRef<THREE.Group>(null)
  const leftElbowRef = useRef<THREE.Group>(null)
  const leftWristRef = useRef<THREE.Group>(null)
  const rightShoulderPitchRef = useRef<THREE.Group>(null)
  const rightShoulderYawRef = useRef<THREE.Group>(null)
  const rightElbowRef = useRef<THREE.Group>(null)
  const rightWristRef = useRef<THREE.Group>(null)
  const leftHipPitchRef = useRef<THREE.Group>(null)
  const leftHipYawRef = useRef<THREE.Group>(null)
  const leftKneeRef = useRef<THREE.Group>(null)
  const leftAnkleRef = useRef<THREE.Group>(null)
  const rightHipPitchRef = useRef<THREE.Group>(null)
  const rightHipYawRef = useRef<THREE.Group>(null)
  const rightKneeRef = useRef<THREE.Group>(null)
  const rightAnkleRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (torsoRef.current) torsoRef.current.rotation.y = degToRad(jointAngles.torso)
    if (neckYawRef.current) neckYawRef.current.rotation.y = degToRad(jointAngles.neckYaw)
    if (neckPitchRef.current) neckPitchRef.current.rotation.x = degToRad(jointAngles.neckPitch)
    if (leftShoulderPitchRef.current) leftShoulderPitchRef.current.rotation.y = degToRad(jointAngles.leftShoulderPitch)
    if (leftShoulderYawRef.current) leftShoulderYawRef.current.rotation.z = degToRad(jointAngles.leftShoulderYaw)
    if (leftElbowRef.current) leftElbowRef.current.rotation.y = degToRad(jointAngles.leftElbow)
    if (leftWristRef.current) leftWristRef.current.rotation.z = degToRad(jointAngles.leftWrist)
    if (rightShoulderPitchRef.current) rightShoulderPitchRef.current.rotation.y = degToRad(-jointAngles.rightShoulderPitch)
    if (rightShoulderYawRef.current) rightShoulderYawRef.current.rotation.z = degToRad(jointAngles.rightShoulderYaw)
    if (rightElbowRef.current) rightElbowRef.current.rotation.y = degToRad(-jointAngles.rightElbow)
    if (rightWristRef.current) rightWristRef.current.rotation.z = degToRad(jointAngles.rightWrist)
    if (leftHipPitchRef.current) leftHipPitchRef.current.rotation.x = degToRad(jointAngles.leftHipPitch)
    if (leftHipYawRef.current) leftHipYawRef.current.rotation.y = degToRad(jointAngles.leftHipYaw)
    if (leftKneeRef.current) leftKneeRef.current.rotation.x = degToRad(jointAngles.leftKnee)
    if (leftAnkleRef.current) leftAnkleRef.current.rotation.x = degToRad(jointAngles.leftAnkle)
    if (rightHipPitchRef.current) rightHipPitchRef.current.rotation.x = degToRad(jointAngles.rightHipPitch)
    if (rightHipYawRef.current) rightHipYawRef.current.rotation.y = degToRad(jointAngles.rightHipYaw)
    if (rightKneeRef.current) rightKneeRef.current.rotation.x = degToRad(jointAngles.rightKnee)
    if (rightAnkleRef.current) rightAnkleRef.current.rotation.x = degToRad(jointAngles.rightAnkle)
  })

  // 건담 헤드
  const GundamHead = () => (
    <group>
      {/* 메인 헤드 */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[0.55, 0.5, 0.45]} />
        <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* 페이스 플레이트 */}
      <mesh castShadow position={[0, 0.25, 0.2]}>
        <boxGeometry args={[0.45, 0.25, 0.15]} />
        <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* 턱 가드 */}
      <mesh castShadow position={[0, 0.1, 0.18]}>
        <boxGeometry args={[0.4, 0.15, 0.12]} />
        <meshStandardMaterial color={COLORS.red} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* V-핀 */}
      <mesh castShadow position={[-0.2, 0.7, 0.1]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.35, 0.08, 0.04]} />
        <meshStandardMaterial color={COLORS.yellow} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0.2, 0.7, 0.1]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.35, 0.08, 0.04]} />
        <meshStandardMaterial color={COLORS.yellow} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 센터 크레스트 */}
      <mesh castShadow position={[0, 0.65, 0.15]}>
        <boxGeometry args={[0.08, 0.15, 0.06]} />
        <meshStandardMaterial color={COLORS.red} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* 눈 */}
      <mesh position={[-0.12, 0.35, 0.26]}>
        <boxGeometry args={[0.12, 0.06, 0.02]} />
        <meshStandardMaterial color={COLORS.green} emissive={COLORS.green} emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0.12, 0.35, 0.26]}>
        <boxGeometry args={[0.12, 0.06, 0.02]} />
        <meshStandardMaterial color={COLORS.green} emissive={COLORS.green} emissiveIntensity={1.5} />
      </mesh>

      {/* 사이드 헬멧 */}
      <mesh castShadow position={[-0.32, 0.35, 0]}>
        <boxGeometry args={[0.12, 0.4, 0.35]} />
        <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0.32, 0.35, 0]}>
        <boxGeometry args={[0.12, 0.4, 0.35]} />
        <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* 에어 인테이크 */}
      <mesh castShadow position={[-0.35, 0.2, 0.1]}>
        <boxGeometry args={[0.08, 0.15, 0.2]} />
        <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0.35, 0.2, 0.1]}>
        <boxGeometry args={[0.08, 0.15, 0.2]} />
        <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )

  // 건담 손
  const GundamHand = ({ gripValue, mirror = false }: { gripValue: number; mirror?: boolean }) => {
    const offset = gripValue * 0.1
    return (
      <group>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.12, 0.18]} />
          <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.12, -0.06 - offset]} castShadow>
          <boxGeometry args={[0.18, 0.2, 0.05]} />
          <meshStandardMaterial color={COLORS.darkGray} metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.12, 0.06 + offset]} castShadow>
          <boxGeometry args={[0.18, 0.2, 0.05]} />
          <meshStandardMaterial color={COLORS.darkGray} metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[mirror ? 0.1 : -0.1, -0.08, 0]} castShadow>
          <boxGeometry args={[0.06, 0.15, 0.08]} />
          <meshStandardMaterial color={COLORS.darkGray} metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
    )
  }

  // 어깨 아머
  const ShoulderArmor = ({ mirror = false }: { mirror?: boolean }) => (
    <group>
      <mesh castShadow position={[mirror ? -0.15 : 0.15, 0.1, 0]}>
        <boxGeometry args={[0.5, 0.35, 0.4]} />
        <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[mirror ? -0.2 : 0.2, 0.3, 0]}>
        <boxGeometry args={[0.35, 0.12, 0.35]} />
        <meshStandardMaterial color={COLORS.blue} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[mirror ? -0.15 : 0.15, 0.05, 0.21]}>
        <boxGeometry args={[0.4, 0.08, 0.02]} />
        <meshStandardMaterial color={COLORS.red} metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 베이스 */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.1, 32]} />
        <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 몸통 그룹 */}
      <group ref={torsoRef} position={[0, 0, 0]}>
        <group position={[0, 3.5, 0]}>

          {/* 상체 */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[1.3, 1.2, 0.7]} />
            <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
          </mesh>

          {/* 가슴 벤트 */}
          <mesh position={[-0.25, 0.7, 0.36]} castShadow>
            <boxGeometry args={[0.35, 0.25, 0.1]} />
            <meshStandardMaterial color={COLORS.blue} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0.25, 0.7, 0.36]} castShadow>
            <boxGeometry args={[0.35, 0.25, 0.1]} />
            <meshStandardMaterial color={COLORS.blue} metalness={0.5} roughness={0.4} />
          </mesh>

          {/* 콕핏 해치 */}
          <mesh position={[0, 0.4, 0.36]} castShadow>
            <boxGeometry args={[0.3, 0.35, 0.08]} />
            <meshStandardMaterial color={COLORS.yellow} metalness={0.7} roughness={0.2} />
          </mesh>

          {/* 복부 */}
          <mesh position={[0, -0.15, 0]} castShadow>
            <boxGeometry args={[0.8, 0.5, 0.5]} />
            <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
          </mesh>

          {/* 허리 아머 */}
          <mesh position={[0, -0.5, 0]} castShadow>
            <boxGeometry args={[1.1, 0.3, 0.55]} />
            <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
          </mesh>

          {/* 스커트 아머 */}
          <mesh position={[0, -0.75, 0.2]} castShadow>
            <boxGeometry args={[0.9, 0.35, 0.15]} />
            <meshStandardMaterial color={COLORS.blue} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[-0.5, -0.75, 0]} castShadow>
            <boxGeometry args={[0.2, 0.4, 0.4]} />
            <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.5, -0.75, 0]} castShadow>
            <boxGeometry args={[0.2, 0.4, 0.4]} />
            <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
          </mesh>

          {/* 머리 */}
          <group position={[0, 1.4, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.15, 0.2, 0.25, 8]} />
              <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
            </mesh>
            <group ref={neckYawRef}>
              <group ref={neckPitchRef} position={[0, 0.2, 0]}>
                <GundamHead />
              </group>
            </group>
          </group>

          {/* 왼팔 */}
          <group position={[0.8, 0.8, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
            </mesh>
            <ShoulderArmor />
            <group ref={leftShoulderPitchRef}>
              <group ref={leftShoulderYawRef}>
                <mesh position={[0.45, 0, 0]} castShadow>
                  <boxGeometry args={[0.7, 0.25, 0.25]} />
                  <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
                </mesh>
                <group position={[0.85, 0, 0]}>
                  <mesh castShadow>
                    <sphereGeometry args={[0.14, 16, 16]} />
                    <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
                  </mesh>
                  <group ref={leftElbowRef}>
                    <mesh position={[0.4, 0, 0]} castShadow>
                      <boxGeometry args={[0.6, 0.22, 0.22]} />
                      <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
                    </mesh>
                    <mesh position={[0.35, 0, 0.12]} castShadow>
                      <boxGeometry args={[0.4, 0.18, 0.1]} />
                      <meshStandardMaterial color={COLORS.red} metalness={0.5} roughness={0.4} />
                    </mesh>
                    <group position={[0.75, 0, 0]}>
                      <mesh castShadow>
                        <sphereGeometry args={[0.1, 16, 16]} />
                        <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
                      </mesh>
                      <group ref={leftWristRef}>
                        <group position={[0.18, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                          <GundamHand gripValue={jointAngles.leftGrip} />
                        </group>
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>

          {/* 오른팔 */}
          <group position={[-0.8, 0.8, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
            </mesh>
            <ShoulderArmor mirror />
            <group ref={rightShoulderPitchRef}>
              <group ref={rightShoulderYawRef}>
                <mesh position={[-0.45, 0, 0]} castShadow>
                  <boxGeometry args={[0.7, 0.25, 0.25]} />
                  <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
                </mesh>
                <group position={[-0.85, 0, 0]}>
                  <mesh castShadow>
                    <sphereGeometry args={[0.14, 16, 16]} />
                    <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
                  </mesh>
                  <group ref={rightElbowRef}>
                    <mesh position={[-0.4, 0, 0]} castShadow>
                      <boxGeometry args={[0.6, 0.22, 0.22]} />
                      <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
                    </mesh>
                    <mesh position={[-0.35, 0, 0.12]} castShadow>
                      <boxGeometry args={[0.4, 0.18, 0.1]} />
                      <meshStandardMaterial color={COLORS.red} metalness={0.5} roughness={0.4} />
                    </mesh>
                    <group position={[-0.75, 0, 0]}>
                      <mesh castShadow>
                        <sphereGeometry args={[0.1, 16, 16]} />
                        <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
                      </mesh>
                      <group ref={rightWristRef}>
                        <group position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                          <GundamHand gripValue={jointAngles.rightGrip} mirror />
                        </group>
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>

          {/* 왼다리 */}
          <group position={[0.35, -1.0, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
            </mesh>
            <group ref={leftHipYawRef}>
              <group ref={leftHipPitchRef}>
                <mesh position={[0, -0.55, 0]} castShadow>
                  <boxGeometry args={[0.32, 0.9, 0.32]} />
                  <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
                </mesh>
                <mesh position={[0.15, -0.4, 0.15]} castShadow>
                  <boxGeometry args={[0.1, 0.5, 0.1]} />
                  <meshStandardMaterial color={COLORS.blue} metalness={0.5} roughness={0.4} />
                </mesh>
                <group position={[0, -1.1, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.28, 0.2, 0.35]} />
                    <meshStandardMaterial color={COLORS.red} metalness={0.5} roughness={0.4} />
                  </mesh>
                  <group ref={leftKneeRef}>
                    <mesh position={[0, -0.55, 0]} castShadow>
                      <boxGeometry args={[0.28, 0.85, 0.28]} />
                      <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
                    </mesh>
                    <mesh position={[0, -0.5, -0.18]} castShadow>
                      <boxGeometry args={[0.2, 0.4, 0.12]} />
                      <meshStandardMaterial color={COLORS.blue} metalness={0.5} roughness={0.4} />
                    </mesh>
                    <group position={[0, -1.05, 0]}>
                      <mesh castShadow>
                        <sphereGeometry args={[0.1, 16, 16]} />
                        <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
                      </mesh>
                      <group ref={leftAnkleRef}>
                        <mesh position={[0, -0.12, 0.12]} castShadow>
                          <boxGeometry args={[0.3, 0.18, 0.5]} />
                          <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
                        </mesh>
                        <mesh position={[0, -0.15, 0.38]} castShadow>
                          <boxGeometry args={[0.25, 0.12, 0.15]} />
                          <meshStandardMaterial color={COLORS.blue} metalness={0.5} roughness={0.4} />
                        </mesh>
                        <mesh position={[0, -0.12, -0.12]} castShadow>
                          <boxGeometry args={[0.25, 0.15, 0.15]} />
                          <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
                        </mesh>
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>

          {/* 오른다리 */}
          <group position={[-0.35, -1.0, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
            </mesh>
            <group ref={rightHipYawRef}>
              <group ref={rightHipPitchRef}>
                <mesh position={[0, -0.55, 0]} castShadow>
                  <boxGeometry args={[0.32, 0.9, 0.32]} />
                  <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
                </mesh>
                <mesh position={[-0.15, -0.4, 0.15]} castShadow>
                  <boxGeometry args={[0.1, 0.5, 0.1]} />
                  <meshStandardMaterial color={COLORS.blue} metalness={0.5} roughness={0.4} />
                </mesh>
                <group position={[0, -1.1, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.28, 0.2, 0.35]} />
                    <meshStandardMaterial color={COLORS.red} metalness={0.5} roughness={0.4} />
                  </mesh>
                  <group ref={rightKneeRef}>
                    <mesh position={[0, -0.55, 0]} castShadow>
                      <boxGeometry args={[0.28, 0.85, 0.28]} />
                      <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
                    </mesh>
                    <mesh position={[0, -0.5, -0.18]} castShadow>
                      <boxGeometry args={[0.2, 0.4, 0.12]} />
                      <meshStandardMaterial color={COLORS.blue} metalness={0.5} roughness={0.4} />
                    </mesh>
                    <group position={[0, -1.05, 0]}>
                      <mesh castShadow>
                        <sphereGeometry args={[0.1, 16, 16]} />
                        <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
                      </mesh>
                      <group ref={rightAnkleRef}>
                        <mesh position={[0, -0.12, 0.12]} castShadow>
                          <boxGeometry args={[0.3, 0.18, 0.5]} />
                          <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
                        </mesh>
                        <mesh position={[0, -0.15, 0.38]} castShadow>
                          <boxGeometry args={[0.25, 0.12, 0.15]} />
                          <meshStandardMaterial color={COLORS.blue} metalness={0.5} roughness={0.4} />
                        </mesh>
                        <mesh position={[0, -0.12, -0.12]} castShadow>
                          <boxGeometry args={[0.25, 0.15, 0.15]} />
                          <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
                        </mesh>
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>

          {/* 백팩 */}
          <group position={[0, 0.5, -0.45]}>
            <mesh castShadow>
              <boxGeometry args={[0.9, 0.8, 0.35]} />
              <meshStandardMaterial color={COLORS.white} metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[-0.25, -0.1, -0.2]} castShadow>
              <cylinderGeometry args={[0.12, 0.15, 0.25, 8]} />
              <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.25, -0.1, -0.2]} castShadow>
              <cylinderGeometry args={[0.12, 0.15, 0.25, 8]} />
              <meshStandardMaterial color={COLORS.darkGray} metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[-0.25, -0.25, -0.15]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
              <meshStandardMaterial color={COLORS.yellow} metalness={0.7} roughness={0.2} />
            </mesh>
            <mesh position={[0.25, -0.25, -0.15]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
              <meshStandardMaterial color={COLORS.yellow} metalness={0.7} roughness={0.2} />
            </mesh>
            <mesh position={[-0.35, 0.5, 0]} castShadow rotation={[0.3, 0, -0.2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
              <meshStandardMaterial color={COLORS.lightGray} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.35, 0.5, 0]} castShadow rotation={[0.3, 0, 0.2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
              <meshStandardMaterial color={COLORS.lightGray} metalness={0.7} roughness={0.3} />
            </mesh>
          </group>

        </group>
      </group>
    </group>
  )
}
