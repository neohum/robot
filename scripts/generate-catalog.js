#!/usr/bin/env node

/**
 * 의상/악세서리 카탈로그 생성 스크립트
 * Wasabi에 업로드된 3D 모델 목록을 자동으로 카탈로그화합니다.
 * 
 * 사용법:
 *   node scripts/generate-catalog.js
 */

const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const s3Client = new S3Client({
  endpoint: process.env.WASABI_ENDPOINT || 'https://s3.ap-northeast-1.wasabisys.com',
  region: process.env.WASABI_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY,
    secretAccessKey: process.env.WASABI_SECRET_KEY,
  },
});

const BUCKET = process.env.WASABI_BUCKET || 'robot-bone-mappings';

// Wasabi에서 파일 목록 가져오기
async function listAllFiles(prefix = '') {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error('파일 목록 조회 실패:', error.message);
    return [];
  }
}

// 카탈로그 데이터 생성
function generateCatalog(files) {
  const catalog = {
    outfits: {
      tops: [],
      bottoms: [],
      shoes: [],
      fullbody: []
    },
    accessories: {
      hats: [],
      glasses: [],
      bags: [],
      jewelry: [],
      other: []
    }
  };

  const baseUrl = `${process.env.WASABI_ENDPOINT}/${BUCKET}`;

  files.forEach(file => {
    const key = file.Key;
    
    // GLB/GLTF 파일만 처리
    if (!/\.(glb|gltf)$/i.test(key)) return;

    const parts = key.split('/');
    const fileName = parts[parts.length - 1];
    const category = parts[0]; // outfits or accessories
    const subcategory = parts[1]; // tops, hats, etc.

    const item = {
      id: path.parse(fileName).name,
      name: formatName(fileName),
      url: `${baseUrl}/${key}`,
      path: key,
      size: file.Size,
      lastModified: file.LastModified,
      tags: extractTags(fileName)
    };

    // 카탈로그에 추가
    if (catalog[category] && catalog[category][subcategory]) {
      catalog[category][subcategory].push(item);
    }
  });

  return catalog;
}

// 파일명을 읽기 쉬운 이름으로 변환
function formatName(fileName) {
  return path.parse(fileName).name
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

// 파일명에서 태그 추출
function extractTags(fileName) {
  const tags = [];
  const name = fileName.toLowerCase();

  // 스타일 태그
  if (name.includes('casual')) tags.push('casual');
  if (name.includes('formal')) tags.push('formal');
  if (name.includes('sport')) tags.push('sport');
  if (name.includes('vintage')) tags.push('vintage');
  if (name.includes('modern')) tags.push('modern');

  // 재질 태그
  if (name.includes('leather')) tags.push('leather');
  if (name.includes('denim')) tags.push('denim');
  if (name.includes('cotton')) tags.push('cotton');

  // 색상 태그 (선택적)
  const colors = ['red', 'blue', 'green', 'black', 'white', 'gray', 'brown'];
  colors.forEach(color => {
    if (name.includes(color)) tags.push(color);
  });

  return tags;
}

// 카탈로그를 JSON 파일로 저장 (Wasabi)
async function saveCatalog(catalog) {
  try {
    const catalogJson = JSON.stringify(catalog, null, 2);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: 'catalog.json',
      Body: catalogJson,
      ContentType: 'application/json',
      ACL: 'public-read',
    });

    await s3Client.send(command);
    console.log('✅ 카탈로그가 Wasabi에 저장되었습니다.');
    console.log(`   URL: ${process.env.WASABI_ENDPOINT}/${BUCKET}/catalog.json`);
  } catch (error) {
    console.error('❌ 카탈로그 저장 실패:', error.message);
  }
}

// 로컬에도 저장
function saveCatalogLocally(catalog) {
  const fs = require('fs');
  const localPath = './public/models/catalog.json';
  
  fs.writeFileSync(localPath, JSON.stringify(catalog, null, 2));
  console.log(`✅ 카탈로그가 로컬에 저장되었습니다: ${localPath}`);
}

// 메인 실행
async function main() {
  console.log('🔄 카탈로그 생성 중...\n');

  // 의상 파일 목록
  console.log('📁 의상 파일 스캔 중...');
  const outfitFiles = await listAllFiles('outfits/');
  console.log(`   발견: ${outfitFiles.length}개 파일`);

  // 악세서리 파일 목록
  console.log('📁 악세서리 파일 스캔 중...');
  const accessoryFiles = await listAllFiles('accessories/');
  console.log(`   발견: ${accessoryFiles.length}개 파일`);

  // 카탈로그 생성
  const allFiles = [...outfitFiles, ...accessoryFiles];
  const catalog = generateCatalog(allFiles);

  // 통계 출력
  console.log('\n📊 카탈로그 통계:');
  console.log('  의상:');
  console.log(`    - 상의: ${catalog.outfits.tops.length}개`);
  console.log(`    - 하의: ${catalog.outfits.bottoms.length}개`);
  console.log(`    - 신발: ${catalog.outfits.shoes.length}개`);
  console.log(`    - 풀바디: ${catalog.outfits.fullbody.length}개`);
  console.log('  악세서리:');
  console.log(`    - 모자: ${catalog.accessories.hats.length}개`);
  console.log(`    - 안경: ${catalog.accessories.glasses.length}개`);
  console.log(`    - 가방: ${catalog.accessories.bags.length}개`);
  console.log(`    - 장신구: ${catalog.accessories.jewelry.length}개`);
  console.log(`    - 기타: ${catalog.accessories.other.length}개`);

  // 저장
  await saveCatalog(catalog);
  saveCatalogLocally(catalog);

  console.log('\n✨ 카탈로그 생성 완료!');
}

// 실행
main().catch(error => {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
});
