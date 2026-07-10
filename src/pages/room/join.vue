<template>
  <view class="page">
    <view class="header">
      <text class="title">加入房间</text>
      <text class="subtitle">输入邀请码加入团队协作</text>
    </view>
    <view class="card">
      <view class="input-group">
        <text class="input-label">邀请码</text>
        <input class="code-input" v-model="inviteCode" placeholder="请输入6位邀请码" placeholder-style="color:#bbb" maxlength="6" />
      </view>
      <view class="input-group">
        <text class="input-label">你的角色</text>
        <input class="code-input" v-model="roleName" placeholder="例如：雷电将军 coser" placeholder-style="color:#bbb" />
      </view>
      <view class="join-btn" @tap="handleJoin"><text class="join-btn-text">加入房间</text></view>
    </view>
    <text class="tip-text">💡 联系房主获取邀请码</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { addMyRoom } from '../../utils/storage'
const inviteCode = ref('')
const roleName = ref('')
const handleJoin = () => {
  if (!inviteCode.value.trim()) { uni.showToast({ title: '请输入邀请码', icon: 'none' }); return }
  if (!roleName.value.trim()) { uni.showToast({ title: '请输入你的角色', icon: 'none' }); return }
  const code = inviteCode.value.trim()
  uni.setStorageSync('cosplan_room_code', code); uni.setStorageSync('cosplan_my_role', roleName.value.trim())
  addMyRoom({ roomId: code, roomName: '协作房间', role: roleName.value.trim(), joinTime: Date.now() })
  uni.navigateTo({ url: '/pages/room/index' })
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 80rpx 30rpx 60rpx; display: flex; flex-direction: column; align-items: center; }
.header { display: flex; flex-direction: column; align-items: center; margin-bottom: 40rpx; }
.title { font-size: 40rpx; font-weight: bold; color: #fff; margin-bottom: 10rpx; }
.subtitle { font-size: 24rpx; color: rgba(255,255,255,0.6); }
.card { width: 100%; background: rgba(255,255,255,0.9); border-radius: 20rpx; padding: 36rpx 30rpx; }
.input-group { margin-bottom: 24rpx; }
.input-label { font-size: 28rpx; color: #333; font-weight: bold; display: block; margin-bottom: 10rpx; }
.code-input { width: 100%; height: 84rpx; background: #f5f5f5; border-radius: 12rpx; padding: 0 22rpx; font-size: 28rpx; color: #333; }
.join-btn { width: 100%; height: 88rpx; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50rpx; display: flex; align-items: center; justify-content: center; margin-top: 12rpx; }
.join-btn-text { font-size: 30rpx; color: #fff; font-weight: bold; }
.tip-text { font-size: 22rpx; color: rgba(255,255,255,0.45); margin-top: 28rpx; }
</style>