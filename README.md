# Robot Arm Block Coding Simulator

Three.js와 Blockly를 활용한 3D 로봇 팔 제어 시뮬레이터

## ✨ 주요 기능

### 🎨 3D 캐릭터 커스터마이징
- **텍스처 에디터**: 1024x1024 2D 캔버스로 직접 텍스처 그리기
  - 10가지 도구: 브러시, 지우개, 도형, 텍스트, 그라데이션, 채우기, 스포이드 등
  - 레이어 시스템 (추가/삭제/복제/순서변경)
  - 실행 취소/다시 실행 (최대 50단계)
  - UV 매핑 가이드 오버레이
  - 실시간 3D 모델 적용
- **의상 시스템**: 상의/하의/신발 선택 및 커스터마이징
- **악세서리**: 모자, 안경, 가방, 장신구
- **외부 3D 모델 지원**: Wasabi 스토리지에서 GLB 모델 로드

### 🎮 블록 코딩 인터페이스
- Google Blockly 기반의 직관적인 드래그 앤 드롭 인터페이스
- 커스텀 로봇 제어 블록:
  - 관절 회전 (베이스, 어깨, 팔꿈치)
  - 그립퍼 제어 (열기/닫기)
  - 대기 블록
  - 초기 위치 리셋
  - 모든 관절 한번에 설정
- 반복문 및 제어 구조 지원

### 🤖 3D 로봇 시뮬레이션
- Three.js 기반 실시간 3D 렌더링
- 3관절 로봇 팔 + 그립퍼
- 부드러운 애니메이션 (Ease-in-out)
- 마우스로 자유로운 시점 조작 (OrbitControls)

### 💾 프로젝트 관리
- 로컬스토리지 기반 프로젝트 저장/불러오기
- 자동 저장 기능
- 프로젝트 삭제 및 관리

### 📚 예제 프로그램
- 기본 움직임
- 그립퍼 테스트
- 회전 동작
- 픽 앤 플레이스 시뮬레이션

## 🚀 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 빌드

```bash
npm run build
npm start
```

### 3D 모델 관리 (Wasabi)

```bash
# 환경 설정
cp .env.local.example .env.local
# .env.local에 Wasabi 키 입력

# 모델 업로드 (GLB, GLTF, FBX, OBJ 지원)
npm run upload-model -- --file ./model.glb --path outfits/tops/tshirt.glb
npm run upload-model -- --file ./character.fbx --path outfits/fullbody/character.fbx

# 카탈로그 생성
npm run generate-catalog
```

**Cinema 4D 파일(.c4d) 사용하기:**
- C4D 파일은 GLB로 변환 후 업로드하세요
- 자세한 가이드: [C4D to Web Guide](./docs/C4D_TO_WEB_GUIDE.md)

자세한 내용은 [3D 모델 다운로드 가이드](./docs/3D_MODEL_DOWNLOAD_GUIDE.md)를 참고하세요.

## 📖 사용 방법

1. **블록 조립**: 좌측 패널에서 블록을 드래그하여 프로그램 작성
2. **실행**: 상단의 "▶ 실행" 버튼 클릭
3. **확인**: 우측 3D 뷰에서 로봇 팔이 움직이는 것을 확인
4. **저장**: "💾 저장" 버튼으로 프로젝트 저장
5. **예제**: "📚 예제" 버튼으로 샘플 프로그램 불러오기

## 🛠 기술 스택

- **프론트엔드**: Next.js 16, React 18
- **언어**: TypeScript
- **3D 렌더링**: Three.js, React Three Fiber, Drei
- **블록 코딩**: Google Blockly
- **스타일링**: Tailwind CSS

## 📁 프로젝트 구조

```
robot/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx           # 메인 페이지
│   │   └── globals.css
│   ├── components/
│   │   ├── RobotArm/          # 로봇 팔 3D 모델
│   │   ├── Scene/             # Three.js 씬
│   │   ├── BlocklyWorkspace/  # Blockly 워크스페이스
│   │   ├── Controls/          # 제어 버튼
│   │   └── Dialogs/           # 저장/불러오기 다이얼로그
│   └── lib/
│       ├── types/             # TypeScript 타입 정의
│       ├── blockly/           # 커스텀 블록 및 코드 생성기
│       ├── constants.ts       # 상수
│       ├── animationController.ts  # 애니메이션 제어
│       ├── storage.ts         # 로컬스토리지 관리
│       └── examples.ts        # 예제 프로그램
└── public/                    # 정적 파일
```

## 🎯 개발 완료 상황

- ✅ Phase 1: 프로젝트 초기 설정
- ✅ Phase 2: Three.js 3D 환경 구축
- ✅ Phase 3: 로봇 팔 운동학 구현
- ✅ Phase 4: Blockly 통합
- ✅ Phase 5: 명령 실행 엔진
- ✅ Phase 6: UI/UX 개선
- ✅ Phase 7: 추가 기능 (저장/불러오기, 예제)
- ✅ Phase 8: 최적화 및 문서화

## 🎨 주요 기능 상세

### 로봇 팔 구조
```
베이스 (고정)
  └─ 관절1 (Y축 회전 - Yaw) [-180° ~ 180°]
      └─ 관절2 (X축 회전 - Pitch) [-90° ~ 90°]
          └─ 관절3 (X축 회전 - Pitch) [-135° ~ 135°]
              └─ 그립퍼 (개폐) [0: 닫힘, 1: 열림]
```

### 블록 종류
- **로봇 제어**: 초기 위치, 모든 관절 설정
- **동작**: 관절 회전, 그립퍼 제어
- **제어**: 대기, 반복

## 📝 라이선스

MIT

## 👥 기여

이슈 및 PR을 환영합니다!

## 🔗 참고 자료

- [Three.js 문서](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Blockly 개발자 가이드](https://developers.google.com/blockly)
- [Next.js 문서](https://nextjs.org/docs)
