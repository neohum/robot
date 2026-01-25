'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import ModelLibrary from '@/components/ModelLibrary'

const CreatorScene = dynamic(
  () => import('@/components/Creator/CreatorScene'),
  { ssr: false }
)

// 스켈레톤 타입 정의
export type SkeletonType = 'humanSmall' | 'humanMedium' | 'humanLarge' | 'quadruped' | 'biped' | 'bird'

// 탭 타입
type TabType = 'skin' | 'outfit' | 'accessory'

// 선택된 모델 정보
export interface SelectedModel {
  url: string
  name: string
  position: [number, number, number]  // x, y, z
  rotation: [number, number, number]  // x, y, z (라디안)
  scale: number
}

// 의상 설정 (라이브러리에서 선택한 모델)
export interface OutfitConfig {
  top?: SelectedModel
  bottom?: SelectedModel
  shoes?: SelectedModel
  fullbody?: SelectedModel
}

// 악세서리 설정 (라이브러리에서 선택한 모델)
export interface AccessoryConfig {
  hats?: SelectedModel
  glasses?: SelectedModel
  bags?: SelectedModel
  jewelry?: SelectedModel
  other?: SelectedModel
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

// 의상 서브카테고리
const OUTFIT_SUBCATEGORIES = [
  { key: 'top', label: '상의', subcategory: 'tops' },
  { key: 'bottom', label: '하의', subcategory: 'bottoms' },
  { key: 'shoes', label: '신발', subcategory: 'shoes' },
  { key: 'fullbody', label: '전신', subcategory: 'fullbody' },
] as const

// 악세서리 서브카테고리
const ACCESSORY_SUBCATEGORIES = [
  { key: 'hats', label: '모자', icon: '🎩' },
  { key: 'glasses', label: '안경', icon: '👓' },
  { key: 'bags', label: '가방', icon: '🎒' },
  { key: 'jewelry', label: '장신구', icon: '💎' },
  { key: 'other', label: '기타', icon: '✨' },
] as const

export default function CreatorPage() {
  const [skeletonType, setSkeletonType] = useState<SkeletonType>('humanMedium')
  const [activeTab, setActiveTab] = useState<TabType>('skin')
  const [skinColorIndex, setSkinColorIndex] = useState(0)
  const [modelName, setModelName] = useState('내 캐릭터')
  const [isExporting, setIsExporting] = useState(false)

  // 라이브러리 모달 상태
  const [showLibrary, setShowLibrary] = useState(false)
  const [libraryCategory, setLibraryCategory] = useState<'outfits' | 'accessories'>('outfits')
  const [librarySubcategory, setLibrarySubcategory] = useState<string>('tops')

  // 의상 설정 (라이브러리에서 선택)
  const [outfitConfig, setOutfitConfig] = useState<OutfitConfig>({})

  // 악세서리 설정 (라이브러리에서 선택)
  const [accessoryConfig, setAccessoryConfig] = useState<AccessoryConfig>({})

  const handleExportGLB = async () => {
    setIsExporting(true)
    toast.loading('GLB 파일 생성 중...')

    const event = new CustomEvent('exportGLB', {
      detail: {
        name: modelName,
        skeleton: skeletonType,
        skinColor: SKIN_COLORS[skinColorIndex],
        outfit: outfitConfig,
        accessories: accessoryConfig
      }
    })
    window.dispatchEvent(event)

    setTimeout(() => {
      toast.dismiss()
      toast.success('GLB 파일이 다운로드됩니다!')
      setIsExporting(false)
    }, 1500)
  }

  // 라이브러리 열기
  const openLibrary = (category: 'outfits' | 'accessories', subcategory: string) => {
    setLibraryCategory(category)
    setLibrarySubcategory(subcategory)
    setShowLibrary(true)
  }

  // 모델 선택 핸들러
  const handleSelectModel = (url: string, name: string) => {
    const defaultModel: SelectedModel = {
      url,
      name,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1
    }

    if (libraryCategory === 'outfits') {
      const key = OUTFIT_SUBCATEGORIES.find(s => s.subcategory === librarySubcategory)?.key
      if (key) {
        setOutfitConfig(prev => ({
          ...prev,
          [key]: defaultModel
        }))
      }
    } else {
      setAccessoryConfig(prev => ({
        ...prev,
        [librarySubcategory]: defaultModel
      }))
    }
    setShowLibrary(false)
  }

  // 의상 위치/회전/스케일 업데이트
  const updateOutfitTransform = (
    key: keyof OutfitConfig,
    field: 'position' | 'rotation' | 'scale',
    value: [number, number, number] | number
  ) => {
    setOutfitConfig(prev => {
      const model = prev[key]
      if (!model) return prev
      return {
        ...prev,
        [key]: {
          ...model,
          [field]: value
        }
      }
    })
  }

  // 악세서리 위치/회전/스케일 업데이트
  const updateAccessoryTransform = (
    key: keyof AccessoryConfig,
    field: 'position' | 'rotation' | 'scale',
    value: [number, number, number] | number
  ) => {
    setAccessoryConfig(prev => {
      const model = prev[key]
      if (!model) return prev
      return {
        ...prev,
        [key]: {
          ...model,
          [field]: value
        }
      }
    })
  }

  // 모델 제거 핸들러
  const removeOutfit = (key: keyof OutfitConfig) => {
    setOutfitConfig(prev => {
      const newConfig = { ...prev }
      delete newConfig[key]
      return newConfig
    })
    toast.info('의상이 제거되었습니다')
  }

  const removeAccessory = (key: keyof AccessoryConfig) => {
    setAccessoryConfig(prev => {
      const newConfig = { ...prev }
      delete newConfig[key]
      return newConfig
    })
    toast.info('악세서리가 제거되었습니다')
  }

  const handleRandomize = () => {
    setSkinColorIndex(Math.floor(Math.random() * SKIN_COLORS.length))
    // 랜덤은 피부색만 변경 (라이브러리 모델은 수동 선택)
    toast.success('랜덤 피부색 적용!')
  }

  // 인간형만 의상 표시
  const isHumanoid = skeletonType.startsWith('human')

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
              체형, 피부색을 선택하고 라이브러리에서 의상과 악세서리를 입혀보세요
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
              <h3 className="text-gray-400 text-xs font-medium mb-2">사람</h3>
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
              <h3 className="text-gray-400 text-xs font-medium mb-2">동물</h3>
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
              {isHumanoid && (
                <>
                  {outfitConfig.top && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">👕</span>
                      <span className="text-gray-300 text-xs truncate">{outfitConfig.top.name}</span>
                    </div>
                  )}
                  {outfitConfig.bottom && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">👖</span>
                      <span className="text-gray-300 text-xs truncate">{outfitConfig.bottom.name}</span>
                    </div>
                  )}
                  {outfitConfig.shoes && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">👟</span>
                      <span className="text-gray-300 text-xs truncate">{outfitConfig.shoes.name}</span>
                    </div>
                  )}
                  {Object.keys(accessoryConfig).length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-gray-400 text-xs">악세서리:</span>
                      <span className="text-gray-300 text-xs">{Object.keys(accessoryConfig).length}개</span>
                    </div>
                  )}
                </>
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
              outfitConfig={isHumanoid ? outfitConfig : undefined}
              accessoryConfig={isHumanoid ? accessoryConfig : undefined}
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
              disabled={!isHumanoid}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'outfit'
                  ? 'text-white border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              의상
            </button>
            <button
              onClick={() => setActiveTab('accessory')}
              disabled={!isHumanoid}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'accessory'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              악세서리
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

            {activeTab === 'outfit' && isHumanoid && (
              <div className="space-y-4">
                <p className="text-gray-400 text-xs mb-3">라이브러리에서 의상을 선택하고 위치를 조정하세요</p>

                {OUTFIT_SUBCATEGORIES.map(({ key, label, subcategory }) => {
                  const selected = outfitConfig[key as keyof OutfitConfig]
                  return (
                    <div key={key} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm font-medium">{label}</span>
                        {selected && (
                          <button
                            onClick={() => removeOutfit(key as keyof OutfitConfig)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            제거
                          </button>
                        )}
                      </div>
                      {selected ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 bg-green-600/20 border border-green-500/30 rounded px-3 py-2">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-green-400 text-sm truncate">{selected.name}</span>
                          </div>
                          {/* 위치 조정 */}
                          <div className="space-y-2 bg-gray-800 rounded p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs w-6">X</span>
                              <input
                                type="range"
                                min="-2"
                                max="2"
                                step="0.05"
                                value={selected.position[0]}
                                onChange={(e) => {
                                  const newPos: [number, number, number] = [...selected.position]
                                  newPos[0] = parseFloat(e.target.value)
                                  updateOutfitTransform(key as keyof OutfitConfig, 'position', newPos)
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{selected.position[0].toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs w-6">Y</span>
                              <input
                                type="range"
                                min="-1"
                                max="3"
                                step="0.05"
                                value={selected.position[1]}
                                onChange={(e) => {
                                  const newPos: [number, number, number] = [...selected.position]
                                  newPos[1] = parseFloat(e.target.value)
                                  updateOutfitTransform(key as keyof OutfitConfig, 'position', newPos)
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{selected.position[1].toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs w-6">Z</span>
                              <input
                                type="range"
                                min="-2"
                                max="2"
                                step="0.05"
                                value={selected.position[2]}
                                onChange={(e) => {
                                  const newPos: [number, number, number] = [...selected.position]
                                  newPos[2] = parseFloat(e.target.value)
                                  updateOutfitTransform(key as keyof OutfitConfig, 'position', newPos)
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{selected.position[2].toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2 border-t border-gray-700 pt-2 mt-2">
                              <span className="text-gray-400 text-xs w-6">크기</span>
                              <input
                                type="range"
                                min="0.1"
                                max="3"
                                step="0.05"
                                value={selected.scale}
                                onChange={(e) => {
                                  updateOutfitTransform(key as keyof OutfitConfig, 'scale', parseFloat(e.target.value))
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{selected.scale.toFixed(2)}</span>
                            </div>
                            {/* 회전 조정 */}
                            <div className="text-gray-500 text-xs border-t border-gray-700 pt-2 mt-2 mb-1">회전 (도)</div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs w-6">RX</span>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                step="5"
                                value={Math.round(selected.rotation[0] * 180 / Math.PI)}
                                onChange={(e) => {
                                  const newRot: [number, number, number] = [...selected.rotation]
                                  newRot[0] = parseFloat(e.target.value) * Math.PI / 180
                                  updateOutfitTransform(key as keyof OutfitConfig, 'rotation', newRot)
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{Math.round(selected.rotation[0] * 180 / Math.PI)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs w-6">RY</span>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                step="5"
                                value={Math.round(selected.rotation[1] * 180 / Math.PI)}
                                onChange={(e) => {
                                  const newRot: [number, number, number] = [...selected.rotation]
                                  newRot[1] = parseFloat(e.target.value) * Math.PI / 180
                                  updateOutfitTransform(key as keyof OutfitConfig, 'rotation', newRot)
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{Math.round(selected.rotation[1] * 180 / Math.PI)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs w-6">RZ</span>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                step="5"
                                value={Math.round(selected.rotation[2] * 180 / Math.PI)}
                                onChange={(e) => {
                                  const newRot: [number, number, number] = [...selected.rotation]
                                  newRot[2] = parseFloat(e.target.value) * Math.PI / 180
                                  updateOutfitTransform(key as keyof OutfitConfig, 'rotation', newRot)
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{Math.round(selected.rotation[2] * 180 / Math.PI)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => openLibrary('outfits', subcategory)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          라이브러리에서 선택
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'accessory' && isHumanoid && (
              <div className="space-y-4">
                <p className="text-gray-400 text-xs mb-3">라이브러리에서 악세서리를 선택하고 위치를 조정하세요</p>

                {ACCESSORY_SUBCATEGORIES.map(({ key, label, icon }) => {
                  const selected = accessoryConfig[key as keyof AccessoryConfig]
                  return (
                    <div key={key} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm font-medium">
                          {icon} {label}
                        </span>
                        {selected && (
                          <button
                            onClick={() => removeAccessory(key as keyof AccessoryConfig)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            제거
                          </button>
                        )}
                      </div>
                      {selected ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded px-3 py-2">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-blue-400 text-sm truncate">{selected.name}</span>
                          </div>
                          {/* 위치 조정 */}
                          <div className="space-y-2 bg-gray-800 rounded p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs w-6">X</span>
                              <input
                                type="range"
                                min="-2"
                                max="2"
                                step="0.05"
                                value={selected.position[0]}
                                onChange={(e) => {
                                  const newPos: [number, number, number] = [...selected.position]
                                  newPos[0] = parseFloat(e.target.value)
                                  updateAccessoryTransform(key as keyof AccessoryConfig, 'position', newPos)
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{selected.position[0].toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs w-6">Y</span>
                              <input
                                type="range"
                                min="-1"
                                max="3"
                                step="0.05"
                                value={selected.position[1]}
                                onChange={(e) => {
                                  const newPos: [number, number, number] = [...selected.position]
                                  newPos[1] = parseFloat(e.target.value)
                                  updateAccessoryTransform(key as keyof AccessoryConfig, 'position', newPos)
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{selected.position[1].toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs w-6">Z</span>
                              <input
                                type="range"
                                min="-2"
                                max="2"
                                step="0.05"
                                value={selected.position[2]}
                                onChange={(e) => {
                                  const newPos: [number, number, number] = [...selected.position]
                                  newPos[2] = parseFloat(e.target.value)
                                  updateAccessoryTransform(key as keyof AccessoryConfig, 'position', newPos)
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{selected.position[2].toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2 border-t border-gray-700 pt-2 mt-2">
                              <span className="text-gray-400 text-xs w-6">크기</span>
                              <input
                                type="range"
                                min="0.1"
                                max="3"
                                step="0.05"
                                value={selected.scale}
                                onChange={(e) => {
                                  updateAccessoryTransform(key as keyof AccessoryConfig, 'scale', parseFloat(e.target.value))
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{selected.scale.toFixed(2)}</span>
                            </div>
                            {/* 회전 조정 */}
                            <div className="text-gray-500 text-xs border-t border-gray-700 pt-2 mt-2 mb-1">회전 (도)</div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs w-6">RX</span>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                step="5"
                                value={Math.round(selected.rotation[0] * 180 / Math.PI)}
                                onChange={(e) => {
                                  const newRot: [number, number, number] = [...selected.rotation]
                                  newRot[0] = parseFloat(e.target.value) * Math.PI / 180
                                  updateAccessoryTransform(key as keyof AccessoryConfig, 'rotation', newRot)
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{Math.round(selected.rotation[0] * 180 / Math.PI)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs w-6">RY</span>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                step="5"
                                value={Math.round(selected.rotation[1] * 180 / Math.PI)}
                                onChange={(e) => {
                                  const newRot: [number, number, number] = [...selected.rotation]
                                  newRot[1] = parseFloat(e.target.value) * Math.PI / 180
                                  updateAccessoryTransform(key as keyof AccessoryConfig, 'rotation', newRot)
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{Math.round(selected.rotation[1] * 180 / Math.PI)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs w-6">RZ</span>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                step="5"
                                value={Math.round(selected.rotation[2] * 180 / Math.PI)}
                                onChange={(e) => {
                                  const newRot: [number, number, number] = [...selected.rotation]
                                  newRot[2] = parseFloat(e.target.value) * Math.PI / 180
                                  updateAccessoryTransform(key as keyof AccessoryConfig, 'rotation', newRot)
                                }}
                                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                              />
                              <span className="text-gray-300 text-xs w-10 text-right">{Math.round(selected.rotation[2] * 180 / Math.PI)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => openLibrary('accessories', key)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          라이브러리에서 선택
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* 동물 캐릭터는 의상/악세서리 미지원 */}
            {!isHumanoid && (activeTab === 'outfit' || activeTab === 'accessory') && (
              <div className="text-center py-8 text-gray-500">
                <p>동물 캐릭터는 의상/악세서리를</p>
                <p>지원하지 않습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 라이브러리 모달 */}
      {showLibrary && (
        <ModelLibrary
          onClose={() => setShowLibrary(false)}
          onSelectModel={handleSelectModel}
          category={libraryCategory}
          subcategory={librarySubcategory}
        />
      )}
    </main>
  )
}
