<template>
  <view class="page">
    <!-- Subtle starfield -->
    <view class="star-particles">
      <view v-for="i in 6" :key="i" class="star-dot" :class="'s' + i"></view>
    </view>

    <view v-if="!hasResult" class="empty-state anim-fadeInUp">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无推荐结果</text>
      <text class="empty-hint">去首页试试吧</text>
      <view class="empty-btn glass" @tap="goHome"><text class="empty-btn-text">前往首页</text></view>
    </view>

    <template v-else>
      <view class="header anim-fadeInUp">
        <text class="main-title">✦ 你的本命角色 ✦</text>
        <text class="sub-title">{{ matchTime }}</text>
      </view>

      <view
        v-for="(role, index) in roles"
        :key="index"
        class="role-card glass anim-fadeInUp"
        :class="'anim-d' + (index + 1)"
        @tap="goDetail(role)"
      >
        <!-- Rank Badge -->
        <view class="rank-badge" :class="'rank-' + (index + 1)">
          <text v-if="index === 0" class="rank-icon">👑</text>
          <text v-else-if="index === 1" class="rank-icon">💎</text>
          <text v-else class="rank-icon">⭐</text>
        </view>

        <view class="role-body">
          <!-- Left: info -->
          <view class="role-info">
            <text class="role-name" :class="'name-' + (temperamentColor || 'cute')">{{ role.name }}</text>
            <text class="role-anime">出自《{{ role.anime }}》</text>

            <!-- Reason with gradient left bar -->
            <view class="reason-box">
              <view class="reason-bar" :class="'bar-' + (temperamentColor || 'cute')"></view>
              <text class="role-reason">{{ role.reason }}</text>
            </view>

            <view class="role-bottom">
              <text class="difficulty-tag" :class="'diff-' + diffClass(role.difficulty)">
                {{ diffIcon(role.difficulty) }} {{ role.difficulty }}
              </text>
            </view>
          </view>

          <!-- Right: SVG ring progress -->
          <view class="score-ring-wrap">
            <svg class="score-svg" viewBox="0 0 120 120" width="120" height="120">
              <circle
                cx="60" cy="60" r="48"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                stroke-width="6"
              />
              <circle
                cx="60" cy="60" r="48"
                fill="none"
                :stroke="'url(#g' + index + ')'"
                stroke-width="6"
                stroke-linecap="round"
                :stroke-dasharray="2 * Math.PI * 48"
                :stroke-dashoffset="2 * Math.PI * 48 * (1 - role.matchScore / 100)"
                transform="rotate(-90, 60, 60)"
                class="score-fill"
              />
              <defs>
                <linearGradient :id="'g' + index" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" :stop-color="matchGradient(role.matchScore).from" />
                  <stop offset="100%" :stop-color="matchGradient(role.matchScore).to" />
                </linearGradient>
              </defs>
            </svg>
            <view class="score-inner">
              <text class="score-num">{{ role.matchScore }}</text>
              <text class="score-unit">%</text>
              <text class="score-label">匹配度</text>
            </view>
          </view>
        </view>
      </view>

      <view class="bottom-actions anim-fadeInUp anim-d4">
        <view class="btn btn-primary" @tap="goBack">
          <text class="btn-text-primary">重新匹配</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface RoleItem { name: string; anime: string; reason: string; difficulty: string; matchScore: number }
const roles = ref<RoleItem[]>([])
const hasResult = ref(false)
const temperamentColor = ref('cute')

const matchTime = computed(() => {
  const now = new Date(); const pad = (n: number) => String(n).padStart(2, '0')
  return `匹配时间 ${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
})

const diffClass = (level: string): string => { if (level === '简单') return 'easy'; if (level === '困难') return 'hard'; return 'medium' }
const diffIcon = (level: string): string => { if (level === '简单') return '✅'; if (level === '困难') return '🔥'; return '⚡' }

const matchGradient = (score: number) => {
  if (score >= 90) return { from: '#b44dff', to: '#00e5ff' }
  if (score >= 80) return { from: '#b44dff', to: '#C4A87C' }
  return { from: '#7c3aed', to: '#7B9EBD' }
}

const goHome = () => uni.navigateBack()
const goBack = () => uni.navigateBack()
const goDetail = (role?: RoleItem) => { if (!role) return; uni.setStorageSync('cosplan_selected_role', role); uni.navigateTo({ url: '/pages/detail/index' }) }

onMounted(() => {
  try {
    const result = uni.getStorageSync('cosplan_result')
    if (result?.data?.roles?.length > 0) { roles.value = result.data.roles.slice(0, 3); hasResult.value = true }
    else if (result?.roles?.length > 0) { roles.value = result.roles.slice(0, 3); hasResult.value = true }
    if (result?.input?.temperament) {
      const m: Record<string, string> = { '可爱': 'cute', '酷飒': 'cool', '温柔': 'gentle', '高冷': 'cold' }
      temperamentColor.value = m[result.input.temperament] || 'cute'
    }
  } catch { hasResult.value = false }
})
</script>

<style lang="scss" scoped>
/* ========================================
   RESULT - Deep Professional Dark Theme
   ======================================== */

.page {
  min-height: 100vh;
  background: #1B1725;
  padding: 56rpx 30rpx 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}

/* ---- Star particles ---- */
.star-particles {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none; z-index: 0;
}
.star-dot {
  position: absolute;
  width: 4rpx; height: 4rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  animation: floatUp 6s ease-in-out infinite;
}
.s1 { left: 10%; animation-delay: 0s; animation-duration: 5.5s; }
.s2 { left: 30%; animation-delay: 0.8s; animation-duration: 6.5s; }
.s3 { left: 50%; animation-delay: 1.6s; animation-duration: 4.8s; }
.s4 { left: 65%; animation-delay: 2.2s; animation-duration: 7s; }
.s5 { left: 78%; animation-delay: 0.4s; animation-duration: 5.2s; }
.s6 { left: 90%; animation-delay: 1.2s; animation-duration: 5.8s; }

@keyframes floatUp {
  0%   { bottom: -10rpx; opacity: 0; }
  15%  { opacity: 0.25; }
  85%  { opacity: 0.25; }
  100% { bottom: 110%; opacity: 0; }
}

/* ---- Animation ---- */
.anim-fadeInUp { animation: fadeInUp 0.45s cubic-bezier(0.4, 0, 0.2, 1) both; }
.anim-d1 { animation-delay: 0s; }
.anim-d2 { animation-delay: 0.08s; }
.anim-d3 { animation-delay: 0.16s; }
.anim-d4 { animation-delay: 0.24s; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---- Empty state ---- */
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; position: relative; z-index: 2; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 34rpx; color: rgba(255,255,255,0.9); font-weight: bold; margin-bottom: 12rpx; }
.empty-hint { font-size: 24rpx; color: rgba(255,255,255,0.35); margin-bottom: 40rpx; }
.empty-btn { padding: 20rpx 60rpx; border-radius: 40rpx; }
.empty-btn-text { font-size: 28rpx; color: #b44dff; }

/* ---- Glass card ---- */
.glass {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24rpx;
}

/* ---- Header ---- */
.header { display: flex; flex-direction: column; align-items: center; margin-bottom: 30rpx; position: relative; z-index: 2; }
.main-title { font-size: 38rpx; font-weight: bold; color: rgba(255,255,255,0.95); margin-bottom: 6rpx; }
.sub-title { font-size: 22rpx; color: rgba(255,255,255,0.35); }

/* ---- Role Card ---- */
.role-card {
  width: 100%;
  margin-bottom: 20rpx;
  padding: 0;
  overflow: visible;
  position: relative;
  z-index: 2;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.role-card:active { transform: scale(0.98); }

/* Rank Badge */
.rank-badge {
  position: absolute;
  top: -14rpx; left: -8rpx;
  width: 60rpx; height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  animation: ringPulse 2s ease-in-out infinite;
}
.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffb800);
  box-shadow: 0 0 20rpx rgba(255,215,0,0.5), 0 0 40rpx rgba(255,215,0,0.2);
}
.rank-2 {
  background: linear-gradient(135deg, #e0e0e0, #b0b0b0);
  box-shadow: 0 0 18rpx rgba(192,192,192,0.4), 0 0 30rpx rgba(192,192,192,0.15);
}
.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #b8631f);
  box-shadow: 0 0 18rpx rgba(205,127,50,0.4), 0 0 30rpx rgba(205,127,50,0.15);
}
.rank-icon { font-size: 28rpx; }
@keyframes ringPulse {
  0%, 100% { box-shadow: 0 0 15rpx currentColor; }
  50%      { box-shadow: 0 0 30rpx currentColor, 0 0 45rpx currentColor; }
}

/* Role body */
.role-body {
  display: flex;
  padding: 34rpx 22rpx 22rpx;
  gap: 18rpx;
}
.role-info { flex: 1; min-width: 0; }

/* Name gradient by temperament */
.role-name {
  font-size: 32rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 4rpx;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
}
.name-cute { background-image: linear-gradient(135deg, #C49B9B, #E8B8B8); }
.name-cool { background-image: linear-gradient(135deg, #7B9EBD, #A8C8E0); }
.name-gentle { background-image: linear-gradient(135deg, #C4A87C, #E0C898); }
.name-cold { background-image: linear-gradient(135deg, #9B8EC4, #B8A8E0); }

.role-anime {
  font-size: 22rpx;
  color: rgba(255,255,255,0.35);
  display: block;
  margin-bottom: 14rpx;
}

/* Reason with gradient left bar */
.reason-box {
  display: flex;
  margin-bottom: 14rpx;
}
.reason-bar {
  width: 4rpx;
  border-radius: 2rpx;
  margin-right: 12rpx;
  flex-shrink: 0;
}
.bar-cute { background: linear-gradient(to bottom, #C49B9B, #E8B8B8); }
.bar-cool { background: linear-gradient(to bottom, #7B9EBD, #A8C8E0); }
.bar-gentle { background: linear-gradient(to bottom, #C4A87C, #E0C898); }
.bar-cold { background: linear-gradient(to bottom, #9B8EC4, #B8A8E0); }

.role-reason {
  font-size: 26rpx;
  color: rgba(255,255,255,0.65);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  flex: 1;
}

/* Difficulty tag */
.role-bottom { display: flex; align-items: center; }
.difficulty-tag {
  font-size: 22rpx;
  padding: 5rpx 20rpx;
  border-radius: 18rpx;
  font-weight: bold;
}
.diff-easy {
  background: rgba(140,175,158,0.12);
  color: #8CAF9E;
  border: 1px solid rgba(140,175,158,0.25);
}
.diff-medium {
  background: rgba(196,168,124,0.12);
  color: #C4A87C;
  border: 1px solid rgba(196,168,124,0.25);
}
.diff-hard {
  background: rgba(196,155,155,0.12);
  color: #C49B9B;
  border: 1px solid rgba(196,155,155,0.25);
}

/* ---- Score Ring ---- */
.score-ring-wrap {
  width: 120rpx;
  height: 120rpx;
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.score-svg {
  position: absolute;
  top: 0; left: 0;
}
.score-fill {
  transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.score-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.score-num {
  font-size: 28rpx;
  font-weight: bold;
  color: rgba(255,255,255,0.95);
  line-height: 1;
}
.score-unit { font-size: 16rpx; color: rgba(255,255,255,0.4); }
.score-label { font-size: 16rpx; color: rgba(255,255,255,0.25); margin-top: 2rpx; }

/* ---- Bottom Actions ---- */
.bottom-actions {
  width: 100%;
  display: flex;
  gap: 20rpx;
  margin-top: 16rpx;
  padding-bottom: 40rpx;
  position: relative;
  z-index: 2;
}
.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn:active { transform: scale(0.96); }
.btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.12); }
.btn-text-outline { font-size: 28rpx; color: rgba(255,255,255,0.8); font-weight: bold; }
.btn-primary {
  background: linear-gradient(135deg, #b44dff, #7c3aed);
  box-shadow: 0 0 24rpx rgba(180,77,255,0.35);
}
.btn-text-primary { font-size: 28rpx; color: #fff; font-weight: bold; }
</style>