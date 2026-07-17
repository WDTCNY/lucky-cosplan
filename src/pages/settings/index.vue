<template>
  <view class="page">
    <view class="card">
      <view class="menu-item" @tap="openCNModal">
        <text class="menu-icon">✏️</text>
        <text class="menu-label">修改CN</text>
        <view class="menu-right">
          <text class="menu-current-cn">{{ userNick }}</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="logout-btn" @tap="handleLogout">
      <text class="logout-text">退出登录</text>
    </view>

    <!-- 修改CN弹窗 -->
    <view v-if="showCNModal" class="modal-overlay" @tap="showCNModal = false">
      <view class="modal-card" @tap.stop>
        <view class="modal-header-row">
          <text class="modal-title">✏️ 修改CN</text>
          <view class="modal-close-btn" @tap="showCNModal = false"><text>×</text></view>
        </view>
        <view class="modal-field">
          <text class="modal-label">新CN</text>
          <input class="modal-input" v-model="cnForm.newCN" placeholder="输入新的CN" />
        </view>
        <view class="modal-actions">
          <view class="modal-btn modal-btn-cancel" @tap="showCNModal = false"><text class="modal-btn-text-cancel">取消</text></view>
          <view class="modal-btn modal-btn-save" @tap="confirmCNChange"><text class="modal-btn-text-save">确认</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const userNick = ref('新Coser')

function loadUser() {
  const user = uni.getStorageSync('cosplan_user') || {}
  if (user?.nickName) userNick.value = user.nickName
}

// ---- 修改CN ----
const showCNModal = ref(false)
const cnForm = reactive({ newCN: '' })

function openCNModal() {
  loadUser()
  cnForm.newCN = userNick.value
  showCNModal.value = true
}

function confirmCNChange() {
  const name = cnForm.newCN.trim()
  if (!name) {
    uni.showToast({ title: 'CN不能为空', icon: 'none' })
    return
  }
  userNick.value = name
  const user = uni.getStorageSync('cosplan_user') || {}
  user.nickName = name
  uni.setStorageSync('cosplan_user', user)
  showCNModal.value = false
  uni.showToast({ title: 'CN已修改', icon: 'success' })
}

// ---- 退出登录 ----
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

onShow(() => {
  loadUser()
})
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 30rpx; }
.card { width: 100%; background: rgba(255,255,255,0.9); border-radius: 20rpx; padding: 8rpx 30rpx; }
.menu-item { display: flex; align-items: center; padding: 28rpx 0; min-height: 88rpx; }
.menu-icon { font-size: 34rpx; margin-right: 18rpx; width: 40rpx; text-align: center; }
.menu-label { flex: 1; font-size: 28rpx; color: #333; }
.menu-right { display: flex; align-items: center; gap: 12rpx; }
.menu-current-cn { font-size: 24rpx; color: #999; }
.menu-arrow { font-size: 28rpx; color: #ccc; }
.menu-divider { height: 1rpx; background: #f0f0f0; }
.logout-btn { width: 100%; margin-top: 40rpx; padding: 28rpx 0; text-align: center; background: rgba(255,255,255,0.9); border-radius: 20rpx; }
.logout-text { font-size: 28rpx; color: #ff4444; font-weight: bold; }

/* 弹窗 */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: flex-end; }
.modal-card { width: 100%; background: #1A1D24; border-radius: 32rpx 32rpx 0 0; padding: 36rpx 30rpx 60rpx; max-height: 80vh; overflow-y: auto; }
.modal-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.modal-title { font-size: 30rpx; font-weight: bold; color: rgba(255,255,255,0.9); }
.modal-close-btn { width: 44rpx; height: 44rpx; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 24rpx; color: rgba(255,255,255,0.5); }
.modal-field { margin-bottom: 18rpx; }
.modal-label { font-size: 22rpx; color: rgba(255,255,255,0.4); display: block; margin-bottom: 6rpx; }
.modal-input { height: 68rpx; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12rpx; padding: 0 16rpx; font-size: 26rpx; color: rgba(255,255,255,0.8); width: 100%; box-sizing: border-box; }
.modal-actions { display: flex; gap: 16rpx; margin-top: 24rpx; }
.modal-btn { flex: 1; height: 80rpx; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; }
.modal-btn-cancel { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); }
.modal-btn-text-cancel { font-size: 26rpx; color: rgba(255,255,255,0.6); font-weight: bold; }
.modal-btn-save { background: linear-gradient(135deg, #b44dff, #7c3aed); }
.modal-btn-text-save { font-size: 26rpx; color: #fff; font-weight: bold; }
</style>