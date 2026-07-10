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
        <input class="form-input" v-model="cn" placeholder="给自己取个CN吧" placeholder-style="color: rgba(255,255,255,0.25)" maxlength="20" />
      </view>

      <view class="input-wrap pwd-wrap">
        <input class="form-input" :type="showPwd ? 'text' : 'password'" v-model="pwd" placeholder="设置登录密码" placeholder-style="color: rgba(255,255,255,0.25)" maxlength="20" />
        <text class="eye-icon" @tap="showPwd = !showPwd">{{ showPwd ? '👁' : '👁‍🗨' }}</text>
      </view>

      <view class="btn-enter" @tap="handleSubmit">
        <text class="btn-enter-text">{{ isLoginMode ? '登录' : '注册 / 登录' }}</text>
      </view>

      <text class="tip-text">登录后数据云端同步，永不丢失</text>

      <text class="mode-switch" @tap="isLoginMode = !isLoginMode">
        {{ isLoginMode ? '没有账号？注册新号' : '已有账号？直接登录' }}
      </text>

      <text class="skip-text" @tap="handleSkip">暂不登录，先逛逛</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const cn = ref('')
const pwd = ref('')
const showPwd = ref(false)
const isLoginMode = ref(false)

const createUser = (name: string, password: string) => {
  return {
    id: 'u_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    nickName: name || '新Coser',
    password, // plaintext for now
    createdAt: Date.now(),
  }
}

const getAccountByCN = (cnName: string) => {
  try {
    const accounts: any[] = uni.getStorageSync('cosplan_accounts') || []
    return accounts.find((a: any) => a.nickName === cnName) || null
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
  const session = { id: user.id, nickName: user.nickName, createdAt: user.createdAt }
  uni.setStorageSync('cosplan_user', session)
  uni.reLaunch({ url: '/pages/index/index' })
}

const handleSubmit = () => {
  const name = cn.value.trim()
  const pass = pwd.value

  if (!name) { uni.showToast({ title: '请输入CN', icon: 'none' }); return }
  if (!pass || pass.length < 6) { uni.showToast({ title: '密码至少6位', icon: 'none' }); return }

  const existing = getAccountByCN(name)

  if (isLoginMode.value) {
    // Login mode
    if (!existing) {
      uni.showToast({ title: '该CN尚未注册', icon: 'none' })
      return
    }
    if (existing.password !== pass) {
      uni.showToast({ title: '密码错误', icon: 'none' })
      return
    }
    doLogin(existing)
  } else {
    // Register mode
    if (existing) {
      uni.showToast({ title: '该CN已存在，请直接登录或换个CN', icon: 'none' })
      isLoginMode.value = true
      return
    }
    const user = createUser(name, pass)
    saveAccount(user)
    doLogin(user)
  }
}

const handleSkip = () => {
  const user = createUser('', '')
  user.nickName = '游客' + user.id.substring(2, 6)
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

.pwd-wrap {
  position: relative;
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

.eye-icon {
  position: absolute;
  right: 30rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 28rpx;
  z-index: 1;
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

.tip-text {
  font-size: 20rpx;
  color: rgba(255,255,255,0.25);
  margin-bottom: 20rpx;
}

.mode-switch {
  font-size: 24rpx;
  color: rgba(255,255,255,0.35);
  margin-bottom: 24rpx;
}

.skip-text {
  font-size: 24rpx;
  color: rgba(255,255,255,0.25);
  text-decoration: underline;
}
</style>