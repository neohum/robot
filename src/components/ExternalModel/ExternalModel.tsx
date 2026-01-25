'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three-stdlib'
import { HumanoidJointAngles, HumanoidJointKey } from '@/lib/types/robot'

// 본 이름 매핑 - 다양한 명명 규칙 지원
const BONE_NAME_PATTERNS: Record<HumanoidJointKey, string[]> = {
  torso: ['Spine', 'spine', 'Spine1', 'spine1', 'mixamorigSpine', 'Torso', 'torso', 'Chest', 'chest'],
  neckYaw: ['Neck', 'neck', 'mixamorigNeck', 'Head', 'head'],
  neckPitch: ['Head', 'head', 'mixamorigHead'],

  leftShoulderPitch: ['LeftArm', 'LeftShoulder', 'mixamorigLeftArm', 'Left_Arm', 'L_Arm', 'Arm.L', 'shoulder.L', 'LeftUpperArm'],
  leftShoulderYaw: ['LeftArm', 'LeftShoulder', 'mixamorigLeftShoulder', 'Left_Shoulder', 'L_Shoulder'],
  leftElbow: ['LeftForeArm', 'LeftElbow', 'mixamorigLeftForeArm', 'Left_ForeArm', 'L_ForeArm', 'forearm.L', 'LeftLowerArm'],
  leftWrist: ['LeftHand', 'LeftWrist', 'mixamorigLeftHand', 'Left_Hand', 'L_Hand', 'hand.L'],
  leftGrip: ['LeftHandIndex1', 'LeftHandThumb1', 'mixamorigLeftHandIndex1', 'Left_Finger', 'L_Finger'],

  rightShoulderPitch: ['RightArm', 'RightShoulder', 'mixamorigRightArm', 'Right_Arm', 'R_Arm', 'Arm.R', 'shoulder.R', 'RightUpperArm'],
  rightShoulderYaw: ['RightArm', 'RightShoulder', 'mixamorigRightShoulder', 'Right_Shoulder', 'R_Shoulder'],
  rightElbow: ['RightForeArm', 'RightElbow', 'mixamorigRightForeArm', 'Right_ForeArm', 'R_ForeArm', 'forearm.R', 'RightLowerArm'],
  rightWrist: ['RightHand', 'RightWrist', 'mixamorigRightHand', 'Right_Hand', 'R_Hand', 'hand.R'],
  rightGrip: ['RightHandIndex1', 'RightHandThumb1', 'mixamorigRightHandIndex1', 'Right_Finger', 'R_Finger'],

  leftHipPitch: ['LeftUpLeg', 'LeftHip', 'mixamorigLeftUpLeg', 'Left_UpLeg', 'L_UpLeg', 'thigh.L', 'LeftUpperLeg'],
  leftHipYaw: ['LeftUpLeg', 'LeftHip', 'mixamorigLeftUpLeg', 'Left_Hip', 'L_Hip'],
  leftKnee: ['LeftLeg', 'LeftKnee', 'mixamorigLeftLeg', 'Left_Leg', 'L_Leg', 'shin.L', 'LeftLowerLeg'],
  leftAnkle: ['LeftFoot', 'LeftAnkle', 'mixamorigLeftFoot', 'Left_Foot', 'L_Foot', 'foot.L'],

  rightHipPitch: ['RightUpLeg', 'RightHip', 'mixamorigRightUpLeg', 'Right_UpLeg', 'R_UpLeg', 'thigh.R', 'RightUpperLeg'],
  rightHipYaw: ['RightUpLeg', 'RightHip', 'mixamorigRightUpLeg', 'Right_Hip', 'R_Hip'],
  rightKnee: ['RightLeg', 'RightKnee', 'mixamorigRightLeg', 'Right_Leg', 'R_Leg', 'shin.R', 'RightLowerLeg'],
  rightAnkle: ['RightFoot', 'RightAnkle', 'mixamorigRightFoot', 'Right_Foot', 'R_Foot', 'foot.R'],
}

// 관절별 회전 축 및 방향 설정
const JOINT_ROTATION_CONFIG: Record<HumanoidJointKey, { axis: 'x' | 'y' | 'z'; multiplier: number }> = {
  torso: { axis: 'y', multiplier: 1 },
  neckYaw: { axis: 'y', multiplier: 1 },
  neckPitch: { axis: 'x', multiplier: 1 },

  leftShoulderPitch: { axis: 'x', multiplier: 1 },
  leftShoulderYaw: { axis: 'z', multiplier: 1 },
  leftElbow: { axis: 'x', multiplier: 1 },
  leftWrist: { axis: 'z', multiplier: 1 },
  leftGrip: { axis: 'z', multiplier: 1 },

  rightShoulderPitch: { axis: 'x', multiplier: 1 },
  rightShoulderYaw: { axis: 'z', multiplier: 1 },
  rightElbow: { axis: 'x', multiplier: 1 },
  rightWrist: { axis: 'z', multiplier: 1 },
  rightGrip: { axis: 'z', multiplier: 1 },

  leftHipPitch: { axis: 'x', multiplier: 1 },
  leftHipYaw: { axis: 'y', multiplier: 1 },
  leftKnee: { axis: 'x', multiplier: 1 },
  leftAnkle: { axis: 'x', multiplier: 1 },

  rightHipPitch: { axis: 'x', multiplier: 1 },
  rightHipYaw: { axis: 'y', multiplier: 1 },
  rightKnee: { axis: 'x', multiplier: 1 },
  rightAnkle: { axis: 'x', multiplier: 1 },
}

export interface BoneMapping {
  jointKey: HumanoidJointKey
  boneName: string
  bone: THREE.Bone | THREE.Object3D
}

interface ExternalModelProps {
  url: string
  scale?: number
  position?: { x: number; y: number; z: number }
  jointAngles?: HumanoidJointAngles
  onBonesFound?: (bones: string[], mappings: BoneMapping[]) => void
  customBoneMapping?: Record<HumanoidJointKey, string>
}

function degToRad(deg: number): number {
  return deg * Math.PI / 180
}

export default function ExternalModel({
  url,
  scale = 1,
  position = { x: 0, y: 0, z: 0 },
  jointAngles,
  onBonesFound,
  customBoneMapping
}: ExternalModelProps) {
  const [model, setModel] = useState<THREE.Group | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [boneMappings, setBoneMappings] = useState<BoneMapping[]>([])
  const [initialRotations, setInitialRotations] = useState<Map<string, THREE.Euler>>(new Map())
  const groupRef = useRef<THREE.Group>(null)
  const loadedUrlRef = useRef<string | null>(null)

  // 본 찾기 함수 (Bone, SkinnedMesh skeleton, Object3D 순으로 탐색)
  const findBone = useCallback((model: THREE.Group, patterns: string[]): THREE.Bone | THREE.Object3D | null => {
    let foundBone: THREE.Bone | THREE.Object3D | null = null

    // 1. THREE.Bone 직접 탐색
    model.traverse((child) => {
      if (foundBone) return
      if (child instanceof THREE.Bone) {
        const boneName = child.name.toLowerCase()
        for (const pattern of patterns) {
          if (boneName.includes(pattern.toLowerCase())) {
            foundBone = child
            return
          }
        }
      }
    })

    if (foundBone) return foundBone

    // 2. SkinnedMesh skeleton에서 탐색
    model.traverse((child) => {
      if (foundBone) return
      if (child instanceof THREE.SkinnedMesh && child.skeleton) {
        for (const bone of child.skeleton.bones) {
          const boneName = bone.name.toLowerCase()
          for (const pattern of patterns) {
            if (boneName.includes(pattern.toLowerCase())) {
              foundBone = bone
              return
            }
          }
        }
      }
    })

    if (foundBone) return foundBone

    // 3. Object3D에서 탐색 (본이 없는 모델용)
    model.traverse((child) => {
      if (foundBone) return
      if (child instanceof THREE.Object3D && !(child instanceof THREE.Mesh)) {
        const objName = child.name.toLowerCase()
        for (const pattern of patterns) {
          if (objName.includes(pattern.toLowerCase())) {
            foundBone = child
            return
          }
        }
      }
    })

    return foundBone
  }, [])

  // 모든 본 이름 수집 (SkinnedMesh의 skeleton도 확인)
  const collectAllBones = useCallback((model: THREE.Group): string[] => {
    const bones: string[] = []
    const boneSet = new Set<string>()

    model.traverse((child) => {
      // THREE.Bone 직접 탐색
      if (child instanceof THREE.Bone) {
        if (!boneSet.has(child.name)) {
          boneSet.add(child.name)
          bones.push(child.name)
        }
      }

      // SkinnedMesh에서 skeleton의 bones 탐색
      if (child instanceof THREE.SkinnedMesh && child.skeleton) {
        for (const bone of child.skeleton.bones) {
          if (!boneSet.has(bone.name)) {
            boneSet.add(bone.name)
            bones.push(bone.name)
          }
        }
      }
    })

    // 본이 없으면 Object3D 이름도 수집 (일부 모델은 본 대신 Object3D 사용)
    if (bones.length === 0) {
      console.log('[ExternalModel] 본이 없음, Object3D 구조 탐색 중...')
      model.traverse((child) => {
        if (child.name && child.children.length > 0) {
          bones.push(child.name)
        }
      })
    }

    return bones
  }, [])

  // 이름으로 본/오브젝트 찾기
  const findByName = useCallback((model: THREE.Group, name: string): THREE.Bone | THREE.Object3D | null => {
    let found: THREE.Bone | THREE.Object3D | null = null

    // 1. Bone에서 찾기
    model.traverse((child) => {
      if (found) return
      if (child instanceof THREE.Bone && child.name === name) {
        found = child
      }
    })
    if (found) return found

    // 2. SkinnedMesh skeleton에서 찾기
    model.traverse((child) => {
      if (found) return
      if (child instanceof THREE.SkinnedMesh && child.skeleton) {
        for (const bone of child.skeleton.bones) {
          if (bone.name === name) {
            found = bone
            return
          }
        }
      }
    })
    if (found) return found

    // 3. Object3D에서 찾기
    model.traverse((child) => {
      if (found) return
      if (child.name === name) {
        found = child
      }
    })

    return found
  }, [])

  // 본 매핑 재계산 함수
  const recalculateBoneMappings = useCallback((loadedModel: THREE.Group, customMapping?: Record<HumanoidJointKey, string>) => {
    const allBones = collectAllBones(loadedModel)
    const mappings: BoneMapping[] = []
    const initRotations = new Map<string, THREE.Euler>()

    const jointKeys = Object.keys(BONE_NAME_PATTERNS) as HumanoidJointKey[]

    for (const jointKey of jointKeys) {
      let bone: THREE.Bone | THREE.Object3D | null = null
      let boneName = ''

      // 커스텀 매핑이 있으면 우선 사용
      if (customMapping && customMapping[jointKey]) {
        const customName = customMapping[jointKey]
        bone = findByName(loadedModel, customName)
        if (bone) {
          boneName = customName
        }
      }

      // 커스텀 매핑이 없거나 찾지 못한 경우 자동 매핑
      if (!bone) {
        const patterns = BONE_NAME_PATTERNS[jointKey]
        bone = findBone(loadedModel, patterns)
        if (bone) {
          boneName = bone.name
        }
      }

      if (bone) {
        mappings.push({ jointKey, boneName, bone })
        // 초기 회전값 저장
        initRotations.set(boneName, bone.rotation.clone())
      }
    }

    setBoneMappings(mappings)
    setInitialRotations(initRotations)

    return { allBones, mappings }
  }, [collectAllBones, findBone, findByName])

  // 모델 로드 (URL이 변경될 때만)
  useEffect(() => {
    if (!url) return
    if (loadedUrlRef.current === url && model) return // 이미 로드된 URL이면 스킵

    const loader = new GLTFLoader()

    loader.load(
      url,
      (gltf) => {
        const loadedModel = gltf.scene.clone()

        // 모델 중심점 계산 및 조정
        const box = new THREE.Box3().setFromObject(loadedModel)
        const center = box.getCenter(new THREE.Vector3())

        // 모델을 바닥에 맞추기
        loadedModel.position.y = -box.min.y
        loadedModel.position.x = -center.x
        loadedModel.position.z = -center.z

        // 그림자 설정
        loadedModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        loadedUrlRef.current = url
        setModel(loadedModel)
        setError(null)

        // 모델 구조 분석 로깅
        let boneCount = 0
        let skinnedMeshCount = 0
        let objectCount = 0
        loadedModel.traverse((child) => {
          if (child instanceof THREE.Bone) boneCount++
          if (child instanceof THREE.SkinnedMesh) skinnedMeshCount++
          if (child instanceof THREE.Object3D) objectCount++
        })
        console.log('[ExternalModel] 모델 구조:', {
          bones: boneCount,
          skinnedMeshes: skinnedMeshCount,
          objects: objectCount
        })

        // 본 매핑 계산
        const { allBones, mappings } = recalculateBoneMappings(loadedModel, customBoneMapping)

        // 콜백 호출
        if (onBonesFound) {
          onBonesFound(allBones, mappings)
        }

        console.log('GLB 모델 로드됨. 발견된 본/오브젝트:', allBones.length, '매핑된 관절:', mappings.length)
        if (allBones.length > 0) {
          console.log('[ExternalModel] 발견된 이름들:', allBones.slice(0, 20).join(', '), allBones.length > 20 ? '...' : '')
        }
      },
      undefined,
      (err) => {
        console.error('GLB 로딩 오류:', err)
        setError('모델을 불러올 수 없습니다')
      }
    )

    return () => {
      if (model) {
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose())
            } else {
              child.material.dispose()
            }
          }
        })
      }
    }
  }, [url])

  // 커스텀 매핑이 변경되면 본 매핑만 재계산 (모델 다시 로드 X)
  // onBonesFound를 호출하지 않음 - 무한 루프 방지
  useEffect(() => {
    if (!model) {
      return
    }
    if (!customBoneMapping || Object.keys(customBoneMapping).length === 0) {
      return
    }

    console.log('[ExternalModel] 커스텀 매핑으로 본 재계산 시작:', Object.keys(customBoneMapping).length, '개 관절')

    const { mappings } = recalculateBoneMappings(model, customBoneMapping)

    console.log('[ExternalModel] 본 매핑 재계산 완료:', mappings.length, '개 매핑됨')
    // onBonesFound를 여기서 호출하지 않음 - 부모에서 이미 상태를 알고 있음
  }, [customBoneMapping, model, recalculateBoneMappings])

  // 관절 각도를 본에 적용
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position.x, position.y, position.z)
    }

    if (!jointAngles || boneMappings.length === 0) {
      return
    }

    for (const mapping of boneMappings) {
      const { jointKey, bone, boneName } = mapping
      const angle = jointAngles[jointKey]
      const config = JOINT_ROTATION_CONFIG[jointKey]
      const initialRot = initialRotations.get(boneName)

      if (angle !== undefined && config && initialRot && bone) {
        const radians = degToRad(angle * config.multiplier)

        // 초기 회전값에 관절 각도를 더함
        switch (config.axis) {
          case 'x':
            bone.rotation.x = initialRot.x + radians
            break
          case 'y':
            bone.rotation.y = initialRot.y + radians
            break
          case 'z':
            bone.rotation.z = initialRot.z + radians
            break
        }
      }
    }
  })

  if (error) {
    return (
      <group ref={groupRef} position={[position.x, position.y, position.z]}>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1, 2, 0.5]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>
    )
  }

  if (!model) {
    return (
      <group ref={groupRef} position={[position.x, position.y, position.z]}>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#6b7280" wireframe />
        </mesh>
      </group>
    )
  }

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]} scale={scale}>
      <primitive object={model} />
    </group>
  )
}
