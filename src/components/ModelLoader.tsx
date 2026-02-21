import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect } from 'react'

interface ModelLoaderProps {
  url: string
  fileType?: string // 파일 확장자 (glb만 지원)
  position?: [number, number, number]
  scale?: number | [number, number, number]
  rotation?: [number, number, number]
}

/**
 * GLB 모델을 로드하는 컴포넌트
 * 브라우저 업로드는 GLB만 지원 (텍스처 포함)
 */
export default function ModelLoader({ url, position = [0, 0, 0], scale = 1, rotation = [0, 0, 0] }: ModelLoaderProps) {
  // useGLTF 훅으로 GLB 로드 (DRACO 압축 지원)
  const { scene } = useGLTF(url, 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

  // 로드 완료 로그
  useEffect(() => {
    if (scene) {
      console.log('✅ 모델 로드 성공:', url)
    }
  }, [scene, url])

  // 모델 클론 (원본 보호)
  const clonedModel = scene.clone()

  // 그림자 활성화
  clonedModel.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true

      // 재질 최적화
      if (child.material) {
        child.material.side = THREE.FrontSide
        // 재질이 배열인 경우 처리
        if (Array.isArray(child.material)) {
          child.material.forEach((mat: any) => {
            mat.side = THREE.FrontSide
          })
        }
      }
    }
  })

  const scaleArray: [number, number, number] = Array.isArray(scale)
    ? scale
    : [scale, scale, scale]

  return (
    <primitive
      object={clonedModel}
      position={position}
      scale={scaleArray}
      rotation={rotation}
    />
  )
}
