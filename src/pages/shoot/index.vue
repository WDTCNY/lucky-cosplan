<template>
  <view class="page">
    <view class="header"><text class="main-title">拍摄计划</text></view>
    <view v-if="list.length === 0" class="empty-state">
      <text class="empty-icon">📸</text><text class="empty-text">还没有拍摄计划</text><text class="empty-hint">点击下方按钮创建</text>
    </view>
    <view v-else class="list">
      <view v-for="(item, idx) in list" :key="item.id" class="card swipe-card" @touchstart="touchStart($event, idx)" @touchend="touchEnd" @tap="goDetail(item.id)">
        <view class="card-top"><text class="shoot-name">{{ item.roleName }}</text><text class="shoot-status" :class="'status-' + item.status">{{ statusLabel(item.status) }}</text></view>
        <view class="card-info"><text class="info-line">主题：{{ item.theme }}</text><text class="info-line">日期：{{ item.date || '未设置' }}</text><text v-if="item.date" class="countdown">倒计时 {{ countdown(item.date) }} 天</text></view>
        <view v-show="deleteIdx === idx" class="delete-zone" @click.stop="removeItem(idx)"><text>删除</text></view>
      </view>
    </view>
    <view class="fab-btn" @tap="handleCreate"><text class="fab-text">＋ 新建拍摄计划</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSwipeDelete } from '../../composables/useSwipeDelete'

interface ShootItem { id: string; roleName: string; theme: string; status: string; date: string }
const list = ref<ShootItem[]>([])
const { deleteIdx, touchStart, touchEnd, confirmDelete } = useSwipeDelete()

const statusLabel = (s: string) => { if (s === 'done') return '已完成'; if (s === 'active') return '进行中'; return '待开始' }
const countdown = (date: string) => { const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000); return diff < 0 ? 0 : diff }
const goDetail = (id: string) => { if (deleteIdx.value !== -1) { deleteIdx.value = -1; return }; uni.setStorageSync('cosplan_current_shoot_id', id); uni.navigateTo({ url: '/pages/shoot/detail' }) }
const removeItem = (idx: number) => { confirmDelete(() => { list.value.splice(idx, 1); uni.setStorageSync('cosplan_shoots', list.value) }) }
const handleCreate = () => { uni.showModal({ title: '新建拍摄', editable: true, placeholderText: '输入角色名', success: (res) => { if (res.confirm && res.content) { const id = Date.now().toString(); list.value.unshift({ id, roleName: res.content, theme: '', status: 'pending', date: '' }); uni.setStorageSync('cosplan_shoots', list.value); goDetail(id) } } }) }
onMounted(() => { try { const d = uni.getStorageSync('cosplan_shoots'); if (Array.isArray(d)) list.value = d } catch {} })
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 50rpx 30rpx 120rpx; }
.header { margin-bottom: 30rpx; }
.main-title { font-size: 40rpx; font-weight: bold; color: #fff; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 0; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: rgba(255,255,255,0.9); font-weight: bold; margin-bottom: 8rpx; }
.empty-hint { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.card { width: 100%; background: rgba(255,255,255,0.9); border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; }
.swipe-card { position: relative; overflow: hidden; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.shoot-name { font-size: 28rpx; font-weight: bold; color: #333; }
.shoot-status { font-size: 20rpx; padding: 4rpx 16rpx; border-radius: 12rpx; }
.status-pending { background: #f5f5f5; color: #999; }
.status-active { background: #e3f2fd; color: #2196f3; }
.status-done { background: #e8f5e9; color: #4caf50; }
.card-info { display: flex; flex-direction: column; gap: 6rpx; }
.info-line { font-size: 24rpx; color: #666; }
.countdown { font-size: 24rpx; color: #667eea; font-weight: bold; }
.fab-btn { position: fixed; bottom: 60rpx; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #667eea, #764ba2); padding: 24rpx 60rpx; border-radius: 50rpx; box-shadow: 0 8rpx 24rpx rgba(102,126,234,0.4); }
.fab-text { font-size: 28rpx; color: #fff; font-weight: bold; }
</style>