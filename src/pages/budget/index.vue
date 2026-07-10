<template>
  <view class="page">
    <view class="header"><text class="main-title">花费预算</text></view>

    <view v-if="list.length === 0" class="empty-state"><text class="empty-icon">💰</text><text class="empty-text">还没有预算</text></view>

    <view v-else class="list">
      <view v-for="(item, idx) in list" :key="item.projectId" class="card swipe-card" @touchstart="touchStart($event, idx)" @touchend="touchEnd" @tap="goDetail(item.projectId)">
        <view class="card-top"><text class="budget-name">{{ item.roleName }}</text><text class="budget-status" :class="'badge-' + budgetStatus(item)">{{ budgetLabel(item) }}</text></view>
        <view class="budget-row"><text class="budget-label">总预算</text><text class="budget-value">¥{{ item.totalBudget }}</text></view>
        <view class="budget-row"><text class="budget-label">已花费</text><text class="budget-value spent">¥{{ getSpent(item.projectId) }}</text></view>
        <view class="progress-bar"><view class="progress-fill" :class="'bar-' + budgetStatus(item)" :style="{ width: budgetPercent(item) + '%' }"></view></view>
        <view v-show="deleteIdx === idx" class="delete-zone" @click.stop="removeItem(idx)"><text>删除</text></view>
      </view>
    </view>

    <view class="fab-btn" @tap="handleCreate"><text class="fab-text">＋ 新建预算</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAllBudgets, getTotalSpent } from '../../utils/budget'
import { useSwipeDelete } from '../../composables/useSwipeDelete'

interface BudgetItem { projectId: string; roleName: string; totalBudget: number }
const list = ref<BudgetItem[]>([])
const { deleteIdx, touchStart, touchEnd, confirmDelete } = useSwipeDelete()

const getSpent = (pid: string) => getTotalSpent(pid).toFixed(0)
const budgetPercent = (item: BudgetItem) => Math.min(100, Math.round((getTotalSpent(item.projectId) / item.totalBudget) * 100))
const budgetStatus = (item: BudgetItem) => { const p = budgetPercent(item); if (p >= 100) return 'over'; if (p >= 80) return 'warn'; return 'ok' }
const budgetLabel = (item: BudgetItem) => { const p = budgetPercent(item); if (p >= 100) return '超支'; if (p >= 80) return '预警'; return '正常' }
const goDetail = (pid: string) => { if (deleteIdx.value !== -1) { deleteIdx.value = -1; return }; uni.setStorageSync('cosplan_current_budget_id', pid); uni.navigateTo({ url: '/pages/budget/detail' }) }
const removeItem = (idx: number) => { confirmDelete(() => { list.value.splice(idx, 1); uni.setStorageSync('cosplan_budget_list', list.value) }) }
const handleCreate = () => { uni.showModal({ title:'新建预算', editable:true, placeholderText:'输入角色名', success:(res)=>{ if(res.confirm&&res.content){ const pid=Date.now().toString(); list.value.unshift({ projectId:pid, roleName:res.content, totalBudget:2000 }); uni.setStorageSync('cosplan_budget_list', list.value); goDetail(pid) } } }) }
onMounted(() => { try { const d = uni.getStorageSync('cosplan_budget_list'); if (Array.isArray(d)) list.value = d } catch {} })
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 50rpx 30rpx 120rpx; }
.header { margin-bottom: 30rpx; }
.main-title { font-size: 40rpx; font-weight: bold; color: #fff; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 0; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: rgba(255,255,255,0.9); font-weight: bold; }
.card { width: 100%; background: rgba(255,255,255,0.9); border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; }
.swipe-card { position: relative; overflow: hidden; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14rpx; }
.budget-name { font-size: 28rpx; font-weight: bold; color: #333; }
.budget-status { font-size: 20rpx; padding: 4rpx 14rpx; border-radius: 12rpx; }
.badge-ok { background: #e8f5e9; color: #4caf50; }
.badge-warn { background: #fff3e0; color: #ff9800; }
.badge-over { background: #ffebee; color: #f44336; }
.budget-row { display: flex; justify-content: space-between; margin-bottom: 6rpx; }
.budget-label { font-size: 24rpx; color: #999; }
.budget-value { font-size: 28rpx; color: #333; font-weight: bold; }
.budget-value.spent { color: #ff6b6b; }
.progress-bar { height: 12rpx; background: #e8e8e8; border-radius: 6rpx; overflow: hidden; margin-top: 6rpx; }
.progress-fill { height: 100%; border-radius: 6rpx; }
.bar-ok { background: #4caf50; }
.bar-warn { background: #ff9800; }
.bar-over { background: #f44336; }
.fab-btn { position: fixed; bottom: 60rpx; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #667eea, #764ba2); padding: 24rpx 60rpx; border-radius: 50rpx; box-shadow: 0 8rpx 24rpx rgba(102,126,234,0.4); }
.fab-text { font-size: 28rpx; color: #fff; font-weight: bold; }
</style>