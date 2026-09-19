#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3')

const BUCKET_NAME = process.env.WASABI_BUCKET || 'robot2026'
const SOURCE_PREFIX = 'external-models/'
const TARGET_PREFIX = 'backgrand/'

if (!process.env.WASABI_ACCESS_KEY || !process.env.WASABI_SECRET_KEY) {
  console.error('Missing WASABI_ACCESS_KEY or WASABI_SECRET_KEY')
  process.exit(1)
}

const client = new S3Client({
  endpoint: process.env.WASABI_ENDPOINT || 'https://s3.ap-northeast-1.wasabisys.com',
  region: process.env.WASABI_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY,
    secretAccessKey: process.env.WASABI_SECRET_KEY,
  },
})

function copySourceFor(key) {
  return `${BUCKET_NAME}/${encodeURIComponent(key).replace(/%2F/g, '/')}`
}

async function objectExists(key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
    return true
  } catch {
    return false
  }
}

async function copyIfMissing(sourceKey, targetKey, contentType) {
  if (await objectExists(targetKey)) {
    return 'exists'
  }

  await client.send(new CopyObjectCommand({
    Bucket: BUCKET_NAME,
    Key: targetKey,
    CopySource: copySourceFor(sourceKey),
    ContentType: contentType,
    MetadataDirective: 'COPY',
  }))

  return 'copied'
}

async function deleteQuietly(key) {
  try {
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
  } catch (error) {
    console.warn(`Failed to delete ${key}: ${error.message}`)
  }
}

async function readJson(key) {
  const response = await client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
  const body = await response.Body.transformToString()
  return JSON.parse(body)
}

async function listAll(prefix) {
  const objects = []
  let ContinuationToken

  do {
    const response = await client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken,
    }))

    if (response.Contents) {
      objects.push(...response.Contents)
    }

    ContinuationToken = response.NextContinuationToken
  } while (ContinuationToken)

  return objects
}

async function main() {
  const objects = await listAll(SOURCE_PREFIX)
  const metaObjects = objects.filter(item => item.Key && item.Key.endsWith('.meta.json'))
  let moved = 0
  let skipped = 0

  for (const item of metaObjects) {
    const metaKey = item.Key
    const metadata = await readJson(metaKey)

    if (metadata.modelType !== 'background') {
      skipped += 1
      continue
    }

    const sourceModelKey = `${SOURCE_PREFIX}${metadata.id}`
    const targetModelKey = `${TARGET_PREFIX}${metadata.id}`
    const targetMetaKey = `${targetModelKey}.meta.json`

    const modelStatus = await copyIfMissing(sourceModelKey, targetModelKey, 'model/gltf-binary')
    const metaStatus = await copyIfMissing(metaKey, targetMetaKey, 'application/json')

    await deleteQuietly(sourceModelKey)
    await deleteQuietly(metaKey)

    moved += 1
    console.log(`${metadata.name || metadata.id}: ${modelStatus}/${metaStatus} -> ${TARGET_PREFIX}`)
  }

  console.log(`Done. moved=${moved}, skipped=${skipped}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
