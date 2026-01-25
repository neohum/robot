import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Wasabi 설정 (환경 변수에서 가져옴)
const wasabiClient = new S3Client({
  endpoint: process.env.WASABI_ENDPOINT || 'https://s3.ap-northeast-1.wasabisys.com',
  region: process.env.WASABI_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY || '',
    secretAccessKey: process.env.WASABI_SECRET_KEY || '',
  },
})

const BUCKET_NAME = process.env.WASABI_BUCKET || 'robot2026'
const MAPPINGS_PREFIX = 'bone-mappings/'

export interface WasabiBoneMapping {
  modelName: string
  timestamp: number
  mappings: Record<string, string>
  scale?: number
}

// 본 매핑 저장
export async function saveMappingToWasabi(mapping: WasabiBoneMapping): Promise<boolean> {
  try {
    const key = `${MAPPINGS_PREFIX}${encodeURIComponent(mapping.modelName)}.json`

    await wasabiClient.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(mapping),
      ContentType: 'application/json',
    }))

    return true
  } catch (error) {
    console.error('Wasabi 저장 오류:', error)
    return false
  }
}

// 특정 본 매핑 불러오기
export async function loadMappingFromWasabi(modelName: string): Promise<WasabiBoneMapping | null> {
  try {
    const key = `${MAPPINGS_PREFIX}${encodeURIComponent(modelName)}.json`

    const response = await wasabiClient.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }))

    if (response.Body) {
      const bodyString = await response.Body.transformToString()
      return JSON.parse(bodyString)
    }

    return null
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return null
    }
    console.error('Wasabi 조회 오류:', error)
    return null
  }
}

// 모든 본 매핑 목록 불러오기
export async function listAllMappingsFromWasabi(): Promise<WasabiBoneMapping[]> {
  try {
    const response = await wasabiClient.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: MAPPINGS_PREFIX,
    }))

    const mappings: WasabiBoneMapping[] = []

    if (response.Contents) {
      for (const item of response.Contents) {
        if (item.Key && item.Key.endsWith('.json')) {
          try {
            const getResponse = await wasabiClient.send(new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: item.Key,
            }))

            if (getResponse.Body) {
              const bodyString = await getResponse.Body.transformToString()
              const mapping = JSON.parse(bodyString)
              mappings.push(mapping)
            }
          } catch (e) {
            console.error(`파일 읽기 실패: ${item.Key}`, e)
          }
        }
      }
    }

    // 최신순 정렬
    mappings.sort((a, b) => b.timestamp - a.timestamp)

    return mappings
  } catch (error) {
    console.error('Wasabi 목록 조회 오류:', error)
    return []
  }
}

// 본 매핑 삭제
export async function deleteMappingFromWasabi(modelName: string): Promise<boolean> {
  try {
    const key = `${MAPPINGS_PREFIX}${encodeURIComponent(modelName)}.json`

    await wasabiClient.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }))

    return true
  } catch (error) {
    console.error('Wasabi 삭제 오류:', error)
    return false
  }
}

// ============================================
// Creator 모델 저장 (GLB 파일) - 의상/악세서리 라이브러리
// ============================================

const LIBRARY_PREFIX = 'library/'

// 의상 서브카테고리
export type OutfitSubcategory = 'tops' | 'bottoms' | 'shoes' | 'fullbody'

// 악세서리 서브카테고리
export type AccessorySubcategory = 'hats' | 'glasses' | 'bags' | 'jewelry' | 'other'

export interface WasabiLibraryModel {
  id: string
  name: string
  category: 'outfits' | 'accessories'
  subcategory: string
  timestamp: number
  size: number
  url?: string
}

// GLB 모델 파일 업로드 (라이브러리용)
export async function uploadLibraryModel(
  file: Buffer,
  fileName: string,
  category: 'outfits' | 'accessories',
  subcategory: string
): Promise<WasabiLibraryModel | null> {
  try {
    const id = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const key = `${LIBRARY_PREFIX}${category}/${subcategory}/${id}`

    await wasabiClient.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: 'model/gltf-binary',
      Metadata: {
        originalName: fileName,
        category: category,
        subcategory: subcategory,
        uploadTime: Date.now().toString(),
      },
    }))

    // 메타데이터 저장
    const metadata: WasabiLibraryModel = {
      id,
      name: fileName.replace('.glb', ''),
      category,
      subcategory,
      timestamp: Date.now(),
      size: file.length,
    }

    await wasabiClient.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${key}.meta.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
    }))

    return metadata
  } catch (error) {
    console.error('Wasabi 라이브러리 모델 업로드 오류:', error)
    return null
  }
}

// 라이브러리 모델 목록 조회
export async function listLibraryModels(
  category: 'outfits' | 'accessories',
  subcategory?: string
): Promise<WasabiLibraryModel[]> {
  try {
    const prefix = subcategory
      ? `${LIBRARY_PREFIX}${category}/${subcategory}/`
      : `${LIBRARY_PREFIX}${category}/`

    const response = await wasabiClient.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    }))

    const models: WasabiLibraryModel[] = []

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
              const metadata = JSON.parse(bodyString) as WasabiLibraryModel
              models.push(metadata)
            }
          } catch (e) {
            console.error(`메타데이터 읽기 실패: ${item.Key}`, e)
          }
        }
      }
    }

    // 최신순 정렬
    models.sort((a, b) => b.timestamp - a.timestamp)

    return models
  } catch (error) {
    console.error('Wasabi 라이브러리 모델 목록 조회 오류:', error)
    return []
  }
}

// 라이브러리 모델 삭제
export async function deleteLibraryModel(
  id: string,
  category: 'outfits' | 'accessories',
  subcategory: string
): Promise<boolean> {
  try {
    const key = `${LIBRARY_PREFIX}${category}/${subcategory}/${id}`

    // GLB 파일 삭제
    await wasabiClient.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }))

    // 메타데이터 삭제
    await wasabiClient.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${key}.meta.json`,
    }))

    return true
  } catch (error) {
    console.error('Wasabi 라이브러리 모델 삭제 오류:', error)
    return false
  }
}

// ============================================
// Creator 모델 저장 (GLB 파일) - 레거시 호환
// ============================================

const MODELS_PREFIX = 'creator-models/'

export interface WasabiCreatorModel {
  id: string
  name: string
  type: 'outfit' | 'accessory'
  timestamp: number
  size: number
  url?: string
}

// GLB 모델 파일 업로드
export async function uploadModelToWasabi(
  file: Buffer,
  fileName: string,
  modelType: 'outfit' | 'accessory'
): Promise<WasabiCreatorModel | null> {
  try {
    const id = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const key = `${MODELS_PREFIX}${modelType}s/${id}`

    await wasabiClient.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: 'model/gltf-binary',
      Metadata: {
        originalName: fileName,
        modelType: modelType,
        uploadTime: Date.now().toString(),
      },
    }))

    // 메타데이터 저장
    const metadata: WasabiCreatorModel = {
      id,
      name: fileName.replace('.glb', ''),
      type: modelType,
      timestamp: Date.now(),
      size: file.length,
    }

    await wasabiClient.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${key}.meta.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
    }))

    return metadata
  } catch (error) {
    console.error('Wasabi 모델 업로드 오류:', error)
    return null
  }
}

// GLB 모델 다운로드 URL 생성 (Presigned URL)
export async function getModelDownloadUrl(id: string, modelType: 'outfit' | 'accessory'): Promise<string | null> {
  try {
    const key = `${MODELS_PREFIX}${modelType}s/${id}`

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    // 1시간 유효한 presigned URL 생성
    const url = await getSignedUrl(wasabiClient, command, { expiresIn: 3600 })
    return url
  } catch (error) {
    console.error('Wasabi 다운로드 URL 생성 오류:', error)
    return null
  }
}

// 모든 Creator 모델 목록 조회
export async function listCreatorModels(modelType?: 'outfit' | 'accessory'): Promise<WasabiCreatorModel[]> {
  try {
    const prefix = modelType
      ? `${MODELS_PREFIX}${modelType}s/`
      : MODELS_PREFIX

    const response = await wasabiClient.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    }))

    const models: WasabiCreatorModel[] = []

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
              const metadata = JSON.parse(bodyString) as WasabiCreatorModel
              models.push(metadata)
            }
          } catch (e) {
            console.error(`메타데이터 읽기 실패: ${item.Key}`, e)
          }
        }
      }
    }

    // 최신순 정렬
    models.sort((a, b) => b.timestamp - a.timestamp)

    return models
  } catch (error) {
    console.error('Wasabi 모델 목록 조회 오류:', error)
    return []
  }
}

// Creator 모델 삭제
export async function deleteCreatorModel(id: string, modelType: 'outfit' | 'accessory'): Promise<boolean> {
  try {
    const key = `${MODELS_PREFIX}${modelType}s/${id}`

    // GLB 파일 삭제
    await wasabiClient.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }))

    // 메타데이터 삭제
    await wasabiClient.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${key}.meta.json`,
    }))

    return true
  } catch (error) {
    console.error('Wasabi 모델 삭제 오류:', error)
    return false
  }
}

// Wasabi 파일 직접 가져오기 (프록시용)
export async function getWasabiFile(key: string): Promise<{ data: Buffer; contentType: string } | null> {
  try {
    const response = await wasabiClient.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }))

    if (response.Body) {
      const data = await response.Body.transformToByteArray()
      const contentType = response.ContentType || 'application/octet-stream'
      return { data: Buffer.from(data), contentType }
    }

    return null
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return null
    }
    console.error('Wasabi 파일 가져오기 오류:', error)
    return null
  }
}

// 임의 파일 Wasabi에 업로드 (텍스처 등)
export async function uploadFileToWasabi(
  file: Buffer,
  key: string,
  contentType: string
): Promise<boolean> {
  try {
    await wasabiClient.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    }))
    return true
  } catch (error) {
    console.error('Wasabi 파일 업로드 오류:', error)
    return false
  }
}
