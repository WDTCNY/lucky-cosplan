<template>
  <view class="page">
    <view class="header">
      <text class="main-title">历史记录</text>
      <text v-if="list.length > 0" class="clear-btn" @tap="handleClear">清空</text>
    </view>

    <view v-if="list.length === 0" class="empty-state">
      <text class="empty-icon">📋</text><text class="empty-text">暂无历史记录</text>
    </view>

    <view v-else class="list">
      <view v-for="(item, idx) in list" :key="item.timestamp" class="card swipe-card" @touchstart="touchStart($event, idx)" @touchend="touchEnd" @click="gotoResult(item)">
        <view class="card-top"><text class="card-title">角色推荐</text><text class="card-time">{{ formatTime(item.timestamp) }}</text></view>
        <view class="card-tags"><text class="tag">{{ item.input.height }}cm</text><text class="tag">{{ item.input.weight }}kg</text><text class="tag">{{ item.input.temperament }}</text></view>
        <view class="card-roles"><text v-for="r in item.data.roles.slice(0, 3)" :key="r.name" class="role-pill">{{ r.name }}</text></view>
        <view v-show="deleteIdx === idx" class="delete-zone" @click.stop="removeItem(idx)"><text>删除</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getHistory, clearHistory } from '../../utils/storage'
import type { HistoryItem } from '../../utils/storage'
import { useSwipeDelete } from '../../composables/useSwipeDelete'

const list = ref<HistoryItem[]>([])
const { deleteIdx, touchStart, touchEnd, confirmDelete } = useSwipeDelete()

const formatTime = (ts: number) => { const d = new Date(ts); const p = (n:number)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` }
const handleClear = () => { uni.showModal({ title:'确认清空', content:'确定要清空所有历史记录吗？', success:r=>{ if(r.confirm){ clearHistory(); list.value = [] } } }) }
const removeItem = (idx: number) => { confirmDelete(() => { list.value.splice(idx, 1); uni.setStorageSync('cosplan_history', list.value) }) }
const gotoResult = (item: HistoryItem) => { if (deleteIdx.value !== -1) { deleteIdx.value = -1; return }; uni.setStorageSync('cosplan_result', item); uni.navigateTo({ url:'/pages/result/index' }) }
onMounted(() => { list.value = getHistory() })
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 50rpx 30rpx 60rpx; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30rpx; }
.main-title { font-size: 40rpx; font-weight: bold; color: #fff; }
.clear-btn { font-size: 28rpx; color: rgba(255,255,255,0.7); padding: 8rpx 24rpx; background: rgba(255,255,255,0.15); border-radius: 20rpx; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 0; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: rgba(255,255,255,0.9); font-weight: bold; }
.card { width: 100%; background: rgba(255,255,255,0.9); border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; }
.swipe-card { position: relative; overflow: hidden; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.card-title { font-size: 28rpx; font-weight: bold; color: #333; }
.card-time { font-size: 20rpx; color: #999; }
.card-tags { display: flex; gap: 10rpx; margin-bottom: 12rpx; }
.tag { font-size: 20rpx; color: #667eea; background: #f0eeff; padding: 4rpx 12rpx; border-radius: 10rpx; }
.card-roles { display: flex; gap: 8rpx; flex-wrap: wrap; }
.role-pill { font-size: 20rpx; color: #555; background: #f5f5f5; padding: 4rpx 14rpx; border-radius: 10rpx; }
</style>