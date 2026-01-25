'use client'

import { useEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface ExternalModelLoaderProps {
  url: string
  position?: [number, number, number]
  scale?: number
  rotation?: [number, number, number]
  color?: string
}

export function ExternalModelLoader({
  url,
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
  color
}: ExternalModelLoaderProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(url)

  useEffect(() => {
    if (scene && color) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial
          if (material.color) {
            material.color.set(color)
          }
        }
      })
    }
  }, [scene, color])

  return (
    <group ref={groupRef} position={position} scale={scale} rotation={rotation}>
      <primitive object={scene.clone()} />
    </group>
  )
}

// 프리로딩을 위한 유틸리티
export function preloadModel(url: string) {
  useGLTF.preload(url)
}

// 모델 캐시 정리
export function clearModelCache(url: string) {
  useGLTF.clear(url)
}
