<template>
  <view class="page">
    <view class="header"><text class="role-name">{{ roleName }}</text></view>

    <view class="summary-card card">
      <view class="budget-header">
        <text class="s-label">总预算</text>
        <view v-if="editingBudget" class="budget-edit">
          <input class="budget-input" type="digit" v-model="editBudgetVal" @blur="confirmBudget" @confirm="confirmBudget" />
        </view>
        <text v-else class="budget-value" :class="{ placeholder: totalBudget <= 0 }" @tap="startEditBudget">{{ totalBudget > 0 ? '¥' + totalBudget : '点击设置预算' }}</text>
      </view>
      <view class="progress-wrap">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: barPct + '%', background: barColor }"></view>
        </view>
        <text class="progress-text">{{ barPct }}%</text>
      </view>
      <view class="budget-footer">
        <text class="footer-left">已花费 ¥{{ totalSpent }}</text>
        <text v-if="totalSpent > totalBudget && totalBudget > 0" class="footer-right over">已超支 ¥{{ overAmount }}</text>
        <text v-else class="footer-right">总预算 ¥{{ totalBudget }}</text>
      </view>
    </view>

    <view v-for="(cat, ci) in categories" :key="cat" class="card">
      <view class="cat-header" @tap="toggleCat(ci)">
        <text class="cat-icon">{{ catIcon(cat) }}</text>
        <text class="cat-label" :style="{ color: catColor(cat) }">{{ cat }}</text>
        <text class="cat-total">¥{{ catTotal(cat) }}</text>
        <text class="cat-arrow">{{ foldedCats[ci] ? '▶' : '▼' }}</text>
      </view>
      <view v-show="!foldedCats[ci]">
        <view v-for="item in catItems(cat)" :key="item.id">
          <view class="expense-item" :class="{ 'expense-fixed': item.isFixed }">
            <view class="expense-left">
              <text class="expense-arrow" @tap.stop="toggleChildren(item.id)">{{ item.children && item.children.length ? (childFold[item.id] ? '▶' : '▼') : '' }}</text>
              <text class="expense-name">{{ item.name }}</text>
              <text v-if="item.isFixed" class="expense-lock">🔒</text>
            </view>
            <view v-if="editingAmount === item.id" class="amount-edit">
              <input class="amount-input" type="digit" v-model="editAmountVal" @blur="confirmAmount(item)" @confirm="confirmAmount(item)" />
            </view>
            <text v-else class="expense-amount" @tap.stop="startEditAmount(item)">¥{{ item.amount }}</text>
<text class="expense-del" @tap.stop="removeItem(item.id)">×</text>
          </view>
          <!-- children -->
          <view v-if="item.children && item.children.length && !childFold[item.id]" class="children-list">
            <view v-for="ch in item.children" :key="ch.id" class="child-item">
              <text class="child-name">{{ ch.name }}</text>
              <view v-if="editingChild === ch.id" class="amount-edit">
                <input class="amount-input small" type="digit" v-model="editChildVal" @blur="confirmChild(item, ch)" @confirm="confirmChild(item, ch)" />
              </view>
              <text v-else class="child-amount" @tap.stop="startEditChild(ch)">¥{{ ch.amount }}</text>
              <text class="child-del" @tap.stop="removeChild(item, ch.id)">×</text>
            </view>
            <view class="child-add" @tap="addChild(item)"><text class="child-add-text">＋ 添加子项</text></view>
          </view>
        </view>
      </view>
    </view>

    <view class="add-btn" @tap="handleAdd"><text class="add-text">＋ 添加花费</text></view>

    <!-- Add/Edit modal -->
    <view v-if="showModal" class="modal-overlay" @tap="closeModal">
      <view class="modal-card" @tap.stop>
        <text class="modal-title">{{ editingItemId ? '编辑花费' : '添加花费' }}</text>
        <view class="modal-field">
          <text class="modal-label">物品名</text>
          <input class="modal-input" v-model="modalName" placeholder="输入物品名" />
        </view>
        <view class="modal-field">
          <text class="modal-label">分类</text>
          <view class="role-picker">
            <text v-for="c in categories" :key="c" class="role-option" :class="{ 'role-option-active': modalCat === c }" @tap="modalCat = c" :style="modalCat === c ? { background: catColor(c), color: '#fff' } : {}">{{ c }}</text>
          </view>
        </view>
        <view class="modal-field">
          <text class="modal-label">金额</text>
          <input class="modal-input" type="digit" v-model="modalAmount" placeholder="0" />
        </view>
        <view class="modal-actions">
          <view v-if="editingItemId" class="modal-btn modal-btn-del" @tap="deleteEditingItem"><text class="modal-btn-text-del">删除</text></view>
          <view class="modal-btn modal-btn-save" @tap="saveModalItem"><text class="modal-btn-text-save">保存</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface ChildItem { id: string; name: string; amount: number }
interface BudgetItem { id: string; name: string; amount: number; category: string; isFixed: boolean; children: ChildItem[] }

const categories = ['服装', '👞 鞋', '假发', '道具', '化妆', '摄影', '交通', '其他']
const catColorMap: Record<string, string> = {
  '服装': '#7B9EBD', '👞 鞋': '#9B8EC4', '假发': '#9B8EC4', '道具': '#C4A87C', '化妆': '#C49B9B', '摄影': '#8CAF9E', '交通': '#8E9E9E', '其他': '#8E9E9E',
}
const catColor = (c: string) => catColorMap[c] || '#8E9E9E'
const catIcon = (c: string) => { const m: Record<string,string> = { '服装':'👘', '👞 鞋':'👞', '假发':'💇', '道具':'🔧', '化妆':'💄', '摄影':'📸', '交通':'🚗', '其他':'📦' }; return m[c] || '📦' }

const roleName = ref('')
const totalBudget = ref(2000)
const alertLine = ref(80)
const items = ref<BudgetItem[]>([])
const foldedCats = ref<Record<number, boolean>>({})
const childFold = ref<Record<string, boolean>>({})
const editingAmount = ref('')
const editAmountVal = ref('')
const editingChild = ref('')
const editChildVal = ref('')
const showModal = ref(false)
const editingItemId = ref('')
const modalName = ref('')
const modalCat = ref('其他')
const modalAmount = ref('0')
let pid = ''

// Fixed items
const FIXED: BudgetItem[] = [
  { id: '__fixed_venue', name: '🏠 场地', amount: 0, category: '交通', isFixed: true, children: [] },
  { id: '__fixed_shoot', name: '📸 拍摄', amount: 0, category: '摄影', isFixed: true, children: [] },
]

// Merge fixed items on load
const ensureFixed = () => {
  for (const f of FIXED) {
    if (!items.value.find(i => i.id === f.id)) {
      items.value.unshift({ ...f, children: [...f.children] })
    }
  }
}

const allItems = computed(() => items.value)
const totalSpent = computed(() => items.value.reduce((s, i) => s + i.amount, 0))
const remaining = computed(() => totalBudget.value - totalSpent.value)

// Budget editing
const editingBudget = ref(false)
const editBudgetVal = ref('')
const startEditBudget = () => { editBudgetVal.value = String(totalBudget.value); editingBudget.value = true }
const confirmBudget = () => {
  const v = parseFloat(editBudgetVal.value)
  if (!isNaN(v) && v >= 0) totalBudget.value = v
  editingBudget.value = false
  saveData()
}
const overAmount = computed(() => totalBudget.value > 0 ? (totalSpent.value - totalBudget.value).toFixed(0) : '0')
const barPct = computed(() => {
  if (totalBudget.value <= 0) return 0
  const pct = Math.round((totalSpent.value / totalBudget.value) * 100)
  return pct > 100 ? 100 : pct
})
const barColor = computed(() => {
  if (totalBudget.value <= 0) return '#e0e0e0'
  const pct = (totalSpent.value / totalBudget.value) * 100
  if (pct > 100) return '#ff4444'
  if (pct >= 85) return '#C49B9B'
  if (pct >= 60) return '#C4A87C'
  return '#8CAF9E'
})

const catItems = (cat: string) => allItems.value.filter(i => i.category === cat)
const catTotal = (cat: string) => catItems(cat).reduce((s, i) => s + i.amount, 0).toFixed(0)

const toggleCat = (ci: number) => { foldedCats.value[ci] = !foldedCats.value[ci] }
const toggleChildren = (id: string) => { childFold.value[id] = !childFold.value[id] }

// Amount editing
const startEditAmount = (item: BudgetItem) => {
  if (item.children && item.children.length > 0) return // readonly when has children
  editingAmount.value = item.id
  editAmountVal.value = String(item.amount)
}
const confirmAmount = (item: BudgetItem) => {
  const v = parseFloat(editAmountVal.value)
  if (!isNaN(v) && v >= 0) item.amount = v
  editingAmount.value = ''
}

// Child editing
const startEditChild = (ch: ChildItem) => {
  editingChild.value = ch.id
  editChildVal.value = String(ch.amount)
}
const confirmChild = (item: BudgetItem, ch: ChildItem) => {
  const v = parseFloat(editChildVal.value)
  if (!isNaN(v) && v >= 0) ch.amount = v
  editingChild.value = ''
  recalcParent(item)
}
const addChild = (item: BudgetItem) => {
  uni.showModal({ title: '添加子项', editable: true, placeholderText: '子项名称', success: (res) => {
    if (res.confirm && res.content) {
      if (!item.children) item.children = []
      item.children.push({ id: Date.now().toString(), name: res.content, amount: 0 })
      recalcParent(item)
    }
  }})
}
const removeChild = (item: BudgetItem, childId: string) => {
  if (!item.children) return
  item.children = item.children.filter(c => c.id !== childId)
  recalcParent(item)
}
const recalcParent = (item: BudgetItem) => {
  if (item.children && item.children.length > 0) {
    item.amount = item.children.reduce((s, c) => s + c.amount, 0)
  }
  saveData()
}

const removeItem = (id: string) => {
  const item = items.value.find(i => i.id === id)
  if (item?.isFixed) {
    uni.showModal({
      title: '确认删除',
      content: '拍摄/场地是拍片核心支出，确定要删除吗？',
      confirmText: '确认删除',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          items.value = items.value.filter(i => i.id !== id)
          saveData()
        }
      }
    })
    return
  }
  items.value = items.value.filter(i => i.id !== id)
  saveData()
}

// Add/Edit modal
const handleAdd = () => {
  editingItemId.value = ''
  modalName.value = ''
  modalCat.value = '其他'
  modalAmount.value = '0'
  showModal.value = true
}
const closeModal = () => { showModal.value = false }
const saveModalItem = () => {
  if (!modalName.value.trim()) { uni.showToast({ title: '请输入物品名', icon: 'none' }); return }
  const amt = parseFloat(modalAmount.value) || 0
  if (editingItemId.value) {
    const item = items.value.find(i => i.id === editingItemId.value)
    if (item) { item.name = modalName.value.trim(); item.amount = item.children && item.children.length ? item.amount : amt; item.category = modalCat.value; recalcParent(item) }
  } else {
    items.value.push({ id: Date.now().toString(), name: modalName.value.trim(), amount: amt, category: modalCat.value, isFixed: false, children: [] })
  }
  showModal.value = false
  saveData()
}
const deleteEditingItem = () => {
  if (editingItemId.value) {
    const item = items.value.find(i => i.id === editingItemId.value)
    if (item?.isFixed) {
      showModal.value = false
      setTimeout(() => removeItem(editingItemId.value), 100)
      return
    }
    items.value = items.value.filter(i => i.id !== editingItemId.value)
  }
  showModal.value = false
  saveData()
}

const saveData = () => {
  if (!pid) return
  const all = uni.getStorageSync('cosplan_budget_list') || []
  const i = all.findIndex((b: any) => b.projectId === pid)
  if (i >= 0) {
    all[i].totalBudget = totalBudget.value
    all[i].items = items.value
  }
  uni.setStorageSync('cosplan_budget_list', all)
}

watch([totalBudget, alertLine], () => { saveData() })

onMounted(() => {
  pid = uni.getStorageSync('cosplan_current_budget_id') || Date.now().toString()
  categories.forEach((_, i) => { foldedCats.value[i] = false })
  const lists = uni.getStorageSync('cosplan_budget_list') || []
  const found = lists.find((l: any) => l.projectId === pid)
  if (found) {
    roleName.value = found.roleName || ''
    totalBudget.value = found.totalBudget || 2000
    if (found.items) items.value = found.items
  }
  // Remove "代购买" preset if exists
  items.value = items.value.filter(i => i.name !== '代购买')
  // Ensure default shoe item
  if (!items.value.find(i => i.category === '👞 鞋')) {
    items.value.push({ id: 'default_shoes', name: '鞋子', amount: 0, category: '👞 鞋', isFixed: false, children: [] })
  }
  ensureFixed()
  items.value.forEach(i => { if (i.children && i.children.length > 0) recalcParent(i) })
})
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 50rpx 30rpx 60rpx; }
.header { margin-bottom: 28rpx; }
.role-name { font-size: 40rpx; font-weight: bold; color: #fff; }
.card { width: 100%; background: rgba(255,255,255,0.9); border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; }
.s-label { font-size: 22rpx; color: #999; }
.budget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.budget-edit { display: flex; align-items: center; }
.budget-input { width: 140rpx; height: 50rpx; background: #f5f5f5; border-radius: 8rpx; text-align: center; font-size: 28rpx; color: #333; font-weight: bold; }
.budget-value { font-size: 32rpx; font-weight: bold; color: #333; }
.budget-value.placeholder { font-size: 24rpx; font-weight: normal; color: #bbb; }
.progress-wrap { display: flex; align-items: center; gap: 12rpx; margin-bottom: 10rpx; }
.progress-bar { flex: 1; height: 16rpx; background: rgba(0,0,0,0.06); border-radius: 8rpx; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 8rpx; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.progress-text { font-size: 22rpx; color: #999; width: 56rpx; text-align: right; }
.budget-footer { display: flex; justify-content: space-between; }
.footer-left { font-size: 22rpx; color: #999; }
.footer-right { font-size: 22rpx; color: #999; }
.footer-right.over { color: #ff4444; font-weight: bold; }

.cat-header { display: flex; align-items: center; }
.cat-icon { font-size: 26rpx; margin-right: 8rpx; }
.cat-label { font-size: 24rpx; font-weight: bold; flex: 1; }
.cat-total { font-size: 24rpx; color: #667eea; font-weight: bold; margin-right: 6rpx; }
.cat-arrow { font-size: 20rpx; color: #ccc; }

.expense-item { display: flex; align-items: center; padding: 10rpx 0 0 34rpx; }
.expense-fixed { border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 14rpx; margin-bottom: 6rpx; }
.expense-left { flex: 1; display: flex; align-items: center; }
.expense-arrow { font-size: 18rpx; color: #ccc; margin-right: 6rpx; width: 24rpx; text-align: center; }
.expense-name { font-size: 24rpx; color: #555; }
.expense-lock { font-size: 18rpx; margin-left: 6rpx; }
.expense-amount { font-size: 24rpx; font-weight: bold; color: #ff6b6b; margin: 0 10rpx; }
.amount-edit { margin: 0 4rpx; }
.amount-input { width: 100rpx; height: 46rpx; background: #f5f5f5; border-radius: 6rpx; text-align: center; font-size: 22rpx; color: #ff6b6b; }
.amount-input.small { width: 80rpx; height: 40rpx; font-size: 20rpx; }
.expense-del { font-size: 26rpx; color: #ccc; padding: 0 6rpx; }

.children-list { padding-left: 50rpx; }
.child-item { display: flex; align-items: center; padding: 6rpx 0; }
.child-name { font-size: 22rpx; color: #888; flex: 1; }
.child-amount { font-size: 22rpx; color: #ff6b6b; font-weight: bold; margin: 0 6rpx; }
.child-del { font-size: 22rpx; color: #ddd; padding: 0 4rpx; }
.child-add { padding: 8rpx 0; }
.child-add-text { font-size: 20rpx; color: #667eea; }

.add-btn { width: 100%; height: 88rpx; background: #fff; border-radius: 50rpx; display: flex; align-items: center; justify-content: center; margin-top: 12rpx; }
.add-text { font-size: 28rpx; color: #667eea; font-weight: bold; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: flex-end; }
.modal-card { width: 100%; background: #fff; border-radius: 32rpx 32rpx 0 0; padding: 36rpx 30rpx 60rpx; }
.modal-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 24rpx; text-align: center; }
.modal-field { margin-bottom: 18rpx; }
.modal-label { font-size: 22rpx; color: #999; display: block; margin-bottom: 6rpx; }
.modal-input { height: 68rpx; background: #f5f5f5; border-radius: 12rpx; padding: 0 16rpx; font-size: 26rpx; color: #333; }
.role-picker { display: flex; flex-wrap: wrap; gap: 10rpx; }
.role-option { font-size: 24rpx; padding: 8rpx 20rpx; border-radius: 16rpx; background: #f5f5f5; color: #666; }
.role-option-active { color: #fff; }
.modal-actions { display: flex; gap: 16rpx; margin-top: 24rpx; }
.modal-btn { flex: 1; height: 80rpx; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; }
.modal-btn-del { background: rgba(244,67,54,0.15); border: 1px solid rgba(244,67,54,0.25); }
.modal-btn-text-del { font-size: 26rpx; color: #f44336; font-weight: bold; }
.modal-btn-save { background: linear-gradient(135deg, #667eea, #764ba2); }
.modal-btn-text-save { font-size: 26rpx; color: #fff; font-weight: bold; }
</style>