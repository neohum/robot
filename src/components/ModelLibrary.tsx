'use client'

import { useState, useEffect, Suspense } from 'react'
import { toast } from 'sonner'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import ModelLoader from './ModelLoader'
import { ModelErrorBoundary } from './ModelErrorBoundary'

interface ModelItem {
  id: string
  name: string
  url: string
  category: string
  subcategory: string
  size: number
  lastModified: string
}

interface ModelLibraryProps {
  onClose: () => void
  onSelectModel: (url: string, name: string) => void
  category: 'outfits' | 'accessories'
  subcategory?: string
}

// 3D 미리보기 컴포넌트
function ModelPreview({ url }: { url: string }) {
  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 0.5, 2]} fov={50} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={0.5}
        maxDistance={5}
        autoRotate
        autoRotateSpeed={2}
      />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} />

      <ModelErrorBoundary fallback={
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color="red" />
        </mesh>
      }>
        <Suspense fallback={
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color="gray" wireframe />
          </mesh>
        }>
          <ModelLoader
            url={url}
            fileType="glb"
            position={[0, 0, 0]}
            scale={1}
          />
        </Suspense>
      </ModelErrorBoundary>

      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#2a2a3e" />
      </mesh>
    </Canvas>
  )
}

export default function ModelLibrary({ onClose, onSelectModel, category, subcategory }: ModelLibraryProps) {
  const [models, setModels] = useState<ModelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategory || 'tops')
  const [uploading, setUploading] = useState(false)
  const [previewModel, setPreviewModel] = useState<ModelItem | null>(null)

  const subcategories = category === 'outfits'
    ? ['tops', 'bottoms', 'shoes', 'fullbody']
    : ['hats', 'glasses', 'bags', 'jewelry', 'other']

  const subcategoryLabels: Record<string, string> = {
    tops: '상의',
    bottoms: '하의',
    shoes: '신발',
    fullbody: '전신',
    hats: '모자',
    glasses: '안경',
    bags: '가방',
    jewelry: '장신구',
    other: '기타'
  }

  useEffect(() => {
    loadModels()
  }, [selectedSubcategory])

  const loadModels = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/models-library?category=${category}&subcategory=${selectedSubcategory}`)
      const data = await response.json()
      setModels(data.items || [])
    } catch (error) {
      console.error('Failed to load models:', error)
      toast.error('모델 목록을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.glb')) {
      toast.error('GLB 파일만 지원됩니다')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('파일 크기는 20MB 이하여야 합니다')
      return
    }

    setUploading(true)
    toast.loading('업로드 중...', { id: 'upload' })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', `${category}/${selectedSubcategory}`)

      const response = await fetch('/api/upload-model', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('업로드 완료!', { id: 'upload' })
        loadModels() // 목록 새로고침
      } else {
        toast.error(data.error || '업로드 실패', { id: 'upload' })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('업로드 중 오류가 발생했습니다', { id: 'upload' })
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleDeleteModel = async (model: ModelItem, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm(`"${model.name}" 모델을 삭제하시겠습니까?`)) return

    try {
      const response = await fetch(
        `/api/models-library?id=${model.id}&category=${category}&subcategory=${selectedSubcategory}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        toast.success('삭제되었습니다')
        loadModels()
        if (previewModel?.id === model.id) {
          setPreviewModel(null)
        }
      } else {
        toast.error('삭제 실패')
      }
    } catch (error) {
      toast.error('삭제 중 오류 발생')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">모델 라이브러리</h2>
            <p className="text-gray-400 text-sm mt-1">
              {category === 'outfits' ? '의상' : '악세서리'} 모델 선택
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 서브카테고리 탭 */}
        <div className="flex gap-2 px-6 pt-4 overflow-x-auto">
          {subcategories.map(sub => (
            <button
              key={sub}
              onClick={() => {
                setSelectedSubcategory(sub)
                setPreviewModel(null)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedSubcategory === sub
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {subcategoryLabels[sub]}
            </button>
          ))}
        </div>

        {/* 업로드 버튼 */}
        <div className="px-6 pt-4">
          <label className="block">
            <input
              type="file"
              accept=".glb"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className={`bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}>
              {uploading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  업로드 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  새 모델 추가 (.glb)
                </>
              )}
            </div>
          </label>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 모델 목록 */}
          <div className={`${previewModel ? 'w-1/2' : 'w-full'} overflow-y-auto p-6 transition-all`}>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-400 flex flex-col items-center gap-3">
                  <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로딩 중...
                </div>
              </div>
            ) : models.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-400 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="mb-2">모델이 없습니다</p>
                  <p className="text-sm text-gray-500">위의 버튼으로 새 모델을 추가하세요</p>
                </div>
              </div>
            ) : (
              <div className={`grid ${previewModel ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-4`}>
                {models.map(model => (
                  <div
                    key={model.id}
                    className={`group bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition-all cursor-pointer relative ${
                      previewModel?.id === model.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setPreviewModel(model)}
                  >
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => handleDeleteModel(model, e)}
                      className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="aspect-square bg-gray-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      <svg className="w-12 h-12 text-gray-600 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-white text-sm font-medium truncate mb-1">
                      {model.name}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {(model.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3D 미리보기 패널 */}
          {previewModel && (
            <div className="w-1/2 border-l border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{previewModel.name}</h3>
                  <p className="text-gray-400 text-sm">{(previewModel.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={() => setPreviewModel(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 3D 뷰어 */}
              <div className="flex-1 bg-gray-900">
                <ModelPreview url={previewModel.url} />
              </div>

              {/* 선택 버튼 */}
              <div className="p-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    onSelectModel(previewModel.url, previewModel.name)
                    onClose()
                    toast.success(`${previewModel.name} 선택됨`)
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  이 모델 선택
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
