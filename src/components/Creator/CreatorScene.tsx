'use client'

import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFExporter } from 'three-stdlib'
import type { SkeletonType } from '@/app/creator/page'

interface OutfitStyle {
  name: string
  color: string
  type: string
}

interface Accessory {
  name: string
  icon: string
  type: string
}

interface CreatorSceneProps {
  skeletonType: SkeletonType
  skinColor: string
  outfitStyle: OutfitStyle
  accessories: Accessory[]
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

// 의상 스타일에 따른 지오메트리 스타일 매핑
const getGeometryStyleFromOutfit = (outfitType: string): 'box' | 'rounded' | 'angular' | 'smooth' | 'mechanical' | 'organic' => {
  const styleMap: Record<string, 'box' | 'rounded' | 'angular' | 'smooth' | 'mechanical' | 'organic'> = {
    basic: 'box',
    casual: 'rounded',
    formal: 'smooth',
    sport: 'angular',
    military: 'mechanical',
    space: 'mechanical',
    ninja: 'angular',
    knight: 'mechanical',
    cyberpunk: 'angular',
    steampunk: 'mechanical',
    futuristic: 'smooth',
    mech: 'mechanical',
    robot: 'mechanical'
  }
  return styleMap[outfitType] || 'rounded'
}

interface BodyPartMeshProps {
  part: BodyPart
  skinColor: string
  outfitColor: string
  outfitType: string
  skeletonScale: number
  skeletonType: SkeletonType
}

function BodyPartMesh({ part, skinColor, outfitColor, outfitType, skeletonScale, skeletonType }: BodyPartMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const style = getGeometryStyleFromOutfit(outfitType)
  const isHuman = skeletonType.startsWith('human')

  // 부위별 색상 결정 (피부 vs 의상)
  const isSkinPart = part === 'head' || part === 'leftHand' || part === 'rightHand'
  const color = isSkinPart ? skinColor : outfitColor

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
        case 'leftArm': // 앞다리 왼쪽
          return { position: [0.18 * s, 0.22 * s, 0.1 * s], size: [0.06 * s, 0.28 * s, 0.06 * s] }
        case 'rightArm': // 앞다리 오른쪽
          return { position: [0.18 * s, 0.22 * s, -0.1 * s], size: [0.06 * s, 0.28 * s, 0.06 * s] }
        case 'leftHand': // 앞발 왼쪽
          return { position: [0.18 * s, 0.04 * s, 0.1 * s], size: [0.05 * s, 0.04 * s, 0.06 * s] }
        case 'rightHand': // 앞발 오른쪽
          return { position: [0.18 * s, 0.04 * s, -0.1 * s], size: [0.05 * s, 0.04 * s, 0.06 * s] }
        case 'leftLeg': // 뒷다리 왼쪽
          return { position: [-0.18 * s, 0.22 * s, 0.1 * s], size: [0.07 * s, 0.28 * s, 0.07 * s] }
        case 'rightLeg': // 뒷다리 오른쪽
          return { position: [-0.18 * s, 0.22 * s, -0.1 * s], size: [0.07 * s, 0.28 * s, 0.07 * s] }
        case 'leftFoot': // 뒷발 왼쪽
          return { position: [-0.18 * s, 0.04 * s, 0.1 * s], size: [0.06 * s, 0.04 * s, 0.07 * s] }
        case 'rightFoot': // 뒷발 오른쪽
          return { position: [-0.18 * s, 0.04 * s, -0.1 * s], size: [0.06 * s, 0.04 * s, 0.07 * s] }
        default:
          return { position: [0, 0, 0], size: [0.1, 0.1, 0.1] }
      }
    }

    // 2발 동물 (biped - 공룡/캥거루)
    if (skeletonType === 'biped') {
      switch (part) {
        case 'head':
          return { position: [0.15 * s, 1.1 * s, 0], size: [0.2 * s, 0.15 * s, 0.12 * s] }
        case 'torso':
          return { position: [0, 0.65 * s, 0], size: [0.25 * s, 0.45 * s, 0.18 * s], rotation: [0.2, 0, 0] }
        case 'leftArm': // 짧은 앞팔 왼쪽
          return { position: [0.1 * s, 0.75 * s, 0.12 * s], size: [0.04 * s, 0.12 * s, 0.04 * s], rotation: [0.3, 0, -0.5] }
        case 'rightArm': // 짧은 앞팔 오른쪽
          return { position: [0.1 * s, 0.75 * s, -0.12 * s], size: [0.04 * s, 0.12 * s, 0.04 * s], rotation: [-0.3, 0, -0.5] }
        case 'leftHand':
          return { position: [0.12 * s, 0.65 * s, 0.14 * s], size: [0.03 * s, 0.04 * s, 0.03 * s] }
        case 'rightHand':
          return { position: [0.12 * s, 0.65 * s, -0.14 * s], size: [0.03 * s, 0.04 * s, 0.03 * s] }
        case 'leftLeg': // 큰 다리 왼쪽
          return { position: [-0.02 * s, 0.3 * s, 0.1 * s], size: [0.1 * s, 0.35 * s, 0.1 * s] }
        case 'rightLeg': // 큰 다리 오른쪽
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
      case 'leftArm': // 날개 왼쪽
        return { position: [0, 0.4 * s, 0.15 * s], size: [0.18 * s, 0.03 * s, 0.25 * s], rotation: [0.4, 0, 0] }
      case 'rightArm': // 날개 오른쪽
        return { position: [0, 0.4 * s, -0.15 * s], size: [0.18 * s, 0.03 * s, 0.25 * s], rotation: [-0.4, 0, 0] }
      case 'leftHand': // 날개 끝
        return { position: [0, 0, 0], size: [0, 0, 0] } // 숨김
      case 'rightHand':
        return { position: [0, 0, 0], size: [0, 0, 0] } // 숨김
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

  // 스타일에 따른 지오메트리 생성
  const getGeometry = () => {
    const [w, h, d] = config.size
    switch (style) {
      case 'rounded':
        if (part === 'head') {
          return <sphereGeometry args={[w, 16, 16]} />
        }
        return <capsuleGeometry args={[Math.min(w, d) / 2, h - Math.min(w, d), 8, 16]} />
      case 'angular':
        return <boxGeometry args={[w * 1.1, h, d * 0.8]} />
      case 'smooth':
        return <cylinderGeometry args={[Math.min(w, d) / 2, Math.min(w, d) / 2 * 0.9, h, 16]} />
      case 'mechanical':
        return <boxGeometry args={[w, h, d]} />
      case 'organic':
        if (part === 'head') {
          return <sphereGeometry args={[w, 12, 12]} />
        }
        return <capsuleGeometry args={[Math.min(w, d) / 2 * 0.8, h - Math.min(w, d) * 0.8, 6, 12]} />
      default:
        return <boxGeometry args={[w, h, d]} />
    }
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
        color={color}
        metalness={0.3}
        roughness={0.5}
      />
    </mesh>
  )
}

interface RobotModelProps {
  skeletonType: SkeletonType
  skinColor: string
  outfitStyle: OutfitStyle
  accessories: Accessory[]
}

function RobotModel({ skeletonType, skinColor, outfitStyle, accessories }: RobotModelProps) {
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
          link.download = `${event.detail.name || 'robot'}.glb`
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

  // 스켈레톤 타입에 따른 머리 위치
  const getHeadPosition = (): [number, number, number] => {
    switch (skeletonType) {
      case 'humanSmall':
      case 'humanMedium':
      case 'humanLarge':
        return [0, 1.7 * scale, 0]
      case 'quadruped':
        return [0.45 * scale, 0.55 * scale, 0]
      case 'biped':
        return [0.15 * scale, 1.1 * scale, 0]
      case 'bird':
        return [0.12 * scale, 0.55 * scale, 0]
      default:
        return [0, 1 * scale, 0]
    }
  }

  const headPos = getHeadPosition()

  // 악세서리 렌더링
  const renderAccessories = () => {
    return accessories.map((acc, i) => {
      const accScale = scale * 0.15
      switch (acc.type) {
        case 'hat':
        case 'helmet':
        case 'crown':
          return (
            <mesh key={i} position={[headPos[0], headPos[1] + 0.2 * scale, headPos[2]]}>
              <cylinderGeometry args={[accScale, accScale * 1.2, accScale * 0.5, 16]} />
              <meshStandardMaterial color={acc.type === 'crown' ? '#FFD700' : '#4a4a4a'} metalness={0.5} />
            </mesh>
          )
        case 'glasses':
        case 'sunglasses':
          return (
            <mesh key={i} position={[headPos[0], headPos[1], headPos[2] + 0.12 * scale]}>
              <boxGeometry args={[0.25 * scale, 0.04 * scale, 0.02 * scale]} />
              <meshStandardMaterial color={acc.type === 'sunglasses' ? '#1a1a1a' : '#888888'} />
            </mesh>
          )
        case 'backpack':
          return isHuman ? (
            <mesh key={i} position={[0, 1.1 * scale, -0.2 * scale]}>
              <boxGeometry args={[0.25 * scale, 0.3 * scale, 0.15 * scale]} />
              <meshStandardMaterial color="#3B82F6" />
            </mesh>
          ) : null
        case 'cape':
          return isHuman ? (
            <mesh key={i} position={[0, 1.0 * scale, -0.15 * scale]}>
              <planeGeometry args={[0.4 * scale, 0.8 * scale]} />
              <meshStandardMaterial color="#DC143C" side={THREE.DoubleSide} />
            </mesh>
          ) : null
        case 'scarf':
          return (
            <mesh key={i} position={[headPos[0], headPos[1] - 0.2 * scale, headPos[2]]}>
              <torusGeometry args={[0.08 * scale, 0.025 * scale, 8, 24]} />
              <meshStandardMaterial color="#E74C3C" />
            </mesh>
          )
        case 'wings':
          return !skeletonType.includes('bird') ? (
            <group key={i}>
              <mesh position={[0, (isHuman ? 1.2 : 0.4) * scale, -0.15 * scale]} rotation={[0.3, -0.5, 0]}>
                <boxGeometry args={[0.3 * scale, 0.02 * scale, 0.4 * scale]} />
                <meshStandardMaterial color="#FFFFFF" side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, (isHuman ? 1.2 : 0.4) * scale, 0.15 * scale]} rotation={[-0.3, 0.5, 0]}>
                <boxGeometry args={[0.3 * scale, 0.02 * scale, 0.4 * scale]} />
                <meshStandardMaterial color="#FFFFFF" side={THREE.DoubleSide} />
              </mesh>
            </group>
          ) : null
        case 'halo':
          return (
            <mesh key={i} position={[headPos[0], headPos[1] + 0.18 * scale, headPos[2]]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.12 * scale, 0.015 * scale, 8, 24]} />
              <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
            </mesh>
          )
        case 'horns':
          return (
            <group key={i}>
              <mesh position={[headPos[0] - 0.08 * scale, headPos[1] + 0.1 * scale, headPos[2]]} rotation={[0, 0, 0.3]}>
                <coneGeometry args={[0.02 * scale, 0.12 * scale, 8]} />
                <meshStandardMaterial color="#4A4A4A" />
              </mesh>
              <mesh position={[headPos[0] + 0.08 * scale, headPos[1] + 0.1 * scale, headPos[2]]} rotation={[0, 0, -0.3]}>
                <coneGeometry args={[0.02 * scale, 0.12 * scale, 8]} />
                <meshStandardMaterial color="#4A4A4A" />
              </mesh>
            </group>
          )
        default:
          return null
      }
    })
  }

  return (
    <group ref={groupRef}>
      {bodyParts.map((part) => (
        <BodyPartMesh
          key={part}
          part={part}
          skinColor={skinColor}
          outfitColor={outfitStyle.color}
          outfitType={outfitStyle.type}
          skeletonScale={scale}
          skeletonType={skeletonType}
        />
      ))}

      {/* 관절 연결 표시 */}
      {isHuman && (
        [
          [0, 1.4 * scale, 0],
          [-0.2 * scale, 1.35 * scale, 0],
          [0.2 * scale, 1.35 * scale, 0],
          [-0.15 * scale, 0.65 * scale, 0],
          [0.15 * scale, 0.65 * scale, 0],
        ].map((pos, i) => (
          <mesh key={`joint-${i}`} position={pos as [number, number, number]}>
            <sphereGeometry args={[0.03 * scale, 8, 8]} />
            <meshStandardMaterial color="#888888" />
          </mesh>
        ))
      )}

      {/* 4발 동물 특수 부위 */}
      {skeletonType === 'quadruped' && (
        <>
          {/* 귀 */}
          <mesh position={[0.4 * scale, 0.65 * scale, 0.06 * scale]} castShadow>
            <coneGeometry args={[0.03 * scale, 0.1 * scale, 8]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          <mesh position={[0.4 * scale, 0.65 * scale, -0.06 * scale]} castShadow>
            <coneGeometry args={[0.03 * scale, 0.1 * scale, 8]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          {/* 코 */}
          <mesh position={[0.55 * scale, 0.52 * scale, 0]} castShadow>
            <boxGeometry args={[0.08 * scale, 0.05 * scale, 0.05 * scale]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          {/* 꼬리 */}
          <mesh position={[-0.35 * scale, 0.5 * scale, 0]} rotation={[0, 0, 0.8]} castShadow>
            <cylinderGeometry args={[0.015 * scale, 0.03 * scale, 0.2 * scale, 8]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          {/* 목 */}
          <mesh position={[0.3 * scale, 0.5 * scale, 0]} rotation={[0, 0, -0.4]} castShadow>
            <cylinderGeometry args={[0.06 * scale, 0.08 * scale, 0.12 * scale, 12]} />
            <meshStandardMaterial color={outfitStyle.color} />
          </mesh>
        </>
      )}

      {/* 2발 동물 특수 부위 */}
      {skeletonType === 'biped' && (
        <>
          {/* 목 */}
          <mesh position={[0.08 * scale, 0.95 * scale, 0]} rotation={[0, 0, -0.3]} castShadow>
            <cylinderGeometry args={[0.05 * scale, 0.07 * scale, 0.15 * scale, 12]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          {/* 꼬리 */}
          <mesh position={[-0.2 * scale, 0.5 * scale, 0]} rotation={[0, 0, 0.6]} castShadow>
            <coneGeometry args={[0.06 * scale, 0.35 * scale, 8]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
        </>
      )}

      {/* 새 특수 부위 */}
      {skeletonType === 'bird' && (
        <>
          {/* 목 */}
          <mesh position={[0.08 * scale, 0.48 * scale, 0]} rotation={[0, 0, -0.4]} castShadow>
            <cylinderGeometry args={[0.025 * scale, 0.035 * scale, 0.1 * scale, 10]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          {/* 부리 */}
          <mesh position={[0.2 * scale, 0.53 * scale, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <coneGeometry args={[0.02 * scale, 0.08 * scale, 6]} />
            <meshStandardMaterial color="#FFD700" />
          </mesh>
          {/* 꼬리 깃털 */}
          <mesh position={[-0.12 * scale, 0.32 * scale, 0]} rotation={[0, 0, 0.5]} castShadow>
            <boxGeometry args={[0.15 * scale, 0.02 * scale, 0.06 * scale]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
        </>
      )}

      {/* 악세서리 */}
      {renderAccessories()}
    </group>
  )
}

function Scene({ skeletonType, skinColor, outfitStyle, accessories }: CreatorSceneProps) {
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

      {/* 로봇 모델 */}
      <RobotModel
        skeletonType={skeletonType}
        skinColor={skinColor}
        outfitStyle={outfitStyle}
        accessories={accessories}
      />

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
