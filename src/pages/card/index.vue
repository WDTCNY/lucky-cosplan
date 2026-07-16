<template>
  <view class="page">
    <view class="header"><text class="main-title">🎴 电子名片</text></view>
    <template v-if="showEdit">
      <view class="section">
        <text class="section-title">头像</text>
        <view class="avatar-wrap" @tap="pickAvatar">
          <image v-if="card.avatar" class="avatar-img" :src="card.avatar" mode="aspectFill" />
          <view v-else class="avatar-placeholder"><text class="avatar-icon">📸</text><text class="avatar-text">点击上传</text></view>
        </view>
      </view>
      <view class="section glass">
        <view class="field"><text class="label">CN</text><input class="input" v-model="card.cn" placeholder="你的CN/昵称" /></view>
        <view class="field"><text class="label">签名</text><input class="input" v-model="card.signature" placeholder="一句个性签名" /></view>
      </view>
      <view class="section glass">
        <view class="field"><text class="label">属性</text><input class="input" v-model="card.attributes" placeholder="如：御姐/甜系/少年感" /></view>
        <view class="field"><text class="label">混圈</text><input class="input" v-model="card.circles" placeholder="如：原神/崩铁/排球" /></view>
        <view class="field"><text class="label">主推</text><input class="input" v-model="card.favCharacter" placeholder="如：雷电将军单推人" /></view>
        <view class="two-cols"><view class="field"><text class="label">萌点</text><input class="input" v-model="card.likes" placeholder="泪痣/虎牙" /></view><view class="field"><text class="label">雷点</text><input class="input" v-model="card.dislikes" placeholder="乙女向/真人CP" /></view></view>
      </view>
      <view class="section">
        <text class="section-title">Cos 作品</text>
        <view v-for="(w, i) in card.works" :key="w.id" class="work-item glass">
          <view class="work-header"><view class="work-info"><text class="work-name">{{ w.characterName }}</text><text class="work-source">{{ w.workName }}</text></view><text class="work-del" @tap="removeWork(i)">✕</text></view>
          <view class="work-photos">
            <view v-for="(p, pi) in w.photos" :key="pi" class="photo-cell">
              <image class="photo-img" :src="p" mode="aspectFill" />
              <text class="photo-del" @tap="removeWorkPhoto(i, pi)">×</text>
            </view>
            <view v-if="w.photos.length < 3" class="photo-add" @tap="addWorkPhoto(i)"><text class="photo-add-icon">+</text><text class="photo-add-text">上传作品图</text></view>
          </view>
        </view>
        <view v-if="addingWork" class="work-add-form glass">
          <input class="input" v-model="newWork.characterName" placeholder="角色名" />
          <input class="input" v-model="newWork.workName" placeholder="作品出处" style="margin-top:6rpx;" />
          <view class="work-add-actions"><text class="work-add-btn" @tap="addWork">完成</text><text class="work-cancel-btn" @tap="addingWork = false">取消</text></view>
        </view>
        <view v-else class="work-add-trigger" @tap="addingWork = true"><text class="work-add-text">+ 添加作品</text></view>
      </view>
      <view class="section">
        <text class="section-title">自我介绍 <text style="font-size:20rpx;color:rgba(255,255,255,0.3)">({{ card.bio.length }}/300)</text></text>
        <textarea class="bio-textarea glass" v-model="card.bio" placeholder="介绍一下你自己" maxlength="300" />
      </view>
      <view class="section">
        <text class="section-title">社交账号</text>
        <view v-for="(a, i) in card.socialAccounts" :key="i" class="social-item glass">
          <text class="social-platform">{{ a.platform }}</text><text class="social-id">{{ a.id }}</text><text class="social-del" @tap="removeSocial(i)">✕</text>
        </view>
        <view class="platform-tags">
          <view v-for="p in PLATFORMS" :key="p" class="platform-tag" :class="{ active: selectedPlatform === p, used: isPlatformUsed(p) }" @tap="selectPlatform(p)">
            <text>{{ p }}</text>
          </view>
        </view>
        <view v-if="selectedPlatform && !isPlatformUsed(selectedPlatform)" class="platform-input-area">
          <template v-if="selectedPlatform === '其他'">
            <input class="input" v-model="customPlatformName" placeholder="输入平台名称" />
            <input class="input" v-model="newAccountId" placeholder="输入账号ID" />
          </template>
          <template v-else>
            <input class="input" v-model="newAccountId" :placeholder="'请输入' + selectedPlatform + '账号ID'" />
          </template>
          <view class="platform-confirm-btn" @tap="confirmPlatformAccount"><text>确定</text></view>
        </view>
      </view>
      <view class="save-btn" @tap="saveCard"><text>保存名片</text></view>
    </template>
    <template v-else>
      <view class="card-preview-wrap">
        <view class="card-preview">
          <view class="preview-edit-btn" @tap="editCard">✏️</view>
          <view class="preview-identity">
            <image class="preview-avatar" :src="card.avatar" mode="aspectFill" />
            <text class="preview-cn">{{ card.cn }}</text>
            <text class="preview-signature">{{ card.signature }}</text>
            <view class="preview-identity-tags">
              <text v-if="card.attributes" class="identity-tag">{{ card.attributes }}</text>
              <text v-if="card.circles" class="identity-tag">{{ card.circles }}</text>
            </view>
          </view>
          <view class="section-divider"></view>
          <view class="preview-about">
            <text class="section-label">📝 关于我</text>
            <text class="preview-bio-text" :class="{ expanded: bioExpanded }">{{ card.bio || '这个人很懒，什么都没写' }}</text>
            <text v-if="card.bio.length > 60" class="bio-toggle" @tap="bioExpanded = !bioExpanded">{{ bioExpanded ? '收起' : '展开' }}</text>
          </view>
          <view class="section-divider"></view>
          <view class="preview-tags-section">
            <text v-if="card.favCharacter" class="main-tui-label">❤️ 主推 {{ card.favCharacter }}</text>
            <view class="tag-row">
              <text v-if="card.likes" class="mori-tag mori-pink">❤️ {{ card.likes }}</text>
              <text v-if="card.dislikes" class="mori-tag mori-gray">🚫 {{ card.dislikes }}</text>
            </view>
          </view>
          <view class="section-divider"></view>
          <view v-if="card.works.length > 0" class="preview-works-section">
            <text class="section-label">🎬 Cos 作品</text>
            <view class="preview-work-grid">
              <view v-for="w in card.works.slice(0, 3)" :key="w.id" class="preview-work-item">
                <image v-if="w.photos && w.photos.length > 0" class="preview-work-cover" :src="w.photos[0]" mode="aspectFill" />
                <view v-else class="preview-work-placeholder"><text class="preview-work-name">{{ w.characterName }}</text><text class="preview-work-source">{{ w.workName }}</text></view>
              </view>
            </view>
          </view>
          <view class="section-divider"></view>
          <view class="preview-social">
            <text class="section-label">🌐 社交账号</text>
            <view class="social-icons">
              <view v-for="a in card.socialAccounts" :key="a.id" class="social-icon" @tap="copyAccount(a.id)">
                <text class="social-icon-platform">{{ a.platform }}</text>
                <text class="social-icon-id">{{ a.id }}</text>
              </view>
            </view>
          </view>
          <text class="preview-watermark">CosPlan</text>
          <canvas canvas-id="cardCanvas" style="width:375px;height:667px;position:fixed;left:9999px;top:0;z-index:-1;pointer-events:none;"></canvas>
        </view>
        <view class="preview-actions">
          <view class="action-btn action-btn-share" @tap="shareCard"><text>📤 分享</text></view>
          <view class="action-btn action-btn-share" @tap="saveToAlbum"><text>💾 保存到相册</text></view>
        </view>
      </view>
    </template>
  </view>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
interface CosWork { id: string; characterName: string; workName: string; photos: string[] }
interface SocialAccount { platform: string; id: string }
interface CardData { avatar: string; cn: string; signature: string; attributes: string; circles: string; favCharacter: string; likes: string; dislikes: string; works: CosWork[]; bio: string; socialAccounts: SocialAccount[] }
const PLATFORMS = ['微博', '小红书', 'B站', '抖音', '快手', 'QQ', '微信', '其他']
const defaultCard = (): CardData => ({ avatar: '', cn: '', signature: '', attributes: '', circles: '', favCharacter: '', likes: '', dislikes: '', works: [], bio: '', socialAccounts: [] })
const showEdit = ref(true)
const card = ref<CardData>(defaultCard())
const addingWork = ref(false)
const newWork = ref<CosWork>({ id: '', characterName: '', workName: '' })
const selectedPlatform = ref('')
const newAccountId = ref('')
const customPlatformName = ref('')
const bioExpanded = ref(false)
const loadCard = () => { try { const d = uni.getStorageSync('cosplan_card'); if (d) { card.value = { ...defaultCard(), ...d }; showEdit.value = false } } catch {} }
const saveCard = () => { uni.setStorageSync('cosplan_card', card.value); showEdit.value = false; uni.showToast({ title: '名片已保存', icon: 'success' }) }
const editCard = () => { showEdit.value = true; bioExpanded.value = false }
const pickAvatar = () => { uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: (r) => { card.value.avatar = r.tempFilePaths[0] } }) }
const addWorkPhoto = (workIdx: number) => {
  uni.chooseImage({ count: 3 - card.value.works[workIdx].photos.length, sizeType: ['compressed'], success: (r) => {
    const w = card.value.works[workIdx]
    if (w) w.photos.push(...r.tempFilePaths as string[])
  }})
}
const removeWorkPhoto = (workIdx: number, photoIdx: number) => { card.value.works[workIdx]?.photos.splice(photoIdx, 1) }
const addWork = () => { if (!newWork.value.characterName.trim()) return; const id = Date.now().toString(36); card.value.works.push({ ...newWork.value, id, photos: [] }); newWork.value = { id: '', characterName: '', workName: '' }; addingWork.value = false }
const removeWork = (i: number) => { card.value.works.splice(i, 1) }
const isPlatformUsed = (p: string) => card.value.socialAccounts.some(a => a.platform === p)
const selectPlatform = (p: string) => { if (!isPlatformUsed(p)) { selectedPlatform.value = p; newAccountId.value = '' } }
const confirmPlatformAccount = () => {
  const platform = selectedPlatform.value === '其他' ? customPlatformName.value.trim() : selectedPlatform.value
  if (!platform || !newAccountId.value.trim()) { uni.showToast({ title: '请填写完整', icon: 'none' }); return }
  card.value.socialAccounts.push({ platform, id: newAccountId.value.trim() })
  selectedPlatform.value = ''; newAccountId.value = ''; customPlatformName.value = ''
}
const removeSocial = (i: number) => { card.value.socialAccounts.splice(i, 1) }
const copyAccount = (id: string) => { uni.setClipboardData({ data: id }) }
const shareCard = () => { uni.share({ title: card.value.cn + '的Cos名片', summary: card.value.bio || '' }) }
const saveToAlbum = () => {
  uni.showLoading({ title: '生成中...' })
  const ctx = uni.createCanvasContext('cardCanvas')
  const W = 375, H = 667, cx = 30, cy = 30, cw = 315
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath() }
  ctx.setFillStyle('#1B1725'); ctx.fillRect(0, 0, W, H)
  ctx.setFillStyle('rgba(255,255,255,0.04)'); rr(cx, cy, cw, 607, 12); ctx.fill()
  let y = cy + 30
  if (card.value.avatar) { ctx.save(); ctx.beginPath(); ctx.arc(W / 2, y + 25, 25, 0, Math.PI * 2); ctx.closePath(); ctx.clip(); ctx.drawImage(card.value.avatar, W / 2 - 25, y, 50, 50); ctx.restore(); y += 70 }
  ctx.setFillStyle('#b44dff'); ctx.setFontSize(18); ctx.setTextAlign('center'); ctx.fillText(card.value.cn || 'Coser', W / 2, y); y += 26
  ctx.setFillStyle('rgba(255,255,255,0.5)'); ctx.setFontSize(12); ctx.fillText(card.value.signature || '', W / 2, y); y += 22
  let tags = []; if (card.value.attributes) tags.push(card.value.attributes); if (card.value.circles) tags.push(card.value.circles)
  if (tags.length > 0) { ctx.setFontSize(11); let tx = W / 2 - (tags.length * 65) / 2; tags.forEach(t => { ctx.setFillStyle('rgba(255,255,255,0.08)'); rr(tx, y - 8, 65, 22, 11); ctx.fill(); ctx.setFillStyle('rgba(255,255,255,0.6)'); ctx.fillText(t, tx + 32, y + 4); tx += 75 }); y += 30 }
  ctx.setFillStyle('rgba(255,255,255,0.06)'); ctx.fillRect(cx + 10, y, cw - 20, 1); y += 18
  ctx.setFillStyle('rgba(255,255,255,0.4)'); ctx.setFontSize(10); ctx.fillText('📝 关于我', cx + 15, y); y += 16
  ctx.setFillStyle('rgba(255,255,255,0.8)'); ctx.setFontSize(13)
  const bio = card.value.bio || '这个人很懒，什么都没写'; const mw = cw - 30; let lh = 18; let str = ''; let ly = 0
  for (let i = 0; i < bio.length; i++) { let test = str + bio[i]; let tw = test.length * 8; if (tw > mw && str.length > 0) { ctx.fillText(str, cx + 15, y + ly * lh); ly++; if (ly >= 3) break; str = bio[i] } else { str = test } }
  if (str && ly < 3) ctx.fillText(str, cx + 15, y + ly * lh)
  y += (Math.min(ly + 1, 3) * lh) + 8
  ctx.setFillStyle('rgba(255,255,255,0.06)'); ctx.fillRect(cx + 10, y, cw - 20, 1); y += 16
  if (card.value.favCharacter) { ctx.setFillStyle('rgba(255,255,255,0.9)'); ctx.setFontSize(12); ctx.fillText('❤️ 主推 ' + card.value.favCharacter, W / 2, y); y += 22 }
  ctx.setFontSize(11)
  if (card.value.likes) { ctx.setFillStyle('rgba(196,155,155,0.2)'); rr(W / 2 - 80, y - 8, 160, 22, 11); ctx.fill(); ctx.setFillStyle('#C49B9B'); ctx.fillText('❤️ ' + card.value.likes, W / 2, y + 4); y += 26 }
  if (card.value.dislikes) { ctx.setFillStyle('rgba(142,158,158,0.2)'); rr(W / 2 - 80, y - 8, 160, 22, 11); ctx.fill(); ctx.setFillStyle('#8E9E9E'); ctx.fillText('🚫 ' + card.value.dislikes, W / 2, y + 4); y += 26 }
  y += 4
  ctx.setFillStyle('rgba(255,255,255,0.4)'); ctx.setFontSize(10); ctx.fillText('🎬 Cos 作品', cx + 15, y); y += 16
  const ws = card.value.works.slice(0, 3)
  if (ws.length > 0) { const ww = 80; let wx = cx + (cw - ws.length * 90) / 2 + 5; ws.forEach(w => { if (w.photos && w.photos.length > 0) ctx.drawImage(w.photos[0], wx, y, ww, ww); else { ctx.setFillStyle('rgba(255,255,255,0.04)'); rr(wx, y, ww, ww, 8); ctx.fill() }; ctx.setFillStyle('rgba(255,255,255,0.8)'); ctx.setFontSize(11); ctx.fillText(w.characterName, wx + ww / 2, y + ww + 14); wx += 90 }); y += ww + 30 }
  ctx.setFillStyle('rgba(255,255,255,0.06)'); ctx.fillRect(cx + 10, y, cw - 20, 1); y += 16
  ctx.setFillStyle('rgba(255,255,255,0.4)'); ctx.setFontSize(10); ctx.fillText('🌐 社交账号', cx + 15, y); y += 16
  if (card.value.socialAccounts.length > 0) { ctx.setFontSize(11); let sx = cx + 15; card.value.socialAccounts.forEach(a => { ctx.setFillStyle('rgba(255,255,255,0.04)'); const sw = (a.platform.length + a.id.length) * 7 + 20; rr(sx, y - 8, sw, 22, 8); ctx.fill(); ctx.setFillStyle('rgba(255,255,255,0.6)'); ctx.fillText(a.platform + ' ' + a.id, sx + 10, y + 4); sx += sw + 16 }); y += 28 }
  ctx.setFillStyle('rgba(255,255,255,0.2)'); ctx.setFontSize(9); ctx.fillText('CosPlan', W / 2, cy + 607 - 15)
  ctx.draw(false, () => { setTimeout(() => { uni.canvasToTempFilePath({ canvasId: 'cardCanvas', success: (res) => { uni.hideLoading(); uni.saveImageToPhotosAlbum({ filePath: res.tempFilePath, success: () => { uni.showToast({ title: '已保存到相册', icon: 'success' }) }, fail: () => { uni.showToast({ title: '保存失败，请授权相册权限', icon: 'none' }) } }) }, fail: () => { uni.hideLoading(); uni.showToast({ title: '生成图片失败', icon: 'none' }) } }) }, 200) })
}
onMounted(loadCard)
</script>
<style lang="scss" scoped>
.page { min-height: 100vh; background: #1B1725; padding: 40rpx 30rpx 100rpx; }
.header { margin-bottom: 24rpx; }
.main-title { font-size: 40rpx; font-weight: bold; color: rgba(255,255,255,0.9); }
.section { margin-bottom: 24rpx; }
.section-title { font-size: 26rpx; font-weight: bold; color: rgba(255,255,255,0.8); display: block; margin-bottom: 12rpx; }
.glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16rpx; padding: 14rpx; }
.avatar-wrap { width: 140rpx; height: 140rpx; border-radius: 50%; overflow: hidden; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; }
.avatar-img { width: 100%; height: 100%; }
.avatar-placeholder { display: flex; flex-direction: column; align-items: center; }
.avatar-icon { font-size: 36rpx; }
.avatar-text { font-size: 18rpx; color: rgba(255,255,255,0.3); }
.field { margin-bottom: 12rpx; }
.label { font-size: 22rpx; color: rgba(255,255,255,0.45); display: block; margin-bottom: 4rpx; }
.input { width: 100%; height: 64rpx; background: rgba(255,255,255,0.06); border-radius: 10rpx; padding: 0 14rpx; font-size: 26rpx; color: rgba(255,255,255,0.8); box-sizing: border-box; border: 1px solid rgba(255,255,255,0.06); }
.two-cols { display: flex; gap: 12rpx; }
.two-cols .field { flex: 1; }
.bio-textarea { width: 100%; min-height: 140rpx; padding: 14rpx; font-size: 24rpx; color: rgba(255,255,255,0.8); box-sizing: border-box; }
.work-item { display: flex; flex-direction: column; gap: 10rpx; padding: 14rpx; margin-bottom: 10rpx; }
.work-info { flex: 1; }
.work-header { display: flex; align-items: center; width: 100%; }
.work-name { font-size: 24rpx; color: rgba(255,255,255,0.8); display: block; }
.work-source { font-size: 20rpx; color: rgba(255,255,255,0.35); }
.work-del { font-size: 24rpx; color: rgba(255,255,255,0.2); padding: 4rpx; }
.work-add-form { padding: 14rpx; margin-bottom: 10rpx; }
.work-add-actions { display: flex; gap: 16rpx; margin-top: 10rpx; }
.work-add-btn { font-size: 24rpx; color: #b44dff; font-weight: bold; }
.work-cancel-btn { font-size: 24rpx; color: rgba(255,255,255,0.3); }
.work-add-trigger { padding: 14rpx; border: 1rpx dashed rgba(180,77,255,0.25); border-radius: 12rpx; text-align: center; }
.work-add-text { font-size: 24rpx; color: #b44dff; }
.social-item { display: flex; align-items: center; gap: 10rpx; padding: 12rpx 14rpx; margin-bottom: 8rpx; }
.social-platform { font-size: 22rpx; padding: 2rpx 10rpx; background: rgba(180,77,255,0.15); color: #b44dff; border-radius: 8rpx; }
.social-id { flex: 1; font-size: 24rpx; color: rgba(255,255,255,0.7); }
.social-del { font-size: 24rpx; color: rgba(255,255,255,0.2); padding: 4rpx; }
.social-add-form { padding: 14rpx; margin-bottom: 8rpx; }
.platform-pick { padding: 10rpx 16rpx; background: rgba(255,255,255,0.06); border-radius: 8rpx; font-size: 24rpx; color: rgba(255,255,255,0.7); }
.social-add-actions { display: flex; gap: 16rpx; margin-top: 10rpx; font-size: 24rpx; color: #b44dff; }
.social-add-trigger { padding: 14rpx; border: 1rpx dashed rgba(180,77,255,0.25); border-radius: 12rpx; text-align: center; }
.social-add-text { font-size: 24rpx; color: #b44dff; }
.work-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8rpx; margin-top: 10rpx; width: 100%; }
.photo-cell { position: relative; aspect-ratio: 1; border-radius: 10rpx; overflow: hidden; background: rgba(255,255,255,0.04); }
.photo-img { width: 100%; height: 100%; }
.photo-del { position: absolute; top: 4rpx; right: 4rpx; width: 32rpx; height: 32rpx; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20rpx; color: #fff; }
.photo-add { aspect-ratio: 1; border: 1rpx dashed rgba(180,77,255,0.3); border-radius: 10rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(180,77,255,0.04); }
.photo-add-icon { font-size: 36rpx; color: #b44dff; line-height: 1; }
.photo-add-text { font-size: 18rpx; color: rgba(180,77,255,0.5); margin-top: 4rpx; }
.platform-tags { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 10rpx; }
.platform-tag { padding: 10rpx 22rpx; border-radius: 22rpx; background: rgba(255,255,255,0.06); font-size: 24rpx; color: rgba(255,255,255,0.5); border: 1px solid transparent; }
.platform-tag.active { background: linear-gradient(135deg, #b44dff, #7c3aed); color: #fff; font-weight: bold; }
.platform-tag.used { opacity: 0.25; pointer-events: none; }
.platform-input-area { display: flex; gap: 10rpx; align-items: center; margin-top: 12rpx; }
.platform-input-area .input { flex: 1; }
.platform-confirm-btn { height: 64rpx; padding: 0 24rpx; background: linear-gradient(135deg, #b44dff, #7c3aed); border-radius: 32rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; color: #fff; font-weight: bold; flex-shrink: 0; }
/* 作品图网格 */
.work-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8rpx; width: 100%; }
/* 已添加的社交账号标签（预览态） */
.social-icon { font-size: 22rpx; padding: 6rpx 14rpx; background: rgba(255,255,255,0.04); border-radius: 12rpx; color: rgba(255,255,255,0.6); }
.social-icon { display: flex; flex-direction: column; align-items: center; padding: 10rpx 18rpx; }
.social-icon-platform { font-size: 18rpx; color: rgba(255,255,255,0.35); }
.social-icon-id { font-size: 22rpx; color: rgba(255,255,255,0.75); font-weight: bold; }
.save-btn { width: 100%; height: 88rpx; background: linear-gradient(135deg, #b44dff, #7c3aed); border-radius: 44rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; color: #fff; font-weight: bold; margin-top: 20rpx; }
.card-preview { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 24rpx; padding: 32rpx; margin-bottom: 24rpx; }
.card-preview { text-align: center; padding: 40rpx 32rpx; }
.preview-header { display: flex; align-items: center; gap: 20rpx; margin-bottom: 24rpx; }
.preview-header { justify-content: center; }
.preview-avatar { width: 120rpx; height: 120rpx; border-radius: 50%; flex-shrink: 0; }
.preview-info { flex: 1; }
.preview-cn { font-size: 36rpx; font-weight: bold; color: rgba(255,255,255,0.9); display: block; margin-bottom: 4rpx; }
.preview-signature { font-size: 22rpx; color: rgba(255,255,255,0.35); }
.preview-tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-bottom: 14rpx; }
.preview-tags { justify-content: center; }
.tag { font-size: 22rpx; padding: 6rpx 18rpx; border-radius: 20rpx; background: rgba(180,77,255,0.15); color: #b44dff; }
.tag-circle { background: rgba(0,229,255,0.12); color: #00e5ff; }
.tag-fav { background: rgba(255,107,171,0.12); color: #ff6bab; }
.preview-micro-tags { display: flex; gap: 10rpx; margin-bottom: 16rpx; flex-wrap: wrap; }
.preview-micro-tags { justify-content: center; }
.micro-tag { font-size: 20rpx; padding: 4rpx 14rpx; background: rgba(255,255,255,0.04); border-radius: 14rpx; color: rgba(255,255,255,0.5); }
.preview-works { margin-bottom: 16rpx; }
.preview-works-section { margin-bottom: 16rpx; }
.preview-subtitle { font-size: 22rpx; color: rgba(255,255,255,0.5); display: block; margin-bottom: 6rpx; }
.preview-bio { margin-bottom: 16rpx; }
.preview-bio-text { font-size: 24rpx; color: rgba(255,255,255,0.7); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.preview-bio-text.expanded { display: block; }
.bio-toggle { font-size: 20rpx; color: #b44dff; margin-top: 4rpx; display: inline-block; }
.social-icons { display: flex; flex-wrap: wrap; gap: 10rpx; }
.social-icons { justify-content: center; }
.preview-actions { margin-top: 34rpx; display: flex; gap: 16rpx; }
.preview-work-grid { display: flex; gap: 14rpx; overflow-x: auto; }
.preview-work-item { min-width: 140rpx; display: flex; flex-direction: column; gap: 4rpx; }
.preview-work-cover { width: 140rpx; height: 180rpx; border-radius: 12rpx; }
.preview-work-name { font-size: 22rpx; color: rgba(255,255,255,0.8); display: block; }
.preview-work-source { font-size: 18rpx; color: rgba(255,255,255,0.35); display: block; }
.action-btn { flex: 1; height: 80rpx; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); font-size: 26rpx; color: rgba(255,255,255,0.8); }

 /* ===== New Preview Layout ===== */
 .card-preview-wrap { width: 100%; display: flex; flex-direction: column; align-items: center; }
 .card-preview { width: 630rpx; padding: 40rpx 30rpx; text-align: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 24rpx; margin: 0 auto; position: relative; overflow: hidden; }
 .card-preview::before { content: ''; position: absolute; width: 120rpx; height: 120rpx; border-radius: 50%; background: radial-gradient(circle, rgba(180,77,255,0.15), transparent 70%); top: -30rpx; right: -30rpx; pointer-events: none; }
 .card-preview::after { content: ''; position: absolute; width: 80rpx; height: 80rpx; border-radius: 50%; background: radial-gradient(circle, rgba(0,229,255,0.1), transparent 70%); bottom: -20rpx; left: -20rpx; pointer-events: none; }
 .preview-edit-btn { position: absolute; top: 12rpx; right: 16rpx; width: 48rpx; height: 48rpx; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 26rpx; z-index: 2; }
 .preview-identity { display: flex; flex-direction: column; align-items: center; margin-bottom: 8rpx; }
 .preview-avatar { width: 100rpx; height: 100rpx; border-radius: 20rpx; margin-bottom: 14rpx; }
 .preview-cn { font-size: 36rpx; font-weight: bold; background: linear-gradient(135deg, #b44dff, #00e5ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 6rpx; }
 .preview-signature { font-size: 24rpx; color: rgba(255,255,255,0.5); display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 12rpx; }
 .preview-identity-tags { display: flex; gap: 10rpx; flex-wrap: wrap; justify-content: center; }
 .identity-tag { font-size: 22rpx; padding: 6rpx 18rpx; border-radius: 30rpx; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
 .section-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 20rpx 20rpx; }
 .section-label { font-size: 20rpx; color: rgba(255,255,255,0.4); display: block; margin-bottom: 12rpx; }
 .preview-about { margin-bottom: 8rpx; }
 .main-tui-label { font-size: 24rpx; color: rgba(255,255,255,0.9); display: block; margin-bottom: 10rpx; }
 .tag-row { display: flex; gap: 10rpx; flex-wrap: wrap; justify-content: center; }
 .mori-tag { font-size: 22rpx; padding: 6rpx 18rpx; border-radius: 20rpx; }
 .mori-pink { background: rgba(196,155,155,0.2); color: #C49B9B; }
 .mori-gray { background: rgba(142,158,158,0.2); color: #8E9E9E; }
 .preview-work-item { width: 180rpx; }
 .preview-work-cover { width: 180rpx; height: 180rpx; border-radius: 16rpx; }
 .preview-work-placeholder { width: 180rpx; height: 180rpx; border-radius: 16rpx; background: rgba(255,255,255,0.04); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4rpx; }
 .preview-work-name { font-size: 22rpx; color: rgba(255,255,255,0.8); display: block; text-align: center; margin-top: 6rpx; }
 .preview-work-source { font-size: 18rpx; color: rgba(255,255,255,0.35); display: block; text-align: center; }
 .preview-watermark { display: block; text-align: center; margin-top: 24rpx; font-size: 18rpx; color: rgba(255,255,255,0.2); }
 .preview-actions { margin-top: 30rpx; display: flex; justify-content: center; }
 .action-btn-share { width: 300rpx; height: 76rpx; border-radius: 38rpx; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); font-size: 26rpx; color: rgba(255,255,255,0.8); }
 .save-btn-wrap { width: 100%; }
 .save-btn { margin-top: 30rpx; }
 

 /* ===== New Preview Layout ===== */
 .card-preview-wrap { width: 100%; display: flex; flex-direction: column; align-items: center; }
 .card-preview { width: 630rpx; padding: 40rpx 30rpx; text-align: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 24rpx; margin: 0 auto; position: relative; overflow: hidden; }
 .card-preview::before { content: ''; position: absolute; width: 120rpx; height: 120rpx; border-radius: 50%; background: radial-gradient(circle, rgba(180,77,255,0.15), transparent 70%); top: -30rpx; right: -30rpx; pointer-events: none; }
 .card-preview::after { content: ''; position: absolute; width: 80rpx; height: 80rpx; border-radius: 50%; background: radial-gradient(circle, rgba(0,229,255,0.1), transparent 70%); bottom: -20rpx; left: -20rpx; pointer-events: none; }
 .preview-edit-btn { position: absolute; top: 12rpx; right: 16rpx; width: 48rpx; height: 48rpx; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 26rpx; z-index: 2; }
 .preview-identity { display: flex; flex-direction: column; align-items: center; margin-bottom: 8rpx; }
 .preview-avatar { width: 100rpx; height: 100rpx; border-radius: 20rpx; margin-bottom: 14rpx; }
 .preview-cn { font-size: 36rpx; font-weight: bold; background: linear-gradient(135deg, #b44dff, #00e5ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 6rpx; }
 .preview-signature { font-size: 24rpx; color: rgba(255,255,255,0.5); display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 12rpx; }
 .preview-identity-tags { display: flex; gap: 10rpx; flex-wrap: wrap; justify-content: center; }
 .identity-tag { font-size: 22rpx; padding: 6rpx 18rpx; border-radius: 30rpx; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
 .section-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 20rpx 20rpx; }
 .section-label { font-size: 20rpx; color: rgba(255,255,255,0.4); display: block; margin-bottom: 12rpx; }
 .preview-about { margin-bottom: 8rpx; }
 .main-tui-label { font-size: 24rpx; color: rgba(255,255,255,0.9); display: block; margin-bottom: 10rpx; }
 .tag-row { display: flex; gap: 10rpx; flex-wrap: wrap; justify-content: center; }
 .mori-tag { font-size: 22rpx; padding: 6rpx 18rpx; border-radius: 20rpx; }
 .mori-pink { background: rgba(196,155,155,0.2); color: #C49B9B; }
 .mori-gray { background: rgba(142,158,158,0.2); color: #8E9E9E; }
 .preview-work-item { width: 180rpx; }
 .preview-work-cover { width: 180rpx; height: 180rpx; border-radius: 16rpx; }
 .preview-work-placeholder { width: 180rpx; height: 180rpx; border-radius: 16rpx; background: rgba(255,255,255,0.04); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4rpx; }
 .preview-work-name { font-size: 22rpx; color: rgba(255,255,255,0.8); display: block; text-align: center; margin-top: 6rpx; }
 .preview-work-source { font-size: 18rpx; color: rgba(255,255,255,0.35); display: block; text-align: center; }
 .preview-watermark { display: block; text-align: center; margin-top: 24rpx; font-size: 18rpx; color: rgba(255,255,255,0.2); }
 .preview-actions { margin-top: 30rpx; display: flex; justify-content: center; }
 .action-btn-share { width: 300rpx; height: 76rpx; border-radius: 38rpx; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); font-size: 26rpx; color: rgba(255,255,255,0.8); }
 .save-btn-wrap { width: 100%; }
 .save-btn { margin-top: 30rpx; }
 
</style>
