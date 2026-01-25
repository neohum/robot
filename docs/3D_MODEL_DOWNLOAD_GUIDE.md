# 무료 3D 모델 다운로드 및 Wasabi 업로드 가이드

## 🚀 빠른 시작

### 1단계: 환경 설정

```bash
# 환경 변수 파일 생성
cp .env.local.example .env.local

# .env.local 파일을 열어 Wasabi 키 입력
# WASABI_ACCESS_KEY=your_actual_key
# WASABI_SECRET_KEY=your_actual_secret
```

### 2단계: 모델 다운로드
아래 무료 사이트에서 GLB 형식으로 다운로드하세요.

### 3단계: 업로드

```bash
# 단일 파일 업로드
npm run upload-model -- --file ./tshirt.glb --path outfits/tops/tshirt.glb

# 폴더 전체 업로드
npm run upload-model -- --dir ./models --category outfits/tops

# 카탈로그 생성 (업로드 후 실행)
npm run generate-catalog
```

---

## 📦 추천 무료 3D 모델 사이트

### 1. **Sketchfab** (https://sketchfab.com)
- 필터: "Downloadable" + "Free" 체크
- 파일 형식: GLB, GLTF 선택
- 라이선스: CC BY, CC0 확인
- 검색: "low poly clothing", "game ready outfit"

### 2. **CGTrader Free** (https://www.cgtrader.com/free-3d-models)
- 카테고리: Characters > Clothing, Accessories
- 파일 형식: GLB 권장

### 3. **Poly Haven** (https://polyhaven.com)
- CC0 라이선스 (완전 무료)
- 고품질 모델

### 4. **Free3D** (https://free3d.com)
- 의상, 악세서리 카테고리
- 무료 다운로드 가능

### 5. **TurboSquid Free** (https://www.turbosquid.com/Search/3D-Models/free)
- "Free" 필터 적용
- 다양한 의상 모델

---

## 🎯 검색 키워드

### 의상
- `low poly tshirt game ready`
- `casual jacket rigged`
- `jeans pants low poly`
- `sneakers shoes game`
- `dress character clothing`

### 악세서리
- `hat cap low poly`
- `glasses eyewear game`
- `backpack bag low poly`
- `watch jewelry game ready`
- `necklace accessories`

---

## 📁 권장 디렉토리 구조

Wasabi 버킷에 다음과 같이 구조화하여 업로드하세요:

```
robot-bone-mappings/
├── outfits/
│   ├── tops/
│   │   ├── tshirt-casual-white.glb
│   │   ├── hoodie-sport-black.glb
│   │   └── jacket-leather-brown.glb
│   ├── bottoms/
│   │   ├── jeans-casual-blue.glb
│   │   ├── shorts-sport-gray.glb
│   │   └── skirt-formal-red.glb
│   ├── shoes/
│   │   ├── sneakers-casual-white.glb
│   │   ├── boots-winter-black.glb
│   │   └── sandals-summer-brown.glb
│   └── fullbody/
│       ├── dress-formal-red.glb
│       └── jumpsuit-casual-blue.glb
└── accessories/
    ├── hats/
    │   ├── cap-baseball-blue.glb
    │   └── beanie-winter-black.glb
    ├── glasses/
    │   ├── sunglasses-aviator.glb
    │   └── eyeglasses-round.glb
    ├── bags/
    │   ├── backpack-school-blue.glb
    │   └── handbag-leather-brown.glb
    └── jewelry/
        ├── necklace-chain-silver.glb
        └── watch-digital-black.glb
```

---

## ⚙️ 상세 사용법

### 업로드 스크립트

**단일 파일 업로드:**
```bash
npm run upload-model -- --file ./models/tshirt.glb --path outfits/tops/tshirt-white.glb
```

**폴더 전체 업로드:**
```bash
npm run upload-model -- --dir ./downloaded-models --category outfits/tops
```

**업로드된 파일 목록 보기:**
```bash
npm run upload-model
```

### 카탈로그 생성

모든 모델 업로드 후 카탈로그를 생성하세요:

```bash
npm run generate-catalog
```

이 명령은:
1. Wasabi 버킷의 모든 GLB/GLTF 파일을 스캔
2. 카테고리별로 분류
3. `catalog.json` 생성 (Wasabi + 로컬)
4. 파일명에서 태그 자동 추출

---

## ⚖️ 라이선스 주의사항
