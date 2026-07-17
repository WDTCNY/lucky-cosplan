<template>
  <view class="page">
    <!-- CSS star/ring decoration -->
    <view class="decoration">
      <view class="star-ring"></view>
      <view class="star-ring star-ring--small"></view>
      <view class="star-dots">
        <view v-for="i in 12" :key="i" class="star-dot" :class="'sd' + i"></view>
      </view>
    </view>

    <view class="content">
      <text class="logo">COSPLAN</text>
      <text class="subtitle">你的Cos企划助手</text>

      <view class="input-wrap">
        <input class="form-input" type="number" v-model="phone" placeholder="输入手机号" placeholder-style="color: rgba(255,255,255,0.25)" maxlength="11" />
      </view>

      <view class="btn-enter" @tap="handleLogin">
        <text class="btn-enter-text">一键登录</text>
      </view>

      <text class="skip-text" @tap="handleSkip">暂不登录，先逛逛</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const phone = ref('')

const createUser = (phoneNumber: string) => {
  const suffix = phoneNumber.slice(-4)
  return {
    id: 'u_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    nickName: '新Coser' + suffix,
    phone: phoneNumber,
    createdAt: Date.now(),
  }
}

const getAccountByPhone = (phoneNumber: string) => {
  try {
    const accounts: any[] = uni.getStorageSync('cosplan_accounts') || []
    return accounts.find((a: any) => a.phone === phoneNumber) || null
  } catch { return null }
}

const saveAccount = (user: any) => {
  try {
    const accounts: any[] = uni.getStorageSync('cosplan_accounts') || []
    const idx = accounts.findIndex((a: any) => a.id === user.id)
    if (idx >= 0) accounts[idx] = user
    else accounts.unshift(user)
    uni.setStorageSync('cosplan_accounts', accounts)
  } catch {}
}

const doLogin = (user: any) => {
  const session = { id: user.id, nickName: user.nickName, phone: user.phone, createdAt: user.createdAt }
  uni.setStorageSync('cosplan_user', session)
  uni.reLaunch({ url: '/pages/index/index' })
}

const handleLogin = () => {
  const num = phone.value.trim()

  if (!num || num.length !== 11 || !/^1\d{10}$/.test(num)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }

  const existing = getAccountByPhone(num)

  if (existing) {
    doLogin(existing)
  } else {
    const user = createUser(num)
    saveAccount(user)
    doLogin(user)
  }
}

const handleSkip = () => {
  const user = {
    id: 'u_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    nickName: '游客' + Date.now().toString(36).substring(2, 6),
    phone: '',
    createdAt: Date.now(),
  }
  saveAccount(user)
  doLogin(user)
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #1B1725;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 50rpx;
  position: relative;
  overflow: hidden;
}

/* ---- Decoration ---- */
.decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
}

.star-ring {
  width: 300rpx;
  height: 300rpx;
  border: 2rpx solid rgba(180, 77, 255, 0.12);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: spin 12s linear infinite;
}
.star-ring::before {
  content: '';
  position: absolute;
  top: -4rpx;
  left: 50%;
  width: 10rpx;
  height: 10rpx;
  background: #b44dff;
  border-radius: 50%;
  box-shadow: 0 0 16rpx #b44dff;
  transform: translateX(-50%);
}

.star-ring--small {
  width: 210rpx;
  height: 210rpx;
  animation: spin 8s linear infinite reverse;
  border-color: rgba(0, 229, 255, 0.1);
}
.star-ring--small::before {
  background: #00e5ff;
  box-shadow: 0 0 16rpx #00e5ff;
}

.star-dots { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.star-dot {
  position: absolute;
  width: 4rpx;
  height: 4rpx;
  background: rgba(255,255,255,0.4);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}
.sd1  { top: -140rpx; left: 0; }
.sd2  { top: 140rpx; left: 0; animation-delay: 0.2s; }
.sd3  { left: -140rpx; top: 0; animation-delay: 0.4s; }
.sd4  { left: 140rpx; top: 0; animation-delay: 0.6s; }
.sd5  { top: -100rpx; left: -100rpx; animation-delay: 0.8s; }
.sd6  { top: -100rpx; left: 100rpx; animation-delay: 1.0s; }
.sd7  { top: 100rpx; left: -100rpx; animation-delay: 0.3s; }
.sd8  { top: 100rpx; left: 100rpx; animation-delay: 0.7s; }
.sd9  { top: -40rpx; left: 40rpx; animation-delay: 1.2s; }
.sd10 { top: -40rpx; left: -40rpx; animation-delay: 0.5s; }
.sd11 { top: 40rpx; left: -40rpx; animation-delay: 0.9s; }
.sd12 { top: 40rpx; left: 40rpx; animation-delay: 1.5s; }

@keyframes spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.8); }
}

/* ---- Content ---- */
.content {
  position: relative;
  z-index: 2;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  font-size: 56rpx;
  font-weight: bold;
  letter-spacing: 12rpx;
  background: linear-gradient(135deg, #b44dff, #00e5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 14rpx;
}

.subtitle {
  font-size: 26rpx;
  color: rgba(255,255,255,0.4);
  letter-spacing: 6rpx;
  margin-bottom: 80rpx;
}

.input-wrap {
  width: 100%;
  margin-bottom: 24rpx;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 50rpx;
  padding: 0 36rpx;
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
  text-align: center;
  box-sizing: border-box;
}

.btn-enter {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #b44dff, #7c3aed);
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40rpx rgba(180, 77, 255, 0.35);
  margin-bottom: 24rpx;
  transition: all 0.3s;
}
.btn-enter:active { transform: scale(0.97); }
.btn-enter-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  letter-spacing: 4rpx;
}

.skip-text {
  font-size: 24rpx;
  color: rgba(255,255,255,0.25);
  text-decoration: underline;
}
</style>