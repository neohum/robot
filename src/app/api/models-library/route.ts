import { NextRequest, NextResponse } from 'next/server'
import { listLibraryModels, deleteLibraryModel, WasabiLibraryModel } from '@/lib/wasabi'

// 프록시 URL 생성
function getProxyUrl(id: string, category: string, subcategory: string): string {
  return `/api/wasabi-proxy/library/${category}/${subcategory}/${id}`
}

// GET: 라이브러리 모델 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as 'outfits' | 'accessories' | null
    const subcategory = searchParams.get('subcategory')

    if (!category) {
      return NextResponse.json({ error: 'category 파라미터가 필요합니다.' }, { status: 400 })
    }

    const models = await listLibraryModels(category, subcategory || undefined)

    // 각 모델에 프록시 URL 추가
    const items: WasabiLibraryModel[] = models.map((model) => ({
      ...model,
      url: getProxyUrl(model.id, model.category, model.subcategory)
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error('GET 오류:', error)
    return NextResponse.json({ error: '모델 목록을 불러올 수 없습니다.' }, { status: 500 })
  }
}

// DELETE: 라이브러리 모델 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category') as 'outfits' | 'accessories' | null
    const subcategory = searchParams.get('subcategory')

    if (!id || !category || !subcategory) {
      return NextResponse.json({ error: 'id, category, subcategory가 모두 필요합니다.' }, { status: 400 })
    }

    const success = await deleteLibraryModel(id, category, subcategory)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 })
    }
  } catch (error) {
    console.error('DELETE 오류:', error)
    return NextResponse.json({ error: '모델을 삭제할 수 없습니다.' }, { status: 500 })
  }
}
