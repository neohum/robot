# 빠른 시작 가이드

## 🎯 외부 3D 모델 사용하기

### ⚠️ 중요: GLB 파일만 지원

브라우저에서 직접 업로드하는 경우 **GLB 파일만 지원**합니다.

**이유:**
- **GLTF**: 텍스처가 별도 파일 (.jpg, .png, .bin) → 로드 불가
- **FBX/OBJ**: 재질과 텍스처가 별도 파일 → 로드 불가  
- **GLB**: 모든 것이 하나의 파일에 포함 → ✅ 완벽 지원!

### 1단계: 준비하기

무료 3D 모델 사이트에서 의상/악세서리 다운로드:
- [Sketchfab](https://sketchfab.com) - "low poly clothing" 검색, **GLB 다운로드**
- [CGTrader Free](https://www.cgtrader.com/free-3d-models) - **GLB 형식** 선택
- [Free3D](https://free3d.com) - **GLB 형식** 선택

**주의**: 반드시 **GLB 형식**으로 다운로드하세요!

다른 형식은 GLB로 변환 필요:
- GLTF → GLB: [온라인 변환](https://products.aspose.app/3d/conversion/gltf-to-glb)
- FBX → GLB: [온라인 변환](https://products.aspose.app/3d/conversion/fbx-to-glb)
- OBJ → GLB: [온라인 변환](https://products.aspose.app/3d/conversion/obj-to-glb)
- C4D → GLB: [가이드](./C4D_TO_WEB_GUIDE.md)

### 2단계: 환경 설정

```bash
# 환경 변수 파일 생성
cp .env.local.example .env.local

# .env.local 파일 편집
nano .env.local
```

다음과 같이 입력:
```
WASABI_ENDPOINT=https://s3.ap-northeast-1.wasabisys.com
WASABI_REGION=ap-northeast-1
WASABI_ACCESS_KEY=실제_액세스_키
WASABI_SECRET_KEY=실제_시크릿_키
WASABI_BUCKET=robot-bone-mappings
```

### 3단계: 모델 업로드

다운로드한 모델을 Wasabi에 업로드:

```bash
# GLB 업로드
npm run upload-model -- --file ./tshirt.glb --path outfits/tops/tshirt-white.glb

# FBX 업로드 (Cinema 4D에서 내보낸 경우)
npm run upload-model -- --file ./character.fbx --path outfits/fullbody/character.fbx

# OBJ 업로드 (MTL 자동 포함)
npm run upload-model -- --file ./hat.obj --path accessories/hats/cap-baseball.obj

# Cinema 4D 파일?
# → GLB로 변환 필요! docs/C4D_TO_WEB_GUIDE.md 참고
```

또는 폴더 전체 업로드:

```bash
# downloaded-models 폴더의 모든 파일을 상의로 업로드
npm run upload-model -- --dir ./downloaded-models --category outfits/tops
```

### 4단계: 카탈로그 생성

모든 모델을 업로드한 후 카탈로그를 생성:

```bash
npm run generate-catalog
```

이 명령은:
- ✅ Wasabi의 모든 GLB/GLTF 파일을 스캔
- ✅ 카테고리별로 자동 분류
- ✅ `catalog.json` 생성 (Wasabi + 로컬)
- ✅ 파일명에서 태그 자동 추출

### 5단계: 앱에서 사용

개발 서버 실행:

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/creator` 접속하여:
1. **의상/악세서리 탭**에서 업로드한 모델 선택
2. **텍스처 탭**에서 직접 그린 텍스처 적용
3. **GLB 내보내기**로 최종 모델 다운로드

---

## 📋 체크리스트

- [ ] Wasabi 계정 생성 및 버킷 생성
- [ ] `.env.local` 파일 설정
- [ ] 무료 3D 모델 다운로드 (GLB/FBX/OBJ 형식)
- [ ] Cinema 4D 파일은 GLB로 변환
- [ ] 모델 업로드 (`npm run upload-model`)
- [ ] 카탈로그 생성 (`npm run generate-catalog`)
- [ ] 앱 실행 및 테스트 (`npm run dev`)

---

## 💡 팁

### Cinema 4D 파일 사용하기

C4D 파일을 직접 업로드할 수 없습니다. 먼저 변환하세요:

1. **Cinema 4D에서:**
   - File → Export → glTF Binary (.glb)
   - ☑️ Export Materials, Export Textures, Embed Textures

2. **Cinema 4D 없이:**
   - [Aspose 3D Converter](https://products.aspose.app/3d/conversion/c4d-to-glb)에서 온라인 변환
   - 또는 [Blender](https://www.blender.org) 사용

자세한 내용: [C4D to Web Guide](./C4D_TO_WEB_GUIDE.md)

### 추천 파일명 규칙

명확한 이름을 사용하면 카탈로그 생성 시 자동으로 태그가 추출됩니다:

```
✅ 좋은 예:
- tshirt-casual-white.glb
- jeans-denim-blue.glb
- sneakers-sport-red.glb
- cap-baseball-black.glb

❌ 나쁜 예:
- model1.glb
- download.glb
- untitled.glb
```

### 디렉토리 구조

```
outfits/
├── tops/          # 상의 (티셔츠, 셔츠, 재킷 등)
├── bottoms/       # 하의 (바지, 치마 등)
├── shoes/         # 신발 (운동화, 부츠 등)
└── fullbody/      # 전신 (드레스, 점프수트 등)

accessories/
├── hats/          # 모자
├── glasses/       # 안경
├── bags/          # 가방
└── jewelry/       # 장신구
```

### 라이선스 확인

상업적 사용이 가능한 라이선스를 확인하세요:
- ✅ **CC0** (Public Domain) - 제한 없음
- ✅ **CC BY** - 제작자 표시 필요
- ⚠️ **CC BY-NC** - 비상업적 용도만
- ⚠️ **CC BY-SA** - 동일 라이선스로 재배포 필요

---

## 🔧 문제 해결

### 업로드가 안 돼요
```bash
# Wasabi 연결 테스트
npm run upload-model
```

출력된 파일 목록이 보이면 연결 성공!

### 카탈로그가 비어있어요
- 모델을 먼저 업로드했는지 확인
- GLB/GLTF 형식인지 확인
- 올바른 디렉토리 구조인지 확인

### 모델이 앱에 안 보여요
- `npm run generate-catalog` 실행했는지 확인
- 개발 서버 재시작 (`npm run dev`)
- 브라우저 캐시 삭제 (Ctrl+Shift+R)

---

## 📚 추가 자료

- [3D 모델 다운로드 가이드](./3D_MODEL_DOWNLOAD_GUIDE.md) - 무료 사이트 목록 및 검색 키워드
- **[Cinema 4D 파일 사용 가이드](./C4D_TO_WEB_GUIDE.md)** - C4D → GLB 변환 방법
- [Wasabi 문서](https://wasabi.com/help/) - S3 호환 스토리지
- [ModelLoader 컴포넌트](../src/components/ModelLoader.tsx) - GLB/FBX/OBJ 로더

---

**문제가 있나요?** GitHub 이슈로 문의해주세요!
