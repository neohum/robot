import { NextRequest, NextResponse } from 'next/server'
import {
  uploadModelToWasabi,
  listCreatorModels,
  deleteCreatorModel,
  WasabiCreatorModel
} from '@/lib/wasabi'

// 프록시 URL 생성 (presigned URL 대신 프록시 사용)
function getProxyUrl(id: string, modelType: 'outfit' | 'accessory'): string {
  return `/api/wasabi-proxy/creator-models/${modelType}s/${id}`
}

// GET: 모델 목록 조회 또는 다운로드 URL 가져오기
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelType = searchParams.get('type') as 'outfit' | 'accessory' | null
    const modelId = searchParams.get('id')
    const action = searchParams.get('action')

    // 특정 모델의 다운로드 URL 요청
    if (modelId && modelType && action === 'download') {
      const url = getProxyUrl(modelId, modelType)
      return NextResponse.json({ url })
    }

    // 모델 목록 조회
    const models = await listCreatorModels(modelType || undefined)

    // 각 모델에 프록시 URL 추가
    const modelsWithUrls: WasabiCreatorModel[] = models.map((model) => {
      const url = getProxyUrl(model.id, model.type)
      return { ...model, url }
    })

    return NextResponse.json(modelsWithUrls)
  } catch (error) {
    console.error('GET 오류:', error)
    return NextResponse.json({ error: '모델 목록을 불러올 수 없습니다.' }, { status: 500 })
  }
}

// POST: 새 모델 업로드
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const modelType = formData.get('type') as 'outfit' | 'accessory' | null

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 })
    }

    if (!modelType || !['outfit', 'accessory'].includes(modelType)) {
      return NextResponse.json({ error: '유효한 모델 타입이 필요합니다. (outfit 또는 accessory)' }, { status: 400 })
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

    const result = await uploadModelToWasabi(buffer, file.name, modelType)

    if (result) {
      // 프록시 URL 반환
      const url = getProxyUrl(result.id, result.type)
      return NextResponse.json({ success: true, model: { ...result, url } })
    } else {
      return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 500 })
    }
  } catch (error) {
    console.error('POST 오류:', error)
    return NextResponse.json({ error: '모델을 업로드할 수 없습니다.' }, { status: 500 })
  }
}

// DELETE: 모델 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('id')
    const modelType = searchParams.get('type') as 'outfit' | 'accessory' | null

    if (!modelId || !modelType) {
      return NextResponse.json({ error: 'id와 type이 필요합니다.' }, { status: 400 })
    }

    const success = await deleteCreatorModel(modelId, modelType)

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
