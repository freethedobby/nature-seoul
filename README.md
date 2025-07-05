# 네이쳐 | 눈썹 시술 전문 웹사이트

네이쳐 눈썹 시술 전문 브랜드의 공식 웹사이트입니다. Next.js 15, Tailwind CSS, shadcn/ui를 사용하여 제작된 모던한 뷰티 브랜드 웹사이트입니다.

## 🌟 프로젝트 소개

네이쳐는 개인의 얼굴형과 특성에 맞춘 맞춤형 눈썹 디자인을 제공하는 전문 브랜드입니다. 자연스럽고 정교한 시술로 고객 개개인의 아름다운 스타일을 완성해드립니다.

## ✨ 주요 기능

- 🎨 **모던한 뷰티 브랜드 디자인**: 부드러운 그라데이션과 감성적인 UI/UX
- 📱 **완전 반응형**: 모바일부터 데스크톱까지 모든 기기에서 최적화
- 🔐 **카카오 로그인**: Firebase Authentication과 연동된 간편 로그인
- 👥 **역할 기반 접근**: 관리자/일반 사용자 구분
- 🎯 **예약 시스템**: 카카오톡을 통한 간편한 예약 프로세스
- 💅 **브랜드 아이덴티티**: 네이쳐만의 고유한 색상과 디자인 시스템

## 🛠 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **스타일링**: Tailwind CSS
- **컴포넌트**: shadcn/ui
- **인증**: Firebase Authentication + Kakao OAuth
- **아이콘**: Lucide React
- **폼**: React Hook Form
- **유틸리티**: classnames
- **폰트**: Inter (Google Fonts)
- **언어**: TypeScript

## 🚀 시작하기

### 사전 요구사항

- Node.js 18.17 이상
- npm, yarn, 또는 pnpm
- Firebase 프로젝트 (Authentication 활성화)
- 카카오 개발자 계정

### 설치 및 실행

1. **저장소 클론**

```bash
git clone <repository-url>
cd nature-eyebrow-website
```

2. **의존성 설치**

```bash
npm install
```

3. **Firebase 설정**

   - [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
   - Authentication 활성화 및 카카오 제공업체 설정
   - Firebase 설정 정보 복사

4. **카카오 OAuth 설정**

   - [Kakao Developers](https://developers.kakao.com/)에서 앱 생성
   - OAuth 리디렉션 URI 설정
   - 클라이언트 ID 복사

5. **환경 변수 설정**

```bash
cp .env.example .env.local
```

`.env.local` 파일에 실제 값 입력:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Kakao OAuth Configuration
NEXT_PUBLIC_KAKAO_CLIENT_ID=your-kakao-client-id
```

6. **개발 서버 실행**

```bash
npm run dev
```

7. **브라우저에서 확인**
   - http://localhost:3000 접속

## 📱 페이지 구조

```
네이쳐 웹사이트/
├── / (홈페이지)
│   ├── 브랜드 소개
│   ├── 서비스 특징
│   └── 예약하기 CTA
├── /login (로그인)
│   ├── 카카오 로그인
│   └── 데모 로그인 (개발용)
├── /admin (관리자 대시보드)
│   ├── 사용자 관리
│   ├── 일정 관리
│   └── 시스템 설정
└── /user (사용자 대시보드)
    ├── 예약 관리
    ├── 프로필 설정
    └── 예약 내역
```

## 🎨 디자인 시스템

### 색상 팔레트

- **Primary**: Rose/Pink 계열 (rose-500, pink-500)
- **Secondary**: Amber 계열 (amber-400)
- **Background**: 부드러운 그라데이션 (pink-50 to rose-50)
- **Accent**: 카카오 옐로우 (yellow-400)

### 타이포그래피

- **메인 폰트**: Inter (Google Fonts)
- **브랜드 텍스트**: 그라데이션 효과
- **버튼**: 둥근 모서리 (rounded-full)

### 컴포넌트

- **카드**: 반투명 배경 (bg-white/60, backdrop-blur-sm)
- **버튼**: 그림자 효과 및 호버 애니메이션
- **아이콘**: Lucide React (Sparkles, Heart, Star 등)

## 🔐 인증 플로우

1. **홈페이지**: 비로그인 사용자에게 브랜드 소개 및 예약 CTA 표시
2. **로그인 페이지**: 카카오 OAuth 또는 데모 로그인
3. **역할별 리디렉션**:
   - `admin@naturesemi.com` → `/admin` (관리자 대시보드)
   - 기타 사용자 → `/user` (사용자 대시보드)

## 📋 사용 가능한 스크립트

- `npm run dev` - 개발 서버 시작
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 시작
- `npm run lint` - ESLint 실행

## 🧩 shadcn/ui 컴포넌트 추가

새로운 shadcn/ui 컴포넌트 추가:

```bash
npx shadcn@latest add [component-name]
```

예시:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add calendar
```

## 🛡 보안 고려사항

- 환경 변수 파일 (.env.local) 절대 커밋 금지
- Firebase 보안 규칙 적용
- 사용자 입력 검증 및 sanitization
- HTTPS 사용 권장

## 🚀 배포

### Vercel (권장)

1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 자동 배포 설정

### 기타 플랫폼

- Netlify
- AWS Amplify
- Firebase Hosting

## 📞 문의 및 지원

- **브랜드**: 네이쳐 👩🏻‍🔬
- **서비스**: 눈썹 시술 전문
- **위치**: 서울시 용산구
- **연락처**: 010-0000-0000
- **Instagram**: @nature_eyebrow

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

_자연스럽고 정교한 눈썹 디자인으로 당신만의 아름다운 스타일을 완성하세요._ ✨
