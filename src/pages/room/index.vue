<template>
  <view class="page">
    <view class="header">
      <text class="room-name">{{ room.name }}</text>
      <view class="invite-row">
        <text class="invite-label">邀请码</text>
        <text class="invite-code">{{ room.inviteCode }}</text>
        <text class="copy-btn" @tap="copyInviteCode">复制</text>
      </view>
    </view>

    <view class="members-row">
      <view v-for="(m, i) in visibleMembers" :key="i" class="member-item">
        <view class="member-avatar"><text class="member-icon">👤</text></view>
        <text class="member-name">{{ m.name }}</text>
        <text class="member-role">{{ m.role }}</text>
      </view>
      <view v-if="room.members.length > 5" class="member-item">
        <view class="member-avatar member-more"><text class="more-text">+{{ room.members.length - 5 }}</text></view>
      </view>
    </view>

    <view class="card">
      <text class="section-title">团队进度</text>
      <view v-for="(m, i) in room.members" :key="i" class="member-progress">
        <view class="mp-header"><text class="mp-name">{{ m.name }}</text><text class="mp-role">({{ m.role }})</text></view>
        <view class="progress-bar"><view class="progress-fill" :style="{ width: m.progress + '%' }"></view></view>
        <view class="timeline">
          <view v-for="(node, j) in m.timeline" :key="j" class="timeline-node" :class="'tl-' + node.status">
            <text class="tl-icon">{{ statusIcon(node.status) }}</text>
            <text class="tl-label">{{ node.label }}</text>
            <text v-if="node.status === 'overdue'" class="tl-overdue">超{{ node.days }}天</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="section-title">最新动态</text>
      <view v-for="(d, i) in room.feeds" :key="i" class="feed-item">
        <text class="feed-avatar">👤</text>
        <view class="feed-body"><text class="feed-content">{{ d.text }}</text><text class="feed-time">{{ d.time }}</text></view>
      </view>
      <view v-if="room.feeds.length === 0" class="no-data">暂无动态</view>
    </view>

    <view class="card">
      <text class="section-title">投票</text>
      <view v-if="room.poll">
        <text class="poll-title">{{ room.poll.title }}</text>
        <view v-for="(opt, i) in room.poll.options" :key="i" class="poll-option" @tap="votePoll(i)">
          <text class="poll-opt-label">{{ opt.label }}</text>
          <view class="poll-bar-wrap"><view class="poll-bar" :style="{ width: pollPercent(i) + '%' }"></view></view>
          <text class="poll-count">{{ opt.votes }}票</text>
        </view>
      </view>
      <view v-else class="no-data">暂无投票</view>
    </view>

    <view class="bottom-bar">
      <view class="bar-item" @tap="handleUpdateProgress"><text class="bar-icon">📝</text><text class="bar-label">更新进度</text></view>
      <view class="bar-item" @tap="createPoll"><text class="bar-icon">🗳</text><text class="bar-label">发起投票</text></view>
      <view class="bar-item" @tap="handleSettings"><text class="bar-icon">⚙️</text><text class="bar-label">房间设置</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'

interface PollOption { label: string; votes: number }
interface Poll { title: string; options: PollOption[] }
interface TimelineNode { status: string; label: string; days?: number }
interface Member { name: string; role: string; progress: number; timeline: TimelineNode[] }
interface Feed { text: string; time: string }
interface Room { name: string; inviteCode: string; members: Member[]; feeds: Feed[]; poll: Poll | null }

const room = reactive<Room>({
  name: '原神雷电将军小队', inviteCode: 'G342K8',
  members: [
    { name: '雷电将军 coser', role: '雷电将军', progress: 75, timeline: [{ status: 'done', label: '服装完成' }, { status: 'active', label: '道具制作中' }, { status: 'pending', label: '假发造型' }, { status: 'overdue', label: '买材料', days: 2 }] },
    { name: '九条裟罗 coser', role: '九条裟罗', progress: 45, timeline: [{ status: 'done', label: '角色确认' }, { status: 'active', label: '衣服制作中' }, { status: 'pending', label: '道具打磨' }] },
    { name: '毛娘助理', role: '发型师', progress: 30, timeline: [{ status: 'done', label: '设计确认' }, { status: 'overdue', label: '发货', days: 2 }, { status: 'pending', label: '造型' }] },
  ],
  feeds: [
    { text: '雷电将军 coser：衣服已发货', time: '2小时前' },
    { text: '九条裟罗 coser：道具打磨中', time: '5小时前' },
    { text: '系统：毛娘超时2天未更新 [自动]', time: '6小时前' },
  ],
  poll: { title: '漫展集合时间？', options: [{ label: '上午8:00', votes: 3 }, { label: '上午9:00', votes: 2 }, { label: '上午10:00', votes: 1 }] },
})

const visibleMembers = computed(() => room.members.slice(0, 5))
const statusIcon = (s: string) => { if (s === 'done') return '✅'; if (s === 'active') return '🔧'; if (s === 'overdue') return '⚠️'; return '⏳' }
const pollPercent = (i: number) => { if (!room.poll) return 0; const t = room.poll.options.reduce((s, o) => s + o.votes, 0); return t === 0 ? 0 : Math.round((room.poll.options[i].votes / t) * 100) }
const copyInviteCode = () => { uni.setClipboardData({ data: room.inviteCode }); uni.showToast({ title: '邀请码已复制', icon: 'success' }) }
const votePoll = (i: number) => { if (!room.poll) return; room.poll.options[i].votes++; uni.showToast({ title: '投票成功', icon: 'success' }) }
const createPoll = () => { uni.showModal({ title: '发起投票', editable: true, placeholderText: '输入投票主题', success: r => { if (r.confirm && r.content) { room.poll = { title: r.content, options: [{ label: '是', votes: 0 }, { label: '否', votes: 0 }] } } } }) }
const handleUpdateProgress = () => uni.showToast({ title: '功能开发中', icon: 'none' })
const handleSettings = () => uni.showToast({ title: '功能开发中', icon: 'none' })
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); padding: 50rpx 30rpx 160rpx; }
.header { display: flex; flex-direction: column; align-items: center; margin-bottom: 28rpx; }
.room-name { font-size: 40rpx; font-weight: bold; color: #fff; margin-bottom: 14rpx; }
.invite-row { display: flex; align-items: center; gap: 10rpx; background: rgba(255,255,255,0.15); padding: 10rpx 24rpx; border-radius: 40rpx; }
.invite-label { font-size: 20rpx; color: rgba(255,255,255,0.6); }
.invite-code { font-size: 28rpx; font-weight: bold; color: #fff; letter-spacing: 3rpx; }
.copy-btn { font-size: 20rpx; color: #fff; background: rgba(255,255,255,0.25); padding: 4rpx 18rpx; border-radius: 16rpx; }

.members-row { display: flex; gap: 16rpx; margin-bottom: 24rpx; overflow-x: auto; }
.member-item { display: flex; flex-direction: column; align-items: center; width: 100rpx; flex-shrink: 0; }
.member-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 4rpx; }
.member-icon { font-size: 32rpx; }
.member-more { background: rgba(255,255,255,0.1); }
.more-text { font-size: 24rpx; color: rgba(255,255,255,0.6); font-weight: bold; }
.member-name { font-size: 20rpx; color: rgba(255,255,255,0.8); text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
.member-role { font-size: 18rpx; color: rgba(255,255,255,0.5); }

.card { width: 100%; background: rgba(255,255,255,0.9); border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 14rpx; }
.member-progress { margin-bottom: 18rpx; }
.mp-header { display: flex; align-items: center; margin-bottom: 6rpx; }
.mp-name { font-size: 24rpx; color: #333; font-weight: bold; }
.mp-role { font-size: 20rpx; color: #999; margin-left: 6rpx; }
.progress-bar { height: 10rpx; background: #e8e8e8; border-radius: 5rpx; margin-bottom: 10rpx; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 5rpx; }
.timeline { display: flex; gap: 6rpx; flex-wrap: wrap; }
.timeline-node { display: flex; align-items: center; padding: 4rpx 10rpx; border-radius: 12rpx; font-size: 20rpx; }
.tl-done { background: #e8f5e9; color: #4caf50; }
.tl-active { background: #e3f2fd; color: #2196f3; }
.tl-pending { background: #f5f5f5; color: #999; }
.tl-overdue { background: #ffebee; color: #f44336; }
.tl-icon { margin-right: 4rpx; }
.tl-label { margin-right: 4rpx; }
.tl-overdue { font-weight: bold; }

.feed-item { display: flex; padding: 12rpx 0; }
.feed-avatar { font-size: 32rpx; margin-right: 12rpx; }
.feed-body { flex: 1; }
.feed-content { font-size: 24rpx; color: #555; display: block; }
.feed-time { font-size: 20rpx; color: #bbb; margin-top: 2rpx; display: block; }
.no-data { text-align: center; font-size: 24rpx; color: #ccc; padding: 20rpx; }

.poll-title { font-size: 24rpx; font-weight: bold; color: #333; display: block; margin-bottom: 14rpx; }
.poll-option { display: flex; align-items: center; padding: 10rpx 0; }
.poll-opt-label { font-size: 24rpx; color: #555; width: 130rpx; }
.poll-bar-wrap { flex: 1; height: 14rpx; background: #f0f0f0; border-radius: 7rpx; margin: 0 10rpx; overflow: hidden; }
.poll-bar { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 7rpx; }
.poll-count { font-size: 20rpx; color: #999; width: 50rpx; text-align: right; }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(255,255,255,0.95); display: flex; justify-content: space-around; padding: 14rpx 0 34rpx; border-top: 1rpx solid #eee; }
.bar-item { display: flex; flex-direction: column; align-items: center; }
.bar-icon { font-size: 38rpx; margin-bottom: 2rpx; }
.bar-label { font-size: 20rpx; color: #667eea; }
</style>