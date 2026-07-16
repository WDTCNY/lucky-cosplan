<template>
  <view class="page">
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input class="search-input" v-model="searchText" placeholder="搜索物品名称 / 角色 / 分类..." />
    </view>
    <scroll-view class="tabs-scroll" scroll-x enhanced show-scrollbar="false">
      <view class="tabs">
        <view v-for="cat in categories" :key="cat.key" class="tab" :class="{ active: activeTab === cat.key }" @tap="activeTab = cat.key">
          <text class="tab-text">{{ cat.label }}</text>
        </view>
      </view>
    </scroll-view>
    <view class="stats-bar"><text class="stats-text">共 {{ filteredItems.length }} 件物品</text></view>
    <view v-if="filteredItems.length === 0" class="empty-state">
      <text class="empty-icon">📦</text><text class="empty-text">仓库还空空的</text>
      <text class="empty-hint">从企划导入物料或手动新增</text>
      <view class="empty-add-btn" @tap="showAddModal = true"><text class="empty-add-text">+ 手动添加</text></view>
    </view>

    <view v-else class="list-area">
      <!-- 全选行 -->
      <view v-if="selectMode" class="select-all-row" @tap="toggleSelectAll">
        <view class="circle" :class="{ 'circle-checked': isAllChecked }">
          <text v-if="isAllChecked" class="circle-checkmark">✓</text>
        </view>
        <text class="select-all-text">全选</text>
      </view>

      <view v-for="item in filteredItems" :key="item.id" class="item-card" @longpress="handleLongPress(item)">
        <view v-if="selectMode" class="circle" :class="{ 'circle-checked': selectedIds.has(item.id) }" @click.stop="toggleItem(item.id)">
          <text v-if="selectedIds.has(item.id)" class="circle-checkmark">✓</text>
        </view>
        <view class="item-thumb">
          <image v-if="item.image" class="thumb-img" :src="item.image" mode="aspectFill" />
          <text v-else class="thumb-placeholder">{{ catIcon(item.category) }}</text>
        </view>
        <view class="item-info">
          <view class="item-title-row">
            <text class="item-name">{{ item.name }}</text>
            <text class="item-status-tag" :class="'status-' + item.status">{{ statusLabel(item.status) }}</text>
          </view>
          <text class="item-character">{{ item.characterName }}</text>
          <view class="item-meta">
            <text class="item-cat-tag" :class="'cat-' + item.category">{{ catLabel(item.category) }}</text>
            <text v-if="item.location" class="item-location">📍 {{ item.location }}</text>
            <text v-if="item.price" class="item-price">¥{{ item.price }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 右下角导入按钮 -->
    <view class="fab-btn" @tap="openImportModal">
      <text class="fab-text">📥 导入企划物料</text>
    </view>

    <!-- 底部删除按钮 -->
    <view v-if="selectedIds.size > 0" class="delete-bar">
      <text class="delete-bar-cancel" @tap="clearSelection">取消</text>
      <text class="delete-bar-btn" @tap="confirmBatchDelete">删除选中（{{ selectedIds.size }}项）</text>
    </view>

    <!-- 添加物品弹窗 -->
    <view v-if="showAddModal" class="modal-overlay" @tap="showAddModal = false">
      <view class="modal-card" @tap.stop>
        <view class="modal-header-row">
          <text class="modal-title">添加物品</text>
          <view class="modal-close-btn" @tap="showAddModal = false"><text>×</text></view>
        </view>
        <view class="modal-field">
          <text class="modal-label">物品名</text>
          <input class="modal-input" v-model="addForm.name" placeholder="必填" />
        </view>
        <view class="modal-field">
          <text class="modal-label">分类</text>
          <view class="role-picker">
            <text v-for="cat in categories.filter(c => c.key !== 'all')" :key="cat.key" class="role-option" :class="{ 'role-option-active': addForm.category === cat.key }" @tap="addForm.category = cat.key as any">{{ cat.label }}</text>
          </view>
        </view>
        <view class="modal-field">
          <text class="modal-label">所属角色</text>
          <input class="modal-input" v-model="addForm.characterName" placeholder="选填" />
        </view>
        <view class="modal-field">
          <text class="modal-label">备注</text>
          <input class="modal-input" v-model="addForm.note" placeholder="选填" />
        </view>
        <view class="modal-field">
          <text class="modal-label">照片</text>
          <view class="image-pick-row" @tap="pickAddImage">
            <image v-if="addForm.image" class="picked-img" :src="addForm.image" mode="aspectFill" />
            <text v-else class="pick-placeholder">点击选择照片</text>
          </view>
        </view>
        <view class="modal-actions">
          <view class="modal-btn modal-btn-save" @tap="confirmAdd"><text class="modal-btn-text-save">确认添加</text></view>
        </view>
      </view>
    </view>

    <!-- 导入企划物料弹窗 -->
    <view v-if="showImportModal" class="modal-overlay" @tap="showImportModal = false">
      <view class="modal-card" @tap.stop>
        <view class="modal-header-row">
          <text class="modal-title" @tap="showImportModal = true">📥 导入企划物料</text>
          <view class="modal-close-btn" @tap="showImportModal = false"><text>×</text></view>
        </view>
        <view v-if="!selectedProject" class="project-list">
          <view v-for="p in projectList" :key="p.id" class="project-item" @tap="selectedProject = p">
            <text class="project-item-name">{{ p.roleName }}</text>
            <text class="project-item-count">{{ (p.materials || []).reduce((s: number, c: any) => s + (c.items || []).length, 0) }} 件物料</text>
          </view>
          <view v-if="projectList.length === 0" class="empty-hint" style="text-align:center;padding:40rpx 0;">暂无企划</view>
        </view>
        <view v-else>
          <view class="selected-project-header">
            <text class="selected-project-name">{{ selectedProject.roleName }}</text>
            <text class="selected-project-back" @tap="selectedProject = null">← 返回</text>
          </view>
          <text class="import-hint">{{ importedCount }} 项已导入，{{ importableCount }} 项可导入</text>
          <view v-if="importableCount > 0" class="import-select-all" @tap="toggleImportAll">
            <text>{{ isImportAllSelected ? '✅' : '○' }}</text>
            <text class="import-select-all-text">全选可导入</text>
          </view>
          <view v-for="cat in (selectedProject.materials || [])" :key="cat.category" class="import-cat">
            <text class="import-cat-title">{{ cat.category }}</text>
            <view v-for="item in (cat.items || [])" :key="item.name" class="import-item" :class="{ 'import-item-exists': importedKeys.has(selectedProject.roleName + '||' + item.name) }" @tap="importedKeys.has(selectedProject.roleName + '||' + item.name) ? undefined : toggleImportItem(item, cat)">
              <text>{{ importedKeys.has(selectedProject.roleName + '||' + item.name) ? '✅' : importSelectedKeys.has(selectedProject.roleName + '||' + item.name) ? '✅' : '○' }}</text>
              <text class="import-item-name">{{ item.name }}</text>
            </view>
          </view>
          <view class="modal-actions">
            <view class="modal-btn modal-btn-save" @tap="confirmImport"><text class="modal-btn-text-save">确认导入（{{ importSelectedKeys.size }}项）</text></view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

type CategoryKey = 'all' | 'clothing' | 'wig' | 'prop' | 'cosmetic' | 'other'
type StatusKey = 'in_use' | 'idle' | 'sold'
interface StorageItem { id: string; name: string; characterName: string; category: CategoryKey; status: StatusKey; location?: string; price?: number; image?: string; note?: string; source: 'manual' | 'auto' }

const categories = [
  { key: 'all' as CategoryKey, label: '全部' }, { key: 'clothing' as CategoryKey, label: 'C服' }, { key: 'wig' as CategoryKey, label: '假发' },
  { key: 'prop' as CategoryKey, label: '道具' }, { key: 'cosmetic' as CategoryKey, label: '妆品' }, { key: 'other' as CategoryKey, label: '其他' },
]
const statuses = [
  { key: 'in_use' as StatusKey, label: '使用中' }, { key: 'idle' as StatusKey, label: '闲置' }, { key: 'sold' as StatusKey, label: '已出' },
]
const catLabel = (k: CategoryKey) => categories.find(c => c.key === k)?.label || k
const catIcon = (k: CategoryKey) => ({ clothing: '👘', wig: '💇', prop: '🔧', cosmetic: '💄', other: '📦', all: '📦' })[k] || '📦'
const statusLabel = (k: StatusKey) => statuses.find(s => s.key === k)?.label || k

const searchText = ref('')
const activeTab = ref<CategoryKey>('all')
const items = ref<StorageItem[]>([])
const showAddModal = ref(false)
const showImportModal = ref(false)

const addForm = ref<StorageItem>({ id: '', name: '', characterName: '', category: 'clothing', status: 'idle', source: 'manual' })

// ---- 选择模式 + 勾选状态 ----
const selectMode = ref(false)
const selectedIds = ref(new Set<string>())
const isAllChecked = computed(() => filteredItems.value.length > 0 && filteredItems.value.every(i => selectedIds.value.has(i.id)))

function toggleItem(id: string) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

function toggleSelectAll() {
  selectedIds.value = isAllChecked.value ? new Set() : new Set(filteredItems.value.map(i => i.id))
}

// ---- 单个删除（长按） ----
function handleLongPress(item: StorageItem) {
  selectMode.value = true
  toggleItem(item.id)
  uni.showActionSheet({ itemList: ['删除'], success: (res) => {
    if (res.tapIndex === 0) {
      uni.showModal({ title: '确认删除', content: '删除后不可恢复', confirmText: '删除', confirmColor: '#ff4444', success: (r) => {
        if (r.confirm) {
          items.value = items.value.filter(i => i.id !== item.id)
          saveItems(items.value)
          selectMode.value = false
          selectedIds.value = new Set()
          uni.showToast({ title: '已删除', icon: 'none' })
        }
      }})
    }
  }})
}

function clearSelection() { selectMode.value = false; selectedIds.value = new Set() }

// ---- 批量删除 ----
function confirmBatchDelete() {
  if (selectedIds.value.size === 0) return
  uni.showModal({ title: '确认删除', content: `确认删除选中的 ${selectedIds.value.size} 项吗？`, confirmText: '删除', confirmColor: '#ff4444', success: (r) => {
    if (r.confirm) {
      items.value = items.value.filter(i => !selectedIds.value.has(i.id))
      saveItems(items.value)
      selectMode.value = false
      selectedIds.value = new Set()
      uni.showToast({ title: '已删除', icon: 'none' })
    }
  }})
}

// ---- filtered list ----
const filteredItems = computed(() => {
  let list = items.value
  if (activeTab.value !== 'all') list = list.filter(i => i.category === activeTab.value)
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    list = list.filter(i => i.name.toLowerCase().includes(q) || i.characterName.toLowerCase().includes(q) || catLabel(i.category).toLowerCase().includes(q))
  }
  return list
})

const STORAGE_KEY = 'cosplan_warehouse'
function loadItems(): StorageItem[] { try { const d = uni.getStorageSync(STORAGE_KEY); return Array.isArray(d) ? d : [] } catch { return [] } }
function saveItems(list: StorageItem[]) { uni.setStorageSync(STORAGE_KEY, list) }
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// ---- 手动添加 ----
function confirmAdd() {
  const f = addForm.value
  if (!f.name) { uni.showToast({ title: '请填写物品名', icon: 'none' }); return }
  items.value.unshift({ id: genId(), name: f.name, characterName: f.characterName || '', category: f.category, status: f.status, location: f.location || undefined, price: f.price || undefined, image: f.image || undefined, note: f.note || undefined, source: 'manual' })
  saveItems(items.value)
  showAddModal.value = false
  addForm.value = { id: '', name: '', characterName: '', category: 'clothing', status: 'idle', source: 'manual' }
  uni.showToast({ title: '已添加', icon: 'success' })
}

function pickAddImage() { uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: (r) => { const p = (r.tempFilePaths as string[])[0]; if (p) addForm.value.image = p } }) }

// ---- 导入企划物料 ----
const projectList = ref<any[]>([])
const selectedProject = ref<any>(null)
const importSelectedKeys = ref(new Set<string>())
const importSeed = ref(0)

function openImportModal() {
  importSeed.value++
  selectedProject.value = null
  importSelectedKeys.value = new Set()
  showImportModal.value = true
}

const importedKeys = computed(() => {
  void importSeed.value
  if (!selectedProject.value) return new Set<string>()
  const warehouse = loadItems()
  const existing = new Set(warehouse.map(i => i.name + '::' + i.characterName))
  const keys = new Set<string>()
  const materials = selectedProject.value.materials || []
  for (const cat of materials) {
    const items = cat.items || []
    for (const item of items) {
      const dedupKey = item.name + '::' + selectedProject.value.roleName
      if (existing.has(dedupKey)) keys.add(selectedProject.value.roleName + '||' + item.name)
    }
  }
  return keys
})

const importedCount = computed(() => importedKeys.value.size)
const importableCount = computed(() => {
  if (!selectedProject.value) return 0
  let total = 0
  const materials = selectedProject.value.materials || []
  for (const cat of materials) total += (cat.items || []).length
  return total - importedKeys.value.size
})

const isImportAllSelected = computed(() => {
  if (!selectedProject.value) return false
  const importable: string[] = []
  const materials = selectedProject.value.materials || []
  for (const cat of materials) {
    const items = cat.items || []
    for (const item of items) {
      const key = selectedProject.value.roleName + '||' + item.name
      if (!importedKeys.value.has(key)) importable.push(key)
    }
  }
  return importable.length > 0 && importable.every(k => importSelectedKeys.value.has(k))
})

function toggleImportAll() {
  if (!selectedProject.value) return
  const importable: string[] = []
  const materials = selectedProject.value.materials || []
  for (const cat of materials) {
    const items = cat.items || []
    for (const item of items) {
      const key = selectedProject.value.roleName + '||' + item.name
      if (!importedKeys.value.has(key)) importable.push(key)
    }
  }
  if (isImportAllSelected.value) {
    importSelectedKeys.value = new Set()
  } else {
    importSelectedKeys.value = new Set(importable)
  }
}

function toggleImportItem(item: any, cat: any) {
  const key = selectedProject.value.roleName + '||' + item.name
  const s = new Set(importSelectedKeys.value)
  s.has(key) ? s.delete(key) : s.add(key)
  importSelectedKeys.value = s
}

function confirmImport() {
  if (importSelectedKeys.value.size === 0) { uni.showToast({ title: '请选择要导入的物料', icon: 'none' }); return }
  const warehouse = loadItems()
  const existingKeys = new Set(warehouse.map(i => i.name + '::' + i.characterName))
  let added = 0
  const materials = selectedProject.value.materials || []
  for (const cat of materials) {
    const items = cat.items || []
    for (const item of items) {
      const key = selectedProject.value.roleName + '||' + item.name
      if (!importSelectedKeys.value.has(key)) continue
      const dedupKey = item.name + '::' + selectedProject.value.roleName
      if (existingKeys.has(dedupKey)) continue
      warehouse.push({ id: genId(), name: item.name, characterName: selectedProject.value.roleName, category: 'other', status: 'idle', source: 'auto' })
      existingKeys.add(dedupKey)
      added++
    }
  }
  saveItems(warehouse)
  items.value = warehouse
  clearSelection()
  showImportModal.value = false
  selectedProject.value = null
  importSelectedKeys.value = new Set()
  uni.showToast({ title: `已导入 ${added} 项`, icon: 'success' })
}

watch([searchText, activeTab], () => { if (selectMode.value) clearSelection() })

onMounted(() => {
  items.value = loadItems()
  console.log('[仓库] 页面加载，storage 共', items.value.length, '项')
  try { projectList.value = uni.getStorageSync('cosplan_projects') || [] } catch {}
})
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #1B1725; padding: 0 0 120rpx; }
.search-bar { display: flex; align-items: center; margin: 20rpx 24rpx; background: rgba(255,255,255,0.06); border-radius: 40rpx; padding: 0 24rpx; }
.search-icon { font-size: 28rpx; margin-right: 12rpx; }
.search-input { flex: 1; height: 72rpx; font-size: 26rpx; color: rgba(255,255,255,0.8); }
.tabs-scroll { margin: 0 24rpx 16rpx; }
.tabs { display: flex; gap: 12rpx; }
.tab { padding: 12rpx 28rpx; border-radius: 30rpx; background: rgba(255,255,255,0.06); border: 1px solid transparent; flex-shrink: 0; }
.tab.active { background: rgba(180,77,255,0.2); border-color: #b44dff; }
.tab-text { font-size: 24rpx; color: rgba(255,255,255,0.6); }
.tab.active .tab-text { color: #b44dff; font-weight: bold; }
.stats-bar { margin: 0 24rpx 12rpx; }
.stats-text { font-size: 22rpx; color: rgba(255,255,255,0.3); }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(255,255,255,0.7); margin-bottom: 6rpx; }
.empty-hint { font-size: 22rpx; color: rgba(255,255,255,0.3); margin-bottom: 30rpx; }
.empty-add-btn { padding: 16rpx 40rpx; border: 1px solid rgba(180,77,255,0.4); border-radius: 40rpx; }
.empty-add-text { font-size: 26rpx; color: #b44dff; }

/* 全选行 */
.select-all-row { display: flex; align-items: center; gap: 12rpx; margin: 0 24rpx 12rpx; padding: 8rpx 0; }
.select-all-text { font-size: 24rpx; color: rgba(255,255,255,0.6); }

/* 勾选圆圈 */
.circle { width: 24rpx; height: 24rpx; border-radius: 50%; border: 2rpx solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.circle-checked { background: #b44dff; border-color: #b44dff; }
.circle-checkmark { font-size: 16rpx; color: #fff; font-weight: bold; }

/* 物品列表 */
.list-area { margin: 0 24rpx; }
.item-card { display: flex; align-items: center; background: rgba(255,255,255,0.04); border-radius: 16rpx; padding: 18rpx; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 14rpx; gap: 12rpx; }
.item-thumb { width: 80rpx; height: 80rpx; border-radius: 12rpx; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); }
.thumb-img { width: 100%; height: 100%; }
.thumb-placeholder { font-size: 36rpx; }
.item-info { flex: 1; min-width: 0; }
.item-title-row { display: flex; align-items: center; gap: 8rpx; margin-bottom: 4rpx; }
.item-name { font-size: 26rpx; font-weight: bold; color: rgba(255,255,255,0.85); }
.item-character { font-size: 20rpx; color: rgba(255,255,255,0.35); margin-bottom: 6rpx; }
.item-meta { display: flex; align-items: center; gap: 10rpx; flex-wrap: wrap; }
.item-location { font-size: 20rpx; color: rgba(255,255,255,0.3); }
.item-price { font-size: 22rpx; color: #ff6b6b; font-weight: bold; }
.item-cat-tag { font-size: 18rpx; padding: 2rpx 12rpx; border-radius: 12rpx; font-weight: bold; }
.cat-clothing { background: rgba(180,77,255,0.2); color: #b44dff; }
.cat-wig { background: rgba(255,107,171,0.2); color: #ff6bab; }
.cat-prop { background: rgba(255,152,0,0.2); color: #ff9800; }
.cat-cosmetic { background: rgba(76,175,80,0.2); color: #4caf50; }
.cat-other { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }
.item-status-tag { font-size: 18rpx; padding: 2rpx 12rpx; border-radius: 12rpx; font-weight: bold; }
.status-in_use { background: rgba(76,175,80,0.2); color: #4caf50; }
.status-idle { background: rgba(255,193,7,0.2); color: #ffc107; }
.status-sold { background: rgba(244,67,54,0.2); color: #f44336; }

/* 右下角导入按钮 */
.fab-btn { position: fixed; right: 24rpx; bottom: 40rpx; background: linear-gradient(135deg, #b44dff, #7c3aed); border-radius: 36rpx; padding: 16rpx 32rpx; box-shadow: 0 0 30rpx rgba(180,77,255,0.5); z-index: 9; }
.fab-text { font-size: 26rpx; color: #fff; font-weight: bold; white-space: nowrap; }

/* 底部删除按钮 */
.delete-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 100rpx; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; gap: 40rpx; z-index: 10; }
.delete-bar-cancel { font-size: 26rpx; color: rgba(255,255,255,0.5); padding: 8rpx 20rpx; }
.delete-bar-btn { font-size: 28rpx; color: #ff4444; font-weight: bold; }

/* 弹窗 */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: flex-end; }
.modal-card { width: 100%; background: #1A1D24; border-radius: 32rpx 32rpx 0 0; padding: 36rpx 30rpx 60rpx; max-height: 80vh; overflow-y: auto; }
.modal-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.modal-title { font-size: 30rpx; font-weight: bold; color: rgba(255,255,255,0.9); }
.modal-close-btn { width: 44rpx; height: 44rpx; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 24rpx; color: rgba(255,255,255,0.5); }
.modal-field { margin-bottom: 18rpx; }
.modal-label { font-size: 22rpx; color: rgba(255,255,255,0.4); display: block; margin-bottom: 6rpx; }
.modal-input { height: 68rpx; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12rpx; padding: 0 16rpx; font-size: 26rpx; color: rgba(255,255,255,0.8); }
.modal-actions { display: flex; gap: 16rpx; margin-top: 24rpx; }
.modal-btn { flex: 1; height: 80rpx; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; }
.modal-btn-save { background: linear-gradient(135deg, #b44dff, #7c3aed); }
.modal-btn-text-save { font-size: 26rpx; color: #fff; font-weight: bold; }
.role-picker { display: flex; flex-wrap: wrap; gap: 10rpx; }
.role-option { font-size: 24rpx; padding: 8rpx 20rpx; border-radius: 16rpx; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); }
.role-option-active { background: rgba(180,77,255,0.2); color: #b44dff; font-weight: bold; }
.image-pick-row { width: 100%; height: 120rpx; border-radius: 12rpx; border: 1px dashed rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.picked-img { width: 100%; height: 100%; border-radius: 12rpx; }
.pick-placeholder { font-size: 24rpx; color: rgba(255,255,255,0.25); }

/* 导入弹窗 */
.project-list { display: flex; flex-direction: column; gap: 12rpx; }
.project-item { display: flex; justify-content: space-between; align-items: center; padding: 20rpx; background: rgba(255,255,255,0.04); border-radius: 12rpx; }
.project-item-name { font-size: 26rpx; color: rgba(255,255,255,0.8); font-weight: bold; }
.project-item-count { font-size: 22rpx; color: rgba(255,255,255,0.35); }
.selected-project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.selected-project-name { font-size: 28rpx; color: #b44dff; font-weight: bold; }
.selected-project-back { font-size: 22rpx; color: rgba(255,255,255,0.4); }
.import-hint { display: block; font-size: 22rpx; color: rgba(255,255,255,0.35); text-align: center; margin-bottom: 12rpx; }
.import-select-all { display: flex; align-items: center; gap: 10rpx; padding: 12rpx 0; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 12rpx; font-size: 24rpx; }
.import-select-all-text { color: rgba(255,255,255,0.7); }
.import-cat { margin-bottom: 12rpx; }
.import-cat-title { font-size: 22rpx; color: #b44dff; font-weight: bold; display: block; margin-bottom: 6rpx; }
.import-item { display: flex; align-items: center; gap: 10rpx; padding: 8rpx 0; font-size: 24rpx; color: rgba(255,255,255,0.7); }
.import-item-exists { opacity: 0.35; }
.import-item-name { flex: 1; }
</style>