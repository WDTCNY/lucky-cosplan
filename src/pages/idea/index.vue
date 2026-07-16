 <template>
   <view class="page">
     <view class="header"><text class="main-title">💡 灵感便签</text></view>
     <view class="input-card glass">
       <textarea class="idea-input" v-model="newText" placeholder="记录你的Cos灵感..." />
       <view class="input-actions">
         <view class="input-tags">
           <input class="tag-input" v-model="newTag" placeholder="标签（角色/作品）" />
           <text v-if="newImage" class="img-badge" @tap="pickImage">🖼️已选</text>
           <text v-else class="img-btn" @tap="pickImage">🖼️</text>
         </view>
         <text class="post-btn" :class="{ disabled: !newText }" @tap="addIdea">发布</text>
       </view>
     </view>
     <view v-if="ideas.length === 0" class="empty-state"><text class="empty-icon">💡</text><text class="empty-text">还没有灵感</text></view>
     <view v-else class="list">
       <view v-for="(item, idx) in ideas" :key="item.id" class="idea-card" @tap="editIdea(idx)">
         <view class="idea-header"><text class="idea-time">{{ item.time }}</text><text class="idea-del" @tap.stop="deleteIdea(idx)">🗑️</text></view>
         <text class="idea-text">{{ item.text }}</text>
         <image v-if="item.image" class="idea-img" :src="item.image" mode="aspectFill" />
         <view class="idea-tags"><text v-for="t in item.tags" :key="t" class="idea-tag">{{ t }}</text></view>
         <text class="idea-create" @tap.stop="createProject(item)">基于此灵感创建企划 ›</text>
       </view>
     </view>
     <view v-if="editingIdea !== null" class="modal-overlay" @tap="closeEdit">
       <view class="modal-card" @tap.stop>
         <view class="modal-header"><text class="modal-title">编辑灵感</text><text class="modal-close" @tap="closeEdit">✕</text></view>
         <textarea class="modal-input" v-model="editText" placeholder="灵感内容" />
         <input class="modal-tag-input" v-model="editTag" placeholder="标签" />
         <view class="modal-actions"><view class="modal-btn" @tap="saveEdit">保存</view></view>
       </view>
     </view>
   </view>
 </template>
 <script setup lang="ts">
 import { ref, onMounted } from 'vue'
 interface Idea { id: string; text: string; tags: string[]; image?: string; time: string }
 const ideas = ref<Idea[]>([])
 const newText = ref('')
 const newTag = ref('')
 const newImage = ref('')
 const editingIdea = ref<number | null>(null)
 const editText = ref('')
 const editTag = ref('')
 const STORAGE_KEY = 'cosplan_ideas'
 const fmt = () => { const d = new Date(); return `${d.getMonth()+1}.${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
 const load = () => { try { const d = uni.getStorageSync(STORAGE_KEY); if (Array.isArray(d)) ideas.value = d } catch {} }
 const save = () => uni.setStorageSync(STORAGE_KEY, ideas.value)
 const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
 const pickImage = () => { uni.chooseImage({ count: 1, sizeType: ['compressed'], success: (r) => { newImage.value = r.tempFilePaths[0] } }) }
 const addIdea = () => {
   if (!newText.value.trim()) return
   const tags = newTag.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean)
   ideas.value.unshift({ id: genId(), text: newText.value, tags, image: newImage.value || undefined, time: fmt() })
   save(); newText.value = ''; newTag.value = ''; newImage.value = ''
 }
 const deleteIdea = (idx: number) => { uni.showModal({ title: '确认删除', content: '删除后不可恢复', confirmText: '删除', confirmColor: '#ff4444', success: (r) => { if (r.confirm) { ideas.value.splice(idx, 1); save() } } }) }
 const editIdea = (idx: number) => { editingIdea.value = idx; editText.value = ideas.value[idx].text; editTag.value = (ideas.value[idx].tags || []).join('、') }
 const closeEdit = () => { editingIdea.value = null }
 const saveEdit = () => { if (editingIdea.value === null) return; ideas.value[editingIdea.value].text = editText.value; ideas.value[editingIdea.value].tags = editTag.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean); save(); closeEdit() }
 const createProject = (item: Idea) => { uni.navigateTo({ url: '/pages/project/index?fromIdea=' + encodeURIComponent(item.text) }) }
 onMounted(load)
 </script>
 <style lang="scss" scoped>
 .page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 40rpx 30rpx 120rpx; }
 .header { margin-bottom: 24rpx; }
 .main-title { font-size: 40rpx; font-weight: bold; color: #fff; }
 .glass { background: rgba(255,255,255,0.9); border-radius: 20rpx; padding: 24rpx; margin-bottom: 20rpx; }
 .input-card { width: 100%; box-sizing: border-box; }
 .idea-input { width: 100%; min-height: 100rpx; font-size: 26rpx; color: #333; border: none; outline: none; box-sizing: border-box; }
 .input-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
 .input-tags { display: flex; align-items: center; gap: 8rpx; flex: 1; }
 .tag-input { height: 50rpx; background: #f5f5f5; border-radius: 8rpx; padding: 0 12rpx; font-size: 22rpx; flex: 1; }
 .img-btn, .img-badge { font-size: 28rpx; padding: 4rpx 8rpx; }
 .post-btn { padding: 12rpx 32rpx; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 24rpx; font-size: 24rpx; color: #fff; font-weight: bold; }
 .post-btn.disabled { opacity: 0.4; }
 .empty-state { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
 .empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
 .empty-text { font-size: 28rpx; color: rgba(255,255,255,0.7); }
 .list { }
 .idea-card { background: rgba(255,255,255,0.9); border-radius: 16rpx; padding: 20rpx; margin-bottom: 14rpx; }
 .idea-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
 .idea-time { font-size: 20rpx; color: #999; }
 .idea-del { font-size: 24rpx; }
 .idea-text { font-size: 26rpx; color: #333; line-height: 1.5; display: block; margin-bottom: 8rpx; white-space: pre-wrap; }
 .idea-img { width: 100%; height: 200rpx; border-radius: 8rpx; margin-bottom: 8rpx; }
 .idea-tags { display: flex; gap: 6rpx; flex-wrap: wrap; margin-bottom: 8rpx; }
 .idea-tag { font-size: 18rpx; padding: 2rpx 12rpx; background: rgba(102,126,234,0.12); color: #667eea; border-radius: 10rpx; }
 .idea-create { font-size: 22rpx; color: #667eea; }
 .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: flex-end; }
 .modal-card { width: 100%; background: #fff; border-radius: 24rpx 24rpx 0 0; padding: 28rpx 24rpx 60rpx; }
 .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
 .modal-title { font-size: 28rpx; font-weight: bold; color: #333; }
 .modal-close { font-size: 28rpx; color: #999; }
 .modal-input { width: 100%; min-height: 120rpx; background: #f5f5f5; border-radius: 10rpx; padding: 14rpx; font-size: 26rpx; box-sizing: border-box; margin-bottom: 12rpx; }
 .modal-tag-input { width: 100%; height: 60rpx; background: #f5f5f5; border-radius: 10rpx; padding: 0 14rpx; font-size: 24rpx; box-sizing: border-box; margin-bottom: 16rpx; }
 .modal-actions { }
 .modal-btn { width: 100%; height: 76rpx; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 38rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; color: #fff; font-weight: bold; }
 </style>
