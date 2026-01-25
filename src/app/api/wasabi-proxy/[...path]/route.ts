import { NextRequest, NextResponse } from 'next/server'
import { getWasabiFile } from '@/lib/wasabi'

// GET: Wasabi 파일 프록시
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const filePath = path.join('/')

    // 허용된 경로만 프록시
    const allowedPrefixes = ['creator-models/', 'library/']
    if (!allowedPrefixes.some(prefix => filePath.startsWith(prefix))) {
      return NextResponse.json({ error: '접근이 거부되었습니다.' }, { status: 403 })
    }

    const result = await getWasabiFile(filePath)

    if (!result) {
      return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 콘텐츠 타입 결정
    let contentType = result.contentType
    if (filePath.endsWith('.glb')) {
      contentType = 'model/gltf-binary'
    } else if (filePath.endsWith('.png')) {
      contentType = 'image/png'
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      contentType = 'image/jpeg'
    }

    return new NextResponse(new Uint8Array(result.data), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('프록시 오류:', error)
    return NextResponse.json({ error: '파일을 가져올 수 없습니다.' }, { status: 500 })
  }
}
