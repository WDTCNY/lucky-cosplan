// removed
 
 <script setup lang="ts">
 import { ref, computed, onMounted } from 'vue'
 
 // ---- Types ----
 type CategoryKey = 'all' | 'clothing' | 'wig' | 'prop' | 'cosmetic' | 'other'
 type StatusKey = 'in_use' | 'idle' | 'sold'
 
 interface StorageItem {
   id: string
   name: string
   characterName: string
   category: CategoryKey
   status: StatusKey
   location?: string
   price?: number
   image?: string
   note?: string
   source: 'manual' | 'auto'
 }
 
 // ---- Constants ----
 const categories = [
   { key: 'all' as CategoryKey, label: '全部' },
   { key: 'clothing' as CategoryKey, label: 'C服' },
   { key: 'wig' as CategoryKey, label: '假发' },
   { key: 'prop' as CategoryKey, label: '道具' },
   { key: 'cosmetic' as CategoryKey, label: '妆品' },
   { key: 'other' as CategoryKey, label: '其他' },
 ]
 
 const statuses = [
   { key: 'in_use' as StatusKey, label: '使用中' },
   { key: 'idle' as StatusKey, label: '闲置' },
   { key: 'sold' as StatusKey, label: '已出' },
 ]
 
 const catLabel = (k: CategoryKey) => categories.find(c => c.key === k)?.label || k
 const catIcon = (k: CategoryKey) => {
   const m: Record<string, string> = { clothing: '👘', wig: '💇', prop: '🔧', cosmetic: '💄', other: '📦' }
   return m[k] || '📦'
 }
 const statusLabel = (k: StatusKey) => statuses.find(s => s.key === k)?.label || k
 
 // ---- State ----
 const searchText = ref('')
 const activeTab = ref<CategoryKey>('all')
 const items = ref<StorageItem[]>([])
 const detailItem = ref<StorageItem | null>(null)
 const editingDetail = ref(false)
 const showAddModal = ref(false)
 
 // Edit form
 const editForm = ref<StorageItem>({ id: '', name: '', characterName: '', category: 'clothing', status: 'idle', source: 'manual' })
 
 // Add form
 const addForm = ref<StorageItem>({ id: '', name: '', characterName: '', category: 'clothing', status: 'idle', source: 'manual' })
 
 // ---- Computed ----
 const filteredItems = computed(() => {
   let list = items.value
   if (activeTab.value !== 'all') list = list.filter(i => i.category === activeTab.value)
   if (searchText.value.trim()) {
     const q = searchText.value.trim().toLowerCase()
     list = list.filter(i => i.name.toLowerCase().includes(q) || i.characterName.toLowerCase().includes(q))
   }
   return list
 })
 
 // ---- Storage helpers ----
 const STORAGE_KEY = 'cosplan_warehouse'
 
 function loadItems(): StorageItem[] {
   try {
     const d = uni.getStorageSync(STORAGE_KEY)
     return Array.isArray(d) ? d : []
   } catch { return [] }
 }
 
 function saveItems(list: StorageItem[]) {
   uni.setStorageSync(STORAGE_KEY, list)
 }
 
 function generateId(): string {
   return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
 }
 
 // ---- Sync from projects ----
 function syncFromProjects() {
   const warehouse = loadItems()
   const existingKeys = new Set(warehouse.map(i => `${i.name}::${i.characterName}`))
   let changed = false
 
   try {
     const projects: any[] = uni.getStorageSync('cosplan_projects') || []
     for (const p of projects) {
       if (!Array.isArray(p.materials)) continue
       for (const cat of p.materials) {
         if (!Array.isArray(cat.items)) continue
         for (const mat of cat.items) {
           const key = `${mat.name}::${p.roleName}`
           if (!existingKeys.has(key)) {
             warehouse.push({
               id: generateId(),
               name: mat.name,
               characterName: p.roleName,
               category: mapToCategory(cat.category),
               status: 'idle',
               source: 'auto',
             })
             existingKeys.add(key)
             changed = true
           }
         }
       }
     }
   } catch {}
 
   if (changed) saveItems(warehouse)
   items.value = warehouse
 }
 
 function mapToCategory(catName: string): CategoryKey {
   const m: Record<string, CategoryKey> = {
     '服装': 'clothing', '衣服': 'clothing', 'C服': 'clothing',
     '假发': 'wig', '头发': 'wig', '发型': 'wig',
     '道具': 'prop', '武器': 'prop',
     '妆品': 'cosmetic', '化妆': 'cosmetic', '妆容': 'cosmetic',
   }
   return m[catName] || 'other'
 }
 
 // ---- CRUD ----
 function openDetail(item: StorageItem) {
   detailItem.value = { ...item }
   editingDetail.value = false
 }
 
 function confirmDeleteItem() {
   const item = detailItem.value
   if (!item) return
   uni.showModal({
     title: '确认删除',
     content: `删除「${item.name}」？删除后不可恢复`,
     confirmText: '删除',
     confirmColor: '#ff4444',
     success: (res) => {
       if (res.confirm) {
         items.value = items.value.filter(i => i.id !== item.id)
         saveItems(items.value)
         detailItem.value = null
         uni.showToast({ title: '已删除', icon: 'none' })
       }
     }
   })
 }
 
 function saveEdit() {
   const f = editForm.value
   if (!f.name || !f.characterName) {
     uni.showToast({ title: '请填写名称和角色', icon: 'none' })
     return
   }
   const idx = items.value.findIndex(i => i.id === f.id)
   if (idx >= 0) {
     items.value[idx] = { ...f }
     saveItems(items.value)
     detailItem.value = { ...f }
     editingDetail.value = false
     uni.showToast({ title: '已更新', icon: 'success' })
   }
 }
 
 function confirmAdd() {
   const f = addForm.value
   if (!f.name || !f.characterName) {
     uni.showToast({ title: '请填写名称和角色', icon: 'none' })
     return
   }
   const newItem: StorageItem = {
     id: generateId(),
     name: f.name,
     characterName: f.characterName,
     category: f.category,
     status: f.status,
     location: f.location || undefined,
     price: f.price || undefined,
     image: f.image || undefined,
     note: f.note || undefined,
     source: 'manual',
   }
   items.value.unshift(newItem)
   saveItems(items.value)
   showAddModal.value = false
   addForm.value = { id: '', name: '', characterName: '', category: 'clothing', status: 'idle', source: 'manual' }
   uni.showToast({ title: '已添加', icon: 'success' })
 }
 
 function pickImage() {
   uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: (res) => {
     const path = (res.tempFilePaths as string[])[0]
     if (path) { editForm.value.image = path }
   }})
 }
 
 function pickAddImage() {
   uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: (res) => {
     const path = (res.tempFilePaths as string[])[0]
     if (path) { addForm.value.image = path }
   }})
 }
 
 function viewRelatedPlan(item: StorageItem) {
   detailItem.value = null
   uni.navigateTo({ url: `/pages/project/detail?roleName=${encodeURIComponent(item.characterName)}&new=0` })
 }
 
 // ---- Init ----
 onMounted(() => {
   syncFromProjects()
 })
 </script>
 
 <style lang="scss" scoped>
 .page { min-height: 100vh; background: #1B1725; padding: 0 0 120rpx; }
 
 /* Search bar */
 .search-bar { display: flex; align-items: center; margin: 20rpx 24rpx; background: rgba(255,255,255,0.06); border-radius: 40rpx; padding: 0 24rpx; border: 1px solid rgba(255,255,255,0.08); }
 .search-icon { font-size: 28rpx; margin-right: 12rpx; }
 .search-input { flex: 1; height: 72rpx; font-size: 26rpx; color: rgba(255,255,255,0.8); }
 
 /* Tabs */
 .tabs-scroll { margin: 0 24rpx 16rpx; }
 .tabs { display: flex; gap: 12rpx; }
 .tab { padding: 12rpx 28rpx; border-radius: 30rpx; background: rgba(255,255,255,0.06); border: 1px solid transparent; flex-shrink: 0; }
 .tab.active { background: rgba(180,77,255,0.2); border-color: #b44dff; }
 .tab-text { font-size: 24rpx; color: rgba(255,255,255,0.6); }
 .tab.active .tab-text { color: #b44dff; font-weight: bold; }
 
 /* Stats */
 .stats-bar { margin: 0 24rpx 12rpx; }
 .stats-text { font-size: 22rpx; color: rgba(255,255,255,0.3); }
 
 /* Empty */
 .empty-state { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
 .empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
 .empty-text { font-size: 28rpx; color: rgba(255,255,255,0.7); margin-bottom: 6rpx; }
 .empty-hint { font-size: 22rpx; color: rgba(255,255,255,0.3); margin-bottom: 30rpx; }
 .empty-add-btn { padding: 16rpx 40rpx; border: 1px solid rgba(180,77,255,0.4); border-radius: 40rpx; }
 .empty-add-text { font-size: 26rpx; color: #b44dff; }
 
 /* Item list */
 .item-list { margin: 0 24rpx; display: flex; flex-direction: column; gap: 14rpx; }
 .item-card { display: flex; align-items: center; background: rgba(255,255,255,0.04); border-radius: 16rpx; padding: 18rpx; border: 1px solid rgba(255,255,255,0.06); }
 .item-thumb { width: 80rpx; height: 80rpx; border-radius: 12rpx; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); }
 .thumb-img { width: 100%; height: 100%; }
 .thumb-placeholder { font-size: 36rpx; }
 .item-info { flex: 1; margin: 0 16rpx; min-width: 0; }
 .item-title-row { display: flex; align-items: center; gap: 8rpx; margin-bottom: 4rpx; }
 .item-name { font-size: 26rpx; font-weight: bold; color: rgba(255,255,255,0.85); flex-shrink: 0; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
 .item-character { font-size: 20rpx; color: rgba(255,255,255,0.35); margin-bottom: 6rpx; }
 .item-meta { display: flex; align-items: center; gap: 10rpx; flex-wrap: wrap; }
 .item-location { font-size: 20rpx; color: rgba(255,255,255,0.3); }
 .item-price { font-size: 22rpx; color: #ff6b6b; font-weight: bold; }
 .item-arrow { font-size: 28rpx; color: rgba(255,255,255,0.15); }
 
 /* Tags */
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
 
 /* FAB */
 .fab-btn { position: fixed; bottom: 60rpx; right: 40rpx; width: 96rpx; height: 96rpx; border-radius: 50%; background: linear-gradient(135deg, #b44dff, #7c3aed); display: flex; align-items: center; justify-content: center; box-shadow: 0 8rpx 24rpx rgba(180,77,255,0.35); }
 .fab-text { font-size: 44rpx; color: #fff; font-weight: bold; }
 
 /* Modal */
 .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: flex-end; }
 .modal-card { width: 100%; background: #1A1D24; border-radius: 32rpx 32rpx 0 0; padding: 28rpx 24rpx 60rpx; max-height: 85vh; overflow-y: auto; }
 .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
 .modal-title { font-size: 30rpx; font-weight: bold; color: rgba(255,255,255,0.9); }
 .modal-header-actions { display: flex; gap: 16rpx; }
 .modal-header-btn { font-size: 32rpx; color: rgba(255,255,255,0.4); padding: 0 4rpx; }
 
 .detail-img { width: 100%; height: 360rpx; border-radius: 12rpx; margin-bottom: 20rpx; }
 .detail-body { display: flex; flex-direction: column; gap: 14rpx; }
 .detail-row { display: flex; align-items: flex-start; }
 .detail-label { font-size: 24rpx; color: rgba(255,255,255,0.35); width: 120rpx; flex-shrink: 0; }
 .detail-val { font-size: 26rpx; color: rgba(255,255,255,0.8); flex: 1; }
 .detail-related { margin-top: 20rpx; padding: 16rpx; border-top: 1px solid rgba(255,255,255,0.06); }
 .related-text { font-size: 24rpx; color: #b44dff; }
 
 /* Edit fields */
 .edit-body { display: flex; flex-direction: column; gap: 16rpx; }
 .edit-field { display: flex; flex-direction: column; }
 .edit-field.half { flex: 1; }
 .edit-label { font-size: 22rpx; color: rgba(255,255,255,0.4); margin-bottom: 6rpx; }
 .edit-input { height: 64rpx; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12rpx; padding: 0 16rpx; font-size: 26rpx; color: rgba(255,255,255,0.8); }
 .edit-textarea { width: 100%; min-height: 100rpx; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12rpx; padding: 14rpx 16rpx; font-size: 26rpx; color: rgba(255,255,255,0.8); box-sizing: border-box; }
 .edit-row { display: flex; gap: 16rpx; }
 .edit-options { display: flex; gap: 10rpx; flex-wrap: wrap; }
 .edit-option { padding: 8rpx 20rpx; border-radius: 20rpx; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); font-size: 24rpx; color: rgba(255,255,255,0.5); }
 .edit-option.active { background: rgba(180,77,255,0.2); border-color: #b44dff; color: #b44dff; }
 .edit-img-row { display: flex; align-items: center; gap: 12rpx; }
 .edit-img-preview { width: 120rpx; height: 120rpx; border-radius: 12rpx; }
 .edit-img-btn { padding: 14rpx 24rpx; border: 1px dashed rgba(255,255,255,0.15); border-radius: 12rpx; font-size: 22rpx; color: rgba(255,255,255,0.4); }
 
 .modal-actions { display: flex; gap: 16rpx; margin-top: 24rpx; }
 .modal-btn { flex: 1; height: 76rpx; border-radius: 38rpx; display: flex; align-items: center; justify-content: center; font-size: 26rpx; }
 .modal-btn-cancel { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); }
 .modal-btn-save { background: linear-gradient(135deg, #b44dff, #7c3aed); color: #fff; font-weight: bold; }
 </style>
