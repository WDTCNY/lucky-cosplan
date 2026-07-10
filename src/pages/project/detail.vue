<template>
  <view class="page">
    <view class="header anim-fadeInUp">
      <text class="role-name">{{ project.roleName }}</text>
    </view>

    <view class="card glass anim-fadeInUp anim-d1">
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

    <view class="card glass anim-fadeInUp anim-d3">
      <text class="section-title">物料清单</text>
      <text class="section-sub">总工期：{{ totalDays }}天</text>
      <view v-for="(cat, catIdx) in project.materials" :key="catIdx" class="material-cat">
        <view class="cat-header">
          <text class="cat-title">{{ cat.category }}</text>
          <text class="cat-del" @tap="removeCategory(catIdx)">×</text>
        </view>
        <view v-for="(item, i) in cat.items" :key="i" class="material-item" @tap="editMaterial(catIdx, i)">
          <text class="check-icon" @tap.stop="toggleMaterial(catIdx, i)">{{ item.done ? '✅' : '⬜' }}</text>
          <text class="material-name" :class="{ done: item.done }">{{ item.name }}</text>
          <text class="material-qty">×{{ item.quantity || 1 }}</text>
          <text class="material-days">{{ item.days }}天</text>
          <text class="material-del" @tap.stop="removeMaterial(catIdx, i)">×</text>
        </view>
      </view>
      <view class="add-btns">
        <view class="add-row" @tap="addMaterial"><text class="add-text">＋ 添加物料</text></view>
      </view>
      <view v-if="editingMaterial" class="modal-overlay" @tap="editingMaterial = null">
        <view class="modal-card" @tap.stop>
          <text class="modal-title">{{ editingMaterial.isNew ? '添加物料' : '编辑物料' }}</text>
          <view class="modal-field">
            <text class="modal-label">品类</text>
            <input class="modal-input" v-model="editingMaterial.category" placeholder="服装/假发/道具/化妆/其他" />
          </view>
          <view class="modal-field">
            <text class="modal-label">物品名</text>
            <input class="modal-input" v-model="editingMaterial.name" placeholder="物品名称" />
          </view>
          <view class="modal-row">
            <view class="modal-field half">
              <text class="modal-label">数量</text>
              <input class="modal-input" type="digit" v-model="editingMaterial.quantity" placeholder="1" />
            </view>
            <view class="modal-field half">
              <text class="modal-label">工期(天)</text>
              <input class="modal-input" type="digit" v-model="editingMaterial.days" placeholder="天数" />
            </view>
          </view>
          <view class="modal-field">
            <text class="modal-label">制作思路/流程</text>
            <textarea class="modal-textarea" v-model="editingMaterial.process" placeholder="描述制作流程..." />
          </view>
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
    </view>

    <view class="card glass anim-fadeInUp anim-d4">
      <text class="section-title">采购链接</text>
      <text class="section-sub">总预算：<text class="budget-total">¥{{ totalBudget }}</text></text>
      <view v-for="(link, idx) in project.links" :key="idx" class="link-item">
        <text class="link-platform">{{ link.platform }}</text>
        <text class="link-name">{{ link.name }}</text>
        <text class="link-price">¥{{ link.price }}</text>
        <text class="link-del" @tap="removeLink(idx)">×</text>
      </view>
      <view class="add-row" @tap="addLink"><text class="add-text">＋ 添加链接</text></view>
    </view>

    <view class="card glass anim-fadeInUp anim-d5">
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
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { getTotalSpent } from '../../utils/budget'

interface MaterialItem { name: string; done: boolean; days: string; quantity: string; process: string; note: string }
interface MaterialCategory { category: string; items: MaterialItem[] }
interface PurchaseLink { platform: string; name: string; price: string }
interface Sizes { height: string; weight: string; bust: string; waist: string; hip: string; shoe: string }
interface Project { id: string; roleName: string; refImages: string[]; sizes: Sizes; materials: MaterialCategory[]; links: PurchaseLink[]; targetDate: string; remindDays: number }

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
}

const isEditing = ref(true)
const isNewMode = ref(false)
const editingMaterial = ref<EditingMaterial | null>(null)

const project = reactive<Project>({
  id: '', roleName: '新企划', refImages: [],
  sizes: { height: '', weight: '', bust: '', waist: '', hip: '', shoe: '' },
  materials: [
    { category: '服装类', items: [{ name: '上衣', done: false, days: '3', quantity: '1', process: '', note: '' }, { name: '下装', done: false, days: '3', quantity: '1', process: '', note: '' }] },
    { category: '假发', items: [{ name: '假发造型', done: false, days: '2', quantity: '1', process: '', note: '' }] },
    { category: '道具', items: [{ name: '道具制作', done: false, days: '5', quantity: '1', process: '', note: '' }] },
    { category: '材料', items: [{ name: '布料', done: false, days: '1', quantity: '1', process: '', note: '' }] },
  ], links: [], targetDate: '', remindDays: 3,
})

const totalDays = computed(() => { let s = 0; project.materials.forEach(c => c.items.forEach(i => s += parseFloat(i.days) || 0)); return s })
const totalBudget = computed(() => { let s = 0; project.links.forEach(l => s += parseFloat(l.price) || 0); return s.toFixed(2) })
const daysLeft = computed(() => { if (!project.targetDate) return '--'; const d = Math.ceil((new Date(project.targetDate).getTime() - Date.now()) / 86400000); return d < 0 ? 0 : d })

const addRefImage = () => { uni.chooseImage({ count: 9 - project.refImages.length, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: res => { (res.tempFilePaths as string[]).forEach((p: string) => project.refImages.push(p)) } }) }
const removeRefImage = (idx: number) => { project.refImages.splice(idx, 1) }

const toggleMaterial = (c: number, i: number) => { project.materials[c].items[i].done = !project.materials[c].items[i].done }

const addMaterial = () => { editingMaterial.value = { isNew: true, catIdx: project.materials.length, itemIdx: 0, category: '', name: '', quantity: '1', days: '1', process: '', note: '' } }

const editMaterial = (catIdx: number, itemIdx: number) => {
  const item = project.materials[catIdx]?.items[itemIdx]
  if (!item) return
  editingMaterial.value = { isNew: false, catIdx, itemIdx, category: project.materials[catIdx].category, name: item.name, quantity: item.quantity || '1', days: item.days, process: item.process || '', note: item.note || '' }
}

const saveMaterial = () => {
  const em = editingMaterial.value
  if (!em || !em.name || !em.category) { uni.showToast({ title: '请填写品类和物品名', icon: 'none' }); return }
  if (em.isNew) {
    let cat = project.materials.find(c => c.category === em.category)
    if (cat) { cat.items.push({ name: em.name, done: false, days: em.days, quantity: em.quantity, process: em.process, note: em.note }) }
    else { project.materials.push({ category: em.category, items: [{ name: em.name, done: false, days: em.days, quantity: em.quantity, process: em.process, note: em.note }] }) }
  } else {
    const cat = project.materials[em.catIdx]
    if (cat) {
      const item = cat.items[em.itemIdx]
      if (item) { cat.category = em.category; item.name = em.name; item.days = em.days; item.quantity = em.quantity; item.process = em.process; item.note = em.note }
    }
  }
  editingMaterial.value = null
}

const deleteEditingMaterial = () => {
  const em = editingMaterial.value
  if (!em || em.isNew) { editingMaterial.value = null; return }
  project.materials[em.catIdx]?.items.splice(em.itemIdx, 1)
  if (project.materials[em.catIdx]?.items.length === 0) project.materials.splice(em.catIdx, 1)
  editingMaterial.value = null
}

const removeMaterial = (c: number, i: number) => { project.materials[c]?.items.splice(i, 1); if (project.materials[c]?.items.length === 0) project.materials.splice(c, 1) }
const removeCategory = (idx: number) => { project.materials.splice(idx, 1) }

const addLink = () => project.links.push({ platform: '淘宝', name: '新物品', price: '0' })
const removeLink = (i: number) => project.links.splice(i, 1)

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

const handleSaveProject = () => {
  if (isNewMode.value) {
    projectId = Date.now().toString()
    project.id = projectId
    saveToStorage()
    uni.showToast({ title: '企划已创建', icon: 'success' })
    isNewMode.value = false
  } else {
    saveToStorage()
    uni.showToast({ title: '已保存', icon: 'success' })
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const options = (pages[pages.length - 1] as any)?.options || {}
  if (options.new === '1' && options.roleName) {
    isNewMode.value = true
    project.roleName = decodeURIComponent(options.roleName)
    project.id = ''
  } else {
    projectId = options.id || Date.now().toString()
    const all = uni.getStorageSync('cosplan_projects') || []
    const found = all.find((p: Project) => p.id === projectId)
    if (found) Object.assign(project, found)
    project.id = projectId
  }
  if (!isNewMode.value) {
    watch(project, () => saveToStorage(), { deep: true })
  }
})
</script>

<style lang="scss" scoped>
/* ========================================
   PROJECT DETAIL - Deep Professional Dark
   ======================================== */

.page { min-height: 100vh; background: #1B1725; padding: 40rpx 30rpx 120rpx; }

.anim-fadeInUp { animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both; }
.anim-d1 { animation-delay: 0.04s; }
.anim-d2 { animation-delay: 0.08s; }
.anim-d3 { animation-delay: 0.12s; }
.anim-d4 { animation-delay: 0.16s; }
.anim-d5 { animation-delay: 0.20s; }
.anim-d6 { animation-delay: 0.24s; }
.anim-d7 { animation-delay: 0.28s; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.header { margin-bottom: 24rpx; }
.role-name { font-size: 40rpx; font-weight: bold; color: rgba(255,255,255,0.95); }

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
.material-item { display: flex; align-items: center; padding: 10rpx 0; }
.check-icon { font-size: 28rpx; margin-right: 10rpx; flex-shrink: 0; }
.material-name { flex: 1; font-size: 26rpx; color: rgba(255,255,255,0.75); }
.material-name.done { color: rgba(255,255,255,0.25); text-decoration: line-through; }
.material-qty { font-size: 20rpx; color: rgba(255,255,255,0.3); margin: 0 8rpx; }
.material-days { font-size: 20rpx; color: rgba(255,255,255,0.3); width: 56rpx; text-align: center; }
.material-del { font-size: 24rpx; color: rgba(255,255,255,0.2); padding: 0 6rpx; flex-shrink: 0; }
.add-btns { margin-top: 14rpx; }
.add-row { padding: 14rpx; border: 2rpx dashed rgba(255,255,255,0.1); border-radius: 12rpx; display: flex; justify-content: center; }
.add-text { font-size: 24rpx; color: #b44dff; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: flex-end; }
.modal-card { width: 100%; background: #1A1D24; border-radius: 32rpx 32rpx 0 0; padding: 36rpx 30rpx 60rpx; max-height: 80vh; overflow-y: auto; }
.modal-title { font-size: 30rpx; font-weight: bold; color: rgba(255,255,255,0.9); display: block; margin-bottom: 24rpx; text-align: center; }
.modal-field { margin-bottom: 18rpx; }
.modal-label { font-size: 22rpx; color: rgba(255,255,255,0.4); display: block; margin-bottom: 6rpx; }
.modal-input { height: 68rpx; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12rpx; padding: 0 16rpx; font-size: 26rpx; color: rgba(255,255,255,0.8); }
.modal-textarea { width: 100%; min-height: 120rpx; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12rpx; padding: 14rpx 16rpx; font-size: 26rpx; color: rgba(255,255,255,0.8); box-sizing: border-box; }
.modal-row { display: flex; gap: 16rpx; }
.modal-row .modal-field { flex: 1; }
.modal-actions { display: flex; gap: 16rpx; margin-top: 24rpx; }
.modal-btn { flex: 1; height: 80rpx; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; }
.modal-btn-del { background: rgba(244,67,54,0.15); border: 1px solid rgba(244,67,54,0.25); }
.modal-btn-text-del { font-size: 26rpx; color: #f44336; font-weight: bold; }
.modal-btn-save { background: linear-gradient(135deg, #b44dff, #7c3aed); }
.modal-btn-text-save { font-size: 26rpx; color: #fff; font-weight: bold; }

.link-item { display: flex; align-items: center; padding: 12rpx 0; }
.link-platform { font-size: 20rpx; background: #7c3aed; color: #fff; padding: 4rpx 10rpx; border-radius: 8rpx; margin-right: 10rpx; }
.link-name { flex: 1; font-size: 26rpx; color: rgba(255,255,255,0.7); }
.link-price { font-size: 26rpx; font-weight: bold; color: #ff6b6b; margin-right: 10rpx; }
.link-del { font-size: 24rpx; color: rgba(255,255,255,0.2); padding: 0 6rpx; }
.budget-total { color: #ff6b6b; font-weight: bold; }

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
.dot-ok { background: #8CAF9E; }
.dot-warn { background: #C4A87C; }
.dot-over { background: #C49B9B; }
.dot-none { background: rgba(255,255,255,0.15); }

.bottom-actions { width: 100%; display: flex; gap: 20rpx; margin-top: 4rpx; }
.btn { flex: 1; height: 88rpx; border-radius: 50rpx; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.btn:active { transform: scale(0.96); }
.btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.12); }
.btn-text-outline { font-size: 28rpx; color: rgba(255,255,255,0.8); font-weight: bold; }
.btn-primary { background: linear-gradient(135deg, #b44dff, #7c3aed); box-shadow: 0 0 24rpx rgba(180,77,255,0.35); }
.btn-text-primary { font-size: 28rpx; color: #fff; font-weight: bold; }
</style>
