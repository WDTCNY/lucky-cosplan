<template>
  <view class="page">
    <view class="header"><text class="main-title">我的房间</text></view>
    <view v-if="list.length === 0" class="empty-state"><text class="empty-icon">🏠</text><text class="empty-text">还没有加入任何房间</text></view>
    <view v-else class="list">
      <view v-for="(room, idx) in list" :key="room.roomId" class="card swipe-card" @touchstart="touchStart($event, idx)" @touchend="touchEnd" @click="enterRoom(room)">
        <view class="card-header"><text class="room-name">{{ room.roomName }}</text><text class="room-id">{{ room.roomId }}</text></view>
        <view class="card-info"><text class="info-line">角色：{{ room.role }}</text></view>
        <view v-show="deleteIdx === idx" class="delete-zone" @click.stop="removeItem(idx)"><text>退出</text></view>
      </view>
    </view>
    <view class="fab-btn" @tap="goJoin"><text class="fab-text">＋ 加入新房间</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyRooms, removeRoom } from '../../utils/storage'
import type { MyRoom } from '../../utils/storage'
import { useSwipeDelete } from '../../composables/useSwipeDelete'

const list = ref<MyRoom[]>([])
const { deleteIdx, touchStart, touchEnd, confirmDelete } = useSwipeDelete()

const enterRoom = (room: MyRoom) => { if (deleteIdx.value !== -1) { deleteIdx.value = -1; return }; uni.setStorageSync('cosplan_room_code', room.roomId); uni.setStorageSync('cosplan_my_role', room.role); uni.navigateTo({ url: '/pages/room/index' }) }
const removeItem = (idx: number) => { confirmDelete(() => { removeRoom(list.value[idx].roomId); list.value = getMyRooms() }) }
const goJoin = () => uni.navigateTo({ url: '/pages/room/join' })
onMounted(() => { list.value = getMyRooms() })
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
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.room-name { font-size: 28rpx; font-weight: bold; color: #333; }
.room-id { font-size: 20rpx; color: #999; background: #f0f0f0; padding: 4rpx 14rpx; border-radius: 10rpx; }
.card-info { display: flex; flex-direction: column; }
.info-line { font-size: 24rpx; color: #666; }
.fab-btn { position: fixed; bottom: 60rpx; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #667eea, #764ba2); padding: 24rpx 60rpx; border-radius: 50rpx; box-shadow: 0 8rpx 24rpx rgba(102,126,234,0.4); }
.fab-text { font-size: 28rpx; color: #fff; font-weight: bold; }
</style>