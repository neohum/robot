import { NextRequest, NextResponse } from 'next/server'
import { uploadLibraryModel } from '@/lib/wasabi'

// 프록시 URL 생성
function getProxyUrl(id: string, category: string, subcategory: string): string {
  return `/api/wasabi-proxy/library/${category}/${subcategory}/${id}`
}

// POST: 새 모델 업로드
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categoryPath = formData.get('category') as string | null // "outfits/tops" 형식

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 })
    }

    if (!categoryPath) {
      return NextResponse.json({ error: 'category 파라미터가 필요합니다. (예: outfits/tops)' }, { status: 400 })
    }

    const [category, subcategory] = categoryPath.split('/')

    if (!category || !subcategory) {
      return NextResponse.json({ error: 'category 형식이 잘못되었습니다. (예: outfits/tops)' }, { status: 400 })
    }

    if (!['outfits', 'accessories'].includes(category)) {
      return NextResponse.json({ error: 'category는 outfits 또는 accessories여야 합니다.' }, { status: 400 })
    }

    if (!file.name.endsWith('.glb')) {
      return NextResponse.json({ error: 'GLB 파일만 업로드 가능합니다.' }, { status: 400 })
    }

    // 파일 크기 제한 (50MB)
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '파일 크기는 50MB를 초과할 수 없습니다.' }, { status: 400 })
    }

    // File을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await uploadLibraryModel(
      buffer,
      file.name,
      category as 'outfits' | 'accessories',
      subcategory
    )

    if (result) {
      const url = getProxyUrl(result.id, result.category, result.subcategory)
      return NextResponse.json({
        success: true,
        model: { ...result, url }
      })
    } else {
      return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 500 })
    }
  } catch (error) {
    console.error('POST 오류:', error)
    return NextResponse.json({ error: '모델을 업로드할 수 없습니다.' }, { status: 500 })
  }
}
