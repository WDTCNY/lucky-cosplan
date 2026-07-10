<template>
  <view class="page">
    <view class="header"><text class="main-title">漫展日历</text></view>

    <view class="month-switch">
      <text class="month-arrow" @tap="prevMonth">◀</text>
      <text class="month-label">{{ currentYear }}年{{ currentMonth }}月</text>
      <text class="month-arrow" @tap="nextMonth">▶</text>
    </view>

    <view v-if="filteredList.length === 0" class="empty-state">
      <text class="empty-icon">📅</text><text class="empty-text">本月暂无漫展</text>
    </view>

    <view v-else class="list">
      <view
        v-for="(item, idx) in filteredList"
        :key="item.id"
        class="card"
        :class="{ 'card-expanded': expandedIdx === idx }"
        @touchstart="expandedIdx === -1 ? touchStart($event, idx) : null"
        @touchend="expandedIdx === -1 ? touchEnd($event) : null"
        @tap="toggleExpand(idx)"
      >
        <!-- Collapsed view -->
        <view class="expo-collapsed">
          <view class="expo-top">
            <view class="expo-date-box"><text class="expo-date">{{ item.dateLabel }}</text></view>
            <view class="expo-tags">
              <text v-if="isUpcoming(item)" class="tag tag-upcoming">即将开始</text>
            </view>
          </view>
          <view class="expo-body"><text class="expo-name">{{ item.name }}</text><text class="expo-city">📍 {{ item.city }}</text></view>
          <view class="expo-bottom">
            <text class="expo-arrow" :class="{ 'arrow-rotated': expandedIdx === idx }">›</text>
          </view>
          <view v-show="deleteIdx === idx && expandedIdx === -1" class="delete-zone" @click.stop="removeItem(idx)"><text>删除</text></view>
        </view>

        <!-- Expanded view -->
        <view v-if="expandedIdx === idx" class="expo-expanded" @tap.stop="() => {}">
          <view class="expanded-header">
            <text class="expanded-close" @tap.stop="toggleExpand(idx)">收起 ▲</text>
          </view>
          <view class="expanded-row" @tap.stop>
            <text class="expanded-label">名称</text>
            <input class="expanded-input" v-model="item.name" placeholder="漫展名称" @blur="saveData" @confirm="saveData" />
          </view>
          <view class="expanded-row" @tap.stop>
            <text class="expanded-label">日期</text>
            <picker mode="date" :value="dateStr(item)" @change="(e: any) => onDateChange(item, e)">
              <text class="expanded-input clickable">{{ item.dateLabel || '选择日期' }} ✏️</text>
            </picker>
          </view>
          <view class="expanded-row" @tap.stop>
            <text class="expanded-label">地点</text>
            <input class="expanded-input" v-model="item.city" placeholder="城市+场馆" @blur="saveData" @confirm="saveData" />
          </view>
          <text class="expanded-section-title" @tap.stop>参展作品/角色</text>
          <view v-for="(role, ri) in item.roles" :key="ri" class="role-row" @tap.stop>
            <text class="role-text">{{ role }}</text>
            <text class="role-del" @tap.stop="removeRole(item, ri)">×</text>
          </view>
          <view class="role-add" @tap.stop="addRole(item)"><text class="role-add-text">＋ 添加</text></view>
        </view>
      </view>
    </view>

    <view class="fab-btn" @tap="handleAdd"><text class="fab-text">＋ 添加漫展</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useSwipeDelete } from '../../composables/useSwipeDelete'

interface ExpoItem {
  id: string; name: string; city: string; dateLabel: string; dateObj: { year: number; month: number; day: number }; roles: string[]
}

const mockData: ExpoItem[] = [
  { id: '1', name: '上海CP31', city: '上海', dateLabel: '7.15-16', dateObj: { year: 2025, month: 7, day: 15 }, roles: ['初音未来'] },
  { id: '2', name: '广州萤火虫', city: '广州', dateLabel: '7.22', dateObj: { year: 2025, month: 7, day: 22 }, roles: [] },
  { id: '3', name: '北京IDO', city: '北京', dateLabel: '8.5-6', dateObj: { year: 2025, month: 8, day: 5 }, roles: ['木之本樱', '李小狼'] },
]

const now = new Date()
const currentYear = ref(now.getFullYear()); const currentMonth = ref(now.getMonth() + 1); const list = ref<ExpoItem[]>([])
const { deleteIdx, touchStart, touchEnd, confirmDelete } = useSwipeDelete()
const expandedIdx = ref(-1)

const filteredList = computed(() => list.value.filter(item => item.dateObj.year === currentYear.value && item.dateObj.month === currentMonth.value))
const prevMonth = () => { if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- } else { currentMonth.value-- } }
const nextMonth = () => { if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ } else { currentMonth.value++ } }

const toggleExpand = (idx: number) => {
  if (deleteIdx.value === idx) { deleteIdx.value = -1; return }
  expandedIdx.value = expandedIdx.value === idx ? -1 : idx
}
const dateStr = (item: ExpoItem) => {
  const d = item.dateObj; if (!d || !d.year) return ''
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}
const onDateChange = (item: ExpoItem, e: { detail: { value: string } }) => {
  const parts = e.detail.value.split('-')
  if (parts.length === 3) {
    item.dateObj = { year: Number(parts[0]), month: Number(parts[1]), day: Number(parts[2]) }
    item.dateLabel = `${Number(parts[1])}.${Number(parts[2])}`
    saveData()
  }
}
const addRole = (item: ExpoItem) => { uni.showModal({ title: '添加作品/角色', editable: true, placeholderText: '角色名', success: (res) => { if (res.confirm && res.content) { if (!item.roles) item.roles = []; item.roles.push(res.content); saveData() } } }) }
const removeRole = (item: ExpoItem, i: number) => { item.roles.splice(i, 1); saveData() }
const saveData = () => { uni.setStorageSync('cosplan_expos', list.value) }

const removeItem = (localIdx: number) => { confirmDelete(() => { const gi = list.value.findIndex(item => filteredList.value[localIdx] && item.id === filteredList.value[localIdx].id); if (gi >= 0) { list.value.splice(gi, 1); expandedIdx.value = -1; saveData() } }) }
const isUpcoming = (item: ExpoItem) => { const today = new Date(); const d = new Date(item.dateObj.year, item.dateObj.month - 1, item.dateObj.day); const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000); return diff >= 0 && diff <= 3 }
const handleAdd = () => { uni.showModal({ title: '添加漫展', editable: true, placeholderText: '输入漫展名称', success: (res) => { if (res.confirm && res.content) { list.value.unshift({ id: Date.now().toString(), name: res.content, city: '待定', dateLabel: '', dateObj: { year: currentYear.value, month: currentMonth.value, day: 1 }, roles: [] }); saveData() } } }) }
const loadData = () => { try { const s = uni.getStorageSync('cosplan_expos'); if (Array.isArray(s) && s.length > 0) list.value = s; else { list.value = mockData; saveData() } } catch { list.value = mockData } }
onMounted(loadData)
onShow(() => loadData())
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 50rpx 30rpx 120rpx; }
.header { margin-bottom: 24rpx; }
.main-title { font-size: 40rpx; font-weight: bold; color: #fff; }
.month-switch { display: flex; align-items: center; justify-content: center; gap: 28rpx; margin-bottom: 30rpx; }
.month-arrow { font-size: 28rpx; color: rgba(255,255,255,0.8); padding: 6rpx 14rpx; }
.month-label { font-size: 30rpx; font-weight: bold; color: #fff; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 0; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: rgba(255,255,255,0.9); font-weight: bold; }

.card { width: 100%; background: rgba(255,255,255,0.9); border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.card-expanded { padding-bottom: 32rpx; }
.delete-zone { position: absolute; right: 16rpx; top: 50%; transform: translateY(-50%); height: 64rpx; padding: 0 22rpx; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 16rpx; display: flex; align-items: center; justify-content: center; gap: 6rpx; z-index: 2; }
.delete-zone text { font-size: 24rpx; color: #ff6b6b; }
.delete-zone::before { content: '🗑'; font-size: 22rpx; }

.expo-collapsed { position: relative; }
.expo-top { display: flex; align-items: center; gap: 14rpx; margin-bottom: 12rpx; }
.expo-date-box { background: linear-gradient(135deg, #667eea, #764ba2); padding: 8rpx 18rpx; border-radius: 10rpx; }
.expo-date { font-size: 22rpx; color: #fff; font-weight: bold; }
.expo-tags { display: flex; gap: 6rpx; }
.tag { font-size: 18rpx; padding: 4rpx 12rpx; border-radius: 10rpx; }
.tag-upcoming { background: rgba(244,67,54,0.12); color: #f44336; border-radius: 20rpx; padding: 4rpx 16rpx; }
.expo-body { margin-bottom: 6rpx; }
.expo-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 4rpx; }
.expo-city { font-size: 22rpx; color: #999; }
.expo-bottom { display: flex; justify-content: space-between; align-items: center; }
.expo-arrow { font-size: 28rpx; color: #ccc; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: inline-block; }
.arrow-rotated { transform: rotate(90deg); }

/* Expanded */
.expo-expanded { padding-top: 18rpx; }
.expanded-header { display: flex; justify-content: flex-end; margin-bottom: 12rpx; }
.expanded-close { font-size: 22rpx; color: #999; padding: 4rpx 12rpx; }
.expanded-row { display: flex; align-items: center; margin-bottom: 14rpx; }
.expanded-label { font-size: 24rpx; color: #999; width: 80rpx; flex-shrink: 0; }
.expanded-input { flex: 1; height: 56rpx; background: #f5f5f5; border-radius: 8rpx; padding: 0 14rpx; font-size: 26rpx; color: #333; }
.expanded-input.clickable { color: #667eea; line-height: 56rpx; }
.expanded-section-title { font-size: 24rpx; color: #999; display: block; margin: 8rpx 0 6rpx; }
.role-row { display: flex; align-items: center; padding: 8rpx 0 8rpx 80rpx; }
.role-text { flex: 1; font-size: 26rpx; color: #555; }
.role-del { font-size: 26rpx; color: #ccc; padding: 0 8rpx; }
.role-add { margin-left: 80rpx; margin-top: 6rpx; }
.role-add-text { font-size: 24rpx; color: #667eea; }

.fab-btn { position: fixed; bottom: 60rpx; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #667eea, #764ba2); padding: 24rpx 60rpx; border-radius: 50rpx; box-shadow: 0 8rpx 24rpx rgba(102,126,234,0.4); }
.fab-text { font-size: 28rpx; color: #fff; font-weight: bold; }
</style>