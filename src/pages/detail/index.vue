<template>
  <view class="page">
    <view v-if="!hasData" class="empty-state anim-fadeInUp">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无角色数据</text>
      <view class="empty-btn glass" @tap="goBack"><text class="empty-btn-text">返回</text></view>
    </view>

    <template v-else>
      <view class="section anim-fadeInUp">
        <text class="refresh-btn" @tap="handleRefresh">🔄</text>
        <text class="role-name" :class="'name-' + temperamentColor">{{ role.name }}</text>
        <text class="role-anime">《{{ role.anime }}》</text>

        <view class="portrait-card glass">
          <view class="portrait-placeholder" :class="'portrait-bg-' + temperamentColor">
            <text class="portrait-name">{{ role.name }}</text>
            <text class="portrait-hint">角色形象图</text>
          </view>
        </view>

        <view class="bio-card glass">
          <view class="bio-item"><text class="bio-emoji">📖</text><text class="bio-text">{{ bioOrigin }}</text></view>
          <view class="bio-item"><text class="bio-emoji">🎨</text><text class="bio-text">{{ bioAppearance }}</text></view>
          <view class="bio-item"><text class="bio-emoji">💬</text><text class="bio-text">{{ bioPersonality }}</text></view>
          <view class="bio-item"><text class="bio-emoji">✨</text><text class="bio-text">{{ bioHighlight }}</text></view>
          <view class="bio-item"><text class="bio-emoji">🔥</text><text class="bio-text">{{ bioPopularity }}</text></view>
          <view class="bio-item"><text class="bio-emoji">💡</text><text class="bio-text">{{ bioVibe }}</text></view>
        </view>

        <view class="tags-row">
          <text class="tag" :class="'tag-' + popularityClass">{{ popularityLabel }}</text>
          <text class="tag" :class="'tag-' + reachClass">{{ reachLabel }}</text>
          <text class="difficulty-tag-inline" :class="'diff-' + diffClass(role.difficulty)">
            {{ diffIcon(role.difficulty) }} {{ role.difficulty }}
          </text>
        </view>
      </view>

      <view class="section anim-fadeInUp anim-d1">
        <text class="section-title">✦ 匹配分析 ✦</text>

        <view class="match-ring-wrap glass">
          <svg viewBox="0 0 160 160" width="160" height="160">
            <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="7" />
            <circle
              cx="80" cy="80" r="64"
              fill="none"
              stroke="url(#matchGrad)"
              stroke-width="7"
              stroke-linecap="round"
              :stroke-dasharray="circleLen"
              :stroke-dashoffset="circleOffset"
              transform="rotate(-90, 80, 80)"
              class="match-fill"
            />
            <defs>
              <linearGradient id="matchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#b44dff" />
                <stop offset="100%" stop-color="#00e5ff" />
              </linearGradient>
            </defs>
          </svg>
          <view class="match-inner">
            <text class="match-num">{{ role.matchScore }}</text>
            <text class="match-unit">%</text>
            <text class="match-label">综合匹配度</text>
          </view>
        </view>

        <view class="match-card glass">
          <view class="match-item"><text class="match-emoji">📏</text><text class="match-text">{{ bodyMatch }}</text></view>
          <view class="match-item"><text class="match-emoji">🎭</text><text class="match-text">{{ temperamentMatch }}</text></view>
          <view class="match-item"><text class="match-emoji">🔧</text><text class="match-text">{{ difficultyMatch }}</text></view>
          <view class="match-item"><text class="match-emoji">💬</text><text class="match-text">{{ summaryMatch }}</text></view>
        </view>
      </view>
      <view class="cosplay-ref-section anim-fadeInUp anim-d2">
        <text class="section-title">👥 同角色 Coser 参考</text>
        <view v-if="!reference" class="btn-ref" @tap="fetchReference"><text>✨ 生成参考</text></view>
        <view v-else class="ref-content">
          <view class="ref-block"><text class="ref-block-title">常见特点</text><text v-for="t in reference.commonTraits || []" :key="t" class="ref-text">• {{ t }}</text></view>
          <view class="ref-block"><text class="ref-block-title">普遍做法</text><text v-for="p in reference.commonPractices || []" :key="p" class="ref-text">• {{ p }}</text></view>
          <view class="ref-block"><text class="ref-block-title">给你的建议</text><text v-for="s in reference.suggestions || []" :key="s" class="ref-text">💡 {{ s }}</text></view>
          <view class="btn-ref" style="margin-top:12rpx" @tap="fetchReference"><text>🔄 刷新</text></view>
        </view>
      </view>

      <view class="bottom-actions anim-fadeInUp anim-d2">
        <view class="btn-fav" @tap="handleFavorite">
          <text class="fav-icon" :class="{ 'fav-active': isFav }">{{ isFav ? '❤️' : '🤍' }}</text>
          <text class="fav-text" :class="{ 'fav-active': isFav }">{{ isFav ? '已收藏' : '收藏' }}</text>
        </view>
        <view class="btn-project" @tap="handleCreateProject">
          <text class="btn-project-text">为此角色创建企划</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { isFavorite, toggleFavorite, getCachedRoleDetail, setCachedRoleDetail } from '../../utils/storage'
import { getRoleDetail } from '../../utils/api'
import { getCoserReference } from '../../utils/api'

interface RoleItem { name: string; anime: string; reason: string; difficulty: string; matchScore: number }
interface InputData { height: number; weight: number; temperament: string }

const role = ref<RoleItem>({ name: '', anime: '', reason: '', difficulty: '', matchScore: 0 })
const hasData = ref(false)
const isFav = ref(false)
const temperamentColor = ref('cute')
const temperamentLabel = ref('可爱')
const inputData = ref<InputData>({ height: 160, weight: 50, temperament: '可爱' })
const apiLoading = ref(false)

const diffClass = (level: string): string => { if (level === '简单') return 'easy'; if (level === '困难') return 'hard'; return 'medium' }
const diffIcon = (level: string): string => { if (level === '简单') return '✅'; if (level === '困难') return '🔥'; return '⚡' }

// SVG circle math
const CIRCLE_R = 64
const circleLen = 2 * Math.PI * CIRCLE_R
const circleOffset = computed(() => circleLen * (1 - role.value.matchScore / 100))

// API-driven content with fallback placeholders
const PLACEHOLDER = '加载中...'

const bioOrigin = ref(PLACEHOLDER)
const bioAppearance = ref(PLACEHOLDER)
const bioPersonality = ref(PLACEHOLDER)
const bioHighlight = ref(PLACEHOLDER)
const bioPopularity = ref(PLACEHOLDER)
const bioVibe = ref(PLACEHOLDER)
const bodyMatch = ref(PLACEHOLDER)
const temperamentMatch = ref(PLACEHOLDER)
const difficultyMatch = ref(PLACEHOLDER)
const summaryMatch = ref(PLACEHOLDER)

const popularityClass = computed(() => role.value.matchScore >= 90 ? 'hot' : 'warm')
const popularityLabel = computed(() => role.value.matchScore >= 90 ? '烫门' : '温门')
const reachClass = computed(() => role.value.matchScore >= 90 ? 'cross' : 'circle')
const reachLabel = computed(() => role.value.matchScore >= 90 ? '跨圈知名' : '圈内知名')

const goBack = () => uni.navigateBack()

const handleFavorite = () => {
  toggleFavorite(role.value)
  isFav.value = isFavorite(role.value.name)
  uni.showToast({ title: isFav.value ? '已收藏' : '已取消收藏', icon: 'none' })
}

const handleCreateProject = () => {
  uni.navigateTo({ url: '/pages/project/detail?roleName=' + encodeURIComponent(role.value.name) + '&new=1' })
}

const applyDetailData = (result: any) => {
  if (result?.portrait) {
    bioOrigin.value = result.portrait.origin || PLACEHOLDER
    bioAppearance.value = result.portrait.feature || PLACEHOLDER
    bioPersonality.value = result.portrait.personality || PLACEHOLDER
    bioHighlight.value = result.portrait.highlight || PLACEHOLDER
    bioPopularity.value = result.portrait.heat || PLACEHOLDER
    bioVibe.value = result.portrait.vibe || PLACEHOLDER
  }
  if (result?.match) {
    bodyMatch.value = result.match.body || PLACEHOLDER
    temperamentMatch.value = result.match.temperament || PLACEHOLDER
    difficultyMatch.value = result.match.difficulty || PLACEHOLDER
    summaryMatch.value = result.match.suggestion || PLACEHOLDER
  }
}

const fetchRoleDetail = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const cached = getCachedRoleDetail(role.value.name)
    if (cached) {
      applyDetailData(cached.data)
      return
    }
  }
  apiLoading.value = true
  try {
    const result = await getRoleDetail({
      roleName: role.value.name,
      anime: role.value.anime,
      userInput: inputData.value,
    })
    if (result) {
      applyDetailData(result)
      setCachedRoleDetail(role.value.name, { portrait: result.portrait, match: result.match })
    }
  } catch {
    // leave placeholders
  } finally {
    apiLoading.value = false
  }
}

const handleRefresh = () => {
  fetchRoleDetail(true)
  uni.showToast({ title: '已刷新角色信息', icon: 'none' })
}
const reference = ref<any>(null)
const fetchReference = async () => {
  try { const res = await getCoserReference(role.value.name); reference.value = res }
  catch { uni.showToast({ title: '获取失败', icon: 'none' }) }
}

onMounted(() => {
  try {
    const data = uni.getStorageSync('cosplan_selected_role')
    if (data?.name) {
      role.value = data; hasData.value = true; isFav.value = isFavorite(data.name)
      const result = uni.getStorageSync('cosplan_result')
      if (result?.input) {
        inputData.value = { height: result.input.height || 160, weight: result.input.weight || 50, temperament: result.input.temperament || '可爱' }
        const m: Record<string, string> = { '可爱': 'cute', '酷飒': 'cool', '温柔': 'gentle', '高冷': 'cold' }
        temperamentColor.value = m[result.input.temperament] || 'cute'
        temperamentLabel.value = result.input.temperament || '可爱'
      }
      fetchRoleDetail()
    }
  } catch { hasData.value = false }
})
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #1B1725; padding: 40rpx 30rpx 100rpx; display: flex; flex-direction: column; align-items: center; }
.anim-fadeInUp { animation: fadeInUp 0.45s cubic-bezier(0.4, 0, 0.2, 1) both; }
.anim-d1 { animation-delay: 0.1s; }
.anim-d2 { animation-delay: 0.2s; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 34rpx; color: rgba(255,255,255,0.9); font-weight: bold; margin-bottom: 32rpx; }
.empty-btn { padding: 20rpx 60rpx; border-radius: 40rpx; }
.empty-btn-text { font-size: 28rpx; color: #b44dff; }
.glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24rpx; }
.section { width: 100%; margin-bottom: 28rpx; position: relative; }
.refresh-btn { position: absolute; top: 0; right: 0; font-size: 26rpx; padding: 6rpx 10rpx; color: rgba(255,255,255,0.25); z-index: 3; }
.role-name { font-size: 44rpx; font-weight: bold; display: block; text-align: center; margin-bottom: 6rpx; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; }
.name-cute { background-image: linear-gradient(135deg, #C49B9B, #E8B8B8); }
.name-cool { background-image: linear-gradient(135deg, #7B9EBD, #A8C8E0); }
.name-gentle { background-image: linear-gradient(135deg, #C4A87C, #E0C898); }
.name-cold { background-image: linear-gradient(135deg, #9B8EC4, #B8A8E0); }
.role-anime { font-size: 24rpx; color: rgba(255,255,255,0.4); text-align: center; display: block; margin-bottom: 24rpx; }
.portrait-card { width: 100%; height: 400rpx; margin-bottom: 16rpx; overflow: hidden; border: 2rpx solid rgba(180,77,255,0.25); }
.portrait-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.portrait-bg-cute { background: linear-gradient(135deg, rgba(196,155,155,0.3), rgba(196,155,155,0.08)); }
.portrait-bg-cool { background: linear-gradient(135deg, rgba(123,158,189,0.3), rgba(123,158,189,0.08)); }
.portrait-bg-gentle { background: linear-gradient(135deg, rgba(196,168,124,0.3), rgba(196,168,124,0.08)); }
.portrait-bg-cold { background: linear-gradient(135deg, rgba(155,142,196,0.3), rgba(155,142,196,0.08)); }
.portrait-name { font-size: 36rpx; font-weight: bold; color: rgba(255,255,255,0.3); margin-bottom: 8rpx; }
.portrait-hint { font-size: 22rpx; color: rgba(255,255,255,0.15); }
.bio-card { width: 100%; padding: 24rpx 28rpx; margin-bottom: 16rpx; }
.bio-item { display: flex; align-items: baseline; padding: 7rpx 0; }
.bio-emoji { font-size: 28rpx; margin-right: 14rpx; flex-shrink: 0; line-height: 1.6; }
.bio-text { font-size: 25rpx; color: rgba(255,255,255,0.72); line-height: 1.65; flex: 1; }
.match-card { width: 100%; padding: 24rpx 28rpx; }
.match-item { display: flex; align-items: baseline; padding: 7rpx 0; }
.match-emoji { font-size: 28rpx; margin-right: 14rpx; flex-shrink: 0; line-height: 1.6; }
.match-text { font-size: 25rpx; color: rgba(255,255,255,0.72); line-height: 1.65; flex: 1; }
.tags-row { display: flex; gap: 14rpx; flex-wrap: wrap; }
.tag { font-size: 22rpx; padding: 8rpx 22rpx; border-radius: 18rpx; font-weight: bold; }
.tag-hot { background: rgba(196,155,155,0.15); color: #C49B9B; border: 1px solid rgba(196,155,155,0.25); }
.tag-warm { background: rgba(196,168,124,0.12); color: #C4A87C; border: 1px solid rgba(196,168,124,0.25); }
.tag-cold { background: rgba(123,158,189,0.12); color: #7B9EBD; border: 1px solid rgba(123,158,189,0.25); }
.tag-circle { background: rgba(140,175,158,0.12); color: #8CAF9E; border: 1px solid rgba(140,175,158,0.25); }
.tag-cross { background: rgba(155,142,196,0.12); color: #9B8EC4; border: 1px solid rgba(155,142,196,0.25); }
.tag-hidden { background: rgba(142,158,158,0.12); color: #8E9E9E; border: 1px solid rgba(142,158,158,0.25); }
.difficulty-tag-inline { font-size: 22rpx; padding: 8rpx 22rpx; border-radius: 18rpx; font-weight: bold; }
.diff-easy { background: rgba(140,175,158,0.12); color: #8CAF9E; border: 1px solid rgba(140,175,158,0.25); }
.diff-medium { background: rgba(196,168,124,0.12); color: #C4A87C; border: 1px solid rgba(196,168,124,0.25); }
.diff-hard { background: rgba(196,155,155,0.12); color: #C49B9B; border: 1px solid rgba(196,155,155,0.25); }
.section-title { font-size: 28rpx; color: rgba(255,255,255,0.8); text-align: center; display: block; margin-bottom: 20rpx; font-weight: bold; }
.match-ring-wrap { width: 160px; height: 160px; margin: 0 auto 20rpx; position: relative; display: flex; align-items: center; justify-content: center; }
.match-fill { transition: stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1); }
.match-inner { position: absolute; display: flex; flex-direction: column; align-items: center; }
.match-num { font-size: 44rpx; font-weight: bold; color: rgba(255,255,255,0.95); line-height: 1; }
.match-unit { font-size: 20rpx; color: rgba(255,255,255,0.4); }
.match-label { font-size: 18rpx; color: rgba(255,255,255,0.25); margin-top: 4rpx; }
.bottom-actions { width: 100%; display: flex; gap: 20rpx; margin-top: 10rpx; padding-bottom: 40rpx; }
.btn-fav { width: 140rpx; height: 88rpx; border-radius: 44rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.btn-fav:active { transform: scale(0.96); }
.fav-icon { font-size: 30rpx; }
.fav-active .fav-icon { animation: bubblePop 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes bubblePop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
.fav-text { font-size: 18rpx; color: rgba(255,255,255,0.4); margin-top: 2rpx; }
.btn-project { flex: 1; height: 88rpx; border-radius: 50rpx; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #b44dff, #7c3aed); box-shadow: 0 0 24rpx rgba(180,77,255,0.35); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.btn-project:active { transform: scale(0.96); }
.btn-project-text { font-size: 28rpx; color: #fff; font-weight: bold; }
.cosplay-ref-section { margin-bottom: 20rpx; width: 100%; }
.cosplay-ref-section .section-title { font-size: 28rpx; color: rgba(255,255,255,0.8); text-align: center; display: block; margin-bottom: 16rpx; font-weight: bold; }
.btn-ref { padding: 16rpx 0; text-align: center; font-size: 24rpx; color: #b44dff; border: 1px solid rgba(180,77,255,0.25); border-radius: 20rpx; }
.ref-content { }
.ref-block { margin-bottom: 12rpx; }
.ref-block-title { font-size: 24rpx; color: rgba(255,255,255,0.7); font-weight: bold; display: block; margin-bottom: 6rpx; }
.ref-text { font-size: 22rpx; color: rgba(255,255,255,0.6); display: block; line-height: 1.6; padding-left: 10rpx; }
.ref-text.highlight { color: #b44dff; }
</style>
