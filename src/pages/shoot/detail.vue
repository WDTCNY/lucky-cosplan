<template>
  <view class="page">
    <view class="header">
      <text class="role-name">{{ shoot.roleName }}</text>
      <text class="shoot-status" :class="'status-' + shoot.status">{{ statusLabel(shoot.status) }}</text>
    </view>

    <view class="card">
      <text class="section-title">基本信息</text>
      <view class="info-item"><text class="info-label">拍摄主题</text><input class="info-input" v-model="shoot.theme" placeholder="输入主题" placeholder-style="color:#bbb" /></view>
      <view class="info-item"><text class="info-label">拍摄日期</text><picker mode="date" :value="shoot.date" @change="onDateChange"><text class="date-pick">{{ shoot.date || '选择日期' }}</text></picker></view>
      <view v-if="shoot.date" class="countdown-row"><text class="countdown-num">{{ daysLeft }}</text><text class="countdown-label">天</text></view>
    </view>

    <!-- 拍摄地点 — 多地点列表 -->
    <view class="card">
      <text class="section-title">拍摄地点</text>
      <view v-for="(loc, idx) in shoot.locations" :key="idx" class="loc-item" :class="{ 'loc-selected': loc.voted }" @tap="loc.voted = !loc.voted">
        <view class="loc-body">
          <text class="loc-name">{{ loc.name }}</text>
          <text class="loc-addr">{{ loc.address }}</text>
        </view>
        <text class="loc-vote">{{ loc.voted ? '🗳' : '☐' }}</text>
        <text class="loc-del" @tap.stop="removeLocation(idx)">×</text>
      </view>
      <view class="add-row" @tap="addLocation"><text class="add-text">＋ 添加备选地点</text></view>
      <!-- Add location popup -->
      <view v-if="editingLocation !== null" class="modal-overlay" @tap="editingLocation = null">
        <view class="modal-card" @tap.stop>
          <text class="modal-title">添加地点</text>
          <view class="modal-field">
            <text class="modal-label">地点名称</text>
            <input class="modal-input" v-model="editLocName" placeholder="如：森林公园" />
          </view>
          <view class="modal-field">
            <text class="modal-label">地址描述</text>
            <input class="modal-input" v-model="editLocAddr" placeholder="如：XX路XX号" />
          </view>
          <view class="modal-actions">
            <view class="modal-btn modal-btn-save" @tap="saveLocation"><text class="modal-btn-text-save">保存</text></view>
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="section-header">
        <text class="section-title">参与人员</text>
        <text v-if="isGroupMode" class="group-badge">团片模式</text>
      </view>
      <view v-for="(person, idx) in shoot.crew" :key="idx" class="crew-item">
        <text class="crew-role-tag" :class="'role-' + roleColorClass(person.role)">{{ person.role }}</text>
        <text class="crew-name">{{ person.name }}</text>
        <text class="crew-edit" @tap="editCrewMember(idx)">✏️</text>
        <text class="crew-del" @tap="removeCrewMember(idx)">×</text>
      </view>
      <view v-if="shoot.crew.length === 0" class="crew-empty">暂无人员，点击下方添加</view>
      <view class="add-row" @tap="addCrewMember"><text class="add-text">＋ 添加人员</text></view>
      <!-- Crew edit modal -->
      <view v-if="editingCrew !== null" class="modal-overlay" @tap="editingCrew = null">
        <view class="modal-card" @tap.stop>
          <text class="modal-title">{{ editingCrew.isNew ? '添加人员' : '编辑人员' }}</text>
          <view class="modal-field">
            <text class="modal-label">姓名/昵称</text>
            <input class="modal-input" v-model="editCrewName" placeholder="输入姓名" />
          </view>
          <view class="modal-field">
            <text class="modal-label">角色/分工</text>
            <view class="role-picker">
              <text v-for="role in roleOptions" :key="role" class="role-option" :class="{ 'role-option-active': editCrewRole === role }" @tap="editCrewRole = role">{{ role }}</text>
            </view>
          </view>
          <view class="modal-field">
            <text class="modal-label">联系方式（选填）</text>
            <input class="modal-input" v-model="editCrewContact" placeholder="手机号/微信号" />
          </view>
          <view class="modal-field">
            <text class="modal-label">备注（选填）</text>
            <input class="modal-input" v-model="editCrewNote" placeholder="备注信息" />
          </view>
          <view class="modal-actions">
            <view v-if="!editingCrew.isNew" class="modal-btn modal-btn-del" @tap="deleteCrewMember"><text class="modal-btn-text-del">删除</text></view>
            <view class="modal-btn modal-btn-save" @tap="saveCrewMember"><text class="modal-btn-text-save">保存</text></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 分镜脚本 — 可删除 + 全屏预览 -->
    <view class="card">
      <text class="section-title">分镜脚本</text>
      <view class="ref-grid">
        <view v-for="(img, i) in shoot.storyboard" :key="i" class="ref-img-wrap">
          <image class="ref-img" :src="img" mode="aspectFill" @tap="previewImage(i)" />
          <view class="ref-del" @tap.stop="removeStoryboard(i)"><text class="ref-del-icon">×</text></view>
        </view>
        <view class="ref-add" @tap="addStoryboard"><text class="ref-add-icon">＋</text></view>
      </view>
    </view>

    <!-- 拍摄清单 — 可编辑 -->
    <view class="card">
      <text class="section-title">拍摄清单</text>
      <view v-for="(item, i) in shoot.checklist" :key="i" class="check-item">
        <text class="check-icon" @tap="item.done = !item.done">{{ item.done ? '✅' : '⬜' }}</text>
        <text class="check-label" :class="{ done: item.done }" @tap="editCheckItem(i)">{{ item.label }}</text>
        <text class="check-del" @tap="removeCheckItem(i)">×</text>
      </view>
      <view class="add-row" @tap="addCheckItem"><text class="add-text">＋ 添加清单项</text></view>
      <!-- Edit/add checklist popup -->
      <view v-if="editingCheck !== null" class="modal-overlay" @tap="editingCheck = null">
        <view class="modal-card" @tap.stop>
          <text class="modal-title">{{ editingCheck.isNew ? '添加清单项' : '编辑清单项' }}</text>
          <view class="modal-field">
            <input class="modal-input" v-model="editCheckLabel" placeholder="输入清单内容" />
          </view>
          <view class="modal-actions">
            <view v-if="!editingCheck.isNew" class="modal-btn modal-btn-del" @tap="deleteCheckItem"><text class="modal-btn-text-del">删除</text></view>
            <view class="modal-btn modal-btn-save" @tap="saveCheckItem"><text class="modal-btn-text-save">保存</text></view>
          </view>
        </view>
      </view>
    </view>

    <view class="share-btn" @tap="handleShare"><text class="share-text">📤 分享拍摄计划</text></view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'

interface CheckItem { label: string; done: boolean }
interface Staff { photographer: string; makeup: string; assistant: string }
interface LocationItem { name: string; address: string; voted: boolean }
interface CrewMember { name: string; role: string; contact: string; note: string }
interface Shoot { id: string; roleName: string; theme: string; status: string; date: string; locations: LocationItem[]; crew: CrewMember[]; staff: Staff; storyboard: string[]; checklist: CheckItem[] }

const roleOptions = ['Coser', '摄影', '妆娘', '毛娘', '后勤', '后期', '场务', '其他']
const roleColorMap: Record<string, string> = {
  'Coser': 'tailor', '摄影': 'shoot', '妆娘': 'makeup', '毛娘': 'wig', '后勤': 'logistics', '后期': 'prop', '场务': 'logistics', '其他': 'logistics'
}

const defaultChecklist: CheckItem[] = [
  { label: '电池充满', done: false }, { label: '道具检查', done: false }, { label: '假发造型', done: false }, { label: '服装熨烫', done: false },
]

const shoot = reactive<Shoot>({
  id: '', roleName: '', theme: '', status: 'pending', date: '', locations: [], crew: [],
  staff: { photographer: '', makeup: '', assistant: '' }, storyboard: [], checklist: [...defaultChecklist.map(c => ({ ...c }))],
})

const isGroupMode = computed(() => shoot.crew.filter(c => c.role === 'Coser').length >= 3)
const roleColorClass = (role: string) => roleColorMap[role] || 'logistics'

let shootId = ''

// Location
const editingLocation = ref<boolean | null>(null)
const editLocName = ref('')
const editLocAddr = ref('')
const addLocation = () => { editLocName.value = ''; editLocAddr.value = ''; editingLocation.value = true }
const saveLocation = () => {
  if (!editLocName.value.trim()) { uni.showToast({ title: '请输入地点名称', icon: 'none' }); return }
  shoot.locations.push({ name: editLocName.value.trim(), address: editLocAddr.value.trim(), voted: false })
  editingLocation.value = null
}
const removeLocation = (idx: number) => { shoot.locations.splice(idx, 1) }

// Storyboard
const addStoryboard = () => uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: res => shoot.storyboard.push(res.tempFilePaths[0]) })
const removeStoryboard = (idx: number) => { shoot.storyboard.splice(idx, 1) }
const previewImage = (idx: number) => { uni.previewImage({ current: idx, urls: shoot.storyboard }) }

// Checklist
const editingCheck = ref<{ isNew: boolean; idx: number } | null>(null)
const editCheckLabel = ref('')
const addCheckItem = () => { editCheckLabel.value = ''; editingCheck.value = { isNew: true, idx: shoot.checklist.length } }
const editCheckItem = (idx: number) => { editCheckLabel.value = shoot.checklist[idx].label; editingCheck.value = { isNew: false, idx } }
const saveCheckItem = () => {
  if (!editCheckLabel.value.trim()) { uni.showToast({ title: '请输入清单内容', icon: 'none' }); return }
  if (!editingCheck.value) return
  if (editingCheck.value.isNew) {
    shoot.checklist.push({ label: editCheckLabel.value.trim(), done: false })
  } else {
    shoot.checklist[editingCheck.value.idx].label = editCheckLabel.value.trim()
  }
  editingCheck.value = null
}
const deleteCheckItem = () => {
  if (!editingCheck.value || editingCheck.value.isNew) { editingCheck.value = null; return }
  shoot.checklist.splice(editingCheck.value.idx, 1)
  editingCheck.value = null
}
const removeCheckItem = (idx: number) => { shoot.checklist.splice(idx, 1) }

// Crew
interface EditingCrewState { isNew: boolean; idx: number }
const editingCrew = ref<EditingCrewState | null>(null)
const editCrewName = ref('')
const editCrewRole = ref('Coser')
const editCrewContact = ref('')
const editCrewNote = ref('')
const addCrewMember = () => { editCrewName.value = ''; editCrewRole.value = 'Coser'; editCrewContact.value = ''; editCrewNote.value = ''; editingCrew.value = { isNew: true, idx: shoot.crew.length } }
const editCrewMember = (idx: number) => {
  const c = shoot.crew[idx]; if (!c) return
  editCrewName.value = c.name; editCrewRole.value = c.role; editCrewContact.value = c.contact || ''; editCrewNote.value = c.note || ''
  editingCrew.value = { isNew: false, idx }
}
const saveCrewMember = () => {
  if (!editCrewName.value.trim()) { uni.showToast({ title: '请输入姓名', icon: 'none' }); return }
  if (!editingCrew.value) return
  const data: CrewMember = { name: editCrewName.value.trim(), role: editCrewRole.value, contact: editCrewContact.value.trim(), note: editCrewNote.value.trim() }
  if (editingCrew.value.isNew) { shoot.crew.push(data) }
  else { Object.assign(shoot.crew[editingCrew.value.idx], data) }
  editingCrew.value = null
}
const deleteCrewMember = () => {
  if (!editingCrew.value || editingCrew.value.isNew) { editingCrew.value = null; return }
  shoot.crew.splice(editingCrew.value.idx, 1)
  editingCrew.value = null
}
const removeCrewMember = (idx: number) => { shoot.crew.splice(idx, 1) }

// Util
const statusLabel = (s: string) => s === 'done' ? '已完成' : s === 'active' ? '进行中' : '待开始'
const daysLeft = computed(() => { if (!shoot.date) return '--'; const diff = Math.ceil((new Date(shoot.date).getTime() - Date.now()) / 86400000); return diff < 0 ? 0 : diff })
const onDateChange = (e: { detail: { value: string } }) => { shoot.date = e.detail.value }
const handleShare = () => uni.showToast({ title: '功能开发中', icon: 'none' })

// Persistence
const save = () => { const all = uni.getStorageSync('cosplan_shoots') || []; const idx = all.findIndex((p: Shoot) => p.id === shootId); if (idx >= 0) all[idx] = { ...shoot, id: shootId }; else all.unshift({ ...shoot, id: shootId }); uni.setStorageSync('cosplan_shoots', all) }
watch(shoot, () => save(), { deep: true })
onMounted(() => { shootId = uni.getStorageSync('cosplan_current_shoot_id') || Date.now().toString(); const all = uni.getStorageSync('cosplan_shoots') || []; const found = all.find((p: Shoot) => p.id === shootId); if (found) Object.assign(shoot, found); shoot.id = shootId })
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 50rpx 30rpx 60rpx; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28rpx; }
.role-name { font-size: 40rpx; font-weight: bold; color: #fff; }
.shoot-status { font-size: 22rpx; padding: 6rpx 22rpx; border-radius: 16rpx; }
.status-pending { background: rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); }
.status-active { background: rgba(33,150,243,0.3); color: #fff; }
.status-done { background: rgba(76,175,80,0.3); color: #fff; }

.card { width: 100%; background: rgba(255,255,255,0.9); border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 12rpx; }
.info-item { display: flex; align-items: center; margin-bottom: 10rpx; }
.info-label { font-size: 24rpx; color: #999; width: 110rpx; }
.info-input { flex: 1; height: 56rpx; background: #f5f5f5; border-radius: 8rpx; padding: 0 12rpx; font-size: 26rpx; color: #333; }
.date-pick { font-size: 26rpx; color: #667eea; padding: 10rpx 18rpx; background: #f0eeff; border-radius: 8rpx; }
.countdown-row { display: flex; align-items: baseline; gap: 4rpx; justify-content: center; margin-top: 10rpx; }
.countdown-num { font-size: 48rpx; font-weight: bold; color: #667eea; }
.countdown-label { font-size: 24rpx; color: #999; }

/* ---- Locations ---- */
.loc-item { display: flex; align-items: center; padding: 12rpx 0; }
.loc-item + .loc-item { border-top: 1px solid rgba(0,0,0,0.05); }
.loc-selected .loc-body { opacity: 1; }
.loc-body { flex: 1; }
.loc-name { font-size: 26rpx; color: #333; font-weight: bold; display: block; }
.loc-addr { font-size: 22rpx; color: #999; margin-top: 2rpx; display: block; }
.loc-vote { font-size: 28rpx; margin: 0 8rpx; flex-shrink: 0; }
.loc-del { font-size: 28rpx; color: #ccc; padding: 0 6rpx; flex-shrink: 0; }

/* ---- Storyboard ---- */
.ref-grid { display: flex; flex-wrap: wrap; gap: 14rpx; }
.ref-img-wrap { position: relative; width: 140rpx; height: 140rpx; }
.ref-img { width: 100%; height: 100%; border-radius: 12rpx; }
.ref-del { position: absolute; top: -8rpx; right: -8rpx; width: 36rpx; height: 36rpx; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; }
.ref-del-icon { font-size: 24rpx; color: #fff; line-height: 1; }
.ref-add { width: 140rpx; height: 140rpx; border: 2rpx dashed #ccc; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; }
.ref-add-icon { font-size: 44rpx; color: #ccc; }

/* ---- Crew ---- */
.section-header { display: flex; justify-content: space-between; align-items: center; }
.group-badge { font-size: 20rpx; background: linear-gradient(135deg, #C49B9B, #ff6b6b); color: #fff; padding: 4rpx 14rpx; border-radius: 12rpx; }
.crew-item { display: flex; align-items: center; padding: 10rpx 0; }
.crew-item + .crew-item { border-top: 1px solid rgba(0,0,0,0.05); }
.crew-role-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 10rpx; color: #fff; margin-right: 10rpx; flex-shrink: 0; }
.role-tailor { background: #7B9EBD; }
.role-shoot { background: #8CAF9E; }
.role-makeup { background: #C49B9B; }
.role-wig { background: #9B8EC4; }
.role-prop { background: #C4A87C; }
.role-logistics { background: #8E9E9E; }
.crew-name { font-size: 26rpx; color: #333; flex: 1; }
.crew-edit { font-size: 24rpx; color: #999; padding: 0 6rpx; flex-shrink: 0; }
.crew-del { font-size: 26rpx; color: #ccc; padding: 0 6rpx; flex-shrink: 0; }
.crew-empty { font-size: 24rpx; color: #bbb; text-align: center; padding: 16rpx 0; }
.role-picker { display: flex; flex-wrap: wrap; gap: 10rpx; }
.role-option { font-size: 24rpx; padding: 8rpx 20rpx; border-radius: 16rpx; background: #f5f5f5; color: #666; }
.role-option-active { background: #667eea; color: #fff; }

/* ---- Checklist ---- */
.check-item { display: flex; align-items: center; padding: 12rpx 0; }
.check-item + .check-item { border-top: 1px solid rgba(0,0,0,0.05); }
.check-icon { font-size: 30rpx; margin-right: 12rpx; flex-shrink: 0; }
.check-label { font-size: 28rpx; color: #555; flex: 1; }
.check-label.done { color: #bbb; text-decoration: line-through; }
.check-del { font-size: 26rpx; color: #ccc; padding: 0 6rpx; flex-shrink: 0; }

.add-row { padding: 14rpx; border: 2rpx dashed #ddd; border-radius: 12rpx; display: flex; justify-content: center; margin-top: 14rpx; }
.add-text { font-size: 24rpx; color: #667eea; }

/* ---- Modal ---- */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: flex-end; }
.modal-card { width: 100%; background: #fff; border-radius: 32rpx 32rpx 0 0; padding: 36rpx 30rpx 60rpx; }
.modal-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 24rpx; text-align: center; }
.modal-field { margin-bottom: 18rpx; }
.modal-label { font-size: 22rpx; color: #999; display: block; margin-bottom: 6rpx; }
.modal-input { height: 68rpx; background: #f5f5f5; border-radius: 12rpx; padding: 0 16rpx; font-size: 26rpx; color: #333; }
.modal-actions { display: flex; gap: 16rpx; margin-top: 24rpx; }
.modal-btn { flex: 1; height: 80rpx; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; }
.modal-btn-del { background: rgba(244,67,54,0.15); border: 1px solid rgba(244,67,54,0.25); }
.modal-btn-text-del { font-size: 26rpx; color: #f44336; font-weight: bold; }
.modal-btn-save { background: linear-gradient(135deg, #667eea, #764ba2); }
.modal-btn-text-save { font-size: 26rpx; color: #fff; font-weight: bold; }

.share-btn { width: 100%; height: 88rpx; background: #fff; border-radius: 50rpx; display: flex; align-items: center; justify-content: center; margin-top: 12rpx; }
.share-text { font-size: 28rpx; color: #667eea; font-weight: bold; }
</style>