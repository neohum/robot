# Cinema 4D 파일을 웹에서 사용하기

Cinema 4D(.c4d) 파일은 웹 브라우저에서 직접 로드할 수 없습니다. 
이 가이드는 C4D 파일을 웹에서 사용할 수 있는 형식으로 변환하는 방법을 설명합니다.

## 🎯 권장 워크플로우

### 방법 1: Cinema 4D에서 직접 내보내기 (가장 권장)

1. **Cinema 4D에서 파일 열기**
2. **File → Export → Export as...** 선택
3. **GLB/GLTF 형식으로 내보내기**
   - 형식: `glTF Binary (.glb)` 선택
   - 옵션:
     - ☑️ Export Materials
     - ☑️ Export Textures
     - ☑️ Embed Textures
     - 해상도: Original 또는 2K

**장점:**
- 최고 품질 유지
- 재질과 텍스처 완벽 보존
- 애니메이션 포함 가능

---

### 방법 2: FBX로 내보내기 (애니메이션 필요 시)

1. **Cinema 4D에서:**
   - File → Export → FBX (.fbx)
   - 버전: FBX 2020 이상
   - ☑️ Embed Media (텍스처 포함)

2. **온라인 변환 (선택):**
   - [Aspose 3D Converter](https://products.aspose.app/3d/conversion/fbx-to-glb) (FBX → GLB)
   - [AnyConv](https://anyconv.com/fbx-to-glb-converter/) (FBX → GLB)

3. **Blender로 변환 (로컬):**
   ```bash
   # Blender 설치 후
   # File → Import → FBX
   # File → Export → glTF 2.0 (.glb)
   ```

---

### 방법 3: OBJ로 내보내기 (단순 모델)

1. **Cinema 4D에서:**
   - File → Export → Wavefront OBJ (.obj)
   - ☑️ Export Materials

2. **온라인 변환:**
   - [Aspose OBJ to GLB](https://products.aspose.app/3d/conversion/obj-to-glb)
   - 또는 Blender 사용

**주의:** OBJ는 애니메이션을 지원하지 않습니다.

---

## 🛠 온라인 변환 도구 (Cinema 4D 없이)

### 추천 도구

1. **Aspose 3D Converter** (무료, 제한 없음)
   - URL: https://products.aspose.app/3d/conversion
   - 지원: C4D → GLB, FBX, OBJ 등
   - 장점: 빠르고 안정적

2. **AnyConv** (무료, 100MB 제한)
   - URL: https://anyconv.com/c4d-to-glb-converter/
   - 직접 C4D → GLB 변환

3. **Blender (무료 오픈소스)**
   - URL: https://www.blender.org
   - 플러그인 설치 후 C4D import 가능
   - 최고의 품질과 제어

---

## 📦 변환 후 업로드

GLB 파일로 변환한 후:

```bash
# 1. 단일 파일 업로드
npm run upload-model -- --file ./converted-model.glb --path outfits/tops/model.glb

# 2. 카탈로그 생성
npm run generate-catalog
```

---

## ⚙️ Cinema 4D 내보내기 최적화

### 웹용 최적화 설정

1. **폴리곤 감소**
   - Mesh → Commands → Polygon Reduction
   - 목표: 5,000 ~ 20,000 폴리곤 (의상/악세서리)

2. **텍스처 크기**
   - 권장: 1024x1024 또는 2048x2048
   - File → Export → GLB → Texture Resolution

3. **불필요한 오브젝트 삭제**
   - 숨겨진 레이어 삭제
   - 라이트, 카메라 제거 (웹에서 재설정됨)

4. **원점 설정**
   - 모델을 (0, 0, 0)에 배치
   - 바닥이 Y=0이 되도록 조정

---

## 🎨 재질/텍스처 주의사항

### 지원되는 재질 속성
- ✅ Base Color (Diffuse)
- ✅ Metallic
- ✅ Roughness
- ✅ Normal Map
- ✅ Emission
- ⚠️ Subsurface Scattering (부분 지원)
- ❌ C4D 전용 셰이더 (변환 필요)

### 텍스처 포맷
- ✅ PNG (투명도 지원)
- ✅ JPEG (용량 작음)
- ❌ TIFF, PSD (변환 필요)

---

## 📋 체크리스트

변환 전:
- [ ] 불필요한 오브젝트 삭제
- [ ] 폴리곤 수 최적화 (< 20K)
- [ ] 텍스처 크기 확인 (≤ 2K)
- [ ] 모델 원점 조정
- [ ] 재질 단순화 (PBR 표준)

변환 후:
- [ ] GLB 파일 크기 확인 (< 5MB 권장)
- [ ] 텍스처가 포함되었는지 확인
- [ ] Wasabi에 업로드
- [ ] 카탈로그 생성

---

## 🔧 문제 해결

### 텍스처가 안 보여요
- GLB 내보내기 시 "Embed Textures" 체크
- 텍스처 파일 경로가 올바른지 확인
- Blender로 다시 열어서 재확인

### 파일이 너무 커요
1. 폴리곤 감소 (Polygon Reduction)
2. 텍스처 해상도 낮추기 (1024x1024)
3. 텍스처를 JPEG로 변환 (투명도 불필요 시)

### 재질이 이상해요
- C4D 전용 셰이더를 Standard Material로 변경
- Octane/Redshift → Physical Material로 변환
- GLB 내보내기 전에 미리보기 확인

---

## 💡 추가 리소스

- [Cinema 4D Export Guide](https://help.maxon.net/c4d/en-us/#html/5699.html)
- [glTF 2.0 Specification](https://www.khronos.org/gltf/)
- [Blender C4D Import Plugin](https://github.com/dfelinto/blender)

---

## 🚀 빠른 시작 예제

```bash
# Cinema 4D가 있다면
# 1. C4D 파일 열기
# 2. File → Export → glTF Binary (.glb)
# 3. 저장

# Cinema 4D가 없다면
# 1. https://products.aspose.app/3d/conversion 방문
# 2. C4D 파일 업로드
# 3. 'to GLB' 선택 후 변환
# 4. 다운로드

# 업로드
npm run upload-model -- --file ./model.glb --path outfits/tops/mymodel.glb
npm run generate-catalog
```

**문제가 있나요?** GitHub 이슈로 문의해주세요!
