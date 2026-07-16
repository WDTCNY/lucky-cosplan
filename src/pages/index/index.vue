<template>
  <view class="page">
    <!-- Subtle star particles -->
    <view class="star-particles">
      <view v-for="i in 8" :key="i" class="star-dot" :class="'s' + i"></view>
    </view>
    <!-- Search bar -->
    <view class="search-bar glass">
      <text class="search-icon">🔍</text>
      <input class="search-input" v-model="searchQuery" placeholder="搜索角色名 / 漫展 / 物料..." @input="onSearchInput" @confirm="doSearch" />
      <text v-if="searchQuery" class="search-clear" @tap="searchQuery = ''; suggestions = []; showHistory = false">✕</text>
    </view>
    <view v-if="showSuggestions && suggestions.length > 0" class="suggestions-dropdown glass">
      <view v-for="s in suggestions" :key="s" class="suggestion-item" @tap="selectSuggestion(s)"><text>{{ s }}</text></view>
    </view>
    <view v-if="showHistory && searchHistory.length > 0 && !searchQuery" class="suggestions-dropdown glass">
      <view class="suggestions-header"><text style="color:#999;font-size:20rpx">最近搜索</text><text style="color:#667eea;font-size:20rpx" @tap="clearHistory">清空</text></view>
      <view v-for="(h, i) in searchHistory" :key="i" class="suggestion-item" @tap="selectSuggestion(h)"><text>{{ h }}</text></view>
    </view>

    <!-- Title -->
    <view class="header anim-fadeInUp">
      <text class="main-title">COSPLAN</text>
      <text class="sub-title">AI 智能角色推荐</text>
    </view>

    <!-- Photo Upload -->
    <view class="upload-card glass anim-fadeInUp anim-d1" @tap="handleChooseImage">
      <template v-if="!photoUrl">
        <view class="upload-ring">
          <view class="ring-spin"></view>
          <text class="upload-icon">📷</text>
        </view>
        <text class="upload-text">点击上传照片</text>
        <text class="upload-hint">支持正面清晰照</text>
      </template>
      <image v-else class="preview-image" :src="photoUrl" mode="aspectFill" />
    </view>

    <!-- Form -->
    <view class="form-card glass anim-fadeInUp anim-d2">
      <view class="form-row">
        <text class="form-label">身高</text>
        <input
          class="form-input"
          type="digit"
          v-model="formData.height"
          placeholder="输入身高"
          placeholder-style="color: rgba(255,255,255,0.2)"
          @blur="validateHeight"
        />
        <text class="form-unit">cm</text>
      </view>
      <view class="form-row">
        <text class="form-label">体重</text>
        <input
          class="form-input"
          type="digit"
          v-model="formData.weight"
          placeholder="输入体重"
          placeholder-style="color: rgba(255,255,255,0.2)"
          @blur="validateWeight"
        />
        <text class="form-unit">kg</text>
      </view>
      <view class="form-row form-row--column">
        <text class="form-label">气质</text>
        <view class="temperament-grid">
          <view
            v-for="item in temperaments"
            :key="item.value"
            class="tm-card"
            :class="[
              'tm-' + item.value,
              { 'tm-active': formData.temperament === item.value }
            ]"
            @tap="formData.temperament = item.value"
          >
            <text class="tm-emoji">{{ item.emoji }}</text>
            <text class="tm-label">{{ item.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Submit -->
    <view class="submit-wrap anim-fadeInUp anim-d3">
      <view
        class="submit-btn"
        :class="{ 'submit-btn--disabled': !canSubmit || loading }"
        @tap="handleMatch"
      >
        <view v-if="loading" class="magic-circle-overlay"></view>
        <text class="submit-text">{{ loading ? 'AI正在分析...' : '✦  开始匹配角色  ✦' }}</text>
      </view>
    </view>

    <text class="skip-link anim-fadeInUp anim-d4" @tap="handleSkipAndViewMock">跳过匹配，查看示例结果</text>
    <text class="tip-text anim-fadeInUp anim-d4">提示：照片越清晰，推荐越精准</text>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getRoleRecommend } from '../../utils/api'
import { getSearchSuggestions } from '../../utils/api'
import { saveHistory } from '../../utils/storage'

const photoUrl = ref('')
const photoBase64 = ref('')
const loading = ref(false)

interface FormData { height: string; weight: string; temperament: string }
const formData = reactive<FormData>({ height: '', weight: '', temperament: '' })
const temperaments = [
  { label: '可爱', emoji: '🌸', value: 'cute' },
  { label: '酷飒', emoji: '🖤', value: 'cool' },
  { label: '温柔', emoji: '🌼', value: 'gentle' },
  { label: '高冷', emoji: '❄️', value: 'cold' },
]

const isHeightValid = (val: string): boolean => { const num = parseFloat(val); return !isNaN(num) && num >= 100 && num <= 250 }
const isWeightValid = (val: string): boolean => { const num = parseFloat(val); return !isNaN(num) && num >= 20 && num <= 200 }
const canSubmit = computed(() => photoUrl.value !== '' && isHeightValid(formData.height) && isWeightValid(formData.weight) && formData.temperament !== '')

const validateHeight = () => { if (formData.height !== '' && !isHeightValid(formData.height)) { uni.showToast({ title: '请输入合理身高(100-250cm)', icon: 'none' }); formData.height = '' } }
const validateWeight = () => { if (formData.weight !== '' && !isWeightValid(formData.weight)) { uni.showToast({ title: '请输入合理体重(20-200kg)', icon: 'none' }); formData.weight = '' } }

const handleChooseImage = (): void => {
  uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: (res) => {
    photoUrl.value = res.tempFilePaths[0]
    uni.getFileSystemManager().readFile({ filePath: res.tempFilePaths[0], encoding: 'base64', success: (fr) => { photoBase64.value = fr.data as string } })
  }})
}

const temperamentLabelMap: Record<string, string> = { cute: '可爱', cool: '酷飒', gentle: '温柔', cold: '高冷' }

const submitHandler = async (): Promise<void> => {
  const h = parseFloat(formData.height); const w = parseFloat(formData.weight); const tm = temperamentLabelMap[formData.temperament] || formData.temperament
  const result = await getRoleRecommend({ height: h, weight: w, temperament: tm, photoBase64: photoBase64.value || undefined })
  const full = { data: result, input: { height: h, weight: w, temperament: tm }, timestamp: Date.now() }
  uni.setStorageSync('cosplan_result', full); saveHistory(full); uni.navigateTo({ url: '/pages/result/index' })
}

const handleSkipAndViewMock = (): void => {
  const mock = { roles: [{ name: '初音未来', anime: 'VOCALOID', reason: '你的身高体重比例与初音设定接近，可爱气质完美契合双马尾形象', difficulty: '简单', matchScore: 95 }, { name: '木之本樱', anime: '魔卡少女樱', reason: '温柔可爱的气质与你高度匹配，小樱的服装制作难度适中', difficulty: '中等', matchScore: 88 }, { name: '血小板', anime: '工作细胞', reason: '娇小可爱的角色设定很符合你的特征，cos难度低', difficulty: '简单', matchScore: 82 }] }
  uni.setStorageSync('cosplan_result', { data: mock, input: { height: 165, weight: 55, temperament: '可爱' }, timestamp: Date.now() })
  uni.navigateTo({ url: '/pages/result/index' })
}

const handleMatch = async (): Promise<void> => { if (!canSubmit.value || loading.value) return; loading.value = true; try { await submitHandler() } catch { uni.showModal({ title: '提示', content: 'AI推荐失败，请重试', showCancel: false }) } finally { loading.value = false } }

// Search
const searchQuery = ref('')
const suggestions = ref<string[]>([])
const showSuggestions = ref(false)
const showHistory = ref(false)
const searchHistory = ref<string[]>([])
const loadSearchHistory = () => { try { const d = uni.getStorageSync('cosplan_search_history'); if (Array.isArray(d)) searchHistory.value = d } catch {} }
const saveSearchHistory = (q: string) => { const list = [q, ...searchHistory.value.filter(h => h !== q)].slice(0, 10); uni.setStorageSync('cosplan_search_history', list); searchHistory.value = list }
const clearHistory = () => { uni.setStorageSync('cosplan_search_history', []); searchHistory.value = [] }
const onSearchInput = () => {
  if (!searchQuery.value.trim()) { suggestions.value = []; showSuggestions.value = false; showHistory.value = true; return }
  suggestions.value = getSearchSuggestions(searchQuery.value)
  showSuggestions.value = suggestions.value.length > 0; showHistory.value = false
}
const selectSuggestion = (s: string) => { searchQuery.value = s; doSearch() }
const doSearch = () => {
  const q = searchQuery.value.trim(); if (!q) return
  saveSearchHistory(q); suggestions.value = []; showSuggestions.value = false
  uni.navigateTo({ url: '/pages/result/index?search=' + encodeURIComponent(q) })
}

onMounted(() => {
  const user = uni.getStorageSync('cosplan_user')
  loadSearchHistory()
  if (!user?.id) {
    uni.reLaunch({ url: '/pages/login/index' })
  }
})
</script>

<style lang="scss" scoped>
/* ========================================
   INDEX - Deep Professional Dark Theme
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

/* ---- Subtle star particles ---- */
.star-particles {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 0;
}
.star-dot {
  position: absolute;
  width: 4rpx;
  height: 4rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  animation: floatUp 6s ease-in-out infinite;
}
.s1 { left: 8%; animation-delay: 0s; animation-duration: 5.5s; }
.s2 { left: 22%; animation-delay: 0.6s; animation-duration: 6.5s; }
.s3 { left: 37%; animation-delay: 1.2s; animation-duration: 4.8s; }
.s4 { left: 52%; animation-delay: 1.8s; animation-duration: 7s; }
.s5 { left: 66%; animation-delay: 0.4s; animation-duration: 5.2s; }
.s6 { left: 78%; animation-delay: 2.1s; animation-duration: 5.8s; }
.s7 { left: 88%; animation-delay: 0.9s; animation-duration: 6.2s; }
.s8 { left: 94%; animation-delay: 2.6s; animation-duration: 5.5s; }

@keyframes floatUp {
  0%   { bottom: -10rpx; opacity: 0; }
  15%  { opacity: 0.3; }
  85%  { opacity: 0.3; }
  100% { bottom: 110%; opacity: 0; }
}

/* ---- Animation entrances ---- */
.anim-fadeInUp {
  animation: fadeInUp 0.45s cubic-bezier(0.4, 0, 0.2, 1) both;
}
.anim-d1 { animation-delay: 0.08s; }
.anim-d2 { animation-delay: 0.16s; }
.anim-d3 { animation-delay: 0.24s; }
.anim-d4 { animation-delay: 0.32s; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---- Glass card base ---- */
.glass {
  width: 100%;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24rpx;
  position: relative;
  z-index: 2;
}

/* ---- Header ---- */
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 36rpx;
  position: relative;
  z-index: 2;
}
.main-title {
  font-size: 52rpx;
  font-weight: bold;
  letter-spacing: 8rpx;
  background: linear-gradient(135deg, #b44dff, #00e5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
}
.sub-title {
  font-size: 22rpx;
  color: rgba(255,255,255,0.45);
  margin-top: 8rpx;
  letter-spacing: 4rpx;
}

/* ---- Upload Card ---- */
.upload-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300rpx;
  height: 400rpx;
  margin-bottom: 20rpx;
  border-style: dashed;
  border-color: rgba(180,77,255,0.3);
  overflow: hidden;
}
.upload-ring {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14rpx;
}
.ring-spin {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2rpx solid rgba(180,77,255,0.2);
  border-top-color: rgba(180,77,255,0.7);
  border-right-color: rgba(0,229,255,0.5);
  border-radius: 50%;
  animation: spin 2.5s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.upload-icon {
  font-size: 48rpx;
  z-index: 1;
}
.upload-text {
  font-size: 26rpx;
  color: rgba(255,255,255,0.8);
}
.upload-hint {
  font-size: 20rpx;
  color: rgba(255,255,255,0.3);
  margin-top: 8rpx;
}
.preview-image {
  width: 100%;
  height: 100%;
  border: none;
}

/* ---- Form Card ---- */
.form-card {
  padding: 28rpx 30rpx;
  margin-bottom: 20rpx;
}
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 22rpx;
}
.form-row:last-child {
  margin-bottom: 0;
}
.form-row--column {
  flex-direction: column;
  align-items: flex-start;
}
.form-row--column .form-label {
  margin-bottom: 14rpx;
}
.form-label {
  font-size: 26rpx;
  color: rgba(255,255,255,0.8);
  width: 80rpx;
  flex-shrink: 0;
}
.form-input {
  flex: 1;
  height: 70rpx;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16rpx;
  padding: 0 18rpx;
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
  transition: border 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.form-input:focus {
  border-color: #b44dff;
  box-shadow: 0 0 12rpx rgba(180,77,255,0.25);
}
.form-unit {
  font-size: 24rpx;
  color: rgba(255,255,255,0.35);
  margin-left: 12rpx;
}

/* ---- Temperament Grid ---- */
.temperament-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
  width: 100%;
}
.tm-card {
  padding: 18rpx 0;
  text-align: center;
  border-radius: 16rpx;
  background: rgba(255,255,255,0.04);
  border: 2rpx solid rgba(255,255,255,0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.tm-emoji {
  font-size: 38rpx;
  display: block;
  margin-bottom: 4rpx;
}
.tm-label {
  font-size: 24rpx;
  color: rgba(255,255,255,0.45);
}

/* cute - 烟粉 #C49B9B */
.tm-cute.tm-active {
  background: rgba(196,155,155,0.15);
  border-color: #C49B9B;
  transform: scale(1.03);
  animation: ringPulseCute 2s ease-in-out infinite;
}
.tm-cute.tm-active .tm-label { color: #C49B9B; }
@keyframes ringPulseCute {
  0%, 100% { box-shadow: 0 0 10rpx rgba(196,155,155,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(196,155,155,0.5); }
}

/* cool - 雾霾蓝 #7B9EBD */
.tm-cool.tm-active {
  background: rgba(123,158,189,0.12);
  border-color: #7B9EBD;
  transform: scale(1.03);
  animation: ringPulseCool 2s ease-in-out infinite;
}
.tm-cool.tm-active .tm-label { color: #7B9EBD; }
@keyframes ringPulseCool {
  0%, 100% { box-shadow: 0 0 10rpx rgba(123,158,189,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(123,158,189,0.5); }
}

/* gentle - 暖砂 #C4A87C */
.tm-gentle.tm-active {
  background: rgba(196,168,124,0.12);
  border-color: #C4A87C;
  transform: scale(1.03);
  animation: ringPulseGentle 2s ease-in-out infinite;
}
.tm-gentle.tm-active .tm-label { color: #C4A87C; }
@keyframes ringPulseGentle {
  0%, 100% { box-shadow: 0 0 10rpx rgba(196,168,124,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(196,168,124,0.5); }
}

/* cold - 淡紫 #9B8EC4 */
.tm-cold.tm-active {
  background: rgba(155,142,196,0.12);
  border-color: #9B8EC4;
  transform: scale(1.03);
  animation: ringPulseCold 2s ease-in-out infinite;
}
.tm-cold.tm-active .tm-label { color: #9B8EC4; }
@keyframes ringPulseCold {
  0%, 100% { box-shadow: 0 0 10rpx rgba(155,142,196,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(155,142,196,0.5); }
}

/* ---- Submit Button ---- */
.submit-wrap {
  width: 100%;
  position: relative;
  z-index: 2;
}
.submit-btn {
  width: 100%;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #b44dff, #7c3aed);
  border-radius: 50rpx;
  animation: breatheGlow 2s ease-in-out infinite;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.submit-btn:active {
  transform: scale(0.96);
  animation: none;
  box-shadow: 0 0 12rpx rgba(180,77,255,0.3);
}
@keyframes breatheGlow {
  0%, 100% { box-shadow: 0 0 12rpx rgba(180,77,255,0.3); }
  50%      { box-shadow: 0 0 40rpx rgba(180,77,255,0.6); }
}
.submit-btn--disabled {
  opacity: 0.35;
  pointer-events: none;
  animation: none;
  box-shadow: none;
}
.submit-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  letter-spacing: 4rpx;
  position: relative;
  z-index: 2;
}

/* Magic circle overlay on loading */
.magic-circle-overlay {
  position: absolute;
  width: 130rpx;
  height: 130rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255,255,255,0.15);
  border-top-color: rgba(255,255,255,0.7);
  animation: spin 1s linear infinite;
  z-index: 1;
}

.skip-link {
  font-size: 22rpx;
  color: rgba(255,255,255,0.2);
  margin-top: 20rpx;
  text-align: center;
  position: relative;
  z-index: 2;
}
.tip-text {
  font-size: 20rpx;
  color: rgba(255,255,255,0.3);
  margin-top: 10rpx;
  text-align: center;
  padding-bottom: 40rpx;
  position: relative;
  z-index: 2;
}
.search-bar { display: flex; align-items: center; gap: 10rpx; padding: 0 20rpx; height: 72rpx; margin-bottom: 16rpx; background: rgba(255,255,255,0.06); border-radius: 40rpx; border: 1px solid rgba(255,255,255,0.08); }
.search-icon { font-size: 28rpx; margin-right: 6rpx; }
.search-input { flex: 1; height: 56rpx; font-size: 24rpx; color: rgba(255,255,255,0.8); }
.search-clear { font-size: 24rpx; color: rgba(255,255,255,0.3); padding: 4rpx; }
.suggestions-dropdown { background: rgba(255,255,255,0.06); border-radius: 16rpx; padding: 10rpx 20rpx; margin-bottom: 12rpx; }
.suggestions-header { display: flex; justify-content: space-between; padding: 6rpx 0; }
.suggestion-item { padding: 12rpx 0; font-size: 24rpx; color: rgba(255,255,255,0.7); border-bottom: 1rpx solid rgba(255,255,255,0.05); }
</style>
