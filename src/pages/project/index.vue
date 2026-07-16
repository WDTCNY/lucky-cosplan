<template>
  <view class="page">
    <view class="header"><text class="main-title">我的企划</text></view>

    <view v-if="projects.length === 0" class="empty-state">
      <text class="empty-icon">📋</text><text class="empty-text">还没有企划</text><text class="empty-hint">还没有企划，点击下方按钮创建</text>
    </view>

    <view v-else class="project-list">
      <view v-for="(group, roleName) in groupedProjects" :key="roleName" class="role-group">
        <view class="role-header">
          <text class="role-name-title">{{ roleName }}</text>
          <text class="role-count">{{ group.length }} 个企划</text>
        </view>
        <view v-for="(item, idx) in group" :key="item.id" class="card swipe-card" @touchstart="touchStart($event, projects.indexOf(item))" @touchend="touchEnd" @tap="goDetail(item.id)">
          <view class="card-header">
            <text class="project-name">{{ item.version }}</text>
            <text class="project-days">{{ item.daysLeft }}天</text>
          </view>
          <view class="card-body">
            <view class="info-row"><text class="info-label">角色</text><text class="info-value">{{ item.roleName }}</text></view>
            <view class="info-row"><text class="info-label">总预算</text><text class="info-value">¥{{ item.totalBudget }}</text></view>
              <view class="info-row"><text class="info-label">进度</text>
              <view class="progress-wrap"><view class="progress-bar"><view class="progress-fill" :style="{ width: getProgress(item) + '%', background: getProgressColor(item) }"></view></view><text class="progress-text">{{ getProgress(item) }}%</text></view>
            </view>
          </view>
          <view v-show="deleteIdx === projects.indexOf(item)" class="delete-zone" @click.stop="removeItem(projects.indexOf(item))"><text>删除</text></view>
        </view>
      </view>
    </view>

    <!-- Create modal -->
    <view v-if="showCreateModal" class="modal-overlay" @tap="showCreateModal = false">
      <view class="modal-card" @tap.stop>
        <text class="modal-title">新建企划</text>
        <view class="modal-field">
          <text class="modal-label">选择已有角色</text>
          <view v-if="allRoles.length > 0" class="role-options">
            <text v-for="r in allRoles" :key="r" class="role-option" :class="{ active: existingRoleName === r }" @tap="existingRoleName = r; createRoleName = ''">{{ r }}</text>
          </view>
          <text v-else class="modal-hint">暂无已有角色</text>
        </view>
        <view class="modal-field">
          <text class="modal-label">或输入新角色名</text>
          <input class="modal-input" v-model="createRoleName" placeholder="输入角色名" @focus="existingRoleName = ''" />
        </view>
        <view class="modal-field">
          <text class="modal-label">版本名（可选）</text>
          <input class="modal-input" v-model="createVersion" placeholder="如：幕府版 / Cosplay正片" />
        </view>
        <view class="modal-actions">
          <view class="modal-btn modal-btn-cancel" @tap="showCreateModal = false"><text>取消</text></view>
          <view class="modal-btn modal-btn-save" @tap="confirmCreate"><text>创建企划</text></view>
        </view>
      </view>
    </view>

    <view class="fab-btn" @tap="handleCreate"><text class="fab-text">＋ 新建企划</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSwipeDelete } from '../../composables/useSwipeDelete'

interface ProjectItem { id: string; roleName: string; version: string; totalBudget: number; progress: number; daysLeft: number }
const projects = ref<ProjectItem[]>([])
const { deleteIdx, touchStart, touchEnd, confirmDelete } = useSwipeDelete()

const groupedProjects = computed(() => {
  const groups: Record<string, ProjectItem[]> = {}
  for (const p of projects.value) {
    if (!groups[p.roleName]) groups[p.roleName] = []
    groups[p.roleName].push(p)
  }
  return groups
})

function getProgress(item: any) {
  try {
    const all = uni.getStorageSync('cosplan_projects') || []
    const p = all.find((p: any) => p.id === item.id)
    if (!p || !Array.isArray(p.materials)) return 0
    let total = 0, done = 0
    for (const cat of p.materials) {
      if (!Array.isArray(cat.items)) continue
      for (const mat of cat.items) { total++; if (mat.done) done++ }
    }
    return total === 0 ? 0 : Math.round((done / total) * 100)
  } catch { return 0 }
}
function getProgressColor(item: any) {
  const p = getProgress(item)
  if (p >= 70) return '#8CAF9E'
  if (p >= 30) return '#C4A87C'
  return '#8E9E9E'
}

const goDetail = (id: string) => { if (deleteIdx.value !== -1) { deleteIdx.value = -1; return }; uni.navigateTo({ url: `/pages/project/detail?id=${id}` }) }
const removeItem = (idx: number) => { confirmDelete(() => { projects.value.splice(idx, 1); saveProjects() }) }

const showCreateModal = ref(false)
const createRoleName = ref('')
const createVersion = ref('')
const existingRoleName = ref('')

const handleCreate = () => { showCreateModal.value = true; createRoleName.value = ''; createVersion.value = ''; existingRoleName.value = '' }

const confirmCreate = () => {
  const role = (existingRoleName.value || createRoleName.value).trim()
  if (!role) { uni.showToast({ title: '请选择或输入角色名', icon: 'none' }); return }
  const id = Date.now().toString()
  const version = createVersion.value.trim() || `企划${Object.keys(groupedProjects.value).length + 1}`
  projects.value.unshift({ id, roleName: role, version, totalBudget: 0, progress: 0, daysLeft: 0 })
  saveProjects()
  showCreateModal.value = false
  goDetail(id)
}

const allRoles = computed(() => {
  const roles = new Set<string>()
  projects.value.forEach(p => roles.add(p.roleName))
  try {
    const warehouse: any[] = uni.getStorageSync('cosplan_warehouse') || []
    warehouse.forEach((w: any) => { if (w.characterName) roles.add(w.characterName) })
  } catch {}
  return [...roles].sort()
})

const saveProjects = () => uni.setStorageSync('cosplan_projects', projects.value)
onMounted(() => {
  try {
    const d = uni.getStorageSync('cosplan_projects')
    if (Array.isArray(d)) projects.value = d.map((p: any) => ({ ...p, version: p.version || `企划` }))
  } catch {}
})
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 50rpx 30rpx 120rpx; display: flex; flex-direction: column; align-items: center; }
.header { margin-bottom: 30rpx; }
.main-title { font-size: 40rpx; font-weight: bold; color: #fff; }
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: rgba(255,255,255,0.9); font-weight: bold; margin-bottom: 8rpx; }
.empty-hint { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.card { width: 100%; background: rgba(255,255,255,0.9); border-radius: 20rpx; }
.swipe-card { position: relative; overflow: hidden; padding: 30rpx; margin-bottom: 20rpx; }
.project-list { width: 100%; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; }
.project-name { font-size: 32rpx; font-weight: bold; color: #333; }
.project-days { font-size: 22rpx; color: #ff6b6b; background: #fff0f0; padding: 6rpx 16rpx; border-radius: 12rpx; }
.card-body { display: flex; flex-direction: column; gap: 14rpx; }
.info-row { display: flex; align-items: center; }
.info-label { font-size: 24rpx; color: #999; width: 100rpx; }
.info-value { font-size: 28rpx; color: #333; font-weight: bold; }
.progress-wrap { flex: 1; display: flex; align-items: center; gap: 12rpx; }
.progress-bar { flex: 1; height: 12rpx; background: #e8e8e8; border-radius: 6rpx; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 6rpx; }
.progress-text { font-size: 22rpx; color: #667eea; font-weight: bold; width: 60rpx; text-align: right; }
.fab-btn { position: fixed; bottom: 60rpx; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #667eea, #764ba2); padding: 24rpx 60rpx; border-radius: 50rpx; box-shadow: 0 8rpx 24rpx rgba(102,126,234,0.4); }
.fab-text { font-size: 28rpx; color: #fff; font-weight: bold; }
.role-group { margin-bottom: 28rpx; }
.role-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; padding: 0 8rpx; }
.role-name-title { font-size: 30rpx; font-weight: bold; color: rgba(255,255,255,0.9); }
.role-count { font-size: 22rpx; color: rgba(255,255,255,0.4); }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: flex-end; }
.modal-card { width: 100%; background: #fff; border-radius: 32rpx 32rpx 0 0; padding: 36rpx 30rpx 60rpx; max-height: 70vh; overflow-y: auto; }
.modal-title { font-size: 32rpx; font-weight: bold; color: #333; display: block; margin-bottom: 24rpx; text-align: center; }
.modal-field { margin-bottom: 18rpx; }
.modal-label { font-size: 24rpx; color: #666; display: block; margin-bottom: 8rpx; }
.modal-input { height: 68rpx; background: #f5f5f5; border-radius: 12rpx; padding: 0 16rpx; font-size: 26rpx; color: #333; }
.modal-hint { font-size: 22rpx; color: #999; }
.role-options { display: flex; flex-wrap: wrap; gap: 10rpx; }
.role-option { padding: 10rpx 22rpx; border-radius: 20rpx; background: #f5f5f5; font-size: 24rpx; color: #666; }
.role-option.active { background: #667eea; color: #fff; }
.modal-actions { display: flex; gap: 16rpx; margin-top: 24rpx; }
.modal-btn { flex: 1; height: 80rpx; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; }
.modal-btn-cancel { background: #f0f0f0; color: #666; }
.modal-btn-save { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-weight: bold; }
</style>
