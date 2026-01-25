import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import * as THREE from 'three'

interface ModelLoaderProps {
  url: string
  fileType?: string // 파일 확장자 (glb, gltf, fbx, obj)
  position?: [number, number, number]
  scale?: number | [number, number, number]
  rotation?: [number, number, number]
}

/**
 * 다양한 3D 모델 형식을 자동으로 감지하고 로드하는 컴포넌트
 * 지원 형식: GLB, GLTF, FBX, OBJ
 */
export default function ModelLoader({ url, fileType, position = [0, 0, 0], scale = 1, rotation = [0, 0, 0] }: ModelLoaderProps) {
  // fileType이 제공되면 사용, 아니면 URL에서 추출 시도
  const extension = fileType || url.split('.').pop()?.toLowerCase()

  let model: any

  try {
    if (extension === 'glb' || extension === 'gltf') {
      // GLB/GLTF 로드
      const gltf = useLoader(GLTFLoader, url)
      model = gltf.scene
    } else if (extension === 'fbx') {
      // FBX 로드
      model = useLoader(FBXLoader, url)
    } else if (extension === 'obj') {
      // OBJ 로드
      model = useLoader(OBJLoader, url)
    } else {
      console.error(`지원하지 않는 파일 형식: ${extension}`)
      return null
    }
  } catch (error) {
    console.error('모델 로드 실패:', error)
    return null
  }

  // 모델 클론 (원본 보호)
  const clonedModel = model.clone()

  // 그림자 활성화
  clonedModel.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
      
      // 재질 최적화
      if (child.material) {
        child.material.side = THREE.FrontSide
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
