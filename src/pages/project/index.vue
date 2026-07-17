<template>
  <view class="page">
    <!-- Search bar -->
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input class="search-input" v-model="searchQuery" placeholder="搜索企划角色名" placeholder-style="color: rgba(255,255,255,0.3)" @input="onSearchInput" />
      <text v-if="searchQuery" class="search-clear" @tap="searchQuery = ''">✕</text>
    </view>

    <view v-if="filteredProjects.length === 0" class="empty-state">
      <text class="empty-icon">📋</text><text class="empty-text">还没有企划</text><text class="empty-hint">还没有企划，点击下方按钮创建</text>
    </view>

    <view v-else class="project-list">
      <view v-for="(group, roleName) in groupedProjects" :key="roleName" class="role-group">
        <!-- Single version: show card directly -->
        <template v-if="group.length === 1">
          <view v-for="(item, idx) in group" :key="item.id" class="card swipe-card" @touchstart="touchStart($event, projects.indexOf(item))" @touchend="touchEnd" @tap="goDetail(item.id)">
            <view class="card-header">
              <text class="project-name">{{ item.version }}</text>
              <text class="project-days">{{ getDaysLeft(item) }}天</text>
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
        </template>
        <!-- Multiple versions: foldable group card -->
        <template v-else>
          <view class="card group-card" @tap="toggleGroup(roleName)">
            <view class="group-card-header">
              <view class="group-card-info">
                <text class="group-card-role">{{ roleName }}</text>
                <text class="group-card-count">{{ group.length }} 个版本</text>
              </view>
              <text class="group-card-arrow" :class="{ 'arrow-expanded': expandedGroups[roleName] }">▼</text>
            </view>
          </view>
          <view class="group-children" :class="{ 'group-open': expandedGroups[roleName] }">
            <view v-for="(item, idx) in group" :key="item.id" class="card swipe-card sub-card" @touchstart="touchStart($event, projects.indexOf(item))" @touchend="touchEnd" @tap="goDetail(item.id)">
              <view class="card-header">
                <text class="project-name">{{ item.version }}</text>
                <text class="project-days">{{ getDaysLeft(item) }}天</text>
              </view>
              <view class="card-body">
                <view class="info-row"><text class="info-label">总预算</text><text class="info-value">¥{{ item.totalBudget }}</text></view>
                <view class="info-row"><text class="info-label">进度</text>
                  <view class="progress-wrap"><view class="progress-bar"><view class="progress-fill" :style="{ width: getProgress(item) + '%', background: getProgressColor(item) }"></view></view><text class="progress-text">{{ getProgress(item) }}%</text></view>
                </view>
              </view>
              <view v-show="deleteIdx === projects.indexOf(item)" class="delete-zone" @click.stop="removeItem(projects.indexOf(item))"><text>删除</text></view>
            </view>
          </view>
        </template>
      </view>
    </view>

    <!-- Create modal -->
    <view v-if="showCreateModal" class="modal-overlay" @tap="showCreateModal = false">
      <view class="modal-card" @tap.stop>
        <text class="modal-title">新建企划</text>
        <view class="modal-field">
          <text class="modal-label">选择已有角色</text>
          <view v-if="allRoles.length > 0" class="role-options">
            <text v-for="r in allRoles" :key="r" class="role-option" :class="{ active: existingRoleName === r }" @tap="existingRoleName = r">{{ r }}</text>
          </view>
          <text v-else class="modal-hint">暂无已有角色</text>
        </view>
        <view class="modal-field">
          <text class="modal-label">或输入新角色名</text>
          <input class="modal-input" v-model="createRoleName" placeholder="输入角色名" />
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
import { onShow } from '@dcloudio/uni-app'
import { useSwipeDelete } from '../../composables/useSwipeDelete'
import { getDefaultVersion } from '../../utils/storage'

interface ProjectItem { id: string; roleName: string; version: string; totalBudget: number; progress: number; daysLeft: number; createdAt?: number }
const projects = ref<ProjectItem[]>([])
const { deleteIdx, touchStart, touchEnd, confirmDelete } = useSwipeDelete()

// Search
const searchQuery = ref('')
const filteredProjects = computed(() => {
  if (!searchQuery.value.trim()) return projects.value
  const q = searchQuery.value.trim().toLowerCase()
  return projects.value.filter(p => p.roleName.toLowerCase().includes(q))
})
function onSearchInput() {
  // reactive filtering via computed
}

const groupedProjects = computed(() => {
  const groups: Record<string, ProjectItem[]> = {}
  for (const p of filteredProjects.value) {
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
      for (const mat of cat.items) {
        total++
        const st = mat.status || 'pending'
        if (st === 'received' || st === 'done') done++
      }
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

function getDaysLeft(item: any): number {
  // Only show countdown when targetDate is set
  if (item.targetDate) {
    const diff = new Date(item.targetDate).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }
  // No targetDate → show 0 days
  return 0
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
  // Version naming: if user provided one, use it; otherwise auto-generate from storage
  const version = createVersion.value.trim() || getDefaultVersion(role)
  projects.value.unshift({ id, roleName: role, version, totalBudget: 0, progress: 0, daysLeft: 0, createdAt: Date.now() })
  saveProjects()
  showCreateModal.value = false
  goDetail(id)
}

const expandedGroups = ref<Record<string, boolean>>({})

function toggleGroup(roleName: string) {
  expandedGroups.value[roleName] = !expandedGroups.value[roleName]
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

const loadProjects = () => {
  try {
    const d = uni.getStorageSync('cosplan_projects')
    if (Array.isArray(d)) projects.value = d.map((p: any) => ({ ...p, version: p.version || `企划` }))
  } catch {}
}
const saveProjects = () => uni.setStorageSync('cosplan_projects', projects.value)
onMounted(() => loadProjects())

// uni-app page lifecycle - reload data when page becomes visible
onShow(() => { loadProjects() })
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 50rpx 30rpx 180rpx; display: flex; flex-direction: column; align-items: center; }
.header { margin-bottom: 30rpx; }
.main-title { font-size: 40rpx; font-weight: bold; color: #fff; }
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: rgba(255,255,255,0.9); font-weight: bold; margin-bottom: 8rpx; }
.empty-hint { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.card { width: 100%; background: rgba(255,255,255,0.9); border-radius: 20rpx; }
.swipe-card { position: relative; overflow: hidden; padding: 30rpx; margin-bottom: 20rpx; }
.project-list { width: 100%; margin-bottom: 40rpx; }
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

/* Group card (foldable) */
.group-card {
  padding: 30rpx;
  margin-bottom: 0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.group-card:active {
  transform: scale(0.98);
}
.group-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.group-card-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.group-card-role {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}
.group-card-count {
  font-size: 22rpx;
  color: #999;
}
.group-card-arrow {
  font-size: 28rpx;
  color: #999;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.arrow-expanded {
  transform: rotate(180deg);
}

/* Group children (expandable) */
.group-children {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.group-open {
  max-height: 2000rpx;
}
.sub-card {
  width: auto;
  margin-left: 20rpx;
  margin-right: 20rpx;
  margin-top: 14rpx;
  margin-bottom: 14rpx;
  box-sizing: border-box;
}

/* ---- Search Bar ---- */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10rpx;
  width: 100%;
  padding: 0 20rpx;
  height: 72rpx;
  margin-bottom: 20rpx;
  background: rgba(255,255,255,0.08);
  border-radius: 40rpx;
  border: 1px solid rgba(255,255,255,0.1);
}
.search-icon { font-size: 28rpx; }
.search-input { flex: 1; height: 56rpx; font-size: 24rpx; color: rgba(255,255,255,0.9); }
.search-clear { font-size: 24rpx; color: rgba(255,255,255,0.3); padding: 4rpx; }

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
