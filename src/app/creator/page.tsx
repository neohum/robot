'use client'

import { useState, Suspense, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'

const CreatorScene = dynamic(
  () => import('@/components/Creator/CreatorScene'),
  { ssr: false }
)

const ModelPreview = dynamic(
  () => import('@/components/Creator/ModelPreview'),
  { ssr: false }
)

// 스켈레톤 타입 정의
export type SkeletonType = 'humanSmall' | 'humanMedium' | 'humanLarge' | 'quadruped' | 'biped' | 'bird'

// 탭 타입 (피부색, 의상, 악세서리)
type TabType = 'skin' | 'outfit' | 'accessory'

// 외부 모델 타입 (Wasabi에서 가져온 모델)
export interface ExternalModel {
  id: string
  name: string
  url: string
  type: 'outfit' | 'accessory'
  timestamp?: number
  size?: number
}

// 카테고리별 스켈레톤 분류
const SKELETON_CATEGORIES = {
  human: {
    name: '사람',
    types: ['humanSmall', 'humanMedium', 'humanLarge'] as SkeletonType[]
  },
  animal: {
    name: '동물',
    types: ['quadruped', 'biped', 'bird'] as SkeletonType[]
  }
}

// 스켈레톤 타입별 설정
const SKELETON_CONFIGS: Record<SkeletonType, { name: string; description: string; size: string; category: 'human' | 'animal' }> = {
  humanSmall: {
    name: '소형 인간',
    description: '민첩한 동작에 적합',
    size: '120cm',
    category: 'human'
  },
  humanMedium: {
    name: '중형 인간',
    description: '균형 잡힌 표준 체형',
    size: '170cm',
    category: 'human'
  },
  humanLarge: {
    name: '대형 인간',
    description: '강력한 힘과 안정성',
    size: '220cm',
    category: 'human'
  },
  quadruped: {
    name: '4발 동물',
    description: '개, 고양이, 말 등',
    size: '60~150cm',
    category: 'animal'
  },
  biped: {
    name: '2발 동물',
    description: '공룡, 캥거루 등',
    size: '80~200cm',
    category: 'animal'
  },
  bird: {
    name: '새',
    description: '날개가 있는 조류',
    size: '30~100cm',
    category: 'animal'
  }
}

// 피부색 옵션 (30가지)
const SKIN_COLORS = [
  // 사람 피부톤
  '#FFE0BD', '#FFCD94', '#EAC086', '#D4A373', '#C68642',
  '#8D5524', '#6B4423', '#4A3728', '#FFDFC4', '#F0C8A0',
  // 로봇/판타지 색상
  '#E8E8E8', '#C0C0C0', '#808080', '#4A4A4A', '#2C2C2C',
  '#3B82F6', '#06B6D4', '#10B981', '#8B5CF6', '#EC4899',
  // 특수 색상
  '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
]

export default function CreatorPage() {
  const [skeletonType, setSkeletonType] = useState<SkeletonType>('humanMedium')
  const [activeTab, setActiveTab] = useState<TabType>('skin')
  const [skinColorIndex, setSkinColorIndex] = useState(0)
  const [modelName, setModelName] = useState('내 캐릭터')
  const [isExporting, setIsExporting] = useState(false)

  // 외부 모델 상태
  const [allModels, setAllModels] = useState<ExternalModel[]>([])
  const [selectedOutfit, setSelectedOutfit] = useState<ExternalModel | null>(null)
  const [selectedAccessories, setSelectedAccessories] = useState<ExternalModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadType, setUploadType] = useState<'outfit' | 'accessory'>('outfit')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 의상과 악세서리 모델 필터링
  const outfitModels = allModels.filter(m => m.type === 'outfit')
  const accessoryModels = allModels.filter(m => m.type === 'accessory')

  // Wasabi에서 저장된 모델 목록 불러오기
  const fetchSavedModels = useCallback(async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch('/api/creator-models')
      if (response.ok) {
        const models = await response.json()
        setAllModels(models)
      }
    } catch (error) {
      console.error('모델 목록 불러오기 실패:', error)
    } finally {
      setIsLoadingModels(false)
    }
  }, [])

  // 컴포넌트 마운트 시 저장된 모델 불러오기
  useEffect(() => {
    fetchSavedModels()
  }, [fetchSavedModels])

  // GLB 파일 업로드 핸들러 (Wasabi에 저장)
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.glb')) {
      toast.error('GLB 파일만 업로드 가능합니다')
      return
    }

    // 파일 크기 제한 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('파일 크기는 50MB를 초과할 수 없습니다')
      return
    }

    setIsUploading(true)
    toast.loading('Wasabi에 업로드 중...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', uploadType)

      const response = await fetch('/api/creator-models', {
        method: 'POST',
        body: formData,
      })

      toast.dismiss()

      if (response.ok) {
        const data = await response.json()
        const newModel: ExternalModel = data.model
        setAllModels(prev => [newModel, ...prev])

        // 업로드한 모델 자동 선택
        if (uploadType === 'outfit') {
          setSelectedOutfit(newModel)
        } else {
          setSelectedAccessories(prev => [...prev, newModel])
        }

        toast.success(`${file.name} Wasabi에 저장 완료!`)
      } else {
        const error = await response.json()
        toast.error(error.error || '업로드 실패')
      }
    } catch (error) {
      toast.dismiss()
      toast.error('업로드 중 오류가 발생했습니다')
      console.error('업로드 오류:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [uploadType])

  // 모델 삭제 (Wasabi에서도 삭제)
  const handleRemoveModel = useCallback(async (model: ExternalModel) => {
    toast.loading('삭제 중...')
    try {
      const response = await fetch(`/api/creator-models?id=${encodeURIComponent(model.id)}&type=${model.type}`, {
        method: 'DELETE',
      })

      toast.dismiss()

      if (response.ok) {
        setAllModels(prev => prev.filter(m => m.id !== model.id))

        // 선택 해제
        if (selectedOutfit?.id === model.id) {
          setSelectedOutfit(null)
        }
        setSelectedAccessories(prev => prev.filter(a => a.id !== model.id))

        toast.success('Wasabi에서 삭제됨')
      } else {
        toast.error('삭제 실패')
      }
    } catch (error) {
      toast.dismiss()
      toast.error('삭제 중 오류가 발생했습니다')
    }
  }, [selectedOutfit])

  // 악세서리 토글
  const handleAccessoryToggle = (model: ExternalModel) => {
    setSelectedAccessories(prev => {
      const exists = prev.find(a => a.id === model.id)
      if (exists) {
        return prev.filter(a => a.id !== model.id)
      } else {
        return [...prev, model]
      }
    })
  }

  const handleExportGLB = async () => {
    setIsExporting(true)
    toast.loading('GLB 파일 생성 중...')

    const event = new CustomEvent('exportGLB', {
      detail: {
        name: modelName,
        skeleton: skeletonType,
        skinColor: SKIN_COLORS[skinColorIndex]
      }
    })
    window.dispatchEvent(event)

    setTimeout(() => {
      toast.dismiss()
      toast.success('GLB 파일이 다운로드됩니다!')
      setIsExporting(false)
    }, 1500)
  }

  const handleRandomize = () => {
    setSkinColorIndex(Math.floor(Math.random() * SKIN_COLORS.length))

    // 랜덤 의상 선택
    if (outfitModels.length > 0) {
      const randomOutfit = outfitModels[Math.floor(Math.random() * outfitModels.length)]
      setSelectedOutfit(randomOutfit)
    }

    // 랜덤 악세서리 선택 (0~3개)
    if (accessoryModels.length > 0) {
      const count = Math.floor(Math.random() * Math.min(3, accessoryModels.length))
      const shuffled = [...accessoryModels].sort(() => Math.random() - 0.5)
      setSelectedAccessories(shuffled.slice(0, count))
    }

    toast.success('랜덤 캐릭터 생성!')
  }

  return (
    <main className="flex h-screen flex-col bg-gray-900">
      {/* 헤더 */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="홈으로"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 13v10h-6v-6h-6v6h-6v-10h-3l12-12 12 12h-3zm-1-5.907v-5.093h-3v2.093l3 3z"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              캐릭터 만들기
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              체형, 피부색을 선택하고 외부 모델로 의상/악세서리를 장착하세요
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRandomize}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 9l-1.41-1.42L10 14.17l-2.59-2.58L6 13l4 4zm-6-7c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"/>
            </svg>
            랜덤
          </button>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm w-40 focus:outline-none focus:border-purple-500"
            placeholder="캐릭터 이름"
          />
          <button
            onClick={handleExportGLB}
            disabled={isExporting}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11h5l-9 10-9-10h5v-11h8v11zm3 8v3h-14v-3h-2v5h18v-5h-2z"/>
            </svg>
            {isExporting ? '내보내는 중...' : 'GLB 내보내기'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 패널 - 스켈레톤 타입 선택 */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
          <div className="p-4">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
              </svg>
              체형 선택
            </h2>

            {/* 사람 카테고리 */}
            <div className="mb-4">
              <h3 className="text-gray-400 text-xs font-medium mb-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
                </svg>
                사람
              </h3>
              <div className="space-y-2">
                {SKELETON_CATEGORIES.human.types.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSkeletonType(type)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      skeletonType === type
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{SKELETON_CONFIGS[type].name}</span>
                      <span className="text-xs opacity-75">{SKELETON_CONFIGS[type].size}</span>
                    </div>
                    <div className="text-xs opacity-75 mt-1">{SKELETON_CONFIGS[type].description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 동물 카테고리 */}
            <div>
              <h3 className="text-gray-400 text-xs font-medium mb-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 11c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5zm15 0c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5zm-7.5-6c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5zm0 9c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5z"/>
                </svg>
                동물
              </h3>
              <div className="space-y-2">
                {SKELETON_CATEGORIES.animal.types.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSkeletonType(type)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      skeletonType === type
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{SKELETON_CONFIGS[type].name}</span>
                      <span className="text-xs opacity-75">{SKELETON_CONFIGS[type].size}</span>
                    </div>
                    <div className="text-xs opacity-75 mt-1">{SKELETON_CONFIGS[type].description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 현재 설정 표시 */}
          <div className="p-4 mt-auto border-t border-gray-700">
            <h3 className="text-gray-400 text-xs font-medium mb-2">현재 설정</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-gray-500"
                  style={{ backgroundColor: SKIN_COLORS[skinColorIndex] }}
                />
                <span className="text-gray-300">피부</span>
              </div>
              {selectedOutfit && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span className="text-gray-300 truncate text-xs">{selectedOutfit.name}</span>
                </div>
              )}
              {selectedAccessories.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-gray-400 text-xs">악세서리:</span>
                  <span className="text-gray-300 text-xs">{selectedAccessories.length}개</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 중앙 - 3D 미리보기 */}
        <div className="flex-1 relative">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-gray-400">로딩 중...</div>
            </div>
          }>
            <CreatorScene
              skeletonType={skeletonType}
              skinColor={SKIN_COLORS[skinColorIndex]}
              outfitModelUrl={selectedOutfit?.url}
              accessoryModelUrls={selectedAccessories.map(a => a.url)}
            />
          </Suspense>

          {/* 조작 안내 */}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-gray-300 text-xs">마우스로 회전 / 휠로 확대축소</p>
          </div>
        </div>

        {/* 오른쪽 패널 - 스타일 선택 */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* 탭 */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('skin')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'skin'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              피부색
            </button>
            <button
              onClick={() => setActiveTab('outfit')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'outfit'
                  ? 'text-white border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              의상
              {outfitModels.length > 0 && (
                <span className="ml-1 text-xs bg-gray-600 px-1.5 py-0.5 rounded">{outfitModels.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('accessory')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'accessory'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              악세서리
              {accessoryModels.length > 0 && (
                <span className="ml-1 text-xs bg-gray-600 px-1.5 py-0.5 rounded">{accessoryModels.length}</span>
              )}
            </button>
          </div>

          {/* 탭 내용 */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'skin' && (
              <div>
                <p className="text-gray-400 text-xs mb-3">30가지 피부색 중 선택하세요</p>
                <div className="grid grid-cols-6 gap-2">
                  {SKIN_COLORS.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => setSkinColorIndex(i)}
                      className={`aspect-square rounded-lg transition-all ${
                        skinColorIndex === i
                          ? 'ring-2 ring-white scale-110 z-10'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`색상 ${i + 1}`}
                    >
                      {skinColorIndex === i && (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-800 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'outfit' && (
              <div className="space-y-4">
                {/* 업로드 버튼 */}
                <div>
                  <p className="text-gray-400 text-xs mb-3">의상 GLB 모델을 업로드하세요</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".glb"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <button
                    onClick={() => {
                      setUploadType('outfit')
                      fileInputRef.current?.click()
                    }}
                    disabled={isUploading}
                    className="w-full p-3 border-2 border-dashed border-gray-600 rounded-lg hover:border-green-500 hover:bg-gray-700/50 transition-all text-gray-400 hover:text-green-400 disabled:opacity-50"
                  >
                    {isUploading && uploadType === 'outfit' ? (
                      <span className="text-sm">업로드 중...</span>
                    ) : (
                      <span className="text-sm">+ 의상 GLB 업로드</span>
                    )}
                  </button>
                </div>

                {/* 의상 모델 목록 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white text-sm font-medium">의상 목록</h4>
                    <button
                      onClick={fetchSavedModels}
                      disabled={isLoadingModels}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      {isLoadingModels ? '로딩...' : '새로고침'}
                    </button>
                  </div>

                  {/* 선택 해제 버튼 */}
                  {selectedOutfit && (
                    <button
                      onClick={() => setSelectedOutfit(null)}
                      className="w-full p-2 mb-2 bg-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-600"
                    >
                      의상 해제
                    </button>
                  )}

                  {isLoadingModels ? (
                    <div className="text-center py-4 text-gray-500 text-xs">로딩 중...</div>
                  ) : outfitModels.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {outfitModels.map((model) => (
                        <div
                          key={model.id}
                          className={`p-2 rounded-lg flex flex-col items-center cursor-pointer transition-all ${
                            selectedOutfit?.id === model.id
                              ? 'bg-green-600 text-white ring-2 ring-green-400'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          onClick={() => setSelectedOutfit(
                            selectedOutfit?.id === model.id ? null : model
                          )}
                        >
                          <div className="mb-2">
                            <ModelPreview url={model.url} size={70} isSelected={selectedOutfit?.id === model.id} />
                          </div>
                          <span className="text-xs font-medium text-center truncate w-full">{model.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveModel(model)
                            }}
                            className="mt-1 p-1 hover:bg-red-500 rounded transition-colors text-gray-400 hover:text-white"
                            title="삭제"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-xs">의상 모델이 없습니다</p>
                      <p className="text-xs mt-1">GLB 파일을 업로드하세요</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {activeTab === 'accessory' && (
              <div className="space-y-4">
                {/* 업로드 버튼 */}
                <div>
                  <p className="text-gray-400 text-xs mb-3">악세서리 GLB 모델을 업로드하세요 (복수 선택 가능)</p>
                  <button
                    onClick={() => {
                      setUploadType('accessory')
                      fileInputRef.current?.click()
                    }}
                    disabled={isUploading}
                    className="w-full p-3 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 hover:bg-gray-700/50 transition-all text-gray-400 hover:text-blue-400 disabled:opacity-50"
                  >
                    {isUploading && uploadType === 'accessory' ? (
                      <span className="text-sm">업로드 중...</span>
                    ) : (
                      <span className="text-sm">+ 악세서리 GLB 업로드</span>
                    )}
                  </button>
                </div>

                {/* 악세서리 모델 목록 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white text-sm font-medium">악세서리 목록</h4>
                    {selectedAccessories.length > 0 && (
                      <button
                        onClick={() => setSelectedAccessories([])}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        전체 해제
                      </button>
                    )}
                  </div>

                  {isLoadingModels ? (
                    <div className="text-center py-4 text-gray-500 text-xs">로딩 중...</div>
                  ) : accessoryModels.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {accessoryModels.map((model) => {
                        const isSelected = selectedAccessories.some(a => a.id === model.id)
                        return (
                          <div
                            key={model.id}
                            className={`p-2 rounded-lg flex flex-col items-center cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                            onClick={() => handleAccessoryToggle(model)}
                          >
                            <div className="mb-2">
                              <ModelPreview url={model.url} size={70} isSelected={isSelected} />
                            </div>
                            <span className="text-xs font-medium text-center truncate w-full">{model.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveModel(model)
                              }}
                              className="mt-1 p-1 hover:bg-red-500 rounded transition-colors text-gray-400 hover:text-white"
                              title="삭제"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-xs">악세서리 모델이 없습니다</p>
                      <p className="text-xs mt-1">GLB 파일을 업로드하세요</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
