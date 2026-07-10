<template>
  <view class="page">
    <view class="header">
      <text v-if="!editingName" class="expo-name" @tap="startEditName">{{ expo.name }} <text class="edit-icon">✏️</text></text>
      <input v-else class="expo-name-input" v-model="editNameVal" @blur="confirmName" @confirm="confirmName" />
    </view>

    <view class="card">
      <text class="section-title">漫展信息</text>
      <view class="info-row"><text class="info-icon">📅</text><text class="info-label">日期</text><picker mode="date" :value="expoDateStr" @change="onExpoDateChange"><text class="info-value clickable">{{ expo.dateLabel || '选择日期' }} <text class="edit-icon">✏️</text></text></picker></view>
      <view class="info-row"><text class="info-icon">📍</text><text class="info-label">地点</text><input class="info-input" v-model="expo.city" placeholder="城市+场馆+地址" placeholder-style="color:#bbb" @blur="onCityBlur" @confirm="onCityBlur" /></view>
      <view class="info-row"><text class="info-icon">👥</text><text class="info-label">参加</text><text class="info-value">{{ expo.joinerCount }}人</text></view>
    </view>

    <view class="card">
      <text class="section-title">参展角色</text>
      <view v-if="expo.roles.length === 0" class="empty-roles"><text class="empty-roles-text">暂无参展角色</text></view>
      <view v-for="(role, i) in expo.roles" :key="i" class="role-item"><text class="role-name">{{ role }}</text><text class="role-del" @tap.stop="removeRole(i)">×</text></view>
      <view class="add-row" @tap="addRole"><text class="add-text">＋ 添加角色</text></view>
    </view>

    <view class="card">
      <text class="section-title">集合时间</text>
      <picker mode="time" :value="expo.meetTime" @change="onTimeChange"><text class="meet-time">{{ expo.meetTime || '选择时间' }}</text></picker>
      <text class="section-title" style="margin-top:18rpx;">集合地点</text>
      <input class="info-input-full" v-model="expo.meetPlace" placeholder="输入集合地点" placeholder-style="color:#bbb" />
    </view>

    <view class="bottom-actions">
      <view class="btn btn-primary" @tap="handleJoin"><text class="btn-text">🙋 我要参加</text></view>
      <view class="btn btn-outline" @tap="handleShare"><text class="btn-text-outline">🔗 分享</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'

interface ExpoDetail { id: string; name: string; city: string; dateLabel: string; dateObj: { year: number; month: number; day: number }; joinerCount: number; roles: string[]; meetTime: string; meetPlace: string }
const expo = reactive<ExpoDetail>({ id: '', name: '', city: '', dateLabel: '', dateObj: { year: 0, month: 0, day: 0 }, joinerCount: 0, roles: [], meetTime: '', meetPlace: '' })
let expoId = ''

const editingName = ref(false)
const editNameVal = ref('')
const startEditName = () => { editNameVal.value = expo.name; editingName.value = true }
const confirmName = () => { if (editNameVal.value.trim()) expo.name = editNameVal.value.trim(); editingName.value = false; save() }

const expoDateStr = computed(() => {
  if (!expo.dateObj || !expo.dateObj.year) return ''
  const d = expo.dateObj
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
})
const onExpoDateChange = (e: { detail: { value: string } }) => {
  const parts = e.detail.value.split('-')
  if (parts.length === 3) {
    expo.dateObj = { year: Number(parts[0]), month: Number(parts[1]), day: Number(parts[2]) }
    expo.dateLabel = `${Number(parts[1])}.${Number(parts[2])}`
    save()
  }
}
const onCityBlur = () => { save() }

const addRole = () => { uni.showModal({ title:'添加角色', editable:true, placeholderText:'角色名', success:(res)=>{ if(res.confirm&&res.content)expo.roles.push(res.content) } }) }
const removeRole = (i: number) => { expo.roles.splice(i, 1) }
const onTimeChange = (e: { detail: { value: string } }) => { expo.meetTime = e.detail.value }
const handleJoin = () => { expo.joinerCount++; save(); uni.showToast({ title:'已报名参加！', icon:'success' }) }
const handleShare = () => { uni.showToast({ title:'功能开发中', icon:'none' }) }
const save = () => { const all = uni.getStorageSync('cosplan_expos')||[]; const idx = all.findIndex((e:any)=>e.id===expoId); if(idx>=0){ all[idx] = { ...all[idx], city:expo.city, dateLabel:expo.dateLabel, dateObj:expo.dateObj, roles:expo.roles, meetTime:expo.meetTime, meetPlace:expo.meetPlace, joinerCount:expo.joinerCount }; uni.setStorageSync('cosplan_expos', all) } }
watch(expo, ()=>save(), { deep: true })

onMounted(() => { expoId = uni.getStorageSync('cosplan_current_expo_id')||''; const all = uni.getStorageSync('cosplan_expos')||[]; const found = all.find((e:any)=>e.id===expoId); if(found){ expo.id=found.id; expo.name=found.name; expo.city=found.city || ''; expo.dateLabel=found.dateLabel||''; expo.dateObj=found.dateObj||{ year:0, month:0, day:0 }; expo.joinerCount=found.joinerCount||0; expo.roles=found.roles||[]; expo.meetTime=found.meetTime||''; expo.meetPlace=found.meetPlace||'' } })
</script>

<style lang="scss" scoped>
.page { min-height:100vh; background:linear-gradient(135deg,#667eea,#764ba2); padding:50rpx 30rpx 60rpx; }
.header { margin-bottom:28rpx; }
.expo-name { font-size:40rpx; font-weight:bold; color:#fff; }
.card { width:100%; background:rgba(255,255,255,0.9); border-radius:20rpx; padding:28rpx; margin-bottom:20rpx; }
.section-title { font-size:28rpx; font-weight:bold; color:#333; display:block; margin-bottom:12rpx; }
.info-row { display:flex; align-items:center; margin-bottom:10rpx; }
.info-icon { font-size:26rpx; margin-right:8rpx; }
.info-label { font-size:24rpx; color:#999; width:70rpx; }
.info-value { font-size:26rpx; color:#333; }
.info-value.clickable { color:#667eea; }
.info-input { flex:1; height:56rpx; background:#f5f5f5; border-radius:8rpx; padding:0 12rpx; font-size:26rpx; color:#333; }
.empty-roles { padding:18rpx 0; }
.empty-roles-text { font-size:24rpx; color:#ccc; }
.role-item { display:flex; align-items:center; padding:10rpx 0; }
.role-name { flex:1; font-size:26rpx; color:#555; }
.role-del { font-size:26rpx; color:#ccc; padding:0 6rpx; }
.add-row { margin-top:10rpx; padding:14rpx; border:2rpx dashed #ddd; border-radius:12rpx; display:flex; justify-content:center; }
.add-text { font-size:26rpx; color:#667eea; }
.meet-time { font-size:30rpx; color:#667eea; font-weight:bold; padding:8rpx 0; }
.info-input-full { width:100%; height:60rpx; background:#f5f5f5; border-radius:8rpx; padding:0 14rpx; font-size:26rpx; color:#333; margin-top:6rpx; }
.bottom-actions { width:100%; display:flex; gap:20rpx; margin-top:12rpx; padding-bottom:40rpx; }
.btn { flex:1; height:88rpx; border-radius:50rpx; display:flex; align-items:center; justify-content:center; }
.btn-primary { background:#fff; }
.btn-text { font-size:28rpx; color:#667eea; font-weight:bold; }
.btn-outline { background:transparent; border:2rpx solid rgba(255,255,255,0.5); }
.btn-text-outline { font-size:28rpx; color:#fff; font-weight:bold; }
</style>