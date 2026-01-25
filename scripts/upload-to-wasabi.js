#!/usr/bin/env node

/**
 * Wasabi S3 업로드 스크립트
 * 3D 모델(GLB)을 Wasabi 클라우드 스토리지에 업로드합니다.
 * 
 * 사용법:
 *   node scripts/upload-to-wasabi.js --file ./model.glb --path outfits/tops/tshirt_01.glb
 *   node scripts/upload-to-wasabi.js --dir ./models --category outfits/tops
 */

const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

// 환경변수 로드
require('dotenv').config({ path: '.env.local' });

const s3Client = new S3Client({
  endpoint: process.env.WASABI_ENDPOINT || 'https://s3.ap-northeast-1.wasabisys.com',
  region: process.env.WASABI_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY,
    secretAccessKey: process.env.WASABI_SECRET_KEY,
  },
});

const BUCKET = process.env.WASABI_BUCKET || 'robot-bone-mappings'

// 지원하는 파일 형식
const SUPPORTED_FORMATS = ['.glb', '.gltf', '.fbx', '.obj', '.mtl', '.bin']

// MIME 타입 매핑
const MIME_TYPES = {
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.fbx': 'application/octet-stream',
  '.obj': 'text/plain',
  '.mtl': 'text/plain',
  '.bin': 'application/octet-stream'
};

// 명령줄 인자 파싱
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: null,
    path: null,
    dir: null,
    category: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      options.file = args[i + 1];
      i++;
    } else if (args[i] === '--path' && args[i + 1]) {
      options.path = args[i + 1];
      i++;
    } else if (args[i] === '--dir' && args[i + 1]) {
      options.dir = args[i + 1];
      i++;
    } else if (args[i] === '--category' && args[i + 1]) {
      options.category = args[i + 1];
      i++;
    }
  }

  return options;
}

// 단일 파일 업로드
async function uploadFile(localPath, remotePath) {
  try {
    const fileContent = fs.readFileSync(localPath);
    const contentType = mime.lookup(localPath) || 'application/octet-stream';

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: remotePath,
      Body: fileContent,
      ContentType: contentType,
      ACL: 'public-read', // 공개 읽기 권한
    });

    await s3Client.send(command);
    
    const url = `${process.env.WASABI_ENDPOINT}/${BUCKET}/${remotePath}`;
    console.log(`✅ 업로드 성공: ${remotePath}`);
    console.log(`   URL: ${url}`);
    
    return url;
  } catch (error) {
    console.error(`❌ 업로드 실패: ${localPath}`);
    console.error(error.message);
    throw error;
  }
}

// 디렉토리 내 모든 파일 업로드
async function uploadDirectory(localDir, category) {
  const files = fs.readdirSync(localDir);
  const results = [];

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const stat = fs.statSync(localPath);

    if (stat.isFile() && /\.(glb|gltf|obj|fbx)$/i.test(file)) {
      const remotePath = `${category}/${file}`;
      try {
        const url = await uploadFile(localPath, remotePath);
        results.push({ file, url, success: true });
      } catch (error) {
        results.push({ file, error: error.message, success: false });
      }
    } else if (stat.isDirectory()) {
      // 재귀적으로 하위 디렉토리 처리
      const subResults = await uploadDirectory(localPath, `${category}/${file}`);
      results.push(...subResults);
    }
  }

  return results;
}

// 업로드된 파일 목록 확인
async function listFiles(prefix = '') {
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

// 메인 실행
async function main() {
  const options = parseArgs();

  console.log('🚀 Wasabi 업로드 시작\n');

  // 환경변수 확인
  if (!process.env.WASABI_ACCESS_KEY || !process.env.WASABI_SECRET_KEY) {
    console.error('❌ 오류: .env.local 파일에 Wasabi 설정이 필요합니다.');
    console.error('   WASABI_ACCESS_KEY와 WASABI_SECRET_KEY를 설정하세요.\n');
    process.exit(1);
  }

  // 단일 파일 업로드
  if (options.file && options.path) {
    if (!fs.existsSync(options.file)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${options.file}`);
      process.exit(1);
    }

    await uploadFile(options.file, options.path);
    console.log('\n✨ 업로드 완료!');
    return;
  }

  // 디렉토리 업로드
  if (options.dir && options.category) {
    if (!fs.existsSync(options.dir)) {
      console.error(`❌ 디렉토리를 찾을 수 없습니다: ${options.dir}`);
      process.exit(1);
    }

    console.log(`📁 디렉토리: ${options.dir}`);
    console.log(`📂 카테고리: ${options.category}\n`);

    const results = await uploadDirectory(options.dir, options.category);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`\n✨ 업로드 완료!`);
    console.log(`   성공: ${successCount}개`);
    if (failCount > 0) {
      console.log(`   실패: ${failCount}개`);
    }
    return;
  }

  // 파일 목록 조회
  if (!options.file && !options.dir) {
    console.log('📋 현재 업로드된 파일:\n');
    const files = await listFiles();
    
    if (files.length === 0) {
      console.log('   (파일 없음)');
    } else {
      files.forEach(file => {
        console.log(`   - ${file.Key} (${(file.Size / 1024).toFixed(2)} KB)`);
      });
    }
    
    console.log('\n📖 사용법:');
    console.log('   단일 파일: node scripts/upload-to-wasabi.js --file ./model.glb --path outfits/tops/item.glb');
    console.log('   디렉토리: node scripts/upload-to-wasabi.js --dir ./models --category outfits/tops');
    return;
  }

  console.error('\n❌ 잘못된 인자입니다. --help로 사용법을 확인하세요.');
  process.exit(1);
}

// 실행
main().catch(error => {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
});
