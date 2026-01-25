import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const wasabiClient = new S3Client({
  endpoint: process.env.WASABI_ENDPOINT || 'https://s3.ap-northeast-1.wasabisys.com',
  region: process.env.WASABI_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY || '',
    secretAccessKey: process.env.WASABI_SECRET_KEY || '',
  },
})

const BUCKET_NAME = process.env.WASABI_BUCKET || 'robot2026'
const MODELS_PREFIX = 'external-models/'

export interface ExternalModelMetadata {
  id: string
  name: string
  timestamp: number
  size: number
  boneMapping?: Record<string, string>
  scale?: number
}

// POST: GLB 파일 업로드
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const boneMappingStr = formData.get('boneMapping') as string
    const scaleStr = formData.get('scale') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const id = `${Date.now()}-${name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const key = `${MODELS_PREFIX}${id}`

    // GLB 파일 업로드
    await wasabiClient.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'model/gltf-binary',
      Metadata: {
        originalName: name,
        uploadTime: Date.now().toString(),
      },
    }))

    // 메타데이터 저장
    const metadata: ExternalModelMetadata = {
      id,
      name: name.replace('.glb', ''),
      timestamp: Date.now(),
      size: buffer.length,
      boneMapping: boneMappingStr ? JSON.parse(boneMappingStr) : undefined,
      scale: scaleStr ? parseFloat(scaleStr) : undefined,
    }

    await wasabiClient.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${key}.meta.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
    }))

    // Presigned URL 생성 (1시간 유효)
    const url = await getSignedUrl(
      wasabiClient,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
      { expiresIn: 3600 }
    )

    return NextResponse.json({ 
      success: true, 
      id, 
      url,
      metadata 
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', message: error.message },
      { status: 500 }
    )
  }
}

// GET: 모델 목록 조회 또는 특정 모델의 URL 가져오기
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // 특정 모델의 URL 가져오기
    if (id) {
      const key = `${MODELS_PREFIX}${id}`
      
      // Presigned URL 생성 (1시간 유효)
      const url = await getSignedUrl(
        wasabiClient,
        new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        }),
        { expiresIn: 3600 }
      )

      // 메타데이터 가져오기
      try {
        const metaResponse = await wasabiClient.send(new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `${key}.meta.json`,
        }))

        if (metaResponse.Body) {
          const bodyString = await metaResponse.Body.transformToString()
          const metadata = JSON.parse(bodyString)
          
          return NextResponse.json({ 
            success: true, 
            url,
            metadata 
          })
        }
      } catch (e) {
        // 메타데이터 없어도 URL은 반환
        console.warn('No metadata found for', id)
      }

      return NextResponse.json({ success: true, url })
    }

    // 모든 모델 목록 조회
    const response = await wasabiClient.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: MODELS_PREFIX,
    }))

    const models: ExternalModelMetadata[] = []

    if (response.Contents) {
      for (const item of response.Contents) {
        if (item.Key && item.Key.endsWith('.meta.json')) {
          try {
            const getResponse = await wasabiClient.send(new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: item.Key,
            }))

            if (getResponse.Body) {
              const bodyString = await getResponse.Body.transformToString()
              const metadata = JSON.parse(bodyString) as ExternalModelMetadata
              models.push(metadata)
            }
          } catch (e) {
            console.error(`Failed to read metadata: ${item.Key}`, e)
          }
        }
      }
    }

    // 최신순 정렬
    models.sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json({ success: true, models })
  } catch (error: any) {
    console.error('Get models error:', error)
    return NextResponse.json(
      { error: 'Failed to get models', message: error.message },
      { status: 500 }
    )
  }
}

// DELETE: 모델 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'No id provided' }, { status: 400 })
    }

    const key = `${MODELS_PREFIX}${id}`

    // GLB 파일 삭제
    await wasabiClient.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }))

    // 메타데이터 삭제
    try {
      await wasabiClient.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${key}.meta.json`,
      }))
    } catch (e) {
      console.warn('No metadata to delete for', id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Delete failed', message: error.message },
      { status: 500 }
    )
  }
}

// PUT: 메타데이터 업데이트 (본 매핑, 스케일 등)
export async function PUT(request: NextRequest) {
  try {
    const { id, boneMapping, scale } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'No id provided' }, { status: 400 })
    }

    const key = `${MODELS_PREFIX}${id}`
    const metaKey = `${key}.meta.json`

    // 기존 메타데이터 가져오기
    let metadata: ExternalModelMetadata
    try {
      const metaResponse = await wasabiClient.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metaKey,
      }))

      if (metaResponse.Body) {
        const bodyString = await metaResponse.Body.transformToString()
        metadata = JSON.parse(bodyString)
      } else {
        throw new Error('No metadata found')
      }
    } catch (e) {
      return NextResponse.json({ error: 'Metadata not found' }, { status: 404 })
    }

    // 메타데이터 업데이트
    if (boneMapping !== undefined) {
      metadata.boneMapping = boneMapping
    }
    if (scale !== undefined) {
      metadata.scale = scale
    }

    // 업데이트된 메타데이터 저장
    await wasabiClient.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metaKey,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
    }))

    return NextResponse.json({ success: true, metadata })
  } catch (error: any) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: 'Update failed', message: error.message },
      { status: 500 }
    )
  }
}
