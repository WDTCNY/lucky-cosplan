<template>
  <view class="page">
    <view class="header"><text class="main-title">我的收藏</text></view>

    <view v-if="list.length === 0" class="empty-state"><text class="empty-icon">❤️</text><text class="empty-text">还没有收藏</text></view>

    <view v-else class="list">
      <view v-for="(role, idx) in list" :key="role.name" class="card swipe-card" @touchstart="touchStart($event, idx)" @touchend="touchEnd" @click="goDetail(role)">
        <view class="item-left"><text class="item-name">{{ role.name }}</text><text class="item-anime">《{{ role.anime }}》</text></view>
        <view class="item-right">
          <text class="item-score">{{ role.matchScore }}%</text>
          <text class="item-create-btn" @click.stop="goCreateProject(role)">＋企划</text>
        </view>
        <view v-show="deleteIdx === idx" class="delete-zone" @click.stop="removeItem(idx)"><text>删除</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFavorites, toggleFavorite } from '../../utils/storage'
import type { RoleItem } from '../../utils/storage'
import { useSwipeDelete } from '../../composables/useSwipeDelete'

const list = ref<RoleItem[]>([])
const { deleteIdx, touchStart, touchEnd, confirmDelete } = useSwipeDelete()

const goDetail = (role: RoleItem) => { if (deleteIdx.value !== -1) { deleteIdx.value = -1; return }; uni.setStorageSync('cosplan_selected_role', role); uni.navigateTo({ url: '/pages/detail/index' }) }
const goCreateProject = (role: RoleItem) => { uni.navigateTo({ url: '/pages/project/detail?roleName=' + encodeURIComponent(role.name) + '&new=1' }) }
const removeItem = (idx: number) => { confirmDelete(() => { toggleFavorite(list.value[idx]); list.value = getFavorites() }) }
onMounted(() => { list.value = getFavorites() })
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 50rpx 30rpx 60rpx; }
.header { margin-bottom: 30rpx; }
.main-title { font-size: 40rpx; font-weight: bold; color: #fff; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 0; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: rgba(255,255,255,0.9); font-weight: bold; }
.card { width: 100%; background: rgba(255,255,255,0.9); border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; }
.swipe-card { position: relative; overflow: hidden; display: flex; justify-content: space-between; align-items: center; }
.item-left { flex: 1; }
.item-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.item-anime { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }
.item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4rpx; }
.item-score { font-size: 30rpx; font-weight: bold; color: #667eea; }
.item-create-btn { font-size: 22rpx; color: #b44dff; padding: 6rpx 16rpx; border: 1px solid rgba(180,77,255,0.3); border-radius: 20rpx; margin-top: 6rpx; }
</style>