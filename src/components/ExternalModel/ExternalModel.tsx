'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader, DRACOLoader, SkeletonUtils } from 'three-stdlib'
import { HumanoidJointAngles, HumanoidJointKey } from '@/lib/types/robot'

// 본 이름 매핑 - 다양한 명명 규칙 지원
// 각 관절의 첫 번째 항목은 정확히 일치하는 이름 (exact match 우선)
const BONE_NAME_PATTERNS: Record<HumanoidJointKey, string[]> = {
  torso: ['torso', 'Spine', 'spine', 'Spine1', 'spine1', 'Spine2', 'spine2', 'mixamorigSpine', 'Torso', 'Chest', 'chest'],
  neckYaw: ['neckYaw', 'Neck', 'neck', 'mixamorigNeck'],
  neckPitch: ['neckPitch', 'Head', 'head', 'mixamorigHead'],

  leftShoulderPitch: ['leftShoulderPitch', 'LeftArm', 'mixamorigLeftArm', 'Left_Arm', 'L_Arm', 'Arm.L', 'shoulder.L', 'LeftUpperArm'],
  leftShoulderYaw: ['leftShoulderYaw', 'LeftShoulder', 'mixamorigLeftShoulder', 'Left_Shoulder', 'L_Shoulder'],
  leftElbow: ['leftElbow', 'LeftForeArm', 'LeftElbow', 'mixamorigLeftForeArm', 'Left_ForeArm', 'L_ForeArm', 'forearm.L', 'LeftLowerArm'],
  leftWrist: ['leftWrist', 'LeftHand', 'LeftWrist', 'mixamorigLeftHand', 'Left_Hand', 'L_Hand', 'hand.L'],
  leftGrip: ['leftGrip', 'LeftHandIndex1', 'LeftHandThumb1', 'mixamorigLeftHandIndex1', 'Left_Finger', 'L_Finger', 'LeftGrip'],

  rightShoulderPitch: ['rightShoulderPitch', 'RightArm', 'mixamorigRightArm', 'Right_Arm', 'R_Arm', 'Arm.R', 'shoulder.R', 'RightUpperArm'],
  rightShoulderYaw: ['rightShoulderYaw', 'RightShoulder', 'mixamorigRightShoulder', 'Right_Shoulder', 'R_Shoulder'],
  rightElbow: ['rightElbow', 'RightForeArm', 'RightElbow', 'mixamorigRightForeArm', 'Right_ForeArm', 'R_ForeArm', 'forearm.R', 'RightLowerArm'],
  rightWrist: ['rightWrist', 'RightHand', 'RightWrist', 'mixamorigRightHand', 'Right_Hand', 'R_Hand', 'hand.R'],
  rightGrip: ['rightGrip', 'RightHandIndex1', 'RightHandThumb1', 'mixamorigRightHandIndex1', 'Right_Finger', 'R_Finger', 'RightGrip'],

  leftHipPitch: ['leftHipPitch', 'LeftUpLeg', 'mixamorigLeftUpLeg', 'Left_UpLeg', 'L_UpLeg', 'thigh.L', 'LeftUpperLeg'],
  leftHipYaw: ['leftHipYaw', 'LeftHip', 'mixamorigLeftUpLeg', 'Left_Hip', 'L_Hip'],
  leftKnee: ['leftKnee', 'LeftLeg', 'LeftKnee', 'mixamorigLeftLeg', 'Left_Leg', 'L_Leg', 'shin.L', 'LeftLowerLeg'],
  leftAnkle: ['leftAnkle', 'LeftFoot', 'LeftAnkle', 'mixamorigLeftFoot', 'Left_Foot', 'L_Foot', 'foot.L', 'LeftToeBase'],

  rightHipPitch: ['rightHipPitch', 'RightUpLeg', 'mixamorigRightUpLeg', 'Right_UpLeg', 'R_UpLeg', 'thigh.R', 'RightUpperLeg'],
  rightHipYaw: ['rightHipYaw', 'RightHip', 'mixamorigRightUpLeg', 'Right_Hip', 'R_Hip'],
  rightKnee: ['rightKnee', 'RightLeg', 'RightKnee', 'mixamorigRightLeg', 'Right_Leg', 'R_Leg', 'shin.R', 'RightLowerLeg'],
  rightAnkle: ['rightAnkle', 'RightFoot', 'RightAnkle', 'mixamorigRightFoot', 'Right_Foot', 'R_Foot', 'foot.R', 'RightToeBase'],
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

  // 본 찾기 함수 (정확한 이름 매칭 우선 → substring 매칭 폴백)
  const findBone = useCallback((model: THREE.Group, patterns: string[]): THREE.Bone | THREE.Object3D | null => {
    let foundBone: THREE.Bone | THREE.Object3D | null = null

    // === PASS 1: 정확한 이름 매칭 (exact match) ===
    // 관절 이름과 동일한 본 이름을 최우선으로 찾음
    for (const pattern of patterns) {
      if (foundBone) break
      model.traverse((child) => {
        if (foundBone) return
        if (child instanceof THREE.Bone && child.name === pattern) {
          foundBone = child
        }
      })
      if (foundBone) return foundBone

      // SkinnedMesh skeleton에서도 정확 매칭
      model.traverse((child) => {
        if (foundBone) return
        if (child instanceof THREE.SkinnedMesh && child.skeleton) {
          for (const bone of child.skeleton.bones) {
            if (bone.name === pattern) {
              foundBone = bone
              return
            }
          }
        }
      })
      if (foundBone) return foundBone

      // Object3D에서도 정확 매칭
      model.traverse((child) => {
        if (foundBone) return
        if (child instanceof THREE.Object3D && !(child instanceof THREE.Mesh) && child.name === pattern) {
          foundBone = child
        }
      })
      if (foundBone) return foundBone
    }

    // === PASS 2: substring 매칭 (기존 방식 폴백) ===
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

    // 제외할 일반적인 루트/씬 이름
    const excludeNames = ['Scene', 'AuxScene', 'Root', 'Armature', 'RootNode', 'Sketchfab_model', 'root']

    model.traverse((child) => {
      // THREE.Bone 직접 탐색
      if (child instanceof THREE.Bone) {
        if (!boneSet.has(child.name) && child.name && !excludeNames.includes(child.name)) {
          boneSet.add(child.name)
          bones.push(child.name)
        }
      }

      // SkinnedMesh에서 skeleton의 bones 탐색
      if (child instanceof THREE.SkinnedMesh && child.skeleton) {
        for (const bone of child.skeleton.bones) {
          if (!boneSet.has(bone.name) && bone.name && !excludeNames.includes(bone.name)) {
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
        // 이름이 있고, Mesh가 아닌 Object3D (조작 가능한 노드)
        if (child.name &&
          !excludeNames.includes(child.name) &&
          !boneSet.has(child.name)) {
          // Mesh 자체는 제외하고 그룹/노드만 포함
          if (!(child instanceof THREE.Mesh)) {
            boneSet.add(child.name)
            bones.push(child.name)
          }
        }
      })

      // 그래도 없으면 모든 이름있는 객체 수집
      if (bones.length === 0) {
        console.log('[ExternalModel] Object3D도 없음, 모든 이름있는 객체 수집...')
        model.traverse((child) => {
          if (child.name && !boneSet.has(child.name)) {
            boneSet.add(child.name)
            bones.push(child.name)
          }
        })
      }
    }

    console.log('[ExternalModel] 수집된 본/객체 수:', bones.length)
    if (bones.length > 0 && bones.length <= 30) {
      console.log('[ExternalModel] 이름 목록:', bones.join(', '))
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
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    loader.setDRACOLoader(dracoLoader)

    loader.load(
      url,
      (gltf) => {
        const loadedModel = SkeletonUtils.clone(gltf.scene) as THREE.Group

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
        let meshCount = 0
        const meshParents: string[] = []
        loadedModel.traverse((child) => {
          if (child instanceof THREE.Bone) boneCount++
          if (child instanceof THREE.SkinnedMesh) skinnedMeshCount++
          if (child instanceof THREE.Mesh) {
            meshCount++
            if (child.parent) {
              meshParents.push(`${child.name || '(unnamed)'} -> parent: ${child.parent.name || '(unnamed)'}`)
            }
          }
          if (child instanceof THREE.Object3D) objectCount++
        })
        console.log('[ExternalModel] 모델 구조:', {
          bones: boneCount,
          skinnedMeshes: skinnedMeshCount,
          meshes: meshCount,
          objects: objectCount
        })
        if (meshParents.length > 0) {
          console.log('[ExternalModel] Mesh 위치:', meshParents.slice(0, 10))
        }

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
        // Blob URL 만료 감지
        if (url.startsWith('blob:')) {
          setError('파일 모델이 만료되었습니다. 다시 로드해주세요.')
          console.warn('[ExternalModel] Blob URL이 만료됨 - 페이지 새로고침 후에는 파일을 다시 선택해야 합니다')
        } else {
          setError('모델을 불러올 수 없습니다')
        }
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

  // 본 매핑 상태 디버깅 (변경 시에만 로그)
  const prevBoneMappingsLengthRef = useRef(0)
  useEffect(() => {
    if (boneMappings.length !== prevBoneMappingsLengthRef.current) {
      prevBoneMappingsLengthRef.current = boneMappings.length
      console.log('[ExternalModel] 본 매핑 업데이트됨:', boneMappings.length, '개')
      if (boneMappings.length > 0) {
        console.log('[ExternalModel] 매핑된 관절:', boneMappings.map(m => `${m.jointKey}→${m.boneName}`).join(', '))
      }
    }
  }, [boneMappings])

  // 관절 각도를 본에 적용
  const lastAppliedAngleRef = useRef<Record<string, number>>({})
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
        // 각도 변경 시 로그 (프레임마다 출력하지 않도록)
        const angleChanged = lastAppliedAngleRef.current[jointKey] !== angle
        if (angleChanged && angle !== 0) {
          console.log(`[ExternalModel] 관절 회전: ${jointKey} = ${angle}° → 본: ${boneName}`)
          console.log(`  - bone 타입: ${bone.type}, 자식 수: ${bone.children.length}`)
          console.log(`  - 현재 rotation: x=${bone.rotation.x.toFixed(2)}, y=${bone.rotation.y.toFixed(2)}, z=${bone.rotation.z.toFixed(2)}`)
          console.log(`  - initialRot: x=${initialRot.x.toFixed(2)}, y=${initialRot.y.toFixed(2)}, z=${initialRot.z.toFixed(2)}`)
          // 자식 타입 확인
          if (bone.children.length > 0) {
            const childTypes = bone.children.slice(0, 3).map(c => c.type).join(', ')
            console.log(`  - 자식 타입들: ${childTypes}`)
          }
          lastAppliedAngleRef.current[jointKey] = angle
        } else if (angleChanged && angle === 0) {
          lastAppliedAngleRef.current[jointKey] = angle
        }

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

        // 디버깅: 회전 적용 후 값 확인
        if (angleChanged && angle !== 0) {
          console.log(`  - 적용 후 rotation.${config.axis}=${bone.rotation[config.axis].toFixed(2)} (radians: ${radians.toFixed(2)})`)
        }

        // 회전 적용 후 업데이트 필요
        bone.updateMatrix()
        bone.updateMatrixWorld(true)
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
