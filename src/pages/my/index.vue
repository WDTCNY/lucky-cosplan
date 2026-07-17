<template>
  <view class="page">
    <view class="header">
      <view class="header-top">
        <text class="settings-icon" @tap="goSettings">⚙️</text>
      </view>
      <view class="avatar"><text class="avatar-icon">👤</text></view>
      <text class="nickname">{{ userNick }}</text>
      <text class="bio">发现你的本命角色</text>
    </view>

    <view class="menu-card card">
      <view class="menu-item" @tap="goHistory"><text class="menu-icon">📋</text><text class="menu-label">历史记录</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goFavorites"><text class="menu-icon">❤️</text><text class="menu-label">我的收藏</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goStorage"><text class="menu-icon">🗄️</text><text class="menu-label">我的仓库</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goCard"><text class="menu-icon">🎴</text><text class="menu-label">我的名片</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goShoot"><text class="menu-icon">📸</text><text class="menu-label">拍摄计划</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goRooms"><text class="menu-icon">🏠</text><text class="menu-label">我的房间</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goIdea"><text class="menu-icon">💡</text><text class="menu-label">灵感便签</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
    </view>

    <text class="version-text">v0.1.0</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const userNick = ref('新Coser')

function loadUser() {
  const user = uni.getStorageSync('cosplan_user') || {}
  if (user?.nickName) userNick.value = user.nickName
}

const goSettings = () => uni.navigateTo({ url: '/pages/settings/index' })
const goHistory = () => uni.navigateTo({ url: '/pages/history/index' })
const goFavorites = () => uni.navigateTo({ url: '/pages/favorites/index' })
const goProject = () => uni.navigateTo({ url: '/pages/project/index' })
const goStorage = () => uni.navigateTo({ url: '/pages/storage/index' })
const goCard = () => uni.navigateTo({ url: '/pages/card/index' })
const goIdea = () => uni.navigateTo({ url: '/pages/idea/index' })
const goShoot = () => uni.navigateTo({ url: '/pages/shoot/index' })
const goBudget = () => uni.navigateTo({ url: '/pages/budget/index' })
const goExpo = () => uni.navigateTo({ url: '/pages/expo/index' })
const goRooms = () => uni.navigateTo({ url: '/pages/room/list' })

onShow(() => {
  loadUser()
})
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; flex-direction: column; align-items: center; padding: 0 0 80rpx; }
.header { width: 100%; display: flex; flex-direction: column; align-items: center; padding: 80rpx 30rpx 50rpx; background: linear-gradient(180deg, rgba(118,75,162,0.5), transparent); position: relative; }
.header-top { position: absolute; top: 20rpx; right: 30rpx; display: flex; justify-content: flex-end; align-items: center; }
.settings-icon { font-size: 36rpx; padding: 10rpx; }
.avatar { width: 110rpx; height: 110rpx; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 18rpx; }
.avatar-icon { font-size: 52rpx; }
.nickname { font-size: 36rpx; font-weight: bold; color: #fff; margin-bottom: 6rpx; }
.bio { font-size: 24rpx; color: rgba(255,255,255,0.6); }
.card { width: calc(100% - 60rpx); background: rgba(255,255,255,0.9); border-radius: 20rpx; }
.menu-card { margin-top: 20rpx; padding: 8rpx 30rpx; }
.menu-item { display: flex; align-items: center; padding: 28rpx 0; min-height: 88rpx; }
.menu-icon { font-size: 34rpx; margin-right: 18rpx; width: 40rpx; text-align: center; }
.menu-label { flex: 1; font-size: 28rpx; color: #333; }
.menu-right { display: flex; align-items: center; }
.menu-arrow { font-size: 28rpx; color: #ccc; }
.menu-divider { height: 1rpx; background: #f0f0f0; }
.version-text { font-size: 22rpx; color: rgba(255,255,255,0.3); margin-top: 32rpx; }
</style>