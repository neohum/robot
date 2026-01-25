'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Grid, TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { toast } from 'sonner'

// 노드 타입 정의
interface EditorNode {
  id: string
  name: string
  type: 'group' | 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane' | 'imported'
  parentId: string | null
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: string
  visible: boolean
  // 도형별 파라미터
  params?: {
    width?: number
    height?: number
    depth?: number
    radius?: number
    radiusTop?: number
    radiusBottom?: number
    tube?: number
    radialSegments?: number
    tubularSegments?: number
  }
  // 임포트된 geometry
  geometry?: THREE.BufferGeometry
}

// 기본 도형 파라미터
const DEFAULT_PARAMS: Record<string, EditorNode['params']> = {
  box: { width: 1, height: 1, depth: 1 },
  sphere: { radius: 0.5, radialSegments: 32 },
  cylinder: { radiusTop: 0.5, radiusBottom: 0.5, height: 1, radialSegments: 32 },
  cone: { radius: 0.5, height: 1, radialSegments: 32 },
  torus: { radius: 0.4, tube: 0.1, radialSegments: 16, tubularSegments: 48 },
  plane: { width: 1, height: 1 }
}

// 도형 이름 한글화
const SHAPE_LABELS: Record<string, string> = {
  group: '그룹',
  box: '박스',
  sphere: '구',
  cylinder: '실린더',
  cone: '원뿔',
  torus: '토러스',
  plane: '평면',
  imported: '임포트'
}

// 3D 노드 렌더러
function NodeMesh({
  node,
  isSelected,
  onSelect
}: {
  node: EditorNode
  isSelected: boolean
  onSelect: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useCallback(() => {
    if (node.geometry) return node.geometry

    const p = node.params || {}
    switch (node.type) {
      case 'box':
        return new THREE.BoxGeometry(p.width || 1, p.height || 1, p.depth || 1)
      case 'sphere':
        return new THREE.SphereGeometry(p.radius || 0.5, p.radialSegments || 32, p.radialSegments || 32)
      case 'cylinder':
        return new THREE.CylinderGeometry(p.radiusTop || 0.5, p.radiusBottom || 0.5, p.height || 1, p.radialSegments || 32)
      case 'cone':
        return new THREE.ConeGeometry(p.radius || 0.5, p.height || 1, p.radialSegments || 32)
      case 'torus':
        return new THREE.TorusGeometry(p.radius || 0.4, p.tube || 0.1, p.radialSegments || 16, p.tubularSegments || 48)
      case 'plane':
        return new THREE.PlaneGeometry(p.width || 1, p.height || 1)
      default:
        return new THREE.BoxGeometry(1, 1, 1)
    }
  }, [node.type, node.params, node.geometry])

  if (node.type === 'group') return null
  if (!node.visible) return null

  return (
    <mesh
      ref={meshRef}
      position={node.position}
      rotation={node.rotation.map(r => THREE.MathUtils.degToRad(r)) as [number, number, number]}
      scale={node.scale}
      geometry={geometry()}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <meshStandardMaterial
        color={node.color}
        emissive={isSelected ? node.color : '#000000'}
        emissiveIntensity={isSelected ? 0.2 : 0}
      />
    </mesh>
  )
}

// 씬 렌더러
function SceneRenderer({
  nodes,
  selectedId,
  onSelectNode,
  transformMode,
  onTransformChange
}: {
  nodes: EditorNode[]
  selectedId: string | null
  onSelectNode: (id: string | null) => void
  transformMode: 'translate' | 'rotate' | 'scale'
  onTransformChange: (position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => void
}) {
  const selectedNode = nodes.find(n => n.id === selectedId)
  const transformRef = useRef<THREE.Object3D>(null)

  // TransformControls 변경 감지
  useEffect(() => {
    if (transformRef.current && selectedNode) {
      transformRef.current.position.set(...selectedNode.position)
      transformRef.current.rotation.set(
        THREE.MathUtils.degToRad(selectedNode.rotation[0]),
        THREE.MathUtils.degToRad(selectedNode.rotation[1]),
        THREE.MathUtils.degToRad(selectedNode.rotation[2])
      )
      transformRef.current.scale.set(...selectedNode.scale)
    }
  }, [selectedNode])

  return (
    <>
      {nodes.map(node => (
        <NodeMesh
          key={node.id}
          node={node}
          isSelected={selectedId === node.id}
          onSelect={() => onSelectNode(node.id)}
        />
      ))}

      {selectedNode && selectedNode.type !== 'group' && (
        <>
          <group
            ref={transformRef}
            position={selectedNode.position}
            rotation={selectedNode.rotation.map(r => THREE.MathUtils.degToRad(r)) as [number, number, number]}
            scale={selectedNode.scale}
          />
          <TransformControls
            object={transformRef.current || undefined}
            mode={transformMode}
            onObjectChange={() => {
              if (transformRef.current) {
                const pos: [number, number, number] = [
                  transformRef.current.position.x,
                  transformRef.current.position.y,
                  transformRef.current.position.z
                ]
                const rot: [number, number, number] = [
                  THREE.MathUtils.radToDeg(transformRef.current.rotation.x),
                  THREE.MathUtils.radToDeg(transformRef.current.rotation.y),
                  THREE.MathUtils.radToDeg(transformRef.current.rotation.z)
                ]
                const scl: [number, number, number] = [
                  transformRef.current.scale.x,
                  transformRef.current.scale.y,
                  transformRef.current.scale.z
                ]
                onTransformChange(pos, rot, scl)
              }
            }}
          />
        </>
      )}
    </>
  )
}

// 트리 노드 컴포넌트
function TreeNodeItem({
  node,
  nodes,
  selectedId,
  onSelect,
  expandedNodes,
  onToggleExpand,
  depth = 0
}: {
  node: EditorNode
  nodes: EditorNode[]
  selectedId: string | null
  onSelect: (id: string) => void
  expandedNodes: Set<string>
  onToggleExpand: (id: string) => void
  depth?: number
}) {
  const children = nodes.filter(n => n.parentId === node.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedNodes.has(node.id)
  const isSelected = selectedId === node.id

  const typeIcon = {
    group: '📁',
    box: '⬜',
    sphere: '🔵',
    cylinder: '🔷',
    cone: '🔺',
    torus: '⭕',
    plane: '▭',
    imported: '📦'
  }[node.type]

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 cursor-pointer rounded text-sm ${
          isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(node.id)
            }}
            className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-white"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <span className="text-xs opacity-70">{typeIcon}</span>
        <span className={`truncate ${!node.visible ? 'opacity-50' : ''}`}>{node.name}</span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {children.map(child => (
            <TreeNodeItem
              key={child.id}
              node={child}
              nodes={nodes}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ModelEditorPage() {
  const [nodes, setNodes] = useState<EditorNode[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate')
  const [projectName, setProjectName] = useState('새 모델')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)

  const selectedNode = nodes.find(n => n.id === selectedId)
  const rootNodes = nodes.filter(n => n.parentId === null)

  // 노드 추가
  const addNode = (type: EditorNode['type']) => {
    const newNode: EditorNode = {
      id: `node-${Date.now()}`,
      name: `${SHAPE_LABELS[type]}_${nodes.length + 1}`,
      type,
      parentId: selectedId,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      visible: true,
      params: DEFAULT_PARAMS[type] ? { ...DEFAULT_PARAMS[type] } : undefined
    }
    setNodes(prev => [...prev, newNode])
    setSelectedId(newNode.id)
    if (selectedId) {
      setExpandedNodes(prev => new Set([...prev, selectedId]))
    }
  }

  // 노드 삭제
  const deleteNode = (id: string) => {
    // 자식 노드들도 함께 삭제
    const getDescendants = (nodeId: string): string[] => {
      const children = nodes.filter(n => n.parentId === nodeId)
      return [nodeId, ...children.flatMap(c => getDescendants(c.id))]
    }
    const toDelete = new Set(getDescendants(id))
    setNodes(prev => prev.filter(n => !toDelete.has(n.id)))
    if (selectedId && toDelete.has(selectedId)) {
      setSelectedId(null)
    }
  }

  // 노드 복제
  const duplicateNode = (id: string) => {
    const node = nodes.find(n => n.id === id)
    if (!node) return

    const newNode: EditorNode = {
      ...node,
      id: `node-${Date.now()}`,
      name: `${node.name}_복사`,
      position: [node.position[0] + 0.5, node.position[1], node.position[2]]
    }
    setNodes(prev => [...prev, newNode])
    setSelectedId(newNode.id)
  }

  // 노드 업데이트
  const updateNode = (id: string, updates: Partial<EditorNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
  }

  // 트랜스폼 변경
  const handleTransformChange = (
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => {
    if (selectedId) {
      updateNode(selectedId, { position, rotation, scale })
    }
  }

  // GLB 내보내기
  const exportGLB = async () => {
    if (nodes.length === 0) {
      toast.error('내보낼 노드가 없습니다')
      return
    }

    toast.loading('GLB 생성 중...', { id: 'export' })

    try {
      // Three.js 씬 구성
      const scene = new THREE.Scene()
      const nodeMap = new Map<string, THREE.Object3D>()

      // 노드를 Three.js 오브젝트로 변환
      for (const node of nodes) {
        let obj: THREE.Object3D

        if (node.type === 'group') {
          obj = new THREE.Group()
        } else {
          const p = node.params || {}
          let geometry: THREE.BufferGeometry

          if (node.geometry) {
            geometry = node.geometry
          } else {
            switch (node.type) {
              case 'box':
                geometry = new THREE.BoxGeometry(p.width || 1, p.height || 1, p.depth || 1)
                break
              case 'sphere':
                geometry = new THREE.SphereGeometry(p.radius || 0.5, p.radialSegments || 32, p.radialSegments || 32)
                break
              case 'cylinder':
                geometry = new THREE.CylinderGeometry(p.radiusTop || 0.5, p.radiusBottom || 0.5, p.height || 1, p.radialSegments || 32)
                break
              case 'cone':
                geometry = new THREE.ConeGeometry(p.radius || 0.5, p.height || 1, p.radialSegments || 32)
                break
              case 'torus':
                geometry = new THREE.TorusGeometry(p.radius || 0.4, p.tube || 0.1, p.radialSegments || 16, p.tubularSegments || 48)
                break
              case 'plane':
                geometry = new THREE.PlaneGeometry(p.width || 1, p.height || 1)
                break
              default:
                geometry = new THREE.BoxGeometry(1, 1, 1)
            }
          }

          const material = new THREE.MeshStandardMaterial({ color: node.color })
          obj = new THREE.Mesh(geometry, material)
        }

        obj.name = node.name
        obj.position.set(...node.position)
        obj.rotation.set(
          THREE.MathUtils.degToRad(node.rotation[0]),
          THREE.MathUtils.degToRad(node.rotation[1]),
          THREE.MathUtils.degToRad(node.rotation[2])
        )
        obj.scale.set(...node.scale)
        obj.visible = node.visible

        nodeMap.set(node.id, obj)
      }

      // 계층 구조 설정
      for (const node of nodes) {
        const obj = nodeMap.get(node.id)
        if (!obj) continue

        if (node.parentId) {
          const parent = nodeMap.get(node.parentId)
          if (parent) {
            parent.add(obj)
          } else {
            scene.add(obj)
          }
        } else {
          scene.add(obj)
        }
      }

      // GLB로 내보내기
      const exporter = new GLTFExporter()
      const glb = await new Promise<ArrayBuffer>((resolve, reject) => {
        exporter.parse(
          scene,
          (result) => resolve(result as ArrayBuffer),
          reject,
          { binary: true }
        )
      })

      // 다운로드
      const blob = new Blob([glb], { type: 'model/gltf-binary' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName}.glb`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('GLB 파일이 다운로드되었습니다', { id: 'export' })
    } catch (error) {
      console.error('Export error:', error)
      toast.error('내보내기 실패', { id: 'export' })
    }
  }

  // GLB 가져오기
  const importGLB = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    toast.loading('GLB 로딩 중...', { id: 'import' })

    try {
      const url = URL.createObjectURL(file)
      const loader = new GLTFLoader()

      const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
        loader.load(url, resolve, undefined, reject)
      })

      URL.revokeObjectURL(url)

      // 씬의 모든 메시를 노드로 변환
      const newNodes: EditorNode[] = []
      const idMap = new Map<THREE.Object3D, string>()

      const traverse = (obj: THREE.Object3D, parentId: string | null) => {
        if (!obj.name) obj.name = `Object_${newNodes.length}`

        const id = `node-${Date.now()}-${newNodes.length}`
        idMap.set(obj, id)

        const node: EditorNode = {
          id,
          name: obj.name,
          type: obj instanceof THREE.Mesh ? 'imported' : 'group',
          parentId,
          position: [obj.position.x, obj.position.y, obj.position.z],
          rotation: [
            THREE.MathUtils.radToDeg(obj.rotation.x),
            THREE.MathUtils.radToDeg(obj.rotation.y),
            THREE.MathUtils.radToDeg(obj.rotation.z)
          ],
          scale: [obj.scale.x, obj.scale.y, obj.scale.z],
          color: obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial
            ? '#' + obj.material.color.getHexString()
            : '#888888',
          visible: obj.visible
        }

        if (obj instanceof THREE.Mesh) {
          node.geometry = obj.geometry.clone()
        }

        newNodes.push(node)

        for (const child of obj.children) {
          traverse(child, id)
        }
      }

      for (const child of gltf.scene.children) {
        traverse(child, null)
      }

      setNodes(prev => [...prev, ...newNodes])
      setProjectName(file.name.replace(/\.(glb|gltf)$/, ''))

      // 모든 노드 펼치기
      const allIds = new Set(newNodes.map(n => n.id))
      setExpandedNodes(prev => new Set([...prev, ...allIds]))

      toast.success(`${newNodes.length}개 노드 가져옴`, { id: 'import' })
    } catch (error) {
      console.error('Import error:', error)
      toast.error('가져오기 실패', { id: 'import' })
    } finally {
      event.target.value = ''
    }
  }

  // 토글
  const handleToggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* 헤더 */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 13v10h-6v-6h-6v6h-6v-10h-3l12-12 12 12h-3zm-1-5.907v-5.093h-3v2.093l3 3z"/>
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm">.glb</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            onChange={importGLB}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            가져오기
          </button>
          <button
            onClick={exportGLB}
            disabled={nodes.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            GLB 내보내기
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽: 노드 트리 */}
        <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* 도형 추가 버튼들 */}
          <div className="p-3 border-b border-gray-700">
            <p className="text-gray-400 text-xs mb-2">도형 추가</p>
            <div className="grid grid-cols-4 gap-1">
              {(['group', 'box', 'sphere', 'cylinder', 'cone', 'torus', 'plane'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => addNode(type)}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs transition-colors flex flex-col items-center gap-1"
                  title={SHAPE_LABELS[type]}
                >
                  <span className="text-lg">
                    {type === 'group' ? '📁' :
                     type === 'box' ? '⬜' :
                     type === 'sphere' ? '🔵' :
                     type === 'cylinder' ? '🔷' :
                     type === 'cone' ? '🔺' :
                     type === 'torus' ? '⭕' : '▭'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 노드 트리 */}
          <div className="flex-1 overflow-y-auto p-2">
            <p className="text-gray-400 text-xs px-2 mb-2">씬 ({nodes.length}개)</p>
            {rootNodes.length > 0 ? (
              rootNodes.map(node => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  nodes={nodes}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  expandedNodes={expandedNodes}
                  onToggleExpand={handleToggleExpand}
                />
              ))
            ) : (
              <div className="text-gray-500 text-center py-8 text-sm">
                도형을 추가하세요
              </div>
            )}
          </div>
        </div>

        {/* 중앙: 3D 뷰어 */}
        <div className="flex-1 relative">
          {/* 툴바 */}
          <div className="absolute top-4 left-4 z-10 flex gap-2 bg-gray-800/90 backdrop-blur-sm rounded-lg p-2">
            {(['translate', 'rotate', 'scale'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setTransformMode(mode)}
                className={`p-2 rounded transition-colors ${
                  transformMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={mode === 'translate' ? '이동 (G)' : mode === 'rotate' ? '회전 (R)' : '크기 (S)'}
              >
                {mode === 'translate' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                ) : mode === 'rotate' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
            <OrbitControls enableDamping dampingFactor={0.05} makeDefault />

            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} />

            <SceneRenderer
              nodes={nodes}
              selectedId={selectedId}
              onSelectNode={setSelectedId}
              transformMode={transformMode}
              onTransformChange={handleTransformChange}
            />

            <Grid
              args={[20, 20]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#4a4a6a"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#6a6a8a"
              position={[0, 0, 0]}
            />
          </Canvas>

          {/* 단축키 안내 */}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-gray-300 text-xs">마우스로 회전 / 휠로 확대축소 / 클릭으로 선택</p>
          </div>
        </div>

        {/* 오른쪽: 속성 패널 */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-white font-semibold">
              {selectedNode ? selectedNode.name : '속성'}
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              {selectedNode ? SHAPE_LABELS[selectedNode.type] : '노드를 선택하세요'}
            </p>
          </div>

          {selectedNode ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 이름 */}
              <div>
                <label className="text-gray-400 text-xs block mb-1">이름</label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 위치 */}
              <div>
                <label className="text-gray-400 text-xs block mb-1">위치</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                    <div key={axis}>
                      <label className="text-gray-500 text-xs">{axis}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedNode.position[idx].toFixed(2)}
                        onChange={(e) => {
                          const newPos = [...selectedNode.position] as [number, number, number]
                          newPos[idx] = parseFloat(e.target.value) || 0
                          updateNode(selectedNode.id, { position: newPos })
                        }}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 회전 */}
              <div>
                <label className="text-gray-400 text-xs block mb-1">회전 (도)</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                    <div key={axis}>
                      <label className="text-gray-500 text-xs">{axis}</label>
                      <input
                        type="number"
                        step="5"
                        value={selectedNode.rotation[idx].toFixed(1)}
                        onChange={(e) => {
                          const newRot = [...selectedNode.rotation] as [number, number, number]
                          newRot[idx] = parseFloat(e.target.value) || 0
                          updateNode(selectedNode.id, { rotation: newRot })
                        }}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 크기 */}
              <div>
                <label className="text-gray-400 text-xs block mb-1">크기</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                    <div key={axis}>
                      <label className="text-gray-500 text-xs">{axis}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.01"
                        value={selectedNode.scale[idx].toFixed(2)}
                        onChange={(e) => {
                          const newScale = [...selectedNode.scale] as [number, number, number]
                          newScale[idx] = Math.max(0.01, parseFloat(e.target.value) || 0.01)
                          updateNode(selectedNode.id, { scale: newScale })
                        }}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 색상 */}
              {selectedNode.type !== 'group' && (
                <div>
                  <label className="text-gray-400 text-xs block mb-1">색상</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedNode.color}
                      onChange={(e) => updateNode(selectedNode.id, { color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={selectedNode.color}
                      onChange={(e) => updateNode(selectedNode.id, { color: e.target.value })}
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 도형 파라미터 */}
              {selectedNode.params && selectedNode.type !== 'imported' && (
                <div>
                  <label className="text-gray-400 text-xs block mb-1">도형 파라미터</label>
                  <div className="space-y-2">
                    {Object.entries(selectedNode.params).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="text-gray-500 text-xs w-20 capitalize">{key}</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.01"
                          value={value}
                          onChange={(e) => {
                            const newParams = { ...selectedNode.params, [key]: parseFloat(e.target.value) || 0.1 }
                            updateNode(selectedNode.id, { params: newParams })
                          }}
                          className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 가시성 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedNode.visible}
                  onChange={(e) => updateNode(selectedNode.id, { visible: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-gray-300 text-sm">표시</label>
              </div>

              {/* 부모 선택 */}
              <div>
                <label className="text-gray-400 text-xs block mb-1">부모 노드</label>
                <select
                  value={selectedNode.parentId || ''}
                  onChange={(e) => updateNode(selectedNode.id, { parentId: e.target.value || null })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm outline-none"
                >
                  <option value="">없음 (루트)</option>
                  {nodes
                    .filter(n => n.id !== selectedNode.id && n.type === 'group')
                    .map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                </select>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => duplicateNode(selectedNode.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm transition-colors"
                >
                  복제
                </button>
                <button
                  onClick={() => deleteNode(selectedNode.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              노드를 선택하세요
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
