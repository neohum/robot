'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { toast } from 'sonner'
import { HumanoidJointKey } from '@/lib/types/robot'
import {
  saveBoneMappingToServer,
  loadBoneMappingFromServer
} from '@/lib/storage'

// 파트 타입 정의
interface ModelPart {
  id: string
  name: string
  fileName: string
  model: THREE.Group
  type: 'skinned' | 'separated'
  treeNodes: TreeNode[]
  boneNames: string[]
  mapping: Partial<Record<HumanoidJointKey, string>>
  visible: boolean
  position: [number, number, number]
}

// 트리 노드 타입
interface TreeNode {
  name: string
  type: 'bone' | 'object' | 'mesh' | 'group'
  object: THREE.Object3D
  children: TreeNode[]
  depth: number
}

// 관절 그룹 정의
const JOINT_GROUPS = [
  {
    name: '몸통/머리',
    joints: ['torso', 'neckYaw', 'neckPitch'] as HumanoidJointKey[]
  },
  {
    name: '왼팔',
    joints: ['leftShoulderPitch', 'leftShoulderYaw', 'leftElbow', 'leftWrist', 'leftGrip'] as HumanoidJointKey[]
  },
  {
    name: '오른팔',
    joints: ['rightShoulderPitch', 'rightShoulderYaw', 'rightElbow', 'rightWrist', 'rightGrip'] as HumanoidJointKey[]
  },
  {
    name: '왼다리',
    joints: ['leftHipPitch', 'leftHipYaw', 'leftKnee', 'leftAnkle'] as HumanoidJointKey[]
  },
  {
    name: '오른다리',
    joints: ['rightHipPitch', 'rightHipYaw', 'rightKnee', 'rightAnkle'] as HumanoidJointKey[]
  }
]

// 관절 이름 한글화
const JOINT_LABELS: Record<HumanoidJointKey, string> = {
  torso: '몸통',
  neckYaw: '목 좌우',
  neckPitch: '목 상하',
  leftShoulderPitch: '왼어깨 상하',
  leftShoulderYaw: '왼어깨 좌우',
  leftElbow: '왼팔꿈치',
  leftWrist: '왼손목',
  leftGrip: '왼손',
  rightShoulderPitch: '오른어깨 상하',
  rightShoulderYaw: '오른어깨 좌우',
  rightElbow: '오른팔꿈치',
  rightWrist: '오른손목',
  rightGrip: '오른손',
  leftHipPitch: '왼엉덩이 상하',
  leftHipYaw: '왼엉덩이 좌우',
  leftKnee: '왼무릎',
  leftAnkle: '왼발목',
  rightHipPitch: '오른엉덩이 상하',
  rightHipYaw: '오른엉덩이 좌우',
  rightKnee: '오른무릎',
  rightAnkle: '오른발목'
}

// 파트 프리셋 정의
const PART_PRESETS = [
  { id: 'head', name: '머리', joints: ['neckYaw', 'neckPitch'] as HumanoidJointKey[] },
  { id: 'torso', name: '몸통', joints: ['torso'] as HumanoidJointKey[] },
  { id: 'leftArm', name: '왼팔', joints: ['leftShoulderPitch', 'leftShoulderYaw', 'leftElbow', 'leftWrist', 'leftGrip'] as HumanoidJointKey[] },
  { id: 'rightArm', name: '오른팔', joints: ['rightShoulderPitch', 'rightShoulderYaw', 'rightElbow', 'rightWrist', 'rightGrip'] as HumanoidJointKey[] },
  { id: 'leftLeg', name: '왼다리', joints: ['leftHipPitch', 'leftHipYaw', 'leftKnee', 'leftAnkle'] as HumanoidJointKey[] },
  { id: 'rightLeg', name: '오른다리', joints: ['rightHipPitch', 'rightHipYaw', 'rightKnee', 'rightAnkle'] as HumanoidJointKey[] },
]

// 자동 매핑 패턴
const AUTO_MAPPING_PATTERNS: Record<HumanoidJointKey, string[]> = {
  torso: ['Spine', 'spine', 'Torso', 'torso', 'Hips', 'hips', 'mixamorigSpine'],
  neckYaw: ['Neck', 'neck', 'mixamorigNeck'],
  neckPitch: ['Head', 'head', 'mixamorigHead'],
  leftShoulderPitch: ['LeftArm', 'LeftShoulder', 'mixamorigLeftArm', 'Left_Arm', 'L_Arm', 'Arm.L', 'shoulder.L', 'LeftUpperArm'],
  leftShoulderYaw: ['LeftShoulder', 'mixamorigLeftShoulder', 'Left_Shoulder', 'L_Shoulder'],
  leftElbow: ['LeftForeArm', 'LeftElbow', 'mixamorigLeftForeArm', 'Left_Elbow', 'L_Elbow', 'forearm.L', 'LeftLowerArm'],
  leftWrist: ['LeftHand', 'LeftWrist', 'mixamorigLeftHand', 'Left_Hand', 'L_Hand', 'hand.L'],
  leftGrip: ['LeftHandIndex', 'LeftFinger', 'mixamorigLeftHandIndex1'],
  rightShoulderPitch: ['RightArm', 'RightShoulder', 'mixamorigRightArm', 'Right_Arm', 'R_Arm', 'Arm.R', 'shoulder.R', 'RightUpperArm'],
  rightShoulderYaw: ['RightShoulder', 'mixamorigRightShoulder', 'Right_Shoulder', 'R_Shoulder'],
  rightElbow: ['RightForeArm', 'RightElbow', 'mixamorigRightForeArm', 'Right_Elbow', 'R_Elbow', 'forearm.R', 'RightLowerArm'],
  rightWrist: ['RightHand', 'RightWrist', 'mixamorigRightHand', 'Right_Hand', 'R_Hand', 'hand.R'],
  rightGrip: ['RightHandIndex', 'RightFinger', 'mixamorigRightHandIndex1'],
  leftHipPitch: ['LeftUpLeg', 'LeftHip', 'mixamorigLeftUpLeg', 'Left_UpLeg', 'L_UpLeg', 'thigh.L', 'LeftUpperLeg'],
  leftHipYaw: ['LeftUpLeg', 'mixamorigLeftUpLeg'],
  leftKnee: ['LeftLeg', 'LeftKnee', 'mixamorigLeftLeg', 'Left_Leg', 'L_Leg', 'shin.L', 'LeftLowerLeg'],
  leftAnkle: ['LeftFoot', 'LeftAnkle', 'mixamorigLeftFoot', 'Left_Foot', 'L_Foot', 'foot.L'],
  rightHipPitch: ['RightUpLeg', 'RightHip', 'mixamorigRightUpLeg', 'Right_UpLeg', 'R_UpLeg', 'thigh.R', 'RightUpperLeg'],
  rightHipYaw: ['RightUpLeg', 'mixamorigRightUpLeg'],
  rightKnee: ['RightLeg', 'RightKnee', 'mixamorigRightLeg', 'Right_Leg', 'R_Leg', 'shin.R', 'RightLowerLeg'],
  rightAnkle: ['RightFoot', 'RightAnkle', 'mixamorigRightFoot', 'Right_Foot', 'R_Foot', 'foot.R']
}

// 3D 모델 뷰어 컴포넌트
function PartsViewer({
  parts,
  selectedPartId,
  selectedBone
}: {
  parts: ModelPart[]
  selectedPartId: string | null
  selectedBone: string | null
}) {
  const originalMaterials = useRef<Map<THREE.Object3D, THREE.Material | THREE.Material[]>>(new Map())

  // 선택된 본 하이라이트
  const selectedPart = parts.find(p => p.id === selectedPartId)

  return (
    <>
      {parts.filter(p => p.visible).map(part => (
        <group key={part.id} position={part.position}>
          <primitive
            object={part.model}
            onUpdate={(self: THREE.Group) => {
              // 선택된 파트의 선택된 본만 하이라이트
              if (part.id === selectedPartId && selectedBone) {
                self.traverse((obj) => {
                  if (obj instanceof THREE.Mesh) {
                    if (!originalMaterials.current.has(obj)) {
                      originalMaterials.current.set(obj, obj.material)
                    }

                    let isSelected = false
                    let parent: THREE.Object3D | null = obj
                    while (parent) {
                      if (parent.name === selectedBone) {
                        isSelected = true
                        break
                      }
                      parent = parent.parent
                    }

                    if (isSelected) {
                      obj.material = new THREE.MeshStandardMaterial({
                        color: 0x00ff00,
                        emissive: 0x00ff00,
                        emissiveIntensity: 0.3,
                        transparent: true,
                        opacity: 0.8
                      })
                    } else {
                      const original = originalMaterials.current.get(obj)
                      if (original) {
                        obj.material = original
                      }
                    }
                  }
                })
              }
            }}
          />
        </group>
      ))}
      {parts.length === 0 && (
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="gray" wireframe />
        </mesh>
      )}
    </>
  )
}

// 트리 노드 컴포넌트
function TreeNodeItem({
  node,
  selectedBone,
  mappedBones,
  onSelect,
  expandedNodes,
  onToggleExpand
}: {
  node: TreeNode
  selectedBone: string | null
  mappedBones: string[]
  onSelect: (name: string) => void
  expandedNodes: Set<string>
  onToggleExpand: (name: string) => void
}) {
  const isExpanded = expandedNodes.has(node.name)
  const hasChildren = node.children.length > 0
  const isSelected = selectedBone === node.name
  const isMapped = mappedBones.includes(node.name)

  const typeIcon = {
    bone: '🦴',
    mesh: '📦',
    group: '📁',
    object: '⚪'
  }[node.type]

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 cursor-pointer rounded text-sm ${
          isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
        } ${isMapped ? 'text-green-400' : 'text-gray-300'}`}
        style={{ paddingLeft: `${node.depth * 12 + 4}px` }}
        onClick={() => onSelect(node.name)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(node.name)
            }}
            className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-white"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="w-4" />}
        <span className="text-xs">{typeIcon}</span>
        <span className="truncate">{node.name}</span>
        {isMapped && <span className="text-green-400 text-xs ml-1">*</span>}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNodeItem
              key={`${child.name}-${idx}`}
              node={child}
              selectedBone={selectedBone}
              mappedBones={mappedBones}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function BoneEditorPage() {
  const [parts, setParts] = useState<ModelPart[]>([])
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string>('새 프로젝트')
  const [selectedBone, setSelectedBone] = useState<string | null>(null)
  const [selectedJoint, setSelectedJoint] = useState<HumanoidJointKey | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [testingJoint, setTestingJoint] = useState<HumanoidJointKey | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPartId, setUploadingPartId] = useState<string | null>(null)

  const selectedPart = parts.find(p => p.id === selectedPartId)

  // 모델 구조 분석
  const analyzeModel = useCallback((scene: THREE.Group) => {
    const bones: string[] = []
    const nodes: TreeNode[] = []
    let hasBones = false

    const buildTree = (obj: THREE.Object3D, depth: number): TreeNode | null => {
      if (!obj.name || obj.name === '') return null

      let type: TreeNode['type'] = 'object'
      if (obj instanceof THREE.Bone) {
        type = 'bone'
        hasBones = true
        bones.push(obj.name)
      } else if (obj instanceof THREE.Mesh) {
        type = 'mesh'
        if (!hasBones) bones.push(obj.name)
      } else if (obj instanceof THREE.Group) {
        type = 'group'
        if (!hasBones) bones.push(obj.name)
      } else {
        if (!hasBones) bones.push(obj.name)
      }

      const children: TreeNode[] = []
      for (const child of obj.children) {
        const childNode = buildTree(child, depth + 1)
        if (childNode) children.push(childNode)
      }

      return {
        name: obj.name,
        type,
        object: obj,
        children,
        depth
      }
    }

    for (const child of scene.children) {
      const node = buildTree(child, 0)
      if (node) nodes.push(node)
    }

    // 모든 노드 펼치기
    const allNames = new Set<string>()
    const collectNames = (node: TreeNode) => {
      allNames.add(node.name)
      node.children.forEach(collectNames)
    }
    nodes.forEach(collectNames)
    setExpandedNodes(allNames)

    return { bones, nodes, hasBones }
  }, [])

  // 자동 매핑
  const autoMapping = useCallback((bones: string[], allowedJoints?: HumanoidJointKey[]) => {
    const newMapping: Partial<Record<HumanoidJointKey, string>> = {}

    const jointsToMap = allowedJoints || (Object.keys(AUTO_MAPPING_PATTERNS) as HumanoidJointKey[])

    for (const jointKey of jointsToMap) {
      const patterns = AUTO_MAPPING_PATTERNS[jointKey]
      for (const pattern of patterns) {
        const found = bones.find(bone =>
          bone.toLowerCase().includes(pattern.toLowerCase()) ||
          pattern.toLowerCase().includes(bone.toLowerCase())
        )
        if (found && !Object.values(newMapping).includes(found)) {
          newMapping[jointKey] = found
          break
        }
      }
    }

    return newMapping
  }, [])

  // 새 파트 추가
  const handleAddPart = (presetId?: string) => {
    const preset = presetId ? PART_PRESETS.find(p => p.id === presetId) : null
    const newPart: ModelPart = {
      id: `part-${Date.now()}`,
      name: preset?.name || '새 파트',
      fileName: '',
      model: new THREE.Group(),
      type: 'separated',
      treeNodes: [],
      boneNames: [],
      mapping: {},
      visible: true,
      position: [0, 0, 0]
    }
    setParts(prev => [...prev, newPart])
    setSelectedPartId(newPart.id)
  }

  // 파트 삭제
  const handleDeletePart = (partId: string) => {
    setParts(prev => prev.filter(p => p.id !== partId))
    if (selectedPartId === partId) {
      setSelectedPartId(null)
    }
  }

  // 파트에 모델 업로드
  const handlePartFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, partId: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      toast.error('GLB 또는 GLTF 파일만 지원됩니다')
      return
    }

    setLoading(true)
    toast.loading('모델 로딩 중...', { id: 'load' })

    try {
      const url = URL.createObjectURL(file)
      const loader = new GLTFLoader()

      const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
        loader.load(url, resolve, undefined, reject)
      })

      URL.revokeObjectURL(url)

      const scene = gltf.scene
      const { bones, nodes, hasBones } = analyzeModel(scene)

      // 파트의 프리셋에 해당하는 관절만 자동 매핑
      const preset = PART_PRESETS.find(p => {
        const part = parts.find(pt => pt.id === partId)
        return part && p.name === part.name
      })
      const autoMapped = autoMapping(bones, preset?.joints)

      // 저장된 매핑 불러오기
      const modelKey = file.name.replace(/\.(glb|gltf)$/, '')
      const saved = await loadBoneMappingFromServer(modelKey)

      setParts(prev => prev.map(p => {
        if (p.id === partId) {
          return {
            ...p,
            fileName: file.name,
            model: scene,
            type: hasBones ? 'skinned' : 'separated',
            treeNodes: nodes,
            boneNames: bones,
            mapping: saved?.mappings || autoMapped
          }
        }
        return p
      }))

      if (saved) {
        toast.success('저장된 매핑을 불러왔습니다', { id: 'load' })
      } else {
        const mappedCount = Object.keys(autoMapped).length
        toast.success(`모델 로드 완료! 자동 매핑: ${mappedCount}개`, { id: 'load' })
      }
    } catch (error) {
      console.error('Load error:', error)
      toast.error('모델 로드 실패', { id: 'load' })
    } finally {
      setLoading(false)
      setUploadingPartId(null)
      event.target.value = ''
    }
  }

  // 매핑 변경
  const handleMappingChange = (joint: HumanoidJointKey, boneName: string | null) => {
    if (!selectedPartId) return

    setParts(prev => prev.map(p => {
      if (p.id === selectedPartId) {
        const newMapping = { ...p.mapping }
        if (boneName) {
          newMapping[joint] = boneName
        } else {
          delete newMapping[joint]
        }
        return { ...p, mapping: newMapping }
      }
      return p
    }))
  }

  // 전체 매핑 저장
  const handleSaveAll = async () => {
    if (parts.length === 0) {
      toast.error('저장할 파트가 없습니다')
      return
    }

    toast.loading('저장 중...', { id: 'save' })

    try {
      let successCount = 0
      for (const part of parts) {
        if (part.fileName && Object.keys(part.mapping).length > 0) {
          const modelKey = part.fileName.replace(/\.(glb|gltf)$/, '')
          const success = await saveBoneMappingToServer(
            modelKey,
            part.mapping as Record<HumanoidJointKey, string>
          )
          if (success) successCount++
        }
      }

      toast.success(`${successCount}개 파트 매핑 저장됨`, { id: 'save' })
    } catch (error) {
      toast.error('저장 중 오류 발생', { id: 'save' })
    }
  }

  // 매핑 테스트
  const handleTest = async (joint: HumanoidJointKey) => {
    if (!selectedPart) return

    const boneName = selectedPart.mapping[joint]
    if (!boneName) {
      toast.error('매핑된 본이 없습니다')
      return
    }

    setTestingJoint(joint)

    const findBone = (root: THREE.Object3D, name: string): THREE.Object3D | null => {
      if (root.name === name) return root
      for (const child of root.children) {
        const found = findBone(child, name)
        if (found) return found
      }
      return null
    }

    const targetBone = findBone(selectedPart.model, boneName)

    if (!targetBone) {
      toast.error('본을 찾을 수 없습니다')
      setTestingJoint(null)
      return
    }

    const originalRotation = targetBone.rotation.clone()
    const axis = joint.includes('Yaw') ? 'y' : joint.includes('Pitch') ? 'x' : 'z'

    for (let i = 0; i <= 30; i += 5) {
      targetBone.rotation[axis] = THREE.MathUtils.degToRad(i)
      await new Promise(r => setTimeout(r, 50))
    }
    for (let i = 30; i >= -30; i -= 5) {
      targetBone.rotation[axis] = THREE.MathUtils.degToRad(i)
      await new Promise(r => setTimeout(r, 50))
    }
    for (let i = -30; i <= 0; i += 5) {
      targetBone.rotation[axis] = THREE.MathUtils.degToRad(i)
      await new Promise(r => setTimeout(r, 50))
    }

    targetBone.rotation.copy(originalRotation)
    setTestingJoint(null)
  }

  // 선택한 본을 선택한 관절에 매핑
  const handleMapSelected = () => {
    if (selectedBone && selectedJoint) {
      handleMappingChange(selectedJoint, selectedBone)
      toast.success(`${JOINT_LABELS[selectedJoint]} ← ${selectedBone}`)
    }
  }

  // 노드 토글
  const handleToggleExpand = (name: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  // 파트 가시성 토글
  const handleToggleVisibility = (partId: string) => {
    setParts(prev => prev.map(p => {
      if (p.id === partId) {
        return { ...p, visible: !p.visible }
      }
      return p
    }))
  }

  // 파트 이름 변경
  const handleRenamePart = (partId: string, newName: string) => {
    setParts(prev => prev.map(p => {
      if (p.id === partId) {
        return { ...p, name: newName }
      }
      return p
    }))
  }

  // 선택된 파트의 매핑된 본 목록
  const mappedBones = selectedPart ? Object.values(selectedPart.mapping).filter(Boolean) as string[] : []

  // 전체 매핑 수 계산
  const totalMappings = parts.reduce((sum, p) => sum + Object.keys(p.mapping).length, 0)

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* 헤더 */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 13v10h-6v-6h-6v6h-6v-10h-3l12-12 12 12h-3zm-1-5.907v-5.093h-3v2.093l3 3z"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">본 매핑 에디터</h1>
            <p className="text-sm text-gray-400">
              {parts.length}개 파트 | 총 {totalMappings}개 매핑
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAll}
            disabled={parts.length === 0 || totalMappings === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            전체 저장
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽: 파트 목록 및 트리 */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* 파트 목록 */}
          <div className="border-b border-gray-700">
            <div className="p-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">파트 목록</h2>
              <div className="relative group">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                  title="파트 추가"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                {/* 드롭다운 메뉴 */}
                <div className="absolute right-0 top-full mt-1 bg-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-40">
                  <button
                    onClick={() => handleAddPart()}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-600 rounded-t-lg text-sm"
                  >
                    빈 파트 추가
                  </button>
                  <div className="border-t border-gray-600" />
                  {PART_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleAddPart(preset.id)}
                      className="w-full text-left px-4 py-2 text-white hover:bg-gray-600 text-sm"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {parts.length === 0 ? (
                <div className="px-4 pb-4 text-gray-500 text-sm text-center">
                  파트를 추가하세요
                </div>
              ) : (
                parts.map(part => (
                  <div
                    key={part.id}
                    className={`mx-2 mb-2 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedPartId === part.id
                        ? 'bg-blue-600/30 ring-1 ring-blue-500'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedPartId(part.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleVisibility(part.id)
                          }}
                          className={`p-1 rounded ${part.visible ? 'text-green-400' : 'text-gray-500'}`}
                          title={part.visible ? '숨기기' : '보이기'}
                        >
                          {part.visible ? '👁️' : '👁️‍🗨️'}
                        </button>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={part.name}
                            onChange={(e) => handleRenamePart(part.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent text-white text-sm font-medium w-full outline-none"
                          />
                          <p className="text-gray-400 text-xs truncate">
                            {part.fileName || '모델 없음'} · {Object.keys(part.mapping).length}개 매핑
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="file"
                          accept=".glb,.gltf"
                          onChange={(e) => handlePartFileUpload(e, part.id)}
                          className="hidden"
                          id={`file-${part.id}`}
                        />
                        <label
                          htmlFor={`file-${part.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-blue-400 hover:text-blue-300 cursor-pointer"
                          title="모델 업로드"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </label>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePart(part.id)
                          }}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 선택된 파트의 트리 구조 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <span>{selectedPart?.type === 'skinned' ? '🦴' : '📦'}</span>
                {selectedPart ? `${selectedPart.name} 구조` : '모델 구조'}
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                {selectedPart?.boneNames.length || 0}개 노드
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {selectedPart && selectedPart.treeNodes.length > 0 ? (
                selectedPart.treeNodes.map((node, idx) => (
                  <TreeNodeItem
                    key={`${node.name}-${idx}`}
                    node={node}
                    selectedBone={selectedBone}
                    mappedBones={mappedBones}
                    onSelect={setSelectedBone}
                    expandedNodes={expandedNodes}
                    onToggleExpand={handleToggleExpand}
                  />
                ))
              ) : (
                <div className="text-gray-500 text-center py-8 text-sm">
                  {selectedPart ? '모델을 업로드하세요' : '파트를 선택하세요'}
                </div>
              )}
            </div>

            {/* 선택된 본 정보 */}
            {selectedBone && selectedPart && (
              <div className="p-3 border-t border-gray-700 bg-gray-900">
                <p className="text-green-400 text-sm font-medium truncate">{selectedBone}</p>
                <button
                  onClick={handleMapSelected}
                  disabled={!selectedJoint}
                  className="mt-2 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-1.5 px-3 rounded text-sm transition-colors"
                >
                  선택한 관절에 매핑
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 중앙: 3D 뷰어 */}
        <div className="flex-1 relative">
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[2, 2, 3]} fov={50} />
            <OrbitControls enableDamping dampingFactor={0.05} />

            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <directionalLight position={[-3, 5, -3]} intensity={0.3} />

            <PartsViewer
              parts={parts}
              selectedPartId={selectedPartId}
              selectedBone={selectedBone}
            />

            <Grid
              args={[10, 10]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#4a4a6a"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#6a6a8a"
              position={[0, 0, 0]}
            />
          </Canvas>

          {/* 조작 안내 */}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-gray-300 text-xs">마우스로 회전 / 휠로 확대축소</p>
          </div>

          {/* 테스트 중 표시 */}
          {testingJoint && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-lg">
              {JOINT_LABELS[testingJoint]} 테스트 중...
            </div>
          )}
        </div>

        {/* 오른쪽: 관절 매핑 패널 */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-white font-semibold">
              {selectedPart ? `${selectedPart.name} 관절 매핑` : '관절 매핑'}
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              {selectedPart ? `${Object.keys(selectedPart.mapping).length}/22개 매핑됨` : '파트를 선택하세요'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {JOINT_GROUPS.map(group => (
              <div key={group.name} className="border-b border-gray-700">
                <div className="px-4 py-2 bg-gray-900">
                  <h3 className="text-gray-400 text-xs font-medium">{group.name}</h3>
                </div>
                <div className="p-2 space-y-1">
                  {group.joints.map(joint => {
                    const mappedBone = selectedPart?.mapping[joint]
                    const isSelected = selectedJoint === joint

                    return (
                      <div
                        key={joint}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                          isSelected ? 'bg-purple-600/30 ring-1 ring-purple-500' : 'hover:bg-gray-700'
                        } ${!selectedPart ? 'opacity-50' : ''}`}
                        onClick={() => selectedPart && setSelectedJoint(joint)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{JOINT_LABELS[joint]}</p>
                          {mappedBone ? (
                            <p className="text-green-400 text-xs truncate">{mappedBone}</p>
                          ) : (
                            <p className="text-gray-500 text-xs">미매핑</p>
                          )}
                        </div>

                        {mappedBone && selectedPart && (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTest(joint)
                              }}
                              disabled={!!testingJoint}
                              className="p-1 text-blue-400 hover:text-blue-300 disabled:text-gray-600"
                              title="테스트"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMappingChange(joint, null)
                              }}
                              className="p-1 text-red-400 hover:text-red-300"
                              title="제거"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 하단 액션 버튼 */}
          <div className="p-4 border-t border-gray-700 space-y-2">
            <button
              onClick={() => {
                if (selectedPart && selectedPart.boneNames.length > 0) {
                  const preset = PART_PRESETS.find(p => p.name === selectedPart.name)
                  const auto = autoMapping(selectedPart.boneNames, preset?.joints)
                  setParts(prev => prev.map(p => {
                    if (p.id === selectedPartId) {
                      return { ...p, mapping: { ...p.mapping, ...auto } }
                    }
                    return p
                  }))
                  toast.success(`${Object.keys(auto).length}개 자동 매핑됨`)
                }
              }}
              disabled={!selectedPart || selectedPart.boneNames.length === 0}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              자동 매핑
            </button>
            <button
              onClick={() => {
                if (selectedPart) {
                  setParts(prev => prev.map(p => {
                    if (p.id === selectedPartId) {
                      return { ...p, mapping: {} }
                    }
                    return p
                  }))
                  toast.info('매핑이 초기화되었습니다')
                }
              }}
              disabled={!selectedPart || Object.keys(selectedPart.mapping).length === 0}
              className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
