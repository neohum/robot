'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'

const CreatorScene = dynamic(
  () => import('@/components/Creator/CreatorScene'),
  { ssr: false }
)

// 스켈레톤 타입 정의
export type SkeletonType = 'humanSmall' | 'humanMedium' | 'humanLarge' | 'quadruped' | 'biped' | 'bird'

// 탭 타입
type TabType = 'skin' | 'outfit' | 'accessory'

// 의상 타입
export type OutfitTopType = 'none' | 'tshirt' | 'jacket' | 'hoodie' | 'tank' | 'suit'
export type OutfitBottomType = 'none' | 'pants' | 'shorts' | 'skirt' | 'longSkirt'
export type OutfitShoesType = 'none' | 'sneakers' | 'boots' | 'sandals' | 'formal'

// 악세서리 타입
export type AccessoryType = 'hat' | 'glasses' | 'backpack' | 'watch' | 'necklace' | 'earrings' | 'scarf' | 'gloves'

// 의상 설정
export interface OutfitConfig {
  top: OutfitTopType
  topColor: string
  bottom: OutfitBottomType
  bottomColor: string
  shoes: OutfitShoesType
  shoesColor: string
}

// 악세서리 설정
export interface AccessoryConfig {
  type: AccessoryType
  color: string
  enabled: boolean
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

// 의상/악세서리 색상
const OUTFIT_COLORS = [
  '#FFFFFF', '#000000', '#1F2937', '#374151', '#6B7280',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#78350F', '#92400E', '#A16207'
]

// 의상 종류 정의
const OUTFIT_TOP_OPTIONS: { value: OutfitTopType; label: string }[] = [
  { value: 'none', label: '없음' },
  { value: 'tshirt', label: '티셔츠' },
  { value: 'jacket', label: '자켓' },
  { value: 'hoodie', label: '후드티' },
  { value: 'tank', label: '민소매' },
  { value: 'suit', label: '정장' },
]

const OUTFIT_BOTTOM_OPTIONS: { value: OutfitBottomType; label: string }[] = [
  { value: 'none', label: '없음' },
  { value: 'pants', label: '긴바지' },
  { value: 'shorts', label: '반바지' },
  { value: 'skirt', label: '스커트' },
  { value: 'longSkirt', label: '롱스커트' },
]

const OUTFIT_SHOES_OPTIONS: { value: OutfitShoesType; label: string }[] = [
  { value: 'none', label: '없음' },
  { value: 'sneakers', label: '운동화' },
  { value: 'boots', label: '부츠' },
  { value: 'sandals', label: '샌들' },
  { value: 'formal', label: '구두' },
]

// 악세서리 종류 정의
const ACCESSORY_OPTIONS: { value: AccessoryType; label: string; icon: string }[] = [
  { value: 'hat', label: '모자', icon: '🎩' },
  { value: 'glasses', label: '안경', icon: '👓' },
  { value: 'backpack', label: '배낭', icon: '🎒' },
  { value: 'watch', label: '시계', icon: '⌚' },
  { value: 'necklace', label: '목걸이', icon: '📿' },
  { value: 'earrings', label: '귀걸이', icon: '💎' },
  { value: 'scarf', label: '스카프', icon: '🧣' },
  { value: 'gloves', label: '장갑', icon: '🧤' },
]

// 기본 악세서리 설정
const DEFAULT_ACCESSORIES: AccessoryConfig[] = ACCESSORY_OPTIONS.map(opt => ({
  type: opt.value,
  color: '#3B82F6',
  enabled: false
}))

export default function CreatorPage() {
  const [skeletonType, setSkeletonType] = useState<SkeletonType>('humanMedium')
  const [activeTab, setActiveTab] = useState<TabType>('skin')
  const [skinColorIndex, setSkinColorIndex] = useState(0)
  const [modelName, setModelName] = useState('내 캐릭터')
  const [isExporting, setIsExporting] = useState(false)
  
  // 외부 모델 URL 및 타입
  const [externalModelUrl, setExternalModelUrl] = useState<string | null>(null)
  const [externalModelType, setExternalModelType] = useState<string | null>(null)

  // 의상 설정
  const [outfitConfig, setOutfitConfig] = useState<OutfitConfig>({
    top: 'tshirt',
    topColor: '#3B82F6',
    bottom: 'pants',
    bottomColor: '#1F2937',
    shoes: 'sneakers',
    shoesColor: '#FFFFFF'
  })

  // 악세서리 설정
  const [accessories, setAccessories] = useState<AccessoryConfig[]>(DEFAULT_ACCESSORIES)

  // 악세서리 토글
  const toggleAccessory = (type: AccessoryType) => {
    setAccessories(prev => prev.map(acc =>
      acc.type === type ? { ...acc, enabled: !acc.enabled } : acc
    ))
  }

  // 악세서리 색상 변경
  const setAccessoryColor = (type: AccessoryType, color: string) => {
    setAccessories(prev => prev.map(acc =>
      acc.type === type ? { ...acc, color } : acc
    ))
  }

  const handleExportGLB = async () => {
    setIsExporting(true)
    toast.loading('GLB 파일 생성 중...')

    const event = new CustomEvent('exportGLB', {
      detail: {
        name: modelName,
        skeleton: skeletonType,
        skinColor: SKIN_COLORS[skinColorIndex],
        outfit: outfitConfig,
        accessories: accessories.filter(a => a.enabled)
      }
    })
    window.dispatchEvent(event)

    setTimeout(() => {
      toast.dismiss()
      toast.success('GLB 파일이 다운로드됩니다!')
      setIsExporting(false)
    }, 1500)
  }

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 형식 체크 (GLB만 허용 - 텍스처가 포함되어 있음)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'glb') {
      toast.error('GLB 파일만 지원됩니다. GLTF 파일은 GLB로 변환 후 업로드하세요.')
      return
    }

    // 파일 크기 체크 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('파일 크기는 20MB 이하여야 합니다')
      return
    }

    // URL 생성 및 타입 저장
    const url = URL.createObjectURL(file)
    setExternalModelUrl(url)
    setExternalModelType('glb')
    toast.success(`${file.name} 파일이 로드되었습니다`)
  }

  const handleRandomize = () => {
    setSkinColorIndex(Math.floor(Math.random() * SKIN_COLORS.length))

    // 랜덤 의상
    const randomTop = OUTFIT_TOP_OPTIONS[Math.floor(Math.random() * OUTFIT_TOP_OPTIONS.length)].value
    const randomBottom = OUTFIT_BOTTOM_OPTIONS[Math.floor(Math.random() * OUTFIT_BOTTOM_OPTIONS.length)].value
    const randomShoes = OUTFIT_SHOES_OPTIONS[Math.floor(Math.random() * OUTFIT_SHOES_OPTIONS.length)].value

    setOutfitConfig({
      top: randomTop,
      topColor: OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)],
      bottom: randomBottom,
      bottomColor: OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)],
      shoes: randomShoes,
      shoesColor: OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)]
    })

    // 랜덤 악세서리 (0~3개)
    const count = Math.floor(Math.random() * 4)
    const shuffled = [...ACCESSORY_OPTIONS].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, count).map(a => a.value)

    setAccessories(prev => prev.map(acc => ({
      ...acc,
      enabled: selected.includes(acc.type),
      color: OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)]
    })))

    toast.success('랜덤 캐릭터 생성!')
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
              체형, 피부색, 의상, 악세서리를 선택하여 나만의 캐릭터를 만드세요
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
              {isHumanoid && outfitConfig.top !== 'none' && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-gray-500" style={{ backgroundColor: outfitConfig.topColor }} />
                  <span className="text-gray-300 text-xs">{OUTFIT_TOP_OPTIONS.find(o => o.value === outfitConfig.top)?.label}</span>
                </div>
              )}
              {isHumanoid && outfitConfig.bottom !== 'none' && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-gray-500" style={{ backgroundColor: outfitConfig.bottomColor }} />
                  <span className="text-gray-300 text-xs">{OUTFIT_BOTTOM_OPTIONS.find(o => o.value === outfitConfig.bottom)?.label}</span>
                </div>
              )}
              {accessories.filter(a => a.enabled).length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-gray-400 text-xs">악세서리:</span>
                  <span className="text-gray-300 text-xs">{accessories.filter(a => a.enabled).length}개</span>
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
              outfitConfig={isHumanoid ? outfitConfig : undefined}
              accessories={isHumanoid ? accessories.filter(a => a.enabled) : []}
              externalModelUrl={externalModelUrl}
              externalModelType={externalModelType}
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
              <div className="space-y-6">
                {/* 외부 모델 업로드 */}
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-4 border border-blue-500/30">
                  <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    외부 3D 모델 업로드
                  </h4>
                  <p className="text-gray-400 text-xs mb-3">
                    GLB 파일만 지원 (텍스처 포함, 최대 20MB)<br/>
                    <span className="text-yellow-400">💡 GLTF는 GLB로 변환 필요</span>
                  </p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".glb"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="model-upload"
                    />
                    <div className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      파일 선택
                    </div>
                  </label>
                  {externalModelUrl && (
                    <div className="mt-3 flex items-center justify-between bg-green-600/20 border border-green-500/30 rounded px-3 py-2">
                      <span className="text-green-400 text-xs">✓ 모델 로드됨</span>
                      <button
                        onClick={() => {
                          setExternalModelUrl(null)
                          setExternalModelType(null)
                          toast.info('외부 모델이 제거되었습니다')
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        제거
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <p className="text-gray-500 text-xs mb-4">또는 기본 의상 선택:</p>
                </div>

                {/* 상의 */}
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">상의</h4>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {OUTFIT_TOP_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setOutfitConfig(prev => ({ ...prev, top: opt.value }))}
                        className={`p-2 text-xs rounded-lg transition-all ${
                          outfitConfig.top === opt.value
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {outfitConfig.top !== 'none' && (
                    <div>
                      <p className="text-gray-400 text-xs mb-1">상의 색상</p>
                      <div className="grid grid-cols-10 gap-1">
                        {OUTFIT_COLORS.map((color, i) => (
                          <button
                            key={i}
                            onClick={() => setOutfitConfig(prev => ({ ...prev, topColor: color }))}
                            className={`w-6 h-6 rounded transition-all ${
                              outfitConfig.topColor === color ? 'ring-2 ring-white scale-110' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 하의 */}
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">하의</h4>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {OUTFIT_BOTTOM_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setOutfitConfig(prev => ({ ...prev, bottom: opt.value }))}
                        className={`p-2 text-xs rounded-lg transition-all ${
                          outfitConfig.bottom === opt.value
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {outfitConfig.bottom !== 'none' && (
                    <div>
                      <p className="text-gray-400 text-xs mb-1">하의 색상</p>
                      <div className="grid grid-cols-10 gap-1">
                        {OUTFIT_COLORS.map((color, i) => (
                          <button
                            key={i}
                            onClick={() => setOutfitConfig(prev => ({ ...prev, bottomColor: color }))}
                            className={`w-6 h-6 rounded transition-all ${
                              outfitConfig.bottomColor === color ? 'ring-2 ring-white scale-110' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 신발 */}
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">신발</h4>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {OUTFIT_SHOES_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setOutfitConfig(prev => ({ ...prev, shoes: opt.value }))}
                        className={`p-2 text-xs rounded-lg transition-all ${
                          outfitConfig.shoes === opt.value
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {outfitConfig.shoes !== 'none' && (
                    <div>
                      <p className="text-gray-400 text-xs mb-1">신발 색상</p>
                      <div className="grid grid-cols-10 gap-1">
                        {OUTFIT_COLORS.map((color, i) => (
                          <button
                            key={i}
                            onClick={() => setOutfitConfig(prev => ({ ...prev, shoesColor: color }))}
                            className={`w-6 h-6 rounded transition-all ${
                              outfitConfig.shoesColor === color ? 'ring-2 ring-white scale-110' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'accessory' && isHumanoid && (
              <div className="space-y-3">
                <p className="text-gray-400 text-xs mb-3">악세서리를 선택하고 색상을 지정하세요</p>
                {ACCESSORY_OPTIONS.map(opt => {
                  const config = accessories.find(a => a.type === opt.value)!
                  return (
                    <div key={opt.value} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => toggleAccessory(opt.value)}
                          className={`flex items-center gap-2 ${config.enabled ? 'text-white' : 'text-gray-400'}`}
                        >
                          <span className="text-lg">{opt.icon}</span>
                          <span className="text-sm font-medium">{opt.label}</span>
                        </button>
                        <button
                          onClick={() => toggleAccessory(opt.value)}
                          className={`w-10 h-6 rounded-full transition-colors ${
                            config.enabled ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${
                            config.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                      {config.enabled && (
                        <div className="grid grid-cols-10 gap-1">
                          {OUTFIT_COLORS.map((color, i) => (
                            <button
                              key={i}
                              onClick={() => setAccessoryColor(opt.value, color)}
                              className={`w-5 h-5 rounded transition-all ${
                                config.color === color ? 'ring-2 ring-white scale-110' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* 동물 캐릭터는 의상/악세서리 미지원 */}
            {!isHumanoid && (activeTab === 'outfit' || activeTab === 'accessory') && (
              <div className="text-center py-8 text-gray-500">
                <p>동물 캐릭터는 의상/악세사리를</p>
                <p>지원하지 않습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
