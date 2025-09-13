<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 애니메이션을 위한 ref
const isVisible = ref(false)

onMounted(() => {
  // 페이지 로드 후 애니메이션 시작
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})

// 메인페이지로 이동
function goHome() {
  router.push('/')
}

// 기부하러 가기 (메인페이지의 카테고리 섹션으로)
function goToDonate() {
  router.push('/')
  // 필요시 스크롤 이동 로직 추가
}

// 통계 데이터 (실제 데이터로 교체 가능)
const stats = [
  { number: '1,247', label: '누적 기부자' },
  { number: '892,456', label: '총 기부금 (원)' },
  { number: '156', label: '진행중인 캠페인' },
  { number: '89', label: '완료된 프로젝트' }
]

// 핵심 가치
const values = [
  {
    icon: 'https://cdn-icons-png.flaticon.com/512/833/833472.png',
    title: '현황 공개',
    description: '모든 프로젝트의 진행 상황과 기부 현황을 누구나 확인할 수 있습니다'
  },
  {
    icon: 'https://cdn-icons-png.flaticon.com/512/1598/1598431.png',
    title: '지속가능성',
    description: '지속 가능한 변화를 만들어가는 프로젝트를 지원합니다'
  },
  {
    icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    title: '검증된 프로젝트',
    description: '관리자가 직접 검토한 프로젝트만 소개합니다'
  },
  {
    icon: 'https://cdn-icons-png.flaticon.com/512/921/921347.png',
    title: '접근성',
    description: '누구나 쉽고 간편하게 기부에 참여할 수 있습니다'
  }
]
</script>

<template>
  <div class="intro-page" :class="{ visible: isVisible }">
    <!-- 헤더 섹션 -->
    <header class="hero-section">
      <div class="hero-content">
        <div class="logo-section">
          <h1 class="logo">COTW</h1>
          <p class="logo-subtitle">Center of the World</p>
        </div>

        <div class="hero-text">
          <h2 class="hero-title">세상의 중심은 어디일까요?</h2>
          <p class="hero-description">
            힘들어 하는 사람의 손을 잡아주는 곳,<br>
            바로 그곳이 세상의 중심입니다.
          </p>
          <p class="hero-mission">
            COTW는 세상의 중심으로 나아가고자 합니다.<br>
            어려운 사람에게 도움을 줄 수 있는 기부 플랫폼입니다.
          </p>
        </div>

        <div class="hero-actions">
          <button class="cta-button primary" @click="goToDonate">
            기부하러 가기
          </button>
          <button class="cta-button secondary" @click="goHome">
            메인으로 돌아가기
          </button>
        </div>
      </div>

      <div class="hero-image">
        <div class="floating-hearts">
          <div class="heart"></div>
          <div class="heart"></div>
          <div class="heart"></div>
        </div>
        <img
          src="https://cdn-icons-png.flaticon.com/512/833/833472.png"
          alt="hands helping"
          class="main-icon"
        />
      </div>
    </header>

    <!-- 통계 섹션 -->
    <section class="stats-section">
      <div class="container">
        <h3 class="section-title">COTW와 함께한 변화</h3>
        <div class="stats-grid">
          <div
            v-for="(stat, index) in stats"
            :key="index"
            class="stat-item"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="stat-number">{{ stat.number }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 우리의 가치 섹션 -->
    <section class="values-section">
      <div class="container">
        <h3 class="section-title">우리의 가치</h3>
        <div class="values-grid">
          <div
            v-for="(value, index) in values"
            :key="index"
            class="value-item"
            :style="{ animationDelay: `${index * 0.15}s` }"
          >
            <div class="value-icon">
              <img :src="value.icon" :alt="value.title" />
            </div>
            <h4 class="value-title">{{ value.title }}</h4>
            <p class="value-description">{{ value.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 참여 방법 섹션 -->
    <section class="how-to-section">
      <div class="container">
        <h3 class="section-title">어떻게 참여하나요?</h3>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <h4>카테고리 선택</h4>
            <p>관심 있는 분야의 기부 프로젝트를 찾아보세요</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-number">2</div>
            <h4>프로젝트 확인</h4>
            <p>프로젝트 내용을 자세히 확인하세요</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-number">3</div>
            <h4>기부 참여</h4>
            <p>원하는 금액으로 기부에 참여하여 변화를 만들어보세요</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA 섹션 -->
    <section class="final-cta">
      <div class="container">
        <h3>지금 바로 시작해보세요</h3>
        <p>작은 기부가 큰 변화의 시작입니다</p>
        <button class="cta-button large" @click="goToDonate">
          기부 프로젝트 둘러보기
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.intro-page {
  min-height: 100vh;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s ease-out;
}

.intro-page.visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-section {
  background: linear-gradient(135deg, #00c851 0%, #00a844 100%);
  color: white;
  padding: 4rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80vh;
  position: relative;
  overflow: hidden;
}

.hero-content {
  flex: 1;
  max-width: 600px;
}

.logo-section {
  margin-bottom: 2rem;
}

.logo {
  font-size: 4rem;
  font-weight: 900;
  margin: 0;
  letter-spacing: -2px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.logo-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-top: -0.5rem;
  font-style: italic;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.3;
}

.hero-description {
  font-size: 1.3rem;
  margin-bottom: 2rem;
  line-height: 1.6;
  opacity: 0.95;
}

.hero-mission {
  font-size: 1.1rem;
  margin-bottom: 3rem;
  line-height: 1.7;
  opacity: 0.9;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.cta-button {
  padding: 1rem 2rem;
  border: none;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.cta-button.primary {
  background: white;
  color: #00c851;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.cta-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.cta-button.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
}

.cta-button.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.cta-button.large {
  background: #00c851;
  color: white;
  padding: 1.2rem 3rem;
  font-size: 1.3rem;
  box-shadow: 0 6px 20px rgba(0, 200, 81, 0.3);
}

.hero-image {
  flex: 0 0 300px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-icon {
  width: 200px;
  height: 200px;
  filter: brightness(0) invert(1);
  animation: float 3s ease-in-out infinite;
}

.floating-hearts {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.heart {
  position: absolute;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(-45deg);
  animation: float-heart 4s ease-in-out infinite;
}

.heart:before,
.heart:after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
}

.heart:before {
  top: -10px;
  left: 0;
}

.heart:after {
  top: 0;
  left: -10px;
}

.heart:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
.heart:nth-child(2) { top: 60%; right: 20%; animation-delay: 1s; }
.heart:nth-child(3) { top: 30%; right: 10%; animation-delay: 2s; }

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes float-heart {
  0%, 100% { transform: rotate(-45deg) translateY(0px); opacity: 0.3; }
  50% { transform: rotate(-45deg) translateY(-15px); opacity: 0.6; }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
  color: #333;
}

.stats-section {
  padding: 4rem 0;
  background: #f8f9fa;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat-item {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 900;
  color: #00c851;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
}

.values-section {
  padding: 4rem 0;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.value-item {
  text-align: center;
  padding: 2rem;
  background: #fcfcf6;
  border-radius: 15px;
  animation: slideUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
}

.value-icon {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.value-icon img {
  width: 40px;
  height: 40px;
}

.value-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #333;
}

.value-description {
  color: #666;
  line-height: 1.6;
}

.how-to-section {
  padding: 4rem 0;
  background: #f8f9fa;
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2rem;
}

.step {
  flex: 1;
  min-width: 250px;
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.step-number {
  width: 50px;
  height: 50px;
  background: #00c851;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 auto 1rem;
}

.step h4 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #333;
}

.step p {
  color: #666;
  line-height: 1.5;
}

.step-arrow {
  font-size: 2rem;
  color: #00c851;
  font-weight: bold;
}

.final-cta {
  background: linear-gradient(135deg, #00c851 0%, #00a844 100%);
  color: white;
  padding: 4rem 0;
  text-align: center;
}

.final-cta h3 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.final-cta p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1rem;
  }

  .hero-image {
    flex: none;
    margin-top: 2rem;
  }

  .main-icon {
    width: 150px;
    height: 150px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .logo {
    font-size: 3rem;
  }

  .steps {
    flex-direction: column;
  }

  .step-arrow {
    transform: rotate(90deg);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .values-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .hero-actions {
    flex-direction: column;
  }

  .cta-button {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
