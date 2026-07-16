<template>
  <view class="page">
    <view class="header anim-fadeInUp">
      <text class="role-name">{{ project.roleName }}</text>
      <text v-if="project.version" class="role-version"> · {{ project.version }}</text>
    </view>

    <view class="card glass anim-fadeInUp anim-d1">
      <view class="section-header">
        <text class="section-title">📊 物料进度</text>
        <text v-if="isReady" class="ready-tag">🎉 准备就绪</text>
      </view>
      <view class="mat-progress-wrap">
        <view class="mat-progress-bar" :class="{ 'progress-glow': isReady }">
          <view class="mat-progress-fill" :style="{ width: (materialsProgress || 0) + '%', background: progressColor }"></view>
        </view>
        <text class="mat-progress-text">{{ materialsProgress || 0 }}%</text>
      </view>
      <text class="mat-progress-detail">{{ doneCount }}/{{ totalCount }} 项已完成</text>
    </view>

    <view class="card glass anim-fadeInUp anim-d15">
      <text class="section-title">参考图</text>
      <view class="ref-grid">
        <view v-for="(img, idx) in project.refImages" :key="idx" class="ref-img-wrap">
          <image class="ref-img" :src="img" mode="aspectFill" />
          <view class="ref-del" @tap="removeRefImage(idx)"><text class="ref-del-icon">×</text></view>
        </view>
        <view v-if="project.refImages.length < 9" class="ref-add" @tap="addRefImage">
          <text class="ref-add-icon">＋</text>
        </view>
      </view>
    </view>

    <view class="card glass anim-fadeInUp anim-d2">
      <view class="section-header">
        <text class="section-title">我的尺寸</text>
        <text class="edit-toggle" @tap="isEditing = !isEditing">{{ isEditing ? '保存' : '✏️' }}</text>
      </view>
      <view class="size-grid">
        <view class="size-item">
          <text class="size-label">身高(cm)</text>
          <input class="size-input" type="digit" v-model="project.sizes.height" :disabled="!isEditing" placeholder="--" />
        </view>
        <view class="size-item">
          <text class="size-label">体重(kg)</text>
          <input class="size-input" type="digit" v-model="project.sizes.weight" :disabled="!isEditing" placeholder="--" />
        </view>
        <view class="size-item">
          <text class="size-label">胸围(cm)</text>
          <input class="size-input" type="digit" v-model="project.sizes.bust" :disabled="!isEditing" placeholder="--" />
        </view>
        <view class="size-item">
          <text class="size-label">腰围(cm)</text>
          <input class="size-input" type="digit" v-model="project.sizes.waist" :disabled="!isEditing" placeholder="--" />
        </view>
        <view class="size-item">
          <text class="size-label">臀围(cm)</text>
          <input class="size-input" type="digit" v-model="project.sizes.hip" :disabled="!isEditing" placeholder="--" />
        </view>
        <view class="size-item">
          <text class="size-label">鞋码</text>
          <input class="size-input" type="digit" v-model="project.sizes.shoe" :disabled="!isEditing" placeholder="--" />
        </view>
      </view>
    </view>

    <view class="card glass anim-fadeInUp anim-d22">
      <text class="section-title">🧠 智能策划方案</text>
      <view v-if="!planResult">
        <view class="plan-btn" @tap="generatePlan"><text>✨ 生成策划方案</text></view>
      </view>
      <view v-else>
        <view class="plan-section"><text class="plan-section-title">⏰ 时间规划</text><text v-for="t in planResult.timeline||[]" :key="t.phase" class="plan-item">• {{ t.phase }}：{{ t.days }}天</text></view>
        <view class="plan-section"><text class="plan-section-title">📦 物料清单</text><view v-for="m in planResult.materials||[]" :key="m.category" class="plan-material-cat"><text class="plan-cat-title">{{ m.category }}</text><text v-for="i in m.items||[]" :key="i.name" class="plan-item">{{ i.name }} ¥{{ i.price }}</text></view></view>
        <view class="plan-section"><text class="plan-section-title">💰 预算预估</text><text v-for="m in planResult.budget.modes||[]" :key="m.name" class="plan-item">{{ m.name }}：¥{{ m.total }}</text><text class="plan-item plan-total">合计：¥{{ planResult.budget.total }}</text></view>
        <view class="plan-section"><text class="plan-section-title">👥 人员建议</text><text v-for="p in planResult.personnel||[]" :key="p.role" class="plan-item">{{ p.role }}：{{ p.channel }}</text></view>
        <view class="plan-section"><text class="plan-section-title">⚠️ 风险提示</text><text v-for="r in planResult.risks||[]" :key="r.risk" class="plan-item">• {{ r.risk }}</text></view>
        <view class="plan-btn" @tap="planResult = null"><text>🔄 重新生成</text></view>
      </view>
    </view>

    <view class="card glass anim-fadeInUp anim-d3">
      <view class="material-title-row">
        <text class="section-title">物料清单</text>
        <text class="manage-btn" :class="{ disabled: !hasTabData }" @tap="matManageMode ? exitMatManage() : (hasTabData && enterMatManage())">{{ matManageMode ? '完成' : '管理' }}</text>
      </view>
      <view v-if="!matManageMode" class="type-tabs">
        <view class="type-tab" :class="{ active: buyType === 'buy' }" @tap="buyType = 'buy'"><text>🛒 直接购买</text></view>
        <view class="type-tab" :class="{ active: buyType === 'make' }" @tap="buyType = 'make'"><text>🔧 需要制作</text></view>
      </view>
      <view v-for="(cat, catIdx) in filteredMaterials" :key="catIdx" class="material-cat">
        <view class="cat-header">
          <text class="cat-title">{{ cat.category }}</text>
          <text class="cat-del" @tap="removeCat(cat)">×</text>
        </view>
        <view v-for="(item, i) in cat.items" :key="i" class="sub-item-row">
          <view v-if="!matManageMode" class="sub-item-check" :class="{ done: item.done }" @tap.stop="toggleMaterialD(cat, i)"><text v-if="item.done">✓</text></view>
          <text v-if="matManageMode" class="mat-check-circle" @tap.stop="toggleMatItem(cat.category + '||' + item.name)"><text :class="matSelected.has(cat.category + '||' + item.name) ? 'check-active' : ''">{{ matSelected.has(cat.category + '||' + item.name) ? '✅' : '○' }}</text></text>
          <text class="sub-item-name">{{ item.name }}</text>
          <text v-if="!matManageMode" class="status-pill" :class="'status-' + (item.status || 'pending')" @tap.stop="cycleItemStatus(cat, i)">{{ statusText(item) }}</text>
          <text class="sub-item-del" @tap.stop="removeFilteredItem(cat, i)">×</text>
        </view>
        <view class="cat-add-btn" @tap="startQuickAddInFiltered(cat)"><text class="cat-add-text">+ 添加物品</text></view>
      </view>
      <view v-if="!matManageMode" class="add-btns">
        <view class="add-row" @tap="addMaterial"><text class="add-text">＋ 添加物料</text></view>
      </view>
      <view v-if="matManageMode" class="mat-batch-bar">
        <text v-if="hasTabData" class="batch-btn" @tap="selectAllMat()">{{ isAllMatSelected ? '取消全选' : '全选' }}</text>
        <text v-else class="batch-btn disabled">全选</text>
        <text v-if="hasTabData && matSelected.size > 0" class="batch-delete" @tap="confirmBatchDeleteMat()">删除选中（{{ matSelected.size }}项）</text>
      </view>
      <!-- 主物料弹窗 -->
      <view v-if="editingMaterial" class="modal-overlay" @tap="editingMaterial = null">
        <view class="modal-card" @tap.stop>
          <view class="modal-header-row">
            <text class="modal-title">{{ editingMaterial.isNew ? '添加物料' : '编辑物料' }}</text>
            <view class="modal-close-btn" @tap="editingMaterial = null"><text>×</text></view>
          </view>
          <view class="modal-field">
            <text class="modal-label">品类</text>
            <input class="modal-input" v-model="editingMaterial.category" placeholder="服装/假发/道具/化妆/其他" />
          </view>
          <view class="modal-field">
            <text class="modal-label">物品名</text>
            <input class="modal-input" v-model="editingMaterial.name" placeholder="物品名称" />
          </view>
          <view v-if="editingMaterial.type === 'make'" class="modal-field">
            <text class="modal-label">工期(天)</text>
            <input class="modal-input" type="digit" v-model="editingMaterial.days" placeholder="天数" />
          </view>
          <template v-if="editingMaterial.type === 'make'">
            <view class="modal-field"><text class="modal-label">制作思路/流程</text><textarea class="modal-textarea" v-model="editingMaterial.process" placeholder="描述制作流程（选填）..." /></view>
            <view class="modal-field"><text class="modal-label">所需材料</text><input class="modal-input" v-model="editingMaterial.materials" placeholder="逗号分隔，布料、拉链、填充棉" /></view>
          </template>
          <view class="modal-field">
            <text class="modal-label">备注</text>
            <input class="modal-input" v-model="editingMaterial.note" placeholder="备注信息" />
          </view>
          <view class="modal-actions">
            <view v-if="!editingMaterial.isNew" class="modal-btn modal-btn-del" @tap="deleteEditingMaterial">
              <text class="modal-btn-text-del">删除</text>
            </view>
            <view class="modal-btn modal-btn-save" @tap="saveMaterial">
              <text class="modal-btn-text-save">保存</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 子物品添加弹窗 -->
      <view v-if="quickAddCatIdx >= 0" class="modal-overlay" @tap="cancelQuickAdd">
        <view class="modal-card small-modal" @tap.stop>
          <view class="modal-header-row">
            <text class="modal-title">添加物品</text>
            <view class="modal-close-btn" @tap="cancelQuickAdd"><text>×</text></view>
          </view>
          <view class="modal-field">
            <input class="modal-input" v-model="quickAddName" placeholder="输入物品名" @confirm="confirmQuickAdd(quickAddCatIdx)" />
          </view>
          <view class="modal-actions">
            <view class="modal-btn modal-btn-save" @tap="confirmQuickAdd(quickAddCatIdx)">
              <text class="modal-btn-text-save">确认添加</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="card glass anim-fadeInUp anim-d4">
      <text class="section-title">倒计时</text>
      <view class="countdown-row">
        <view class="countdown-left">
          <text v-if="!project.targetDate" class="no-date">暂未设置目标日期</text>
          <text v-else class="countdown-num">{{ daysLeft }}</text>
          <text v-if="project.targetDate" class="countdown-label">天</text>
        </view>
        <view class="countdown-right">
          <text class="remind-label">提前提醒</text>
          <view class="remind-options">
            <text class="remind-tag" :class="{ active: project.remindDays === 3 }" @tap="project.remindDays = 3">3天</text>
            <text class="remind-tag" :class="{ active: project.remindDays === 7 }" @tap="project.remindDays = 7">7天</text>
          </view>
          <picker mode="date" :value="project.targetDate" @change="onDateChange">
            <text class="date-pick">{{ project.targetDate || '选择日期' }}</text>
          </picker>
        </view>
      </view>
    </view>

    <view class="card glass room-card anim-fadeInUp anim-d6" @tap="handleGoBudget">
      <text class="room-card-icon">💰</text>
      <text class="room-card-text">预算管理</text>
      <view class="budget-dot" :class="budgetDotClass"></view>
    </view>

    <view v-if="isNewMode" class="bottom-actions anim-fadeInUp anim-d7">
      <view class="btn btn-primary" @tap="handleSaveProject">
        <text class="btn-text-primary">保存企划</text>
      </view>
    </view>
    <view v-else class="bottom-actions anim-fadeInUp anim-d7">
      <view class="btn btn-outline glass" @tap="handleSaveProject">
        <text class="btn-text-outline">保存</text>
      </view>
      <view class="btn btn-outline glass" @tap="handleShare">
        <text class="btn-text-outline">分享</text>
      </view>
      <view class="btn btn-primary" @tap="handleInvite">
        <text class="btn-text-primary">邀请协作</text>
      </view>
    </view>
    <view class="extra-btns" style="width:100%;display:flex;gap:16rpx;margin-top:20rpx;">
      <view class="btn btn-outline glass" style="flex:1" @tap="handleLocation"><text style="font-size:24rpx;color:rgba(255,255,255,0.8)">📍 推荐拍摄地</text></view>
      <view class="btn btn-outline glass" style="flex:1" @tap="handlePhotography"><text style="font-size:24rpx;color:rgba(255,255,255,0.8)">📸 推荐摄影</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { getTotalSpent } from '../../utils/budget'
import { getSmartPlan, getLocationRecommend, getPhotoRecommendation } from '../../utils/api'

interface MaterialItem { name: string; done: boolean; days: string; quantity: string; type: 'buy' | 'make'; process: string; note: string; link?: string; price?: string; purchaseStatus?: string; materials?: string; estimatedHours?: string }
interface MaterialCategory { category: string; items: MaterialItem[] }
interface Sizes { height: string; weight: string; bust: string; waist: string; hip: string; shoe: string }
interface Project { id: string; roleName: string; version: string; refImages: string[]; sizes: Sizes; materials: MaterialCategory[]; targetDate: string; remindDays: number }

interface EditingMaterial {
  isNew: boolean
  catIdx: number
  itemIdx: number
  category: string
  name: string
  quantity: string
  days: string
  process: string
  note: string
  type: 'buy' | 'make'
  link?: string
  price?: string
  purchaseStatus?: string
  materials?: string
  estimatedHours?: string
}

const isEditing = ref(true)
const isNewMode = ref(false)
const editingMaterial = ref<EditingMaterial | null>(null)
const buyType = ref<'buy' | 'make'>('buy')

// ---- 物料管理模式 ----
const matManageMode = ref(false)
const matSelected = ref(new Set<string>())
function enterMatManage() { matManageMode.value = true; matSelected.value = new Set() }
watch(buyType, () => { matSelected.value = new Set(); if (matManageMode.value && !hasTabData.value) exitMatManage() })
function exitMatManage() { matManageMode.value = false; matSelected.value = new Set() }
function toggleMatItem(key: string) {
  const s = new Set(matSelected.value)
  s.has(key) ? s.delete(key) : s.add(key)
  matSelected.value = s
}
function selectAllMat() {
  const matchKeys: string[] = []
  for (const cat of project.materials) {
    for (const item of cat.items) {
      const itemType = item.type || (item as any).type
      if (itemType === buyType.value || (!itemType && buyType.value === 'buy')) {
        matchKeys.push(cat.category + '||' + item.name)
      }
    }
  }
  if (matSelected.value.size === matchKeys.length && matchKeys.length > 0) {
    matSelected.value = new Set()
  } else {
    matSelected.value = new Set(matchKeys)
  }
}
const hasTabData = computed(() => {
  for (const cat of project.materials) {
    for (const item of cat.items) {
      const itemType = item.type || (item as any).type
      if (itemType === buyType.value || (!itemType && buyType.value === 'buy')) return true
    }
  }
  return false
})
const isAllMatSelected = computed(() => {
  let count = 0
  for (const cat of project.materials) {
    for (const item of cat.items) {
      const itemType = item.type || (item as any).type
      if (itemType === buyType.value || (!itemType && buyType.value === 'buy')) count++
    }
  }
  return count > 0 && matSelected.value.size === count
})

function confirmBatchDeleteMat() {
  if (matSelected.value.size === 0) { uni.showToast({ title: '请选择要删除的项', icon: 'none' }); return }
  uni.showModal({
    title: '确认删除',
    content: `确认删除选中的 ${matSelected.value.size} 项吗？`,
    confirmText: '删除', confirmColor: '#ff4444',
    success: (res) => {
      if (!res.confirm) return
      const keys = matSelected.value
      for (const cat of project.materials) {
        cat.items = cat.items.filter(item => !keys.has(cat.category + '||' + item.name))
      }
      project.materials = project.materials.filter(cat => cat.items.length > 0)
      exitMatManage()
      saveToStorage()
    }
  })
}
// ----

const project = reactive<Project>({
  id: '', roleName: '新企划', version: '企划', refImages: [],
  sizes: { height: '', weight: '', bust: '', waist: '', hip: '', shoe: '' },
  materials: [
    { category: '服装类', items: [{ name: '上衣', done: false, days: '3', quantity: '1', type: 'buy', process: '', note: '' }, { name: '下装', done: false, days: '3', quantity: '1', type: 'buy', process: '', note: '' }] },
    { category: '假发', items: [{ name: '假发造型', done: false, days: '2', quantity: '1', type: 'buy', process: '', note: '' }] },
    { category: '道具', items: [{ name: '道具制作', done: false, days: '5', quantity: '1', type: 'buy', process: '', note: '' }] },
    { category: '材料', items: [{ name: '布料', done: false, days: '1', quantity: '1', type: 'buy', process: '', note: '' }] },
  ], targetDate: '', remindDays: 3,
})

const totalDays = computed(() => { let s = 0; project.materials.forEach(c => c.items.forEach(i => s += parseFloat(i.days) || 0)); return s })
const daysLeft = computed(() => { if (!project.targetDate) return '--'; const d = Math.ceil((new Date(project.targetDate).getTime() - Date.now()) / 86400000); return d < 0 ? 0 : d })

// ---- 物料完成度 ----
const totalCount = computed(() => {
  let count = 0
  for (const cat of project.materials) count += cat.items.length
  return count
})
const doneCount = computed(() => {
  let count = 0
  for (const cat of project.materials) {
    for (const item of cat.items) {
      const st = (item as any).status || 'pending'
      if (st === 'received' || st === 'done') count++
    }
  }
  return count
})
const materialsProgress = computed(() => totalCount.value === 0 ? 0 : Math.round((doneCount.value / totalCount.value) * 100))
const isReady = computed(() => !!materialsProgress.value && materialsProgress.value >= 100)
const progressColor = computed(() => {
  const p = materialsProgress.value
  if (p >= 70) return '#8CAF9E'
  if (p >= 30) return '#C4A87C'
  return '#8E9E9E'
})

const filteredMaterials = computed(() => {
  return project.materials.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.type === buyType.value || (!item.type && buyType.value === 'buy'))
  })).filter(cat => cat.items.length > 0)
})

const addRefImage = () => { uni.chooseImage({ count: 9 - project.refImages.length, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: res => { (res.tempFilePaths as string[]).forEach((p: string) => project.refImages.push(p)) } }) }
const removeRefImage = (idx: number) => { project.refImages.splice(idx, 1) }

const toggleMaterial = (c: number, i: number) => { project.materials[c].items[i].done = !project.materials[c].items[i].done }
const toggleMaterialD = (cat: MaterialCategory, i: number) => { const idx = project.materials.findIndex(c => c.category === cat.category); if (idx >= 0) { project.materials[idx].items[i].done = !project.materials[idx].items[i].done; saveToStorage() } }

const STATUS_BUY = ['pending', 'ordered', 'received'] as const
const STATUS_MAKE = ['pending', 'making', 'done'] as const
function statusText(item: any) {
  const st = (item as any).status || 'pending'
  if (item.type === 'make') return st === 'making' ? '🔧 制作中' : st === 'done' ? '✅ 已完成' : '⬜ 待制作'
  return st === 'ordered' ? '📦 已下单' : st === 'received' ? '✅ 已收货' : '⬜ 待购买'
}
function cycleItemStatus(cat: MaterialCategory, i: number) {
  const idx = project.materials.findIndex(c => c.category === cat.category)
  if (idx < 0) return
  const item = project.materials[idx].items[i] as any
  const list = item.type === 'make' ? STATUS_MAKE : STATUS_BUY
  const cur = item.status || 'pending'
  const next = list[(list.indexOf(cur) + 1) % list.length]
  item.status = next
  saveToStorage()
}

const addMaterial = (catIdx = -1) => { const ci: number = catIdx >= 0 ? catIdx : project.materials.length; editingMaterial.value = { isNew: true, catIdx: ci, itemIdx: 0, category: catIdx >= 0 ? (project.materials[catIdx]?.category || '') : '', name: '', quantity: '1', days: '1', type: buyType.value, process: '', note: '', materials: '', estimatedHours: '', link: '', price: '', purchaseStatus: 'pending' } }

const editMaterial = (catIdx: number, itemIdx: number) => {
  const item = project.materials[catIdx]?.items[itemIdx]
  if (!item) return
  editingMaterial.value = { isNew: false, catIdx, itemIdx, category: project.materials[catIdx].category, name: item.name, quantity: item.quantity || "1", days: item.days, type: item.type || "buy", process: item.process || "", note: item.note || "", materials: item.materials || "", estimatedHours: item.estimatedHours || "", link: item.link || "", price: item.price || "", purchaseStatus: item.purchaseStatus || "pending" }
}

const saveMaterial = () => {
  const em = editingMaterial.value
  if (!em || !em.name || !em.category) { uni.showToast({ title: '请填写品类和物品名', icon: 'none' }); return }
  if (em.isNew) {
    let cat = project.materials.find(c => c.category === em.category)
    if (cat) { cat.items.push({ name: em.name, done: false, days: em.days, quantity: em.quantity, type: em.type, process: em.process, note: em.note, link: em.link, price: em.price, purchaseStatus: em.purchaseStatus, materials: em.materials, estimatedHours: em.estimatedHours }) }
    else { project.materials.push({ category: em.category, items: [{ name: em.name, done: false, days: em.days, quantity: em.quantity, type: em.type, process: em.process, note: em.note, link: em.link, price: em.price, purchaseStatus: em.purchaseStatus, materials: em.materials, estimatedHours: em.estimatedHours }] }) }
  } else {
    const cat = project.materials[em.catIdx]
    if (cat) {
      const item = cat.items[em.itemIdx]
      if (item) { cat.category = em.category; item.name = em.name; item.days = em.days; item.quantity = em.quantity; item.type = em.type; item.process = em.process; item.note = em.note; item.link = em.link; item.price = em.price; item.purchaseStatus = em.purchaseStatus; item.materials = em.materials; item.estimatedHours = em.estimatedHours }
    }
  }
  syncMaterialsToWarehouse()
  editingMaterial.value = null
}

const deleteEditingMaterial = () => {
  const em = editingMaterial.value
  if (!em || em.isNew) { editingMaterial.value = null; return }
  project.materials[em.catIdx]?.items.splice(em.itemIdx, 1)
  if (project.materials[em.catIdx]?.items.length === 0) project.materials.splice(em.catIdx, 1)
  editingMaterial.value = null
}

// ---- Sub-item inline editing ----
const quickAddCatIdx = ref(-1)
const quickAddName = ref('')
const editingSubCat = ref(-1)
const editingSubIdx = ref(-1)
const editSubName = ref('')

const startQuickAdd = (catIdx: number) => { quickAddCatIdx.value = catIdx; quickAddName.value = '' }
const cancelQuickAdd = () => { quickAddCatIdx.value = -1; quickAddName.value = '' }
const confirmQuickAdd = (catIdx: number) => {
  const name = quickAddName.value.trim()
  if (!name) { cancelQuickAdd(); return }
  project.materials[catIdx]?.items.push({ name, done: false, days: '1', quantity: '1', type: buyType.value, process: '', note: '' })
  cancelQuickAdd()
  saveToStorage()
}

const removeMaterial = (c: number, i: number) => { project.materials[c]?.items.splice(i, 1); if (project.materials[c]?.items.length === 0) project.materials.splice(c, 1) }
const removeCategory = (idx: number) => { project.materials.splice(idx, 1) }

const removeCat = (cat: MaterialCategory) => {
  const idx = project.materials.findIndex(c => c.category === cat.category)
  if (idx >= 0) project.materials.splice(idx, 1)
}
const removeFilteredItem = (cat: MaterialCategory, i: number) => {
  const idx = project.materials.findIndex(c => c.category === cat.category)
  if (idx >= 0) { project.materials[idx].items = project.materials[idx].items.filter(item => item.type !== buyType.value || item.name !== cat.items[i].name) }
}
const startQuickAddInFiltered = (cat: MaterialCategory) => {
  const idx = project.materials.findIndex(c => c.category === cat.category)
  if (idx >= 0) startQuickAdd(idx)
}

const onDateChange = (e: { detail: { value: string } }) => { project.targetDate = e.detail.value }

const handleShare = () => uni.showToast({ title: '功能开发中', icon: 'none' })
const handleInvite = () => uni.showToast({ title: '功能开发中', icon: 'none' })

const budgetPid = computed(() => project.id)
const budgetDotClass = computed(() => {
  const budget = uni.getStorageSync('cosplan_budget_list') || []
  const item = budget.find((b: any) => b.projectId === budgetPid.value)
  if (!item) return 'dot-none'
  const spent = getTotalSpent(budgetPid.value)
  const pct = Math.round((spent / item.totalBudget) * 100)
  if (pct >= 100) return 'dot-over'; if (pct >= 80) return 'dot-warn'; return 'dot-ok'
})
const handleGoBudget = () => {
  const list: any[] = uni.getStorageSync('cosplan_budget_list') || []
  if (!list.find((b: any) => b.projectId === project.id)) { list.unshift({ projectId: project.id, roleName: project.roleName, totalBudget: 2000 }); uni.setStorageSync('cosplan_budget_list', list) }
  uni.setStorageSync('cosplan_current_budget_id', project.id)
  uni.navigateTo({ url: '/pages/budget/detail' })
}

let projectId = ''
const saveToStorage = () => {
  const all = uni.getStorageSync('cosplan_projects') || []
  const i = all.findIndex((p: Project) => p.id === projectId)
  if (i >= 0) all[i] = { ...project, id: projectId }
  else all.unshift({ ...project, id: projectId })
  uni.setStorageSync('cosplan_projects', all)
}

function syncMaterialsToWarehouse() {
  try {
    const warehouse: any[] = uni.getStorageSync('cosplan_warehouse') || []
    const existingKeys = new Set(warehouse.map((w: any) => w.name + '::' + w.characterName))
    let changed = false
    for (const cat of project.materials) {
      for (const item of cat.items) {
        const key = item.name + '::' + project.roleName
        if (!existingKeys.has(key)) {
          warehouse.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: item.name,
            characterName: project.roleName,
            category: 'other',
            status: 'in_use',
            source: 'auto',
          })
          existingKeys.add(key)
          changed = true
        }
      }
    }
    if (changed) uni.setStorageSync('cosplan_warehouse', warehouse)
  } catch {}
}

const handleSaveProject = () => {
  if (isNewMode.value) {
    projectId = Date.now().toString()
    project.id = projectId
    saveToStorage()
    uni.showToast({ title: '企划已创建', icon: 'success' })
    isNewMode.value = false
    syncMaterialsToWarehouse()
    setTimeout(() => uni.navigateBack(), 800)
  } else {
    saveToStorage()
    syncMaterialsToWarehouse()
    uni.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  }
}

const planResult = ref<any>(null)
const generatePlan = async () => {
  try { const res = await getSmartPlan({ roleName: project.roleName, anime: '', height: parseFloat(project.sizes.height) || 160, weight: parseFloat(project.sizes.weight) || 50, targetDate: project.targetDate }); planResult.value = res }
  catch { uni.showToast({ title: '生成失败', icon: 'none' }) }
}
const handleLocation = async () => {
  try { const res = await getLocationRecommend(project.roleName, '', ''); const txt = res.local.map((l: any) => l.name + '：' + l.reason).join('\n') + '\n\n全国推荐：\n' + res.national.map((n: any) => n.name + '：' + n.reason).join('\n'); uni.showModal({ title: '📍 推荐拍摄地', content: txt, showCancel: false }) }
  catch { uni.showToast({ title: '获取失败', icon: 'none' }) }
}
const handlePhotography = async () => {
  try { const res = await getPhotoRecommendation(project.roleName, '', ''); uni.showModal({ title: '📸 推荐摄影', content: '风格：' + res.style + '\n\n渠道：' + res.channels.join('\n') + '\n\n注意事项：\n' + res.tips.join('\n'), showCancel: false }) }
  catch { uni.showToast({ title: '获取失败', icon: 'none' }) }
}

onMounted(() => {
  const pages = getCurrentPages()
  const options = (pages[pages.length - 1] as any)?.options || {}
  if (options.new === '1' && options.roleName) {
    isNewMode.value = true
    project.roleName = decodeURIComponent(options.roleName)
    project.version = decodeURIComponent(options.version || '企划')
    project.id = ''
  } else {
    projectId = options.id || Date.now().toString()
    const all = uni.getStorageSync('cosplan_projects') || []
    const found = all.find((p: Project) => p.id === projectId)
    if (found) Object.assign(project, found)
    if (!project.version) project.version = '企划'
    project.id = projectId
  }
  if (!isNewMode.value) {
    watch(project, () => saveToStorage(), { deep: true })
  }
})
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #1B1725; padding: 40rpx 30rpx 120rpx; }
.anim-fadeInUp { animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both; }
.anim-d1 { animation-delay: 0.04s; } .anim-d2 { animation-delay: 0.08s; } .anim-d3 { animation-delay: 0.12s; }
.anim-d4 { animation-delay: 0.16s; } .anim-d5 { animation-delay: 0.20s; } .anim-d6 { animation-delay: 0.24s; } .anim-d7 { animation-delay: 0.28s; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.header { margin-bottom: 24rpx; }
.role-name { font-size: 40rpx; font-weight: bold; color: rgba(255,255,255,0.95); }
.role-version { font-size: 30rpx; color: rgba(255,255,255,0.5); }
.glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24rpx; }
.card { width: 100%; padding: 28rpx; margin-bottom: 20rpx; overflow: visible; }
.section-header { display: flex; justify-content: space-between; align-items: center; }
.section-title { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.85); display: block; margin-bottom: 10rpx; }
.section-sub { font-size: 22rpx; color: rgba(255,255,255,0.35); display: block; margin-bottom: 16rpx; }
.edit-toggle { font-size: 36rpx; color: #b44dff; padding: 0 8rpx; }
.ref-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.ref-img-wrap { position: relative; width: calc((100% - 24rpx) / 3); aspect-ratio: 1; }
.ref-img { width: 100%; height: 100%; border-radius: 12rpx; }
.ref-del { position: absolute; top: -8rpx; right: -8rpx; width: 36rpx; height: 36rpx; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; }
.ref-del-icon { font-size: 24rpx; color: #fff; line-height: 1; }
.ref-add { width: calc((100% - 24rpx) / 3); aspect-ratio: 1; border: 2rpx dashed rgba(255,255,255,0.12); border-radius: 12rpx; display: flex; align-items: center; justify-content: center; }
.ref-add-icon { font-size: 44rpx; color: rgba(255,255,255,0.2); }
.size-grid { display: flex; flex-wrap: wrap; gap: 14rpx; }
.size-item { width: calc(33.33% - 10rpx); display: flex; flex-direction: column; }
.size-label { font-size: 20rpx; color: rgba(255,255,255,0.35); margin-bottom: 4rpx; }
.size-input { height: 60rpx; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.06); border-radius: 8rpx; padding: 0 10rpx; font-size: 24rpx; color: rgba(255,255,255,0.75); }
.material-cat { margin-bottom: 14rpx; }
.cat-header { display: flex; align-items: center; margin-bottom: 4rpx; }
.cat-title { font-size: 24rpx; color: #b44dff; font-weight: bold; flex: 1; }
.cat-del { font-size: 28rpx; color: rgba(255,255,255,0.2); padding: 0 8rpx; }
.add-btns { margin-top: 14rpx; }
.add-row { padding: 14rpx; border: 2rpx dashed rgba(255,255,255,0.1); border-radius: 12rpx; display: flex; justify-content: center; }
.add-text { font-size: 24rpx; color: #b44dff; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: flex-end; }
.modal-card { width: 100%; background: #1A1D24; border-radius: 32rpx 32rpx 0 0; padding: 36rpx 30rpx 60rpx; max-height: 80vh; overflow-y: auto; }
.modal-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.modal-title { font-size: 30rpx; font-weight: bold; color: rgba(255,255,255,0.9); }
.modal-close-btn { width: 44rpx; height: 44rpx; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 24rpx; color: rgba(255,255,255,0.5); }
.type-selector { display: flex; gap: 12rpx; margin-bottom: 20rpx; }
.type-btn { flex: 1; padding: 14rpx 0; text-align: center; border-radius: 14rpx; background: rgba(255,255,255,0.04); font-size: 24rpx; color: rgba(255,255,255,0.5); }
.type-btn.active { background: rgba(180,77,255,0.15); color: #b44dff; font-weight: bold; }
.modal-field { margin-bottom: 18rpx; }
.modal-label { font-size: 22rpx; color: rgba(255,255,255,0.4); display: block; margin-bottom: 6rpx; }
.modal-input { height: 68rpx; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12rpx; padding: 0 16rpx; font-size: 26rpx; color: rgba(255,255,255,0.8); }
.modal-textarea { width: 100%; min-height: 120rpx; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12rpx; padding: 14rpx 16rpx; font-size: 26rpx; color: rgba(255,255,255,0.8); box-sizing: border-box; }
.modal-actions { display: flex; gap: 16rpx; margin-top: 24rpx; }
.modal-btn { flex: 1; height: 80rpx; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; }
.modal-btn-del { background: rgba(244,67,54,0.15); border: 1px solid rgba(244,67,54,0.25); }
.modal-btn-text-del { font-size: 26rpx; color: #f44336; font-weight: bold; }
.modal-btn-save { background: linear-gradient(135deg, #b44dff, #7c3aed); }
.modal-btn-text-save { font-size: 26rpx; color: #fff; font-weight: bold; }
.countdown-row { display: flex; justify-content: space-between; align-items: center; }
.countdown-left { display: flex; align-items: baseline; }
.countdown-num { font-size: 64rpx; font-weight: bold; color: #b44dff; }
.countdown-label { font-size: 26rpx; color: rgba(255,255,255,0.35); margin-left: 2rpx; }
.no-date { font-size: 26rpx; color: rgba(255,255,255,0.35); }
.countdown-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10rpx; }
.remind-label { font-size: 20rpx; color: rgba(255,255,255,0.35); }
.remind-options { display: flex; gap: 8rpx; }
.remind-tag { font-size: 20rpx; padding: 6rpx 18rpx; border-radius: 16rpx; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.3); }
.remind-tag.active { background: #b44dff; color: #fff; }
.date-pick { font-size: 24rpx; color: #b44dff; }
.room-card { display: flex; align-items: center; gap: 12rpx; padding: 24rpx 30rpx; margin-bottom: 20rpx; }
.room-card-icon { font-size: 34rpx; }
.room-card-text { font-size: 28rpx; color: #b44dff; font-weight: bold; flex: 1; }
.budget-dot { width: 14rpx; height: 14rpx; border-radius: 50%; flex-shrink: 0; }
.dot-ok { background: #8CAF9E; } .dot-warn { background: #C4A87C; } .dot-over { background: #C49B9B; } .dot-none { background: rgba(255,255,255,0.15); }
.bottom-actions { width: 100%; display: flex; gap: 20rpx; margin-top: 4rpx; }
.btn { flex: 1; height: 88rpx; border-radius: 50rpx; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.btn:active { transform: scale(0.96); }
.btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.12); }
.btn-text-outline { font-size: 28rpx; color: rgba(255,255,255,0.8); font-weight: bold; }
.btn-primary { background: linear-gradient(135deg, #b44dff, #7c3aed); box-shadow: 0 0 24rpx rgba(180,77,255,0.35); }
.btn-text-primary { font-size: 28rpx; color: #fff; font-weight: bold; }
.type-tabs{display:flex;gap:12rpx;margin-bottom:16rpx;}
.type-tab{flex:1;padding:14rpx 0;text-align:center;border-radius:16rpx;background:rgba(255,255,255,0.04);font-size:24rpx;color:rgba(255,255,255,0.5);}
.type-tab.active{background:rgba(180,77,255,0.15);color:#b44dff;font-weight:bold;}
.cat-add-btn{padding:10rpx 0;text-align:center;border:1rpx dashed rgba(180,77,255,0.2);border-radius:10rpx;margin-top:6rpx;}
.cat-add-text{font-size:22rpx;color:#b44dff;}
.sub-item-row{display:flex;align-items:center;padding:8rpx 0 8rpx 12rpx;}
.sub-item-name{flex:1;font-size:24rpx;color:rgba(255,255,255,0.7);}
.sub-item-del{font-size:22rpx;color:rgba(255,255,255,0.2);padding:0 6rpx;flex-shrink:0;}
.material-title-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10rpx;}
.manage-btn{font-size:22rpx;color:rgba(255,255,255,0.4);padding:6rpx 10rpx;flex-shrink:0;}
.manage-btn.disabled{color:rgba(255,255,255,0.12);}
/* 进度条 */
.ready-tag{font-size:20rpx;color:#8CAF9E;background:rgba(140,175,158,0.12);padding:4rpx 14rpx;border-radius:12rpx;font-weight:bold;}
.mat-progress-wrap{display:flex;align-items:center;gap:12rpx;margin-bottom:6rpx;}
.mat-progress-bar{flex:1;height:14rpx;background:rgba(255,255,255,0.08);border-radius:7rpx;overflow:hidden;}
.mat-progress-bar.progress-glow{box-shadow:0 0 16rpx rgba(140,175,158,0.4);}
.mat-progress-fill{height:100%;border-radius:7rpx;transition:width 0.4s cubic-bezier(0.4,0,0.2,1);}
.mat-progress-text{font-size:24rpx;color:rgba(255,255,255,0.5);font-weight:bold;width:60rpx;text-align:right;}
.mat-progress-detail{font-size:20rpx;color:rgba(255,255,255,0.25);}
/* 勾选圆圈 */
.sub-item-check{width:28rpx;height:28rpx;border-radius:50%;border:2rpx solid rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;margin-right:10rpx;font-size:16rpx;flex-shrink:0;color:transparent;}
.sub-item-check.done{border-color:#8CAF9E;background:#8CAF9E;color:#fff;}
/* 状态标签 */
.status-pill{font-size:18rpx;padding:2rpx 14rpx;border-radius:16rpx;flex-shrink:0;font-weight:bold;}
.status-pending{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);}
.status-ordered,.status-making{background:rgba(196,168,124,0.2);color:#C4A87C;}
.status-received,.status-done{background:rgba(140,175,158,0.2);color:#8CAF9E;}
.mat-check-circle{font-size:24rpx;margin-right:8rpx;flex-shrink:0;}
.mat-check-circle .check-active{color:#4caf50;}
.mat-batch-bar{position:fixed;bottom:0;left:0;right:0;height:100rpx;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:space-around;z-index:10;}
.mat-batch-bar .batch-btn{font-size:26rpx;color:rgba(255,255,255,0.8);padding:10rpx 24rpx;}
.mat-batch-bar .batch-btn.disabled{color:rgba(255,255,255,0.2);}
.mat-batch-bar .batch-delete{font-size:26rpx;color:#ff6b6b;font-weight:bold;padding:10rpx 24rpx;}
.plan-btn { padding: 20rpx; text-align: center; font-size: 26rpx; color: #b44dff; border: 1px dashed rgba(180,77,255,0.3); border-radius: 16rpx; margin: 8rpx 0; }
.plan-section { margin-bottom: 14rpx; }
.plan-section-title { font-size: 24rpx; font-weight: bold; color: rgba(255,255,255,0.75); display: block; margin-bottom: 6rpx; }
.plan-item { font-size: 22rpx; color: rgba(255,255,255,0.55); display: block; line-height: 1.6; }
.plan-total { color: #b44dff; font-weight: bold; }
.plan-material-cat { margin-bottom: 6rpx; }
.plan-cat-title { font-size: 22rpx; color: rgba(255,255,255,0.6); font-weight: bold; display: block; }
</style>
