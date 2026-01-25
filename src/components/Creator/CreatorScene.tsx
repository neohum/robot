'use client'

import React, { useRef, useEffect, Suspense, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFExporter } from 'three-stdlib'
import type { SkeletonType, OutfitConfig, AccessoryConfig, SelectedModel } from '@/app/creator/page'
import ModelLoader from '../ModelLoader'
import { ModelErrorBoundary } from '../ModelErrorBoundary'

interface CreatorSceneProps {
  skeletonType: SkeletonType
  skinColor: string
  outfitConfig?: OutfitConfig
  accessoryConfig?: AccessoryConfig
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

// 22개 본으로 구성된 스켈레톤 생성
function createSkeleton(scale: number, skeletonType: SkeletonType): { skeleton: THREE.Skeleton; rootBone: THREE.Bone; bones: Record<JointName, THREE.Bone> } {
  const jointPositions = getJointPositions(scale, skeletonType)
  const bones: Record<string, THREE.Bone> = {}

  // 모든 본 생성
  for (const jointName of ALL_JOINTS) {
    const bone = new THREE.Bone()
    bone.name = jointName
    const pos = jointPositions[jointName]
    bone.position.set(pos[0], pos[1], pos[2])
    bones[jointName] = bone
  }

  // 본 계층 구조 설정 (부모-자식 관계)
  // 부모 본의 로컬 좌표계에서 자식 본의 위치를 계산해야 함
  for (const jointName of ALL_JOINTS) {
    const parentName = JOINT_HIERARCHY[jointName]
    if (parentName && bones[parentName]) {
      const parentBone = bones[parentName]
      const childBone = bones[jointName]

      // 부모 본에 자식 본 추가
      parentBone.add(childBone)

      // 자식 본의 위치를 부모 기준 상대 좌표로 변환
      const parentPos = jointPositions[parentName]
      const childPos = jointPositions[jointName]
      childBone.position.set(
        childPos[0] - parentPos[0],
        childPos[1] - parentPos[1],
        childPos[2] - parentPos[2]
      )
    }
  }

  // 루트 본(Hips)은 월드 좌표 그대로
  const rootBone = bones['Hips']
  const hipsPos = jointPositions['Hips']
  rootBone.position.set(hipsPos[0], hipsPos[1], hipsPos[2])

  // 스켈레톤 생성
  const boneArray = ALL_JOINTS.map(name => bones[name])
  const skeleton = new THREE.Skeleton(boneArray)

  return { skeleton, rootBone, bones: bones as Record<JointName, THREE.Bone> }
}

function RobotModel({ skeletonType, skinColor }: RobotModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const skeletonRef = useRef<{ skeleton: THREE.Skeleton; rootBone: THREE.Bone; bones: Record<JointName, THREE.Bone> } | null>(null)
  const scale = SKELETON_SCALES[skeletonType]

  // 스켈레톤 생성 및 그룹에 추가
  useEffect(() => {
    if (!groupRef.current) return

    // 기존 스켈레톤 제거
    if (skeletonRef.current) {
      groupRef.current.remove(skeletonRef.current.rootBone)
    }

    // 새 스켈레톤 생성
    const { skeleton, rootBone, bones } = createSkeleton(scale, skeletonType)
    skeletonRef.current = { skeleton, rootBone, bones }

    // 루트 본을 그룹에 추가
    groupRef.current.add(rootBone)

    // 스켈레톤 헬퍼 (디버그용, 필요시 활성화)
    // const helper = new THREE.SkeletonHelper(rootBone)
    // groupRef.current.add(helper)

    return () => {
      if (groupRef.current && skeletonRef.current) {
        groupRef.current.remove(skeletonRef.current.rootBone)
      }
    }
  }, [scale, skeletonType])

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

      {/* 22개 관절 시각화 (본 구조와 별개로 표시) */}
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

// 의상 상의 컴포넌트
function OutfitTop({ type, color, scale }: { type: string; color: string; scale: number }) {
  if (type === 'none') return null
  const s = scale

  if (type === 'tshirt') {
    return (
      <group name="outfit-tshirt">
        {/* 메인 상체 */}
        <mesh position={[0, 1.15 * s, 0]} castShadow>
          <cylinderGeometry args={[0.22 * s, 0.2 * s, 0.45 * s, 24]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        {/* 왼쪽 소매 */}
        <mesh position={[-0.3 * s, 1.25 * s, 0]} rotation={[0, 0, 0.8]} castShadow>
          <cylinderGeometry args={[0.08 * s, 0.095 * s, 0.22 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 오른쪽 소매 */}
        <mesh position={[0.3 * s, 1.25 * s, 0]} rotation={[0, 0, -0.8]} castShadow>
          <cylinderGeometry args={[0.08 * s, 0.095 * s, 0.22 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 넥라인 디테일 */}
        <mesh position={[0, 1.37 * s, 0.12 * s]} castShadow>
          <torusGeometry args={[0.08 * s, 0.01 * s, 8, 24, Math.PI]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* 주름 디테일 (앞면) */}
        <mesh position={[-0.05 * s, 1.1 * s, 0.195 * s]} castShadow>
          <cylinderGeometry args={[0.002 * s, 0.002 * s, 0.3 * s, 8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh position={[0.05 * s, 1.1 * s, 0.195 * s]} castShadow>
          <cylinderGeometry args={[0.002 * s, 0.002 * s, 0.3 * s, 8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
    )
  }

  if (type === 'jacket') {
    return (
      <group name="outfit-jacket">
        {/* 메인 자켓 몸체 */}
        <mesh position={[0, 1.12 * s, 0]} castShadow>
          <cylinderGeometry args={[0.24 * s, 0.22 * s, 0.52 * s, 24]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>
        {/* 왼쪽 소매 (더 두껍고 정교하게) */}
        <mesh position={[-0.32 * s, 1.1 * s, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.075 * s, 0.095 * s, 0.48 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* 왼쪽 커프스 */}
        <mesh position={[-0.32 * s, 0.87 * s, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.095 * s, 0.095 * s, 0.04 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* 오른쪽 소매 */}
        <mesh position={[0.32 * s, 1.1 * s, 0]} rotation={[0, 0, -0.3]} castShadow>
          <cylinderGeometry args={[0.075 * s, 0.095 * s, 0.48 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* 오른쪽 커프스 */}
        <mesh position={[0.32 * s, 0.87 * s, 0]} rotation={[0, 0, -0.3]} castShadow>
          <cylinderGeometry args={[0.095 * s, 0.095 * s, 0.04 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* 칼라 */}
        <mesh position={[0, 1.37 * s, 0.08 * s]} rotation={[0.5, 0, 0]} castShadow>
          <boxGeometry args={[0.22 * s, 0.1 * s, 0.03 * s]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        {/* 왼쪽 라펠 */}
        <mesh position={[-0.08 * s, 1.3 * s, 0.13 * s]} rotation={[0.4, 0.3, 0]} castShadow>
          <boxGeometry args={[0.08 * s, 0.15 * s, 0.02 * s]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        {/* 오른쪽 라펠 */}
        <mesh position={[0.08 * s, 1.3 * s, 0.13 * s]} rotation={[0.4, -0.3, 0]} castShadow>
          <boxGeometry args={[0.08 * s, 0.15 * s, 0.02 * s]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        {/* 지퍼/버튼 라인 */}
        <mesh position={[0, 1.15 * s, 0.215 * s]} castShadow>
          <boxGeometry args={[0.01 * s, 0.45 * s, 0.01 * s]} />
          <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* 포켓 (왼쪽) */}
        <mesh position={[-0.12 * s, 0.98 * s, 0.21 * s]} castShadow>
          <boxGeometry args={[0.06 * s, 0.08 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 포켓 (오른쪽) */}
        <mesh position={[0.12 * s, 0.98 * s, 0.21 * s]} castShadow>
          <boxGeometry args={[0.06 * s, 0.08 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 어깨 심 */}
        <mesh position={[-0.2 * s, 1.35 * s, 0]} rotation={[0, 0, -0.3]} castShadow>
          <cylinderGeometry args={[0.002 * s, 0.002 * s, 0.12 * s, 8]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        <mesh position={[0.2 * s, 1.35 * s, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.002 * s, 0.002 * s, 0.12 * s, 8]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      </group>
    )
  }

  if (type === 'hoodie') {
    return (
      <group name="outfit-hoodie">
        {/* 메인 후드티 몸체 */}
        <mesh position={[0, 1.1 * s, 0]} castShadow>
          <cylinderGeometry args={[0.25 * s, 0.23 * s, 0.57 * s, 24]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.8}
            metalness={0.05}
          />
        </mesh>
        {/* 왼쪽 소매 */}
        <mesh position={[-0.32 * s, 1.08 * s, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.08 * s, 0.1 * s, 0.52 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* 왼쪽 커프스 (리브 디테일) */}
        <mesh position={[-0.32 * s, 0.83 * s, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.09 * s, 0.09 * s, 0.05 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        {/* 오른쪽 소매 */}
        <mesh position={[0.32 * s, 1.08 * s, 0]} rotation={[0, 0, -0.3]} castShadow>
          <cylinderGeometry args={[0.08 * s, 0.1 * s, 0.52 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* 오른쪽 커프스 */}
        <mesh position={[0.32 * s, 0.83 * s, 0]} rotation={[0, 0, -0.3]} castShadow>
          <cylinderGeometry args={[0.09 * s, 0.09 * s, 0.05 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        {/* 후드 메인 */}
        <mesh position={[0, 1.45 * s, -0.1 * s]} castShadow>
          <sphereGeometry args={[0.16 * s, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshStandardMaterial color={color} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        {/* 후드 입구 */}
        <mesh position={[0, 1.38 * s, 0.05 * s]} rotation={[0.3, 0, 0]} castShadow>
          <torusGeometry args={[0.09 * s, 0.015 * s, 12, 24]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 캥거루 포켓 */}
        <mesh position={[0, 1.05 * s, 0.235 * s]} castShadow>
          <boxGeometry args={[0.18 * s, 0.12 * s, 0.03 * s]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* 포켓 입구 라인 */}
        <mesh position={[0, 1.11 * s, 0.245 * s]} castShadow>
          <boxGeometry args={[0.16 * s, 0.005 * s, 0.005 * s]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
        {/* 후드 끈 (왼쪽) */}
        <mesh position={[-0.04 * s, 1.35 * s, 0.13 * s]} castShadow>
          <cylinderGeometry args={[0.006 * s, 0.006 * s, 0.15 * s, 8]} />
          <meshStandardMaterial color="#CCCCCC" roughness={0.6} />
        </mesh>
        {/* 후드 끈 (오른쪽) */}
        <mesh position={[0.04 * s, 1.35 * s, 0.13 * s]} castShadow>
          <cylinderGeometry args={[0.006 * s, 0.006 * s, 0.15 * s, 8]} />
          <meshStandardMaterial color="#CCCCCC" roughness={0.6} />
        </mesh>
        {/* 밑단 리브 */}
        <mesh position={[0, 0.82 * s, 0]} castShadow>
          <cylinderGeometry args={[0.22 * s, 0.22 * s, 0.04 * s, 24]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      </group>
    )
  }

  if (type === 'tank') {
    return (
      <group name="outfit-tank">
        {/* 메인 상체 */}
        <mesh position={[0, 1.15 * s, 0]} castShadow>
          <cylinderGeometry args={[0.2 * s, 0.18 * s, 0.45 * s, 24]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
        {/* 넓은 어깨 스트랩 (왼쪽) */}
        <mesh position={[-0.15 * s, 1.35 * s, 0]} rotation={[0, 0, 0.2]} castShadow>
          <boxGeometry args={[0.05 * s, 0.25 * s, 0.15 * s]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* 넓은 어깨 스트랩 (오른쪽) */}
        <mesh position={[0.15 * s, 1.35 * s, 0]} rotation={[0, 0, -0.2]} castShadow>
          <boxGeometry args={[0.05 * s, 0.25 * s, 0.15 * s]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* 암홀 디테일 */}
        <mesh position={[-0.2 * s, 1.2 * s, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.08 * s, 0.008 * s, 8, 16, Math.PI]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh position={[0.2 * s, 1.2 * s, 0]} rotation={[Math.PI / 2, 0, Math.PI]} castShadow>
          <torusGeometry args={[0.08 * s, 0.008 * s, 8, 16, Math.PI]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>
    )
  }

  if (type === 'suit') {
    return (
      <group name="outfit-suit">
        {/* 메인 수트 재킷 */}
        <mesh position={[0, 1.1 * s, 0]} castShadow>
          <cylinderGeometry args={[0.24 * s, 0.2 * s, 0.55 * s, 24]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>
        {/* 왼쪽 소매 */}
        <mesh position={[-0.32 * s, 1.08 * s, 0]} rotation={[0, 0, 0.25]} castShadow>
          <cylinderGeometry args={[0.065 * s, 0.08 * s, 0.52 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
        </mesh>
        {/* 오른쪽 소매 */}
        <mesh position={[0.32 * s, 1.08 * s, 0]} rotation={[0, 0, -0.25]} castShadow>
          <cylinderGeometry args={[0.065 * s, 0.08 * s, 0.52 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
        </mesh>
        {/* 왼쪽 라펠 (더 정교하게) */}
        <mesh position={[-0.08 * s, 1.32 * s, 0.13 * s]} rotation={[0.4, 0.25, 0.05]} castShadow>
          <boxGeometry args={[0.09 * s, 0.13 * s, 0.02 * s]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.35} />
        </mesh>
        {/* 오른쪽 라펠 */}
        <mesh position={[0.08 * s, 1.32 * s, 0.13 * s]} rotation={[0.4, -0.25, -0.05]} castShadow>
          <boxGeometry args={[0.09 * s, 0.13 * s, 0.02 * s]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.35} />
        </mesh>
        {/* 버튼 (위) */}
        <mesh position={[0.03 * s, 1.25 * s, 0.215 * s]} castShadow>
          <cylinderGeometry args={[0.012 * s, 0.012 * s, 0.008 * s, 16]} />
          <meshStandardMaterial color="#1F2937" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* 버튼 (중) */}
        <mesh position={[0.03 * s, 1.15 * s, 0.215 * s]} castShadow>
          <cylinderGeometry args={[0.012 * s, 0.012 * s, 0.008 * s, 16]} />
          <meshStandardMaterial color="#1F2937" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* 버튼 (아래) */}
        <mesh position={[0.03 * s, 1.05 * s, 0.215 * s]} castShadow>
          <cylinderGeometry args={[0.012 * s, 0.012 * s, 0.008 * s, 16]} />
          <meshStandardMaterial color="#1F2937" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* 가슴 포켓 (왼쪽) */}
        <mesh position={[-0.1 * s, 1.25 * s, 0.21 * s]} castShadow>
          <boxGeometry args={[0.05 * s, 0.06 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        {/* 포켓 스퀘어 */}
        <mesh position={[-0.1 * s, 1.28 * s, 0.215 * s]} castShadow>
          <boxGeometry args={[0.035 * s, 0.015 * s, 0.005 * s]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        {/* 하단 포켓 (왼쪽) */}
        <mesh position={[-0.13 * s, 0.95 * s, 0.205 * s]} castShadow>
          <boxGeometry args={[0.08 * s, 0.1 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.45} />
        </mesh>
        {/* 하단 포켓 (오른쪽) */}
        <mesh position={[0.13 * s, 0.95 * s, 0.205 * s]} castShadow>
          <boxGeometry args={[0.08 * s, 0.1 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.45} />
        </mesh>
        {/* 커프스 버튼 (왼쪽) */}
        <mesh position={[-0.32 * s, 0.84 * s, 0.065 * s]} rotation={[0, 0, 0.25]} castShadow>
          <cylinderGeometry args={[0.008 * s, 0.008 * s, 0.006 * s, 12]} />
          <meshStandardMaterial color="#1F2937" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* 커프스 버튼 (오른쪽) */}
        <mesh position={[0.32 * s, 0.84 * s, 0.065 * s]} rotation={[0, 0, -0.25]} castShadow>
          <cylinderGeometry args={[0.008 * s, 0.008 * s, 0.006 * s, 12]} />
          <meshStandardMaterial color="#1F2937" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* 칼라 */}
        <mesh position={[0, 1.37 * s, 0.06 * s]} rotation={[0.6, 0, 0]} castShadow>
          <boxGeometry args={[0.2 * s, 0.08 * s, 0.025 * s]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.35} />
        </mesh>
      </group>
    )
  }

  return null
}

// 의상 하의 컴포넌트
function OutfitBottom({ type, color, scale }: { type: string; color: string; scale: number }) {
  if (type === 'none') return null
  const s = scale

  if (type === 'pants') {
    return (
      <group name="outfit-pants">
        {/* 허리밴드 */}
        <mesh position={[0, 0.82 * s, 0]} castShadow>
          <cylinderGeometry args={[0.2 * s, 0.18 * s, 0.12 * s, 24]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        {/* 왼쪽 다리 */}
        <mesh position={[-0.1 * s, 0.45 * s, 0]} castShadow>
          <cylinderGeometry args={[0.085 * s, 0.075 * s, 0.62 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 왼쪽 무릎 주름 디테일 */}
        <mesh position={[-0.1 * s, 0.5 * s, 0.08 * s]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.085 * s, 0.005 * s, 8, 16]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* 왼쪽 밑단 */}
        <mesh position={[-0.1 * s, 0.145 * s, 0]} castShadow>
          <cylinderGeometry args={[0.075 * s, 0.075 * s, 0.02 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.75} />
        </mesh>
        {/* 오른쪽 다리 */}
        <mesh position={[0.1 * s, 0.45 * s, 0]} castShadow>
          <cylinderGeometry args={[0.085 * s, 0.075 * s, 0.62 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 오른쪽 무릎 주름 디테일 */}
        <mesh position={[0.1 * s, 0.5 * s, 0.08 * s]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.085 * s, 0.005 * s, 8, 16]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* 오른쪽 밑단 */}
        <mesh position={[0.1 * s, 0.145 * s, 0]} castShadow>
          <cylinderGeometry args={[0.075 * s, 0.075 * s, 0.02 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.75} />
        </mesh>
        {/* 앞 주머니 (왼쪽) */}
        <mesh position={[-0.13 * s, 0.75 * s, 0.175 * s]} rotation={[0.1, 0.2, 0]} castShadow>
          <boxGeometry args={[0.05 * s, 0.06 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* 앞 주머니 (오른쪽) */}
        <mesh position={[0.13 * s, 0.75 * s, 0.175 * s]} rotation={[0.1, -0.2, 0]} castShadow>
          <boxGeometry args={[0.05 * s, 0.06 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* 벨트 루프 (앞 왼쪽) */}
        <mesh position={[-0.08 * s, 0.88 * s, 0.18 * s]} castShadow>
          <boxGeometry args={[0.015 * s, 0.04 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.75} />
        </mesh>
        {/* 벨트 루프 (앞 오른쪽) */}
        <mesh position={[0.08 * s, 0.88 * s, 0.18 * s]} castShadow>
          <boxGeometry args={[0.015 * s, 0.04 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.75} />
        </mesh>
        {/* 지퍼/버튼 */}
        <mesh position={[0, 0.82 * s, 0.185 * s]} castShadow>
          <cylinderGeometry args={[0.008 * s, 0.008 * s, 0.008 * s, 12]} />
          <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    )
  }

  if (type === 'shorts') {
    return (
      <group name="outfit-shorts">
        {/* 허리밴드 */}
        <mesh position={[0, 0.82 * s, 0]} castShadow>
          <cylinderGeometry args={[0.2 * s, 0.22 * s, 0.12 * s, 24]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
        {/* 왼쪽 반바지 다리 */}
        <mesh position={[-0.11 * s, 0.65 * s, 0]} castShadow>
          <cylinderGeometry args={[0.1 * s, 0.095 * s, 0.26 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 왼쪽 밑단 */}
        <mesh position={[-0.11 * s, 0.525 * s, 0]} castShadow>
          <cylinderGeometry args={[0.095 * s, 0.095 * s, 0.015 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* 오른쪽 반바지 다리 */}
        <mesh position={[0.11 * s, 0.65 * s, 0]} castShadow>
          <cylinderGeometry args={[0.1 * s, 0.095 * s, 0.26 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 오른쪽 밑단 */}
        <mesh position={[0.11 * s, 0.525 * s, 0]} castShadow>
          <cylinderGeometry args={[0.095 * s, 0.095 * s, 0.015 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* 주머니 (왼쪽) */}
        <mesh position={[-0.16 * s, 0.75 * s, 0.19 * s]} rotation={[0.1, 0.3, 0]} castShadow>
          <boxGeometry args={[0.055 * s, 0.07 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* 주머니 (오른쪽) */}
        <mesh position={[0.16 * s, 0.75 * s, 0.19 * s]} rotation={[0.1, -0.3, 0]} castShadow>
          <boxGeometry args={[0.055 * s, 0.07 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
    )
  }

  if (type === 'skirt') {
    return (
      <group name="outfit-skirt">
        {/* 메인 스커트 (플레어 효과) */}
        <mesh position={[0, 0.7 * s, 0]} castShadow>
          <cylinderGeometry args={[0.27 * s, 0.16 * s, 0.37 * s, 24]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.6}
            metalness={0.05}
          />
        </mesh>
        {/* 허리밴드 */}
        <mesh position={[0, 0.88 * s, 0]} castShadow>
          <cylinderGeometry args={[0.16 * s, 0.16 * s, 0.03 * s, 24]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </mesh>
        {/* 밑단 디테일 */}
        <mesh position={[0, 0.515 * s, 0]} castShadow>
          <torusGeometry args={[0.27 * s, 0.008 * s, 12, 24]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 주름 디테일 (8개) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const x = Math.sin(angle) * 0.2 * s
          const z = Math.cos(angle) * 0.2 * s
          return (
            <mesh key={i} position={[x, 0.7 * s, z]} rotation={[0, -angle, 0]} castShadow>
              <boxGeometry args={[0.005 * s, 0.35 * s, 0.002 * s]} />
              <meshStandardMaterial color={color} roughness={0.75} />
            </mesh>
          )
        })}
      </group>
    )
  }

  if (type === 'longSkirt') {
    return (
      <group name="outfit-longskirt">
        {/* 메인 롱스커트 */}
        <mesh position={[0, 0.55 * s, 0]} castShadow>
          <cylinderGeometry args={[0.3 * s, 0.16 * s, 0.68 * s, 24]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.65}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 허리밴드 */}
        <mesh position={[0, 0.88 * s, 0]} castShadow>
          <cylinderGeometry args={[0.16 * s, 0.16 * s, 0.04 * s, 24]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </mesh>
        {/* 밑단 디테일 */}
        <mesh position={[0, 0.22 * s, 0]} castShadow>
          <torusGeometry args={[0.3 * s, 0.01 * s, 12, 24]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 세로 주름 라인 (12개) */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const x = Math.sin(angle) * 0.2 * s
          const z = Math.cos(angle) * 0.2 * s
          return (
            <mesh key={i} position={[x, 0.55 * s, z]} rotation={[0, -angle, 0]} castShadow>
              <boxGeometry args={[0.004 * s, 0.65 * s, 0.002 * s]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
          )
        })}
        {/* 벨트/리본 장식 */}
        <mesh position={[0, 0.88 * s, 0.17 * s]} castShadow>
          <boxGeometry args={[0.18 * s, 0.025 * s, 0.02 * s]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
        </mesh>
      </group>
    )
  }

  return null
}

// 의상 신발 컴포넌트
function OutfitShoes({ type, color, scale }: { type: string; color: string; scale: number }) {
  if (type === 'none') return null
  const s = scale

  if (type === 'sneakers') {
    return (
      <group name="outfit-sneakers">
        {/* 왼쪽 운동화 */}
        {/* 밑창 */}
        <mesh position={[-0.12 * s, 0.025 * s, 0.03 * s]} castShadow>
          <boxGeometry args={[0.11 * s, 0.03 * s, 0.22 * s]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.6} metalness={0.1} />
        </mesh>
        {/* 미드솔 */}
        <mesh position={[-0.12 * s, 0.045 * s, 0.02 * s]} castShadow>
          <boxGeometry args={[0.105 * s, 0.01 * s, 0.2 * s]} />
          <meshStandardMaterial color="#E0E0E0" roughness={0.5} />
        </mesh>
        {/* 갑피 (어퍼) */}
        <mesh position={[-0.12 * s, 0.07 * s, 0.02 * s]} castShadow>
          <boxGeometry args={[0.1 * s, 0.06 * s, 0.19 * s]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />
        </mesh>
        {/* 설포 (텅) */}
        <mesh position={[-0.12 * s, 0.08 * s, 0.08 * s]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.06 * s, 0.05 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 끈 (왼쪽) */}
        <mesh position={[-0.14 * s, 0.075 * s, 0.05 * s]} rotation={[0.2, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.004 * s, 0.004 * s, 0.04 * s, 8]} />
          <meshStandardMaterial color="#333333" roughness={0.8} />
        </mesh>
        {/* 끈 (오른쪽) */}
        <mesh position={[-0.1 * s, 0.075 * s, 0.05 * s]} rotation={[0.2, -0.3, 0]} castShadow>
          <cylinderGeometry args={[0.004 * s, 0.004 * s, 0.04 * s, 8]} />
          <meshStandardMaterial color="#333333" roughness={0.8} />
        </mesh>
        {/* 로고 스우시 */}
        <mesh position={[-0.15 * s, 0.07 * s, 0.03 * s]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[0.03 * s, 0.015 * s, 0.002 * s]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.5} metalness={0.2} />
        </mesh>

        {/* 오른쪽 운동화 (미러) */}
        <mesh position={[0.12 * s, 0.025 * s, 0.03 * s]} castShadow>
          <boxGeometry args={[0.11 * s, 0.03 * s, 0.22 * s]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.6} metalness={0.1} />
        </mesh>
        <mesh position={[0.12 * s, 0.045 * s, 0.02 * s]} castShadow>
          <boxGeometry args={[0.105 * s, 0.01 * s, 0.2 * s]} />
          <meshStandardMaterial color="#E0E0E0" roughness={0.5} />
        </mesh>
        <mesh position={[0.12 * s, 0.07 * s, 0.02 * s]} castShadow>
          <boxGeometry args={[0.1 * s, 0.06 * s, 0.19 * s]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />
        </mesh>
        <mesh position={[0.12 * s, 0.08 * s, 0.08 * s]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.06 * s, 0.05 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh position={[0.14 * s, 0.075 * s, 0.05 * s]} rotation={[0.2, -0.3, 0]} castShadow>
          <cylinderGeometry args={[0.004 * s, 0.004 * s, 0.04 * s, 8]} />
          <meshStandardMaterial color="#333333" roughness={0.8} />
        </mesh>
        <mesh position={[0.1 * s, 0.075 * s, 0.05 * s]} rotation={[0.2, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.004 * s, 0.004 * s, 0.04 * s, 8]} />
          <meshStandardMaterial color="#333333" roughness={0.8} />
        </mesh>
        <mesh position={[0.15 * s, 0.07 * s, 0.03 * s]} rotation={[0, -Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[0.03 * s, 0.015 * s, 0.002 * s]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>
    )
  }

  if (type === 'boots') {
    return (
      <group name="outfit-boots">
        {/* 왼쪽 부츠 */}
        {/* 샤프트 (긴 부분) */}
        <mesh position={[-0.12 * s, 0.16 * s, 0]} castShadow>
          <cylinderGeometry args={[0.068 * s, 0.082 * s, 0.3 * s, 16]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.5}
            metalness={0.15}
          />
        </mesh>
        {/* 가죽 주름 디테일 (상단) */}
        <mesh position={[-0.12 * s, 0.25 * s, 0.068 * s]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.068 * s, 0.004 * s, 8, 16]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* 가죽 주름 디테일 (하단) */}
        <mesh position={[-0.12 * s, 0.12 * s, 0.08 * s]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.075 * s, 0.004 * s, 8, 16]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* 발등 부분 */}
        <mesh position={[-0.12 * s, 0.05 * s, 0.05 * s]} castShadow>
          <boxGeometry args={[0.105 * s, 0.07 * s, 0.2 * s]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.15} />
        </mesh>
        {/* 밑창 */}
        <mesh position={[-0.12 * s, 0.015 * s, 0.05 * s]} castShadow>
          <boxGeometry args={[0.11 * s, 0.02 * s, 0.21 * s]} />
          <meshStandardMaterial color="#2C2C2C" roughness={0.8} metalness={0.1} />
        </mesh>
        {/* 지퍼 라인 */}
        <mesh position={[-0.16 * s, 0.16 * s, 0]} castShadow>
          <boxGeometry args={[0.005 * s, 0.28 * s, 0.008 * s]} />
          <meshStandardMaterial color="#A0A0A0" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* 지퍼 풀러 */}
        <mesh position={[-0.16 * s, 0.28 * s, 0]} castShadow>
          <boxGeometry args={[0.008 * s, 0.015 * s, 0.01 * s]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* 힐 */}
        <mesh position={[-0.12 * s, 0.025 * s, -0.08 * s]} castShadow>
          <boxGeometry args={[0.08 * s, 0.04 * s, 0.06 * s]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
        </mesh>

        {/* 오른쪽 부츠 (미러) */}
        <mesh position={[0.12 * s, 0.16 * s, 0]} castShadow>
          <cylinderGeometry args={[0.068 * s, 0.082 * s, 0.3 * s, 16]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.15} />
        </mesh>
        <mesh position={[0.12 * s, 0.25 * s, 0.068 * s]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.068 * s, 0.004 * s, 8, 16]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[0.12 * s, 0.12 * s, 0.08 * s]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.075 * s, 0.004 * s, 8, 16]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[0.12 * s, 0.05 * s, 0.05 * s]} castShadow>
          <boxGeometry args={[0.105 * s, 0.07 * s, 0.2 * s]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.15} />
        </mesh>
        <mesh position={[0.12 * s, 0.015 * s, 0.05 * s]} castShadow>
          <boxGeometry args={[0.11 * s, 0.02 * s, 0.21 * s]} />
          <meshStandardMaterial color="#2C2C2C" roughness={0.8} metalness={0.1} />
        </mesh>
        <mesh position={[0.16 * s, 0.16 * s, 0]} castShadow>
          <boxGeometry args={[0.005 * s, 0.28 * s, 0.008 * s]} />
          <meshStandardMaterial color="#A0A0A0" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.16 * s, 0.28 * s, 0]} castShadow>
          <boxGeometry args={[0.008 * s, 0.015 * s, 0.01 * s]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.12 * s, 0.025 * s, -0.08 * s]} castShadow>
          <boxGeometry args={[0.08 * s, 0.04 * s, 0.06 * s]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
        </mesh>
      </group>
    )
  }

  if (type === 'sandals') {
    return (
      <group name="outfit-sandals">
        {/* 왼쪽 샌들 */}
        {/* 밑창 */}
        <mesh position={[-0.12 * s, 0.015 * s, 0.02 * s]} castShadow>
          <boxGeometry args={[0.095 * s, 0.02 * s, 0.19 * s]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
        </mesh>
        {/* 앞 스트랩 */}
        <mesh position={[-0.12 * s, 0.03 * s, 0.05 * s]} castShadow>
          <boxGeometry args={[0.09 * s, 0.01 * s, 0.03 * s]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 발목 스트랩 */}
        <mesh position={[-0.12 * s, 0.04 * s, -0.04 * s]} castShadow>
          <boxGeometry args={[0.09 * s, 0.01 * s, 0.02 * s]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* 버클 장식 */}
        <mesh position={[-0.16 * s, 0.04 * s, -0.04 * s]} castShadow>
          <boxGeometry args={[0.012 * s, 0.015 * s, 0.015 * s]} />
          <meshStandardMaterial color="#C0A070" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* 오른쪽 샌들 */}
        <mesh position={[0.12 * s, 0.015 * s, 0.02 * s]} castShadow>
          <boxGeometry args={[0.095 * s, 0.02 * s, 0.19 * s]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh position={[0.12 * s, 0.03 * s, 0.05 * s]} castShadow>
          <boxGeometry args={[0.09 * s, 0.01 * s, 0.03 * s]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh position={[0.12 * s, 0.04 * s, -0.04 * s]} castShadow>
          <boxGeometry args={[0.09 * s, 0.01 * s, 0.02 * s]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh position={[0.16 * s, 0.04 * s, -0.04 * s]} castShadow>
          <boxGeometry args={[0.012 * s, 0.015 * s, 0.015 * s]} />
          <meshStandardMaterial color="#C0A070" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    )
  }

  if (type === 'formal') {
    return (
      <group name="outfit-formal">
        {/* 왼쪽 구두 */}
        {/* 밑창 */}
        <mesh position={[-0.12 * s, 0.015 * s, 0.02 * s]} castShadow>
          <boxGeometry args={[0.085 * s, 0.02 * s, 0.2 * s]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* 갑피 (상단) */}
        <mesh position={[-0.12 * s, 0.06 * s, 0.02 * s]} castShadow>
          <boxGeometry args={[0.08 * s, 0.07 * s, 0.19 * s]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        {/* 토캡 (앞코) */}
        <mesh position={[-0.12 * s, 0.05 * s, 0.11 * s]} castShadow>
          <sphereGeometry args={[0.045 * s, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} roughness={0.25} metalness={0.5} />
        </mesh>
        {/* 힐 */}
        <mesh position={[-0.12 * s, 0.04 * s, -0.07 * s]} castShadow>
          <boxGeometry args={[0.07 * s, 0.055 * s, 0.055 * s]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.4} />
        </mesh>
        {/* 레이싱 (끈) 디테일 */}
        <mesh position={[-0.12 * s, 0.075 * s, 0.05 * s]} rotation={[0.3, 0, 0]} castShadow>
          <cylinderGeometry args={[0.003 * s, 0.003 * s, 0.05 * s, 8]} />
          <meshStandardMaterial color="#2C2C2C" roughness={0.8} />
        </mesh>
        {/* 광택 효과 (하이라이트) */}
        <mesh position={[-0.12 * s, 0.08 * s, 0.05 * s]} castShadow>
          <boxGeometry args={[0.03 * s, 0.015 * s, 0.06 * s]} />
          <meshStandardMaterial 
            color={color}
            roughness={0.15}
            metalness={0.6}
            emissive={color}
            emissiveIntensity={0.1}
          />
        </mesh>

        {/* 오른쪽 구두 (미러) */}
        <mesh position={[0.12 * s, 0.015 * s, 0.02 * s]} castShadow>
          <boxGeometry args={[0.085 * s, 0.02 * s, 0.2 * s]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.7} metalness={0.2} />
        </mesh>
        <mesh position={[0.12 * s, 0.06 * s, 0.02 * s]} castShadow>
          <boxGeometry args={[0.08 * s, 0.07 * s, 0.19 * s]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0.12 * s, 0.05 * s, 0.11 * s]} castShadow>
          <sphereGeometry args={[0.045 * s, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} roughness={0.25} metalness={0.5} />
        </mesh>
        <mesh position={[0.12 * s, 0.04 * s, -0.07 * s]} castShadow>
          <boxGeometry args={[0.07 * s, 0.055 * s, 0.055 * s]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.4} />
        </mesh>
        <mesh position={[0.12 * s, 0.075 * s, 0.05 * s]} rotation={[0.3, 0, 0]} castShadow>
          <cylinderGeometry args={[0.003 * s, 0.003 * s, 0.05 * s, 8]} />
          <meshStandardMaterial color="#2C2C2C" roughness={0.8} />
        </mesh>
        <mesh position={[0.12 * s, 0.08 * s, 0.05 * s]} castShadow>
          <boxGeometry args={[0.03 * s, 0.015 * s, 0.06 * s]} />
          <meshStandardMaterial 
            color={color}
            roughness={0.15}
            metalness={0.6}
            emissive={color}
            emissiveIntensity={0.1}
          />
        </mesh>
      </group>
    )
  }

  return null
}

// 악세서리 컴포넌트
function Accessory({ type, color, scale }: { type: string; color: string; scale: number }) {
  const s = scale

  if (type === 'hat') {
    return (
      <group name="accessory-hat">
        <mesh position={[0, 1.8 * s, 0]} castShadow>
          <cylinderGeometry args={[0.18 * s, 0.2 * s, 0.15 * s, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 1.72 * s, 0]} castShadow>
          <cylinderGeometry args={[0.28 * s, 0.28 * s, 0.02 * s, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }

  if (type === 'glasses') {
    return (
      <group name="accessory-glasses">
        <mesh position={[-0.08 * s, 1.62 * s, 0.13 * s]} castShadow>
          <ringGeometry args={[0.04 * s, 0.05 * s, 16]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.08 * s, 1.62 * s, 0.13 * s]} castShadow>
          <ringGeometry args={[0.04 * s, 0.05 * s, 16]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.62 * s, 0.13 * s]} castShadow>
          <boxGeometry args={[0.06 * s, 0.01 * s, 0.01 * s]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }

  if (type === 'backpack') {
    return (
      <group name="accessory-backpack">
        <mesh position={[0, 1.1 * s, -0.2 * s]} castShadow>
          <boxGeometry args={[0.25 * s, 0.35 * s, 0.12 * s]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[-0.1 * s, 1.2 * s, -0.1 * s]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.03 * s, 0.25 * s, 0.02 * s]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0.1 * s, 1.2 * s, -0.1 * s]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.03 * s, 0.25 * s, 0.02 * s]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }

  if (type === 'watch') {
    return (
      <group name="accessory-watch">
        <mesh position={[-0.38 * s, 0.85 * s, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.025 * s, 0.025 * s, 0.015 * s, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[-0.38 * s, 0.85 * s, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.035 * s, 0.008 * s, 8, 24]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }

  if (type === 'necklace') {
    return (
      <group name="accessory-necklace">
        <mesh position={[0, 1.4 * s, 0.12 * s]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.12 * s, 0.01 * s, 8, 24]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 1.28 * s, 0.14 * s]} castShadow>
          <sphereGeometry args={[0.025 * s, 12, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }

  if (type === 'earrings') {
    return (
      <group name="accessory-earrings">
        <mesh position={[-0.14 * s, 1.58 * s, 0]} castShadow>
          <sphereGeometry args={[0.015 * s, 8, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0.14 * s, 1.58 * s, 0]} castShadow>
          <sphereGeometry args={[0.015 * s, 8, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }

  if (type === 'scarf') {
    return (
      <group name="accessory-scarf">
        <mesh position={[0, 1.42 * s, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.14 * s, 0.04 * s, 8, 24]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0.08 * s, 1.2 * s, 0.14 * s]} castShadow>
          <boxGeometry args={[0.08 * s, 0.35 * s, 0.02 * s]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }

  if (type === 'gloves') {
    return (
      <group name="accessory-gloves">
        <mesh position={[-0.4 * s, 0.78 * s, 0]} castShadow>
          <sphereGeometry args={[0.055 * s, 12, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0.4 * s, 0.78 * s, 0]} castShadow>
          <sphereGeometry args={[0.055 * s, 12, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }

  return null
}

// 라이브러리 모델 로더 컴포넌트
function LibraryModelRenderer({ model, skeletonScale }: { model: SelectedModel; skeletonScale: number }) {
  // 모델의 position, rotation, scale을 적용 (스켈레톤 스케일과 모델 스케일 결합)
  const finalScale = model.scale * skeletonScale

  return (
    <group position={model.position} rotation={model.rotation}>
      <ModelErrorBoundary fallback={
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial color="red" />
        </mesh>
      }>
        <Suspense fallback={
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="gray" wireframe />
          </mesh>
        }>
          <ModelLoader
            url={model.url}
            fileType="glb"
            position={[0, 0, 0]}
            scale={finalScale}
          />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  )
}

function Scene({ skeletonType, skinColor, outfitConfig, accessoryConfig }: CreatorSceneProps) {
  const scale = SKELETON_SCALES[skeletonType]

  // 스켈레톤 타입에 따른 카메라 타겟
  const cameraTarget: [number, number, number] = skeletonType.startsWith('human')
    ? [0, 1, 0]
    : skeletonType === 'bird'
      ? [0, 0.3, 0]
      : [0, 0.5, 0]

  // 의상 및 악세서리 모델 수집
  const outfitModels: SelectedModel[] = []
  const accessoryModels: SelectedModel[] = []

  if (outfitConfig) {
    if (outfitConfig.top) outfitModels.push(outfitConfig.top)
    if (outfitConfig.bottom) outfitModels.push(outfitConfig.bottom)
    if (outfitConfig.shoes) outfitModels.push(outfitConfig.shoes)
    if (outfitConfig.fullbody) outfitModels.push(outfitConfig.fullbody)
  }

  if (accessoryConfig) {
    if (accessoryConfig.hats) accessoryModels.push(accessoryConfig.hats)
    if (accessoryConfig.glasses) accessoryModels.push(accessoryConfig.glasses)
    if (accessoryConfig.bags) accessoryModels.push(accessoryConfig.bags)
    if (accessoryConfig.jewelry) accessoryModels.push(accessoryConfig.jewelry)
    if (accessoryConfig.other) accessoryModels.push(accessoryConfig.other)
  }

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

      {/* 라이브러리에서 선택한 의상 모델들 */}
      {outfitModels.map((model, index) => (
        <LibraryModelRenderer
          key={`outfit-${model.name}-${index}`}
          model={model}
          skeletonScale={scale}
        />
      ))}

      {/* 라이브러리에서 선택한 악세서리 모델들 */}
      {accessoryModels.map((model, index) => (
        <LibraryModelRenderer
          key={`accessory-${model.name}-${index}`}
          model={model}
          skeletonScale={scale}
        />
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
