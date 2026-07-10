<template>
  <view class="page">
    <view class="header"><text class="main-title">我的企划</text></view>

    <view v-if="projects.length === 0" class="empty-state">
      <text class="empty-icon">📋</text><text class="empty-text">还没有企划</text><text class="empty-hint">还没有企划，点击下方按钮创建</text>
    </view>

    <view v-else class="project-list">
      <view v-for="(item, idx) in projects" :key="item.id" class="card swipe-card" @touchstart="touchStart($event, idx)" @touchend="touchEnd" @tap="goDetail(item.id)">
        <view class="card-header"><text class="project-name">{{ item.roleName }}</text><text class="project-days">{{ item.daysLeft }}天</text></view>
        <view class="card-body">
          <view class="info-row"><text class="info-label">总预算</text><text class="info-value">¥{{ item.totalBudget }}</text></view>
          <view class="info-row"><text class="info-label">进度</text>
            <view class="progress-wrap"><view class="progress-bar"><view class="progress-fill" :style="{ width: item.progress + '%' }"></view></view><text class="progress-text">{{ item.progress }}%</text></view>
          </view>
        </view>
        <view v-show="deleteIdx === idx" class="delete-zone" @click.stop="removeItem(idx)"><text>删除</text></view>
      </view>
    </view>

    <view class="fab-btn" @tap="handleCreate"><text class="fab-text">＋ 新建企划</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSwipeDelete } from '../../composables/useSwipeDelete'

interface ProjectItem { id: string; roleName: string; totalBudget: number; progress: number; daysLeft: number }
const projects = ref<ProjectItem[]>([])
const { deleteIdx, touchStart, touchEnd, confirmDelete } = useSwipeDelete()

const goDetail = (id: string) => { if (deleteIdx.value !== -1) { deleteIdx.value = -1; return }; uni.navigateTo({ url: `/pages/project/detail?id=${id}` }) }
const removeItem = (idx: number) => { confirmDelete(() => { projects.value.splice(idx, 1); saveProjects() }) }
const handleCreate = () => { uni.showModal({ title: '新建企划', editable: true, placeholderText: '输入角色名', success: (res) => { if (res.confirm && res.content) { const id = Date.now().toString(); projects.value.unshift({ id, roleName: res.content, totalBudget: 0, progress: 0, daysLeft: 0 }); saveProjects(); goDetail(id) } } }) }
const saveProjects = () => uni.setStorageSync('cosplan_projects', projects.value)
onMounted(() => { try { const d = uni.getStorageSync('cosplan_projects'); if (Array.isArray(d)) projects.value = d } catch {} })
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
</style>
