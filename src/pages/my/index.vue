<template>
  <view class="page">
    <view class="header">
      <view class="avatar"><text class="avatar-icon">👤</text></view>
      <text v-if="!editingNick" class="nickname" @tap="startEditNick">{{ userNick }} <text class="nick-edit">✏️</text></text>
      <input v-else class="nick-input" v-model="editNickVal" @blur="confirmNick" @confirm="confirmNick" />
      <text class="bio">发现你的本命角色</text>
    </view>

    <view class="menu-card card">
      <view class="menu-item" @tap="goHistory"><text class="menu-icon">📋</text><text class="menu-label">历史记录</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goFavorites"><text class="menu-icon">❤️</text><text class="menu-label">我的收藏</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goProject"><text class="menu-icon">📋</text><text class="menu-label">我的企划</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-item" @tap="goStorage"><text class="menu-icon">🗄️</text><text class="menu-label">我的仓库</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goCard"><text class="menu-icon">🎴</text><text class="menu-label">我的名片</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goShoot"><text class="menu-icon">📸</text><text class="menu-label">拍摄计划</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goBudget"><text class="menu-icon">💰</text><text class="menu-label">花费预算</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goExpo"><text class="menu-icon">📅</text><text class="menu-label">漫展日历</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goRooms"><text class="menu-icon">🏠</text><text class="menu-label">我的房间</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="goIdea"><text class="menu-icon">💡</text><text class="menu-label">灵感便签</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="handleTap('settings')"><text class="menu-icon">⚙️</text><text class="menu-label">设置</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
      <view class="menu-divider"></view>
      <view class="menu-item" @tap="handleTap('about')"><text class="menu-icon">ℹ️</text><text class="menu-label">关于CosPlan</text><view class="menu-right"><text class="menu-arrow">›</text></view></view>
    </view>

    <view class="logout-wrap"><text class="logout-text" @tap="handleLogout">退出登录</text></view>
    <text class="version-text">v1.0.0</text>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const userNick = ref('新Coser')
const editingNick = ref(false)
const editNickVal = ref('')

const startEditNick = () => { editNickVal.value = userNick.value; editingNick.value = true }
const confirmNick = () => {
  if (editNickVal.value.trim()) {
    userNick.value = editNickVal.value.trim()
    const user = uni.getStorageSync('cosplan_user') || {}
    user.nickName = userNick.value
    uni.setStorageSync('cosplan_user', user)
  }
  editingNick.value = false
}

const handleLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '',
    confirmText: '退出',
    confirmColor: '#ff4444',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('cosplan_user')
        uni.redirectTo({ url: '/pages/login/index' })
      }
    }
  })
}

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
const handleTap = (type: string) => { if (type === 'settings') uni.showToast({ title: '功能开发中', icon: 'none' }); if (type === 'about') uni.showToast({ title: 'CosPlan v1.0', icon: 'none' }) }

onMounted(() => {
  const user = uni.getStorageSync('cosplan_user')
  if (user?.nickName) userNick.value = user.nickName
})
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; flex-direction: column; align-items: center; padding: 0 0 80rpx; }
.header { width: 100%; display: flex; flex-direction: column; align-items: center; padding: 80rpx 30rpx 50rpx; background: linear-gradient(180deg, rgba(118,75,162,0.5), transparent); }
.avatar { width: 110rpx; height: 110rpx; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 18rpx; }
.avatar-icon { font-size: 52rpx; }
.nickname { font-size: 36rpx; font-weight: bold; color: #fff; margin-bottom: 6rpx; }
.nick-edit { font-size: 20rpx; opacity: 0.5; }
.nick-input { width: 260rpx; height: 56rpx; background: rgba(255,255,255,0.15); border-radius: 12rpx; padding: 0 18rpx; font-size: 30rpx; color: #fff; text-align: center; box-sizing: border-box; }
.bio { font-size: 24rpx; color: rgba(255,255,255,0.6); }
.card { width: calc(100% - 60rpx); background: rgba(255,255,255,0.9); border-radius: 20rpx; }
.menu-card { margin-top: 20rpx; padding: 8rpx 30rpx; }
.menu-item { display: flex; align-items: center; padding: 28rpx 0; min-height: 88rpx; }
.menu-icon { font-size: 34rpx; margin-right: 18rpx; width: 40rpx; text-align: center; }
.menu-label { flex: 1; font-size: 28rpx; color: #333; }
.menu-right { display: flex; align-items: center; }
.menu-arrow { font-size: 28rpx; color: #ccc; }
.menu-divider { height: 1rpx; background: #f0f0f0; }
.logout-wrap { margin-top: 36rpx; padding: 12rpx 0; }
.logout-text { font-size: 24rpx; color: rgba(255,255,255,0.3); text-decoration: underline; }
.version-text { font-size: 22rpx; color: rgba(255,255,255,0.3); margin-top: 32rpx; }
</style>
