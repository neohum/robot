'use client'

import React, { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFExporter } from 'three-stdlib'
import type { SkeletonType } from '@/app/creator/page'

interface CreatorSceneProps {
  skeletonType: SkeletonType
  skinColor: string
  outfitModelUrl?: string
  accessoryModelUrls?: string[]
}

// 스켈레톤 타입별 스케일
const SKELETON_SCALES: Record<SkeletonType, number> = {
  humanSmall: 0.8,
  humanMedium: 1.0,
  humanLarge: 1.3,
  quadruped: 0.7,
  biped: 1.1,
  bird: 0.5
}

type BodyPart = 'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftHand' | 'rightHand' | 'leftLeg' | 'rightLeg' | 'leftFoot' | 'rightFoot'

// 22개 기본 관절 정의
export type JointName =
  | 'Hips'           // 1. 엉덩이 (루트)
  | 'Spine'          // 2. 척추
  | 'Spine1'         // 3. 척추1
  | 'Spine2'         // 4. 척추2 (가슴)
  | 'Neck'           // 5. 목
  | 'Head'           // 6. 머리
  | 'LeftShoulder'   // 7. 왼쪽 어깨
  | 'LeftArm'        // 8. 왼쪽 팔
  | 'LeftForeArm'    // 9. 왼쪽 전완
  | 'LeftHand'       // 10. 왼손
  | 'RightShoulder'  // 11. 오른쪽 어깨
  | 'RightArm'       // 12. 오른쪽 팔
  | 'RightForeArm'   // 13. 오른쪽 전완
  | 'RightHand'      // 14. 오른손
  | 'LeftUpLeg'      // 15. 왼쪽 대퇴부
  | 'LeftLeg'        // 16. 왼쪽 정강이
  | 'LeftFoot'       // 17. 왼발
  | 'LeftToeBase'    // 18. 왼발 앞
  | 'RightUpLeg'     // 19. 오른쪽 대퇴부
  | 'RightLeg'       // 20. 오른쪽 정강이
  | 'RightFoot'      // 21. 오른발
  | 'RightToeBase'   // 22. 오른발 앞

// 관절 계층 구조
export const JOINT_HIERARCHY: Record<JointName, JointName | null> = {
  Hips: null,
  Spine: 'Hips',
  Spine1: 'Spine',
  Spine2: 'Spine1',
  Neck: 'Spine2',
  Head: 'Neck',
  LeftShoulder: 'Spine2',
  LeftArm: 'LeftShoulder',
  LeftForeArm: 'LeftArm',
  LeftHand: 'LeftForeArm',
  RightShoulder: 'Spine2',
  RightArm: 'RightShoulder',
  RightForeArm: 'RightArm',
  RightHand: 'RightForeArm',
  LeftUpLeg: 'Hips',
  LeftLeg: 'LeftUpLeg',
  LeftFoot: 'LeftLeg',
  LeftToeBase: 'LeftFoot',
  RightUpLeg: 'Hips',
  RightLeg: 'RightUpLeg',
  RightFoot: 'RightLeg',
  RightToeBase: 'RightFoot',
}

// 22개 관절의 기본 위치 (인간형 기준, 스케일 1.0)
export const getJointPositions = (scale: number, skeletonType: SkeletonType): Record<JointName, [number, number, number]> => {
  const isHuman = skeletonType.startsWith('human')
  const s = scale

  if (isHuman) {
    return {
      Hips: [0, 0.85 * s, 0],
      Spine: [0, 0.95 * s, 0],
      Spine1: [0, 1.05 * s, 0],
      Spine2: [0, 1.2 * s, 0],
      Neck: [0, 1.45 * s, 0],
      Head: [0, 1.6 * s, 0],
      LeftShoulder: [-0.12 * s, 1.35 * s, 0],
      LeftArm: [-0.25 * s, 1.3 * s, 0],
      LeftForeArm: [-0.35 * s, 1.05 * s, 0],
      LeftHand: [-0.4 * s, 0.82 * s, 0],
      RightShoulder: [0.12 * s, 1.35 * s, 0],
      RightArm: [0.25 * s, 1.3 * s, 0],
      RightForeArm: [0.35 * s, 1.05 * s, 0],
      RightHand: [0.4 * s, 0.82 * s, 0],
      LeftUpLeg: [-0.12 * s, 0.8 * s, 0],
      LeftLeg: [-0.12 * s, 0.45 * s, 0],
      LeftFoot: [-0.12 * s, 0.08 * s, 0],
      LeftToeBase: [-0.12 * s, 0.02 * s, 0.1 * s],
      RightUpLeg: [0.12 * s, 0.8 * s, 0],
      RightLeg: [0.12 * s, 0.45 * s, 0],
      RightFoot: [0.12 * s, 0.08 * s, 0],
      RightToeBase: [0.12 * s, 0.02 * s, 0.1 * s],
    }
  }

  // 4발 동물
  if (skeletonType === 'quadruped') {
    return {
      Hips: [-0.2 * s, 0.45 * s, 0],
      Spine: [0, 0.48 * s, 0],
      Spine1: [0.15 * s, 0.5 * s, 0],
      Spine2: [0.28 * s, 0.52 * s, 0],
      Neck: [0.38 * s, 0.55 * s, 0],
      Head: [0.48 * s, 0.58 * s, 0],
      LeftShoulder: [0.22 * s, 0.48 * s, 0.08 * s],
      LeftArm: [0.2 * s, 0.35 * s, 0.1 * s],
      LeftForeArm: [0.19 * s, 0.2 * s, 0.1 * s],
      LeftHand: [0.18 * s, 0.05 * s, 0.1 * s],
      RightShoulder: [0.22 * s, 0.48 * s, -0.08 * s],
      RightArm: [0.2 * s, 0.35 * s, -0.1 * s],
      RightForeArm: [0.19 * s, 0.2 * s, -0.1 * s],
      RightHand: [0.18 * s, 0.05 * s, -0.1 * s],
      LeftUpLeg: [-0.2 * s, 0.4 * s, 0.1 * s],
      LeftLeg: [-0.2 * s, 0.25 * s, 0.1 * s],
      LeftFoot: [-0.2 * s, 0.08 * s, 0.1 * s],
      LeftToeBase: [-0.2 * s, 0.02 * s, 0.12 * s],
      RightUpLeg: [-0.2 * s, 0.4 * s, -0.1 * s],
      RightLeg: [-0.2 * s, 0.25 * s, -0.1 * s],
      RightFoot: [-0.2 * s, 0.08 * s, -0.1 * s],
      RightToeBase: [-0.2 * s, 0.02 * s, -0.12 * s],
    }
  }

  // 2발 동물 (biped)
  if (skeletonType === 'biped') {
    return {
      Hips: [0, 0.55 * s, 0],
      Spine: [0, 0.65 * s, 0],
      Spine1: [0.02 * s, 0.75 * s, 0],
      Spine2: [0.05 * s, 0.85 * s, 0],
      Neck: [0.08 * s, 0.98 * s, 0],
      Head: [0.12 * s, 1.1 * s, 0],
      LeftShoulder: [0.05 * s, 0.82 * s, 0.1 * s],
      LeftArm: [0.08 * s, 0.75 * s, 0.12 * s],
      LeftForeArm: [0.1 * s, 0.68 * s, 0.13 * s],
      LeftHand: [0.12 * s, 0.62 * s, 0.14 * s],
      RightShoulder: [0.05 * s, 0.82 * s, -0.1 * s],
      RightArm: [0.08 * s, 0.75 * s, -0.12 * s],
      RightForeArm: [0.1 * s, 0.68 * s, -0.13 * s],
      RightHand: [0.12 * s, 0.62 * s, -0.14 * s],
      LeftUpLeg: [-0.02 * s, 0.5 * s, 0.1 * s],
      LeftLeg: [-0.02 * s, 0.28 * s, 0.1 * s],
      LeftFoot: [0.02 * s, 0.05 * s, 0.1 * s],
      LeftToeBase: [0.1 * s, 0.02 * s, 0.1 * s],
      RightUpLeg: [-0.02 * s, 0.5 * s, -0.1 * s],
      RightLeg: [-0.02 * s, 0.28 * s, -0.1 * s],
      RightFoot: [0.02 * s, 0.05 * s, -0.1 * s],
      RightToeBase: [0.1 * s, 0.02 * s, -0.1 * s],
    }
  }

  // 새 (bird)
  return {
    Hips: [0, 0.32 * s, 0],
    Spine: [0, 0.35 * s, 0],
    Spine1: [0.02 * s, 0.38 * s, 0],
    Spine2: [0.04 * s, 0.42 * s, 0],
    Neck: [0.08 * s, 0.48 * s, 0],
    Head: [0.12 * s, 0.55 * s, 0],
    LeftShoulder: [0, 0.4 * s, 0.05 * s],
    LeftArm: [0, 0.4 * s, 0.15 * s],
    LeftForeArm: [0, 0.4 * s, 0.28 * s],
    LeftHand: [0, 0.4 * s, 0.38 * s],
    RightShoulder: [0, 0.4 * s, -0.05 * s],
    RightArm: [0, 0.4 * s, -0.15 * s],
    RightForeArm: [0, 0.4 * s, -0.28 * s],
    RightHand: [0, 0.4 * s, -0.38 * s],
    LeftUpLeg: [0, 0.28 * s, 0.04 * s],
    LeftLeg: [0.02 * s, 0.15 * s, 0.04 * s],
    LeftFoot: [0.04 * s, 0.03 * s, 0.04 * s],
    LeftToeBase: [0.08 * s, 0.01 * s, 0.04 * s],
    RightUpLeg: [0, 0.28 * s, -0.04 * s],
    RightLeg: [0.02 * s, 0.15 * s, -0.04 * s],
    RightFoot: [0.04 * s, 0.03 * s, -0.04 * s],
    RightToeBase: [0.08 * s, 0.01 * s, -0.04 * s],
  }
}

// 22개 관절 목록
export const ALL_JOINTS: JointName[] = [
  'Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
  'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
  'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
  'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase',
  'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase'
]

interface BodyPartMeshProps {
  part: BodyPart
  skinColor: string
  skeletonScale: number
  skeletonType: SkeletonType
}

// 신체 부위 메쉬 (피부색으로만 렌더링)
function BodyPartMesh({ part, skinColor, skeletonScale, skeletonType }: BodyPartMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const isHuman = skeletonType.startsWith('human')

  // 부위별 위치와 크기 설정
  const getPartConfig = (): { position: [number, number, number]; size: [number, number, number]; rotation?: [number, number, number] } => {
    const s = skeletonScale

    // 인간형
    if (isHuman) {
      switch (part) {
        case 'head':
          return { position: [0, 1.7 * s, 0], size: [0.25 * s, 0.3 * s, 0.25 * s] }
        case 'torso':
          return { position: [0, 1.1 * s, 0], size: [0.4 * s, 0.5 * s, 0.25 * s] }
        case 'leftArm':
          return { position: [-0.35 * s, 1.2 * s, 0], size: [0.12 * s, 0.35 * s, 0.12 * s] }
        case 'rightArm':
          return { position: [0.35 * s, 1.2 * s, 0], size: [0.12 * s, 0.35 * s, 0.12 * s] }
        case 'leftHand':
          return { position: [-0.35 * s, 0.75 * s, 0], size: [0.08 * s, 0.12 * s, 0.06 * s] }
        case 'rightHand':
          return { position: [0.35 * s, 0.75 * s, 0], size: [0.08 * s, 0.12 * s, 0.06 * s] }
        case 'leftLeg':
          return { position: [-0.15 * s, 0.45 * s, 0], size: [0.12 * s, 0.4 * s, 0.12 * s] }
        case 'rightLeg':
          return { position: [0.15 * s, 0.45 * s, 0], size: [0.12 * s, 0.4 * s, 0.12 * s] }
        case 'leftFoot':
          return { position: [-0.15 * s, 0.08 * s, 0.05 * s], size: [0.1 * s, 0.08 * s, 0.18 * s] }
        case 'rightFoot':
          return { position: [0.15 * s, 0.08 * s, 0.05 * s], size: [0.1 * s, 0.08 * s, 0.18 * s] }
        default:
          return { position: [0, 0, 0], size: [0.1, 0.1, 0.1] }
      }
    }

    // 4발 동물 (quadruped)
    if (skeletonType === 'quadruped') {
      switch (part) {
        case 'head':
          return { position: [0.45 * s, 0.55 * s, 0], size: [0.15 * s, 0.12 * s, 0.1 * s] }
        case 'torso':
          return { position: [0, 0.45 * s, 0], size: [0.5 * s, 0.2 * s, 0.18 * s], rotation: [0, 0, Math.PI / 2] }
        case 'leftArm':
          return { position: [0.18 * s, 0.22 * s, 0.1 * s], size: [0.06 * s, 0.28 * s, 0.06 * s] }
        case 'rightArm':
          return { position: [0.18 * s, 0.22 * s, -0.1 * s], size: [0.06 * s, 0.28 * s, 0.06 * s] }
        case 'leftHand':
          return { position: [0.18 * s, 0.04 * s, 0.1 * s], size: [0.05 * s, 0.04 * s, 0.06 * s] }
        case 'rightHand':
          return { position: [0.18 * s, 0.04 * s, -0.1 * s], size: [0.05 * s, 0.04 * s, 0.06 * s] }
        case 'leftLeg':
          return { position: [-0.18 * s, 0.22 * s, 0.1 * s], size: [0.07 * s, 0.28 * s, 0.07 * s] }
        case 'rightLeg':
          return { position: [-0.18 * s, 0.22 * s, -0.1 * s], size: [0.07 * s, 0.28 * s, 0.07 * s] }
        case 'leftFoot':
          return { position: [-0.18 * s, 0.04 * s, 0.1 * s], size: [0.06 * s, 0.04 * s, 0.07 * s] }
        case 'rightFoot':
          return { position: [-0.18 * s, 0.04 * s, -0.1 * s], size: [0.06 * s, 0.04 * s, 0.07 * s] }
        default:
          return { position: [0, 0, 0], size: [0.1, 0.1, 0.1] }
      }
    }

    // 2발 동물 (biped)
    if (skeletonType === 'biped') {
      switch (part) {
        case 'head':
          return { position: [0.15 * s, 1.1 * s, 0], size: [0.2 * s, 0.15 * s, 0.12 * s] }
        case 'torso':
          return { position: [0, 0.65 * s, 0], size: [0.25 * s, 0.45 * s, 0.18 * s], rotation: [0.2, 0, 0] }
        case 'leftArm':
          return { position: [0.1 * s, 0.75 * s, 0.12 * s], size: [0.04 * s, 0.12 * s, 0.04 * s], rotation: [0.3, 0, -0.5] }
        case 'rightArm':
          return { position: [0.1 * s, 0.75 * s, -0.12 * s], size: [0.04 * s, 0.12 * s, 0.04 * s], rotation: [-0.3, 0, -0.5] }
        case 'leftHand':
          return { position: [0.12 * s, 0.65 * s, 0.14 * s], size: [0.03 * s, 0.04 * s, 0.03 * s] }
        case 'rightHand':
          return { position: [0.12 * s, 0.65 * s, -0.14 * s], size: [0.03 * s, 0.04 * s, 0.03 * s] }
        case 'leftLeg':
          return { position: [-0.02 * s, 0.3 * s, 0.1 * s], size: [0.1 * s, 0.35 * s, 0.1 * s] }
        case 'rightLeg':
          return { position: [-0.02 * s, 0.3 * s, -0.1 * s], size: [0.1 * s, 0.35 * s, 0.1 * s] }
        case 'leftFoot':
          return { position: [0.05 * s, 0.05 * s, 0.1 * s], size: [0.12 * s, 0.05 * s, 0.1 * s] }
        case 'rightFoot':
          return { position: [0.05 * s, 0.05 * s, -0.1 * s], size: [0.12 * s, 0.05 * s, 0.1 * s] }
        default:
          return { position: [0, 0, 0], size: [0.1, 0.1, 0.1] }
      }
    }

    // 새 (bird)
    switch (part) {
      case 'head':
        return { position: [0.12 * s, 0.55 * s, 0], size: [0.1 * s, 0.1 * s, 0.08 * s] }
      case 'torso':
        return { position: [0, 0.35 * s, 0], size: [0.15 * s, 0.2 * s, 0.12 * s] }
      case 'leftArm':
        return { position: [0, 0.4 * s, 0.15 * s], size: [0.18 * s, 0.03 * s, 0.25 * s], rotation: [0.4, 0, 0] }
      case 'rightArm':
        return { position: [0, 0.4 * s, -0.15 * s], size: [0.18 * s, 0.03 * s, 0.25 * s], rotation: [-0.4, 0, 0] }
      case 'leftHand':
        return { position: [0, 0, 0], size: [0, 0, 0] }
      case 'rightHand':
        return { position: [0, 0, 0], size: [0, 0, 0] }
      case 'leftLeg':
        return { position: [0.02 * s, 0.15 * s, 0.04 * s], size: [0.02 * s, 0.18 * s, 0.02 * s] }
      case 'rightLeg':
        return { position: [0.02 * s, 0.15 * s, -0.04 * s], size: [0.02 * s, 0.18 * s, 0.02 * s] }
      case 'leftFoot':
        return { position: [0.04 * s, 0.03 * s, 0.04 * s], size: [0.05 * s, 0.02 * s, 0.04 * s] }
      case 'rightFoot':
        return { position: [0.04 * s, 0.03 * s, -0.04 * s], size: [0.05 * s, 0.02 * s, 0.04 * s] }
      default:
        return { position: [0, 0, 0], size: [0.1, 0.1, 0.1] }
    }
  }

  const config = getPartConfig()

  // 크기가 0이면 렌더링하지 않음
  if (config.size[0] === 0 && config.size[1] === 0 && config.size[2] === 0) {
    return null
  }

  // 둥근 스타일 지오메트리
  const getGeometry = () => {
    const [w, h, d] = config.size
    if (part === 'head') {
      return <sphereGeometry args={[w, 16, 16]} />
    }
    return <capsuleGeometry args={[Math.min(w, d) / 2, h - Math.min(w, d), 8, 16]} />
  }

  return (
    <mesh
      ref={meshRef}
      position={config.position}
      rotation={config.rotation as [number, number, number] | undefined}
      name={part}
      castShadow
      receiveShadow
    >
      {getGeometry()}
      <meshStandardMaterial
        color={skinColor}
        metalness={0.3}
        roughness={0.5}
      />
    </mesh>
  )
}

// 관절 간 뼈 연결선 컴포넌트
function Bone({ start, end, color = '#666666', thickness = 0.01 }: {
  start: [number, number, number]
  end: [number, number, number]
  color?: string
  thickness?: number
}) {
  const startVec = new THREE.Vector3(...start)
  const endVec = new THREE.Vector3(...end)
  const direction = new THREE.Vector3().subVectors(endVec, startVec)
  const length = direction.length()

  if (length < 0.001) return null

  const midpoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5)
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())

  return (
    <mesh position={[midpoint.x, midpoint.y, midpoint.z]} quaternion={quaternion}>
      <cylinderGeometry args={[thickness, thickness, length, 6]} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
    </mesh>
  )
}

// 22개 관절을 시각화하는 컴포넌트
function SkeletonJoints({ scale, skeletonType }: { scale: number; skeletonType: SkeletonType }) {
  const jointPositions = getJointPositions(scale, skeletonType)
  const jointRadius = 0.02 * scale
  const boneThickness = 0.008 * scale

  // 관절 색상 (부위별로 다르게)
  const getJointColor = (joint: JointName): string => {
    if (joint === 'Hips') return '#FF6B6B'
    if (joint.includes('Spine') || joint === 'Neck') return '#4ECDC4'
    if (joint === 'Head') return '#FFE66D'
    if (joint.includes('Left')) return '#95E1D3'
    if (joint.includes('Right')) return '#F38181'
    return '#888888'
  }

  return (
    <group name="skeleton-joints">
      {ALL_JOINTS.map((joint) => (
        <mesh key={joint} position={jointPositions[joint]} name={`joint-${joint}`}>
          <sphereGeometry args={[jointRadius, 8, 8]} />
          <meshStandardMaterial color={getJointColor(joint)} metalness={0.2} roughness={0.6} />
        </mesh>
      ))}
      {ALL_JOINTS.map((joint) => {
        const parent = JOINT_HIERARCHY[joint]
        if (!parent) return null
        return (
          <Bone
            key={`bone-${joint}`}
            start={jointPositions[parent]}
            end={jointPositions[joint]}
            color="#555555"
            thickness={boneThickness}
          />
        )
      })}
    </group>
  )
}

interface RobotModelProps {
  skeletonType: SkeletonType
  skinColor: string
}

function RobotModel({ skeletonType, skinColor }: RobotModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const scale = SKELETON_SCALES[skeletonType]
  const isHuman = skeletonType.startsWith('human')

  // 자동 회전
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3
    }
  })

  // GLB 내보내기 이벤트 리스너
  useEffect(() => {
    const handleExport = (event: CustomEvent) => {
      if (!groupRef.current) return

      const exporter = new GLTFExporter()
      exporter.parse(
        groupRef.current,
        (result) => {
          const output = result as ArrayBuffer
          const blob = new Blob([output], { type: 'application/octet-stream' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${event.detail.name || 'character'}.glb`
          link.click()
          URL.revokeObjectURL(url)
        },
        (error) => {
          console.error('GLB 내보내기 오류:', error)
        },
        { binary: true }
      )
    }

    window.addEventListener('exportGLB', handleExport as EventListener)
    return () => {
      window.removeEventListener('exportGLB', handleExport as EventListener)
    }
  }, [])

  const bodyParts: BodyPart[] = [
    'head', 'torso', 'leftArm', 'rightArm',
    'leftHand', 'rightHand', 'leftLeg', 'rightLeg',
    'leftFoot', 'rightFoot'
  ]

  return (
    <group ref={groupRef}>
      {bodyParts.map((part) => (
        <BodyPartMesh
          key={part}
          part={part}
          skinColor={skinColor}
          skeletonScale={scale}
          skeletonType={skeletonType}
        />
      ))}

      {/* 22개 관절 표시 */}
      <SkeletonJoints scale={scale} skeletonType={skeletonType} />

      {/* 4발 동물 특수 부위 */}
      {skeletonType === 'quadruped' && (
        <>
          <mesh position={[0.4 * scale, 0.65 * scale, 0.06 * scale]} castShadow>
            <coneGeometry args={[0.03 * scale, 0.1 * scale, 8]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          <mesh position={[0.4 * scale, 0.65 * scale, -0.06 * scale]} castShadow>
            <coneGeometry args={[0.03 * scale, 0.1 * scale, 8]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          <mesh position={[0.55 * scale, 0.52 * scale, 0]} castShadow>
            <boxGeometry args={[0.08 * scale, 0.05 * scale, 0.05 * scale]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          <mesh position={[-0.35 * scale, 0.5 * scale, 0]} rotation={[0, 0, 0.8]} castShadow>
            <cylinderGeometry args={[0.015 * scale, 0.03 * scale, 0.2 * scale, 8]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          <mesh position={[0.3 * scale, 0.5 * scale, 0]} rotation={[0, 0, -0.4]} castShadow>
            <cylinderGeometry args={[0.06 * scale, 0.08 * scale, 0.12 * scale, 12]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
        </>
      )}

      {/* 2발 동물 특수 부위 */}
      {skeletonType === 'biped' && (
        <>
          <mesh position={[0.08 * scale, 0.95 * scale, 0]} rotation={[0, 0, -0.3]} castShadow>
            <cylinderGeometry args={[0.05 * scale, 0.07 * scale, 0.15 * scale, 12]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          <mesh position={[-0.2 * scale, 0.5 * scale, 0]} rotation={[0, 0, 0.6]} castShadow>
            <coneGeometry args={[0.06 * scale, 0.35 * scale, 8]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
        </>
      )}

      {/* 새 특수 부위 */}
      {skeletonType === 'bird' && (
        <>
          <mesh position={[0.08 * scale, 0.48 * scale, 0]} rotation={[0, 0, -0.4]} castShadow>
            <cylinderGeometry args={[0.025 * scale, 0.035 * scale, 0.1 * scale, 10]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          <mesh position={[0.2 * scale, 0.53 * scale, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <coneGeometry args={[0.02 * scale, 0.08 * scale, 6]} />
            <meshStandardMaterial color="#FFD700" />
          </mesh>
          <mesh position={[-0.12 * scale, 0.32 * scale, 0]} rotation={[0, 0, 0.5]} castShadow>
            <boxGeometry args={[0.15 * scale, 0.02 * scale, 0.06 * scale]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
        </>
      )}
    </group>
  )
}

// 외부 GLB 모델 로더
function ExternalModel({ url, scale = 1, position = [0, 0, 0] as [number, number, number] }: {
  url: string
  scale?: number
  position?: [number, number, number]
}) {
  const { scene } = useGLTF(url)
  const modelRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const targetSize = 1.5 * scale
      const scaleFactor = targetSize / maxDim

      scene.scale.setScalar(scaleFactor)

      box.setFromObject(scene)
      const minY = box.min.y
      scene.position.y = -minY + position[1]
      scene.position.x = position[0]
      scene.position.z = position[2]
    }
  }, [scene, scale, position])

  return (
    <group ref={modelRef}>
      <primitive object={scene.clone()} />
    </group>
  )
}

function Scene({ skeletonType, skinColor, outfitModelUrl, accessoryModelUrls = [] }: CreatorSceneProps) {
  const scale = SKELETON_SCALES[skeletonType]

  // 스켈레톤 타입에 따른 카메라 타겟
  const cameraTarget: [number, number, number] = skeletonType.startsWith('human')
    ? [0, 1, 0]
    : skeletonType === 'bird'
      ? [0, 0.3, 0]
      : [0, 0.5, 0]

  return (
    <>
      <PerspectiveCamera makeDefault position={[3, 2, 4]} fov={50} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={10}
        target={cameraTarget}
      />

      {/* 조명 */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-3, 5, -3]} intensity={0.3} color="#b3d9ff" />
      <pointLight position={[0, 3, 3]} intensity={0.2} />

      {/* 기본 캐릭터 모델 (피부색) */}
      <RobotModel
        skeletonType={skeletonType}
        skinColor={skinColor}
      />

      {/* 의상 모델 (외부 GLB) */}
      {outfitModelUrl && (
        <Suspense fallback={null}>
          <ExternalModel url={outfitModelUrl} scale={scale} />
        </Suspense>
      )}

      {/* 악세서리 모델들 (외부 GLB) */}
      {accessoryModelUrls.map((url, index) => (
        <Suspense key={`accessory-${index}`} fallback={null}>
          <ExternalModel
            url={url}
            scale={scale * 0.5}
            position={[0, 0.2 * index, 0]}
          />
        </Suspense>
      ))}

      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* 그리드 */}
      <Grid
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#4a4a6a"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#6a6a8a"
        fadeDistance={15}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
        position={[0, 0.01, 0]}
      />
    </>
  )
}

export default function CreatorScene(props: CreatorSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <Scene {...props} />
      </Canvas>
    </div>
  )
}
