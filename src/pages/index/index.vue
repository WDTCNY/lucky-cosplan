<template>
  <view class="page">
    <!-- Subtle star particles -->
    <view class="star-particles">
      <view v-for="i in 8" :key="i" class="star-dot" :class="'s' + i"></view>
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
      <!-- Gender Selector -->
      <view class="form-row form-row--column">
        <text class="form-label">性别</text>
        <view class="gender-row">
          <view v-for="g in genderSelectOptions" :key="g.value" class="gender-chip" :class="{ 'gender-active': selectedGender === g.value }" @tap="selectedGender = g.value as 'female' | 'male' | 'all'">
            <text class="gender-label">{{ g.label }}</text>
          </view>
        </view>
      </view>
      <view class="form-row form-row--column">
        <text class="form-label">气质</text>
        <view class="temperament-grid">
          <view
            v-for="item in filteredTemperaments"
            :key="item.value"
            class="tm-card"
            :class="[
              'tm-' + item.value,
              { 'tm-active': selectedTemperaments.includes(item.value) }
            ]"
            @tap="toggleTemperament(item.value)"
          >
            <text class="tm-icon">{{ item.icon }}</text>
            <text class="tm-label">{{ item.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Advanced Toggle -->
    <view class="advanced-toggle anim-fadeInUp anim-d2" @tap="showAdvanced = !showAdvanced">
      <text class="advanced-toggle-text">更多偏好</text>
      <text class="advanced-toggle-arrow" :class="{ 'arrow-up': showAdvanced }">▼</text>
    </view>

    <!-- Advanced Options -->
    <view class="advanced-wrap" :class="{ 'advanced-open': showAdvanced }">
      <view class="form-card glass">
        <!-- 预算范围 -->
        <view class="form-row form-row--column">
          <text class="form-label">预算范围</text>
          <view class="chip-row">
            <view v-for="item in budgetOptions" :key="item.value" class="chip" :class="{ 'chip-active': advanced.budget.includes(item.value) }" @tap="toggleMultiChip('budget', item.value)">
              <text class="chip-text">{{ item.label }}</text>
            </view>
            <template v-if="editingField === 'budget'">
              <view class="chip chip-active"><input class="chip-input" v-model="customInputValue" placeholder="输入预算" placeholder-style="color: rgba(255,255,255,0.25)" @confirm="confirmCustomInput('budget')" @blur="confirmCustomInput('budget')" @tap.stop /></view>
            </template>
            <view v-else class="chip" :class="{ 'chip-active': budgetOtherActive }" @tap="toggleOtherChip('budget')"><text class="chip-text">{{ budgetCustom || '其他' }}</text></view>
          </view>
        </view>
        <!-- Cos经验 -->
        <view class="form-row form-row--column">
          <text class="form-label">Cos经验</text>
          <view class="chip-row">
            <view v-for="item in expOptions" :key="item.value" class="chip" :class="{ 'chip-active': advanced.experience === item.value }" @tap="advanced.experience = item.value">
              <text class="chip-text">{{ item.label }}</text>
            </view>
          </view>
        </view>
        <!-- 偏好性别 -->
        <view class="form-row form-row--column">
          <text class="form-label">偏好性别</text>
          <view class="chip-row">
            <view v-for="item in genderPrefOptions" :key="item.value" class="chip" :class="{ 'chip-active': advanced.genderPreference === item.value }" @tap="advanced.genderPreference = item.value">
              <text class="chip-text">{{ item.label }}</text>
            </view>
          </view>
        </view>
        <!-- 风格偏好 -->
        <view class="form-row form-row--column">
          <text class="form-label">风格偏好</text>
          <view class="chip-row">
            <view v-for="item in styleOptions" :key="item.value" class="chip" :class="{ 'chip-active': advanced.stylePreference.includes(item.value) }" @tap="toggleMultiChip('stylePreference', item.value)">
              <text class="chip-text">{{ item.label }}</text>
            </view>
            <template v-if="editingField === 'stylePreference'">
              <view class="chip chip-active"><input class="chip-input" v-model="customInputValue" placeholder="输入风格" placeholder-style="color: rgba(255,255,255,0.25)" @confirm="confirmCustomInput('stylePreference')" @blur="confirmCustomInput('stylePreference')" @tap.stop /></view>
            </template>
            <view v-else class="chip" :class="{ 'chip-active': styleOtherActive }" @tap="toggleOtherChip('stylePreference')"><text class="chip-text">{{ styleCustom || '其他' }}</text></view>
          </view>
        </view>
        <!-- 作品类型 -->
        <view class="form-row form-row--column">
          <text class="form-label">作品类型</text>
          <view class="chip-row">
            <view v-for="item in workTypeOptions" :key="item.value" class="chip" :class="{ 'chip-active': advanced.workType.includes(item.value) }" @tap="toggleMultiChip('workType', item.value)">
              <text class="chip-text">{{ item.label }}</text>
            </view>
            <template v-if="editingField === 'workType'">
              <view class="chip chip-active"><input class="chip-input" v-model="customInputValue" placeholder="输入类型" placeholder-style="color: rgba(255,255,255,0.25)" @confirm="confirmCustomInput('workType')" @blur="confirmCustomInput('workType')" @tap.stop /></view>
            </template>
            <view v-else class="chip" :class="{ 'chip-active': workTypeOtherActive }" @tap="toggleOtherChip('workType')"><text class="chip-text">{{ workTypeCustom || '其他' }}</text></view>
          </view>
        </view>
        <!-- 其他偏好（自由添加） -->
        <view class="form-row form-row--column">
          <text class="form-label">其他偏好</text>
          <view class="chip-row">
            <view v-for="(tag, idx) in customTags" :key="idx" class="chip chip-active">
              <text class="chip-text">{{ tag }}</text>
              <text class="chip-remove" @tap="removeCustomTag(idx)">×</text>
            </view>
            <template v-if="editingField === 'customTag'">
              <view class="chip chip-active"><input class="chip-input chip-input--wide" v-model="customInputValue" placeholder="输入偏好" placeholder-style="color: rgba(255,255,255,0.25)" @confirm="confirmCustomTag" @blur="confirmCustomTag" @tap.stop /></view>
            </template>
            <view v-else class="chip chip-add" @tap="startEditing('customTag')"><text class="chip-text">＋ 其他偏好</text></view>
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

    <!-- Direct Create Project -->
    <view class="create-project-btn anim-fadeInUp anim-d4" @tap="showCreateModal = true">
      <text class="create-project-text">直接创建企划</text>
    </view>

    <!-- Create Project Modal -->
    <view v-if="showCreateModal" class="modal-overlay" @tap="closeCreateModal">
      <view class="modal-card" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">✏️ 新建企划</text>
          <text class="modal-close" @tap="closeCreateModal">×</text>
        </view>
        <view class="modal-body">
          <view class="modal-field">
            <text class="modal-field-label">角色名 <text style="color:#b44dff">*</text></text>
            <input class="modal-input" v-model="createForm.roleName" placeholder="输入角色名" placeholder-style="color: rgba(255,255,255,0.25)" />
          </view>
          <view class="modal-field">
            <text class="modal-field-label">版本/场次</text>
            <input class="modal-input" v-model="createForm.version" placeholder="如：幕府版、CP31场照" placeholder-style="color: rgba(255,255,255,0.25)" />
          </view>
        </view>
        <view class="modal-footer">
          <view class="modal-btn modal-btn-cancel" @tap="closeCreateModal"><text class="modal-btn-text-cancel">取消</text></view>
          <view class="modal-btn modal-btn-confirm" @tap="confirmCreateProject"><text class="modal-btn-text-confirm">确认创建</text></view>
        </view>
      </view>
    </view>

    <text class="tip-text anim-fadeInUp anim-d4">提示：照片越清晰，推荐越精准</text>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getRoleRecommend } from '../../utils/api'
import { getSearchSuggestions } from '../../utils/api'
import { saveHistory, getDefaultVersion } from '../../utils/storage'

const photoUrl = ref('')
const photoBase64 = ref('')
const loading = ref(false)
const showAdvanced = ref(false)

interface FormData { height: string; weight: string }
const formData = reactive<FormData>({ height: '', weight: '' })

// ========== Gender & Temperament ==========
const selectedGender = ref<'female' | 'male' | 'all'>('female')
const selectedTemperaments = ref<string[]>([])

const genderSelectOptions = [
  { label: '女', value: 'female' },
  { label: '男', value: 'male' },
  { label: '不限', value: 'all' },
]

const femaleTemperaments = [
  { label: '可爱', icon: '♡', value: 'cute' },
  { label: '御姐', icon: '◆', value: 'royal' },
  { label: '温柔', icon: '◇', value: 'gentle' },
  { label: '高冷', icon: '♢', value: 'cold' },
  { label: '清新', icon: '○', value: 'fresh' },
  { label: '英气', icon: '△', value: 'heroic' },
  { label: '神秘', icon: '☆', value: 'mystic' },
  { label: '元气', icon: '☀', value: 'energetic' },
]

const maleTemperaments = [
  { label: '硬汉', icon: '■', value: 'tough' },
  { label: '绅士', icon: '♤', value: 'gentleman' },
  { label: '痞帅', icon: '♧', value: 'rogue' },
  { label: '清冷', icon: '♢', value: 'cool' },
  { label: '热血', icon: '♥', value: 'passionate' },
  { label: '阴郁', icon: '♠', value: 'gloomy' },
  { label: '狂气', icon: '✦', value: 'wild' },
]

const filteredTemperaments = computed(() => {
  if (selectedGender.value === 'female') return femaleTemperaments
  if (selectedGender.value === 'male') return maleTemperaments
  // 'all' — show both, female row + male row
  return [...femaleTemperaments, ...maleTemperaments]
})

function toggleTemperament(value: string) {
  const idx = selectedTemperaments.value.indexOf(value)
  if (idx >= 0) {
    selectedTemperaments.value.splice(idx, 1)
  } else {
    selectedTemperaments.value.push(value)
  }
}

// ========== Advanced options ==========
const advanced = reactive({
  budget: [] as string[],
  experience: '',
  genderPreference: '',
  stylePreference: [] as string[],
  workType: [] as string[],
  crossGender: 'same',
})

// "其他" custom values for multi-select fields
const budgetCustom = ref('')
const styleCustom = ref('')
const workTypeCustom = ref('')
const budgetOtherActive = ref(false)
const styleOtherActive = ref(false)
const workTypeOtherActive = ref(false)

const budgetOptions = [
  { label: '300以内', value: 'under300' },
  { label: '300-800', value: '300to800' },
  { label: '800-1500', value: '800to1500' },
  { label: '1500以上', value: 'above1500' },
  { label: '不限', value: 'unlimited' },
]

const expOptions = [
  { label: '新手', value: 'beginner' },
  { label: '入门', value: 'intermediate' },
  { label: '有经验', value: 'experienced' },
]

const genderPrefOptions = [
  { label: '女角', value: 'female' },
  { label: '男角', value: 'male' },
  { label: '不限', value: 'any' },
]

const crossGenderOptions = [
  { label: '同性别角色', value: 'same' },
  { label: '异性角色', value: 'cross' },
  { label: '不限', value: 'all' },
]

const styleOptions = [
  { label: '正片', value: 'formal' },
  { label: '场照', value: 'convention' },
  { label: '游场', value: 'walkaround' },
  { label: '不限', value: 'any' },
]

const workTypeOptions = [
  { label: '动漫', value: 'anime' },
  { label: '游戏', value: 'game' },
  { label: '小说', value: 'novel' },
  { label: '国创', value: 'domestic' },
  { label: '不限', value: 'any' },
]

const isHeightValid = (val: string): boolean => { const num = parseFloat(val); return !isNaN(num) && num >= 100 && num <= 250 }
const isWeightValid = (val: string): boolean => { const num = parseFloat(val); return !isNaN(num) && num >= 20 && num <= 200 }
const canSubmit = computed(() => photoUrl.value !== '' && isHeightValid(formData.height) && isWeightValid(formData.weight) && selectedTemperaments.value.length > 0)

const validateHeight = () => { if (formData.height !== '' && !isHeightValid(formData.height)) { uni.showToast({ title: '请输入合理身高(100-250cm)', icon: 'none' }); formData.height = '' } }
const validateWeight = () => { if (formData.weight !== '' && !isWeightValid(formData.weight)) { uni.showToast({ title: '请输入合理体重(20-200kg)', icon: 'none' }); formData.weight = '' } }

const handleChooseImage = (): void => {
  uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: (res) => {
    photoUrl.value = res.tempFilePaths[0]
    uni.getFileSystemManager().readFile({ filePath: res.tempFilePaths[0], encoding: 'base64', success: (fr) => { photoBase64.value = fr.data as string } })
  }})
}

// Inline editing for "其他" fields
const editingField = ref<string | null>(null)
const customInputValue = ref('')

// Free-form custom tags
const customTags = ref<string[]>([])

function removeCustomTag(idx: number) {
  customTags.value.splice(idx, 1)
}

function confirmCustomTag() {
  const val = customInputValue.value.trim()
  if (val) {
    customTags.value.push(val)
  }
  editingField.value = null
}

function startEditing(field: string) {
  editingField.value = field
  customInputValue.value = ''
  // Focus the input after render
  setTimeout(() => {
    const el = document.querySelector('.chip-input') as HTMLInputElement
    if (el) el.focus()
  }, 50)
}

function toggleMultiChip(field: 'budget' | 'stylePreference' | 'workType', value: string) {
  const arr = advanced[field] as string[]
  const idx = arr.indexOf(value)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(value)
  }
  // Selecting any preset deselects "其他"
  if (field === 'budget') { budgetOtherActive.value = false; budgetCustom.value = '' }
  else if (field === 'stylePreference') { styleOtherActive.value = false; styleCustom.value = '' }
  else if (field === 'workType') { workTypeOtherActive.value = false; workTypeCustom.value = '' }
}

function toggleOtherChip(field: 'budget' | 'stylePreference' | 'workType') {
  const otherActive = field === 'budget' ? budgetOtherActive : field === 'stylePreference' ? styleOtherActive : workTypeOtherActive
  if (otherActive.value) {
    // Deselect "其他"
    otherActive.value = false
    if (field === 'budget') budgetCustom.value = ''
    else if (field === 'stylePreference') styleCustom.value = ''
    else if (field === 'workType') workTypeCustom.value = ''
  } else {
    // Select "其他" → deselect all presets
    const arr = advanced[field] as string[]
    arr.splice(0, arr.length)
    otherActive.value = true
    startEditing(field)
  }
}

function confirmCustomInput(field: string) {
  const val = customInputValue.value.trim()
  if (val) {
    if (field === 'budget') { budgetCustom.value = val }
    else if (field === 'stylePreference') { styleCustom.value = val }
    else if (field === 'workType') { workTypeCustom.value = val }
  }
  editingField.value = null
}

const temperamentLabelMap: Record<string, string> = {
  cute: '可爱', royal: '御姐', gentle: '温柔', cold: '高冷',
  fresh: '清新', heroic: '英气', mystic: '神秘', energetic: '元气',
  tough: '硬汉', gentleman: '绅士', rogue: '痞帅', cool: '清冷',
  passionate: '热血', gloomy: '阴郁', wild: '狂气',
}

const submitHandler = async (): Promise<void> => {
  const h = parseFloat(formData.height); const w = parseFloat(formData.weight)
  const temperamentsStr = selectedTemperaments.value.map(v => temperamentLabelMap[v] || v).join(',') || '不限'

  // Convert gender value to Chinese label
  const genderMap: Record<string, string> = { female: '女', male: '男', all: '不限' }
  const genderStr = genderMap[selectedGender.value] || '不限'

  // Build params, omit empty/不限 fields
  const params: any = {
    height: h,
    weight: w,
    gender: genderStr,
    temperaments: temperamentsStr,
    photoBase64: photoBase64.value || undefined,
  }
  const budgetVal = (advanced.budget as string[]).join(',')
  if (budgetVal) params.budget = budgetVal
  if (advanced.experience) params.experience = advanced.experience
  if (advanced.genderPreference) params.preferGender = advanced.genderPreference
  const styleVal = (advanced.stylePreference as string[]).join(',')
  if (styleVal) params.style = styleVal
  const workVal = (advanced.workType as string[]).join(',')
  if (workVal) params.workType = workVal
  const otherVal = customTags.value.join(',')
  if (otherVal) params.otherPreference = otherVal

  const result = await getRoleRecommend(params)
  const full = { data: result, input: { height: h, weight: w, temperaments: temperamentsStr }, timestamp: Date.now() }
  uni.setStorageSync('cosplan_result', full); saveHistory(full); uni.navigateTo({ url: '/pages/result/index' })
}

// Create project modal
const showCreateModal = ref(false)
const createForm = reactive({ roleName: '', version: '' })

function closeCreateModal() {
  showCreateModal.value = false
}

function confirmCreateProject() {
  if (!createForm.roleName.trim()) {
    uni.showToast({ title: '请输入角色名', icon: 'none' })
    return
  }
  const roleName = createForm.roleName.trim()
  const project = {
    id: Date.now().toString(),
    roleName,
    version: createForm.version.trim() || getDefaultVersion(roleName),
    createdAt: Date.now(),
    totalBudget: 0,
    progress: 0,
    daysLeft: 0,
    status: 'planning',
  }
  const key = 'cosplan_projects'
  const list: any[] = uni.getStorageSync(key) || []
  list.unshift(project)
  uni.setStorageSync(key, list)
  uni.showToast({ title: '企划已创建', icon: 'success' })
  showCreateModal.value = false
  uni.navigateTo({ url: '/pages/project/detail?id=' + project.id })
}

const handleCreateProject = (): void => {
  uni.navigateTo({ url: '/pages/project/detail' })
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
.form-row--column > .form-label {
  margin-bottom: 14rpx;
}
.form-label {
  font-size: 26rpx;
  color: rgba(255,255,255,0.8);
  width: 80rpx;
  flex-shrink: 0;
  white-space: nowrap;
}
.optional-tag {
  font-size: 18rpx;
  color: rgba(255,255,255,0.25);
  font-weight: normal;
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

/* ---- Gender Selector ---- */
.gender-row {
  display: flex;
  gap: 14rpx;
  width: 100%;
}
.gender-chip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 0;
  border-radius: 20rpx;
  background: rgba(255,255,255,0.04);
  border: 2rpx solid rgba(255,255,255,0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.gender-label {
  font-size: 28rpx;
  color: rgba(255,255,255,0.45);
  font-weight: 500;
}
.gender-active {
  border-color: #b44dff;
  background: rgba(180,77,255,0.12);
  transform: scale(1.03);
  box-shadow: 0 0 20rpx rgba(180,77,255,0.3);
}
.gender-active .gender-label {
  color: #b44dff;
  font-weight: bold;
}

/* ---- Temperament Tags (pill style) ---- */
.temperament-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  width: 100%;
}
.tm-card {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  padding: 12rpx 24rpx;
  border-radius: 40rpx;
  background: rgba(255,255,255,0.04);
  border: 2rpx solid rgba(255,255,255,0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}
.tm-icon {
  font-size: 22rpx;
  color: rgba(255,255,255,0.35);
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

/* royal - 深红 #C44B4B */
.tm-royal.tm-active {
  background: rgba(196,75,75,0.12);
  border-color: #C44B4B;
  transform: scale(1.03);
  animation: ringPulseRoyal 2s ease-in-out infinite;
}
.tm-royal.tm-active .tm-label { color: #C44B4B; }
@keyframes ringPulseRoyal {
  0%, 100% { box-shadow: 0 0 10rpx rgba(196,75,75,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(196,75,75,0.5); }
}

/* fresh - 薄荷 #7BC4A8 */
.tm-fresh.tm-active {
  background: rgba(123,196,168,0.12);
  border-color: #7BC4A8;
  transform: scale(1.03);
  animation: ringPulseFresh 2s ease-in-out infinite;
}
.tm-fresh.tm-active .tm-label { color: #7BC4A8; }
@keyframes ringPulseFresh {
  0%, 100% { box-shadow: 0 0 10rpx rgba(123,196,168,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(123,196,168,0.5); }
}

/* heroic - 金棕 #C49B4B */
.tm-heroic.tm-active {
  background: rgba(196,155,75,0.12);
  border-color: #C49B4B;
  transform: scale(1.03);
  animation: ringPulseHeroic 2s ease-in-out infinite;
}
.tm-heroic.tm-active .tm-label { color: #C49B4B; }
@keyframes ringPulseHeroic {
  0%, 100% { box-shadow: 0 0 10rpx rgba(196,155,75,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(196,155,75,0.5); }
}

/* mystic - 暗紫 #7B4BC4 */
.tm-mystic.tm-active {
  background: rgba(123,75,196,0.12);
  border-color: #7B4BC4;
  transform: scale(1.03);
  animation: ringPulseMystic 2s ease-in-out infinite;
}
.tm-mystic.tm-active .tm-label { color: #7B4BC4; }
@keyframes ringPulseMystic {
  0%, 100% { box-shadow: 0 0 10rpx rgba(123,75,196,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(123,75,196,0.5); }
}

/* energetic - 暖橙 #C47B4B */
.tm-energetic.tm-active {
  background: rgba(196,123,75,0.12);
  border-color: #C47B4B;
  transform: scale(1.03);
  animation: ringPulseEnergetic 2s ease-in-out infinite;
}
.tm-energetic.tm-active .tm-label { color: #C47B4B; }
@keyframes ringPulseEnergetic {
  0%, 100% { box-shadow: 0 0 10rpx rgba(196,123,75,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(196,123,75,0.5); }
}

/* tough - 深灰 #6B6B7B */
.tm-tough.tm-active {
  background: rgba(107,107,123,0.12);
  border-color: #6B6B7B;
  transform: scale(1.03);
  animation: ringPulseTough 2s ease-in-out infinite;
}
.tm-tough.tm-active .tm-label { color: #6B6B7B; }
@keyframes ringPulseTough {
  0%, 100% { box-shadow: 0 0 10rpx rgba(107,107,123,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(107,107,123,0.5); }
}

/* gentleman - 藏蓝 #4B6B8C */
.tm-gentleman.tm-active {
  background: rgba(75,107,140,0.12);
  border-color: #4B6B8C;
  transform: scale(1.03);
  animation: ringPulseGentleman 2s ease-in-out infinite;
}
.tm-gentleman.tm-active .tm-label { color: #4B6B8C; }
@keyframes ringPulseGentleman {
  0%, 100% { box-shadow: 0 0 10rpx rgba(75,107,140,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(75,107,140,0.5); }
}

/* rogue - 暗红 #8C4B4B */
.tm-rogue.tm-active {
  background: rgba(140,75,75,0.12);
  border-color: #8C4B4B;
  transform: scale(1.03);
  animation: ringPulseRogue 2s ease-in-out infinite;
}
.tm-rogue.tm-active .tm-label { color: #8C4B4B; }
@keyframes ringPulseRogue {
  0%, 100% { box-shadow: 0 0 10rpx rgba(140,75,75,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(140,75,75,0.5); }
}

/* passionate - 赤橙 #C47B3B */
.tm-passionate.tm-active {
  background: rgba(196,123,59,0.12);
  border-color: #C47B3B;
  transform: scale(1.03);
  animation: ringPulsePassionate 2s ease-in-out infinite;
}
.tm-passionate.tm-active .tm-label { color: #C47B3B; }
@keyframes ringPulsePassionate {
  0%, 100% { box-shadow: 0 0 10rpx rgba(196,123,59,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(196,123,59,0.5); }
}

/* gloomy - 暗紫灰 #6B5B7B */
.tm-gloomy.tm-active {
  background: rgba(107,91,123,0.12);
  border-color: #6B5B7B;
  transform: scale(1.03);
  animation: ringPulseGloomy 2s ease-in-out infinite;
}
.tm-gloomy.tm-active .tm-label { color: #6B5B7B; }
@keyframes ringPulseGloomy {
  0%, 100% { box-shadow: 0 0 10rpx rgba(107,91,123,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(107,91,123,0.5); }
}

/* wild - 暗金 #8C7B3B */
.tm-wild.tm-active {
  background: rgba(140,123,59,0.12);
  border-color: #8C7B3B;
  transform: scale(1.03);
  animation: ringPulseWild 2s ease-in-out infinite;
}
.tm-wild.tm-active .tm-label { color: #8C7B3B; }
@keyframes ringPulseWild {
  0%, 100% { box-shadow: 0 0 10rpx rgba(140,123,59,0.3); }
  50%      { box-shadow: 0 0 30rpx rgba(140,123,59,0.5); }
}

/* ---- Advanced Toggle ---- */
.advanced-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 16rpx 0;
  position: relative;
  z-index: 2;
  cursor: pointer;
}
.advanced-toggle-text {
  font-size: 24rpx;
  color: rgba(255,255,255,0.4);
}
.advanced-toggle-arrow {
  font-size: 20rpx;
  color: rgba(255,255,255,0.3);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.arrow-up {
  transform: rotate(180deg);
}

/* ---- Advanced Wrap (collapsible) ---- */
.advanced-wrap {
  width: 100%;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.advanced-open {
  max-height: 1200rpx;
  padding-bottom: 40rpx;
}

/* ---- Chip Row ---- */
.chip-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 10rpx;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4rpx;
}
.chip-row::-webkit-scrollbar { display: none; }
.chip {
  flex-shrink: 0;
  padding: 10rpx 22rpx;
  border-radius: 30rpx;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}
.chip-text {
  font-size: 24rpx;
  color: rgba(255,255,255,0.45);
  max-width: 120rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chip-active {
  background: rgba(180,77,255,0.15);
  border-color: #b44dff;
}
.chip-active .chip-text {
  color: #b44dff;
  font-weight: bold;
}
.chip-input {
  width: 140rpx;
  height: 48rpx;
  background: transparent;
  border: none;
  outline: none;
  font-size: 24rpx;
  color: #b44dff;
  font-weight: bold;
  padding: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.chip-input:focus {
  box-shadow: 0 0 12rpx rgba(180,77,255,0.4);
}
.chip-input--wide {
  width: 200rpx;
}
.chip-remove {
  font-size: 24rpx;
  color: rgba(255,255,255,0.5);
  margin-left: 8rpx;
  padding: 0 2rpx;
}
.chip-other {
  border-color: rgba(180,77,255,0.3);
}
.chip-other .chip-text {
  color: rgba(180,77,255,0.6);
}
.chip-add {
  border-style: dashed;
  border-color: rgba(180,77,255,0.3);
}
.chip-add .chip-text {
  color: rgba(180,77,255,0.6);
}

/* ---- Submit Button ---- */
.submit-wrap {
  width: 100%;
  position: relative;
  z-index: 2;
  margin-top: 40rpx;
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

/* ---- Create Project Button ---- */
.create-project-btn {
  width: 100%;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50rpx;
  border: 1px solid rgba(180,77,255,0.4);
  background: rgba(180,77,255,0.06);
  margin-top: 20rpx;
  position: relative;
  z-index: 2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.create-project-btn:active {
  transform: scale(0.96);
  background: rgba(180,77,255,0.12);
}
.create-project-text {
  font-size: 28rpx;
  color: #b44dff;
  font-weight: 500;
  letter-spacing: 2rpx;
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
/* ---- Modal Overlay ---- */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-card {
  width: 600rpx;
  background: rgba(30,28,50,0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24rpx;
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 30rpx 0;
}
.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: rgba(255,255,255,0.9);
}
.modal-close {
  font-size: 40rpx;
  color: rgba(255,255,255,0.3);
  padding: 0 8rpx;
}
.modal-body {
  padding: 24rpx 30rpx;
}
.modal-field {
  margin-bottom: 20rpx;
}
.modal-field:last-child {
  margin-bottom: 0;
}
.modal-field-label {
  font-size: 24rpx;
  color: rgba(255,255,255,0.6);
  margin-bottom: 10rpx;
  display: block;
}
.modal-input {
  width: 100%;
  height: 72rpx;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16rpx;
  padding: 0 18rpx;
  font-size: 26rpx;
  color: rgba(255,255,255,0.8);
  box-sizing: border-box;
}
.modal-input--picker {
  display: flex;
  align-items: center;
}
.modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 0 30rpx 28rpx;
}
.modal-btn {
  flex: 1;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-btn:active {
  transform: scale(0.96);
}
.modal-btn-cancel {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
}
.modal-btn-text-cancel {
  font-size: 26rpx;
  color: rgba(255,255,255,0.5);
}
.modal-btn-confirm {
  background: linear-gradient(135deg, #b44dff, #7c3aed);
}
.modal-btn-text-confirm {
  font-size: 26rpx;
  color: #fff;
  font-weight: bold;
}
.search-bar { display: flex; align-items: center; gap: 10rpx; padding: 0 20rpx; height: 72rpx; margin-bottom: 16rpx; background: rgba(255,255,255,0.06); border-radius: 40rpx; border: 1px solid rgba(255,255,255,0.08); }
.search-icon { font-size: 28rpx; margin-right: 6rpx; }
.search-input { flex: 1; height: 56rpx; font-size: 24rpx; color: rgba(255,255,255,0.8); }
.search-clear { font-size: 24rpx; color: rgba(255,255,255,0.3); padding: 4rpx; }
.suggestions-dropdown { background: rgba(255,255,255,0.06); border-radius: 16rpx; padding: 10rpx 20rpx; margin-bottom: 12rpx; }
.suggestions-header { display: flex; justify-content: space-between; padding: 6rpx 0; }
.suggestion-item { padding: 12rpx 0; font-size: 24rpx; color: rgba(255,255,255,0.7); border-bottom: 1rpx solid rgba(255,255,255,0.05); }
</style>