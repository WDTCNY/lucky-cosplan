interface RoleItem {
  name: string
  anime: string
  reason: string
  difficulty: string
  matchScore: number
}

interface RecommendResult {
  roles: RoleItem[]
}

interface HistoryItem {
  data: { roles: RoleItem[] }
  input: { height: number; weight: number; temperament?: string; temperaments?: string[] | string }
  timestamp: number
}

export type { RoleItem, RecommendResult, HistoryItem }

// ---- User data isolation ----
export function getStorageKey(name: string): string {
  try {
    const user = uni.getStorageSync('cosplan_user')
    if (user?.id) return `cosplan_${user.id}_${name}`
  } catch {}
  return `cosplan_${name}`
}

const _hk = () => getStorageKey('history')
const _fk = () => getStorageKey('favorites')
const _mrk = () => getStorageKey('my_rooms')

export function saveHistory(item: HistoryItem): void {
  const list = getHistory()
  list.unshift(item)
  if (list.length > 50) list.length = 50
  uni.setStorageSync(_hk(), list)
}

export function getHistory(): HistoryItem[] {
  try {
    const data = uni.getStorageSync(_hk())
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function clearHistory(): void {
  uni.setStorageSync(_hk(), [])
}

export function toggleFavorite(role: RoleItem): boolean {
  const list = getFavorites()
  const idx = list.findIndex((r) => r.name === role.name)
  if (idx >= 0) {
    list.splice(idx, 1)
    uni.setStorageSync(_fk(), list)
    return false // removed
  } else {
    list.push(role)
    uni.setStorageSync(_fk(), list)
    return true // added
  }
}

export function getFavorites(): RoleItem[] {
  try {
    const data = uni.getStorageSync(_fk())
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function isFavorite(roleName: string): boolean {
  return getFavorites().some((r) => r.name === roleName)
}

// ---------- 我的房间 ----------
interface MyRoom {
  roomId: string
  roomName: string
  role: string
  joinTime: number
}

export type { MyRoom }

const MY_ROOMS_KEY = 'cosplan_my_rooms'

export function addMyRoom(room: MyRoom): void {
  const list = getMyRooms()
  const idx = list.findIndex((r) => r.roomId === room.roomId)
  if (idx >= 0) list[idx] = room
  else list.unshift(room)
  uni.setStorageSync(_mrk(), list)
}

export function getMyRooms(): MyRoom[] {
  try {
    const data = uni.getStorageSync(_mrk())
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function removeRoom(roomId: string): void {
  const list = getMyRooms().filter((r) => r.roomId !== roomId)
  uni.setStorageSync(_mrk(), list)
}

// ---------- 角色详情缓存 ----------
interface CachedRoleDetail {
  data: any
  timestamp: number
}

const ROLE_DETAIL_PREFIX = 'cosplan_role_detail_'
const CACHE_TTL = 90 * 24 * 60 * 60 * 1000 // 90天

function roleDetailKey(roleName: string): string {
  return ROLE_DETAIL_PREFIX + roleName
}

export function getCachedRoleDetail(roleName: string): CachedRoleDetail | null {
  try {
    const raw = uni.getStorageSync(roleDetailKey(roleName))
    if (!raw) return null
    const cached: CachedRoleDetail = raw
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      uni.removeStorageSync(roleDetailKey(roleName))
      return null
    }
    return cached
  } catch {
    return null
  }
}

export function setCachedRoleDetail(roleName: string, data: any): void {
  const cached: CachedRoleDetail = {
    data,
    timestamp: Date.now(),
  }
  uni.setStorageSync(roleDetailKey(roleName), cached)
}

// ---------- 版本名默认规则 ----------
/**
 * 根据角色名生成默认版本名
 * - 没有同角色企划 → 返回角色名
 * - 已有 N 个同角色企划 → 返回 角色名-(N+1)
 * - 用户手动填了版本名 → 直接用填的（由调用方判断）
 */
export function getDefaultVersion(roleName: string): string {
  try {
    const all: any[] = uni.getStorageSync('cosplan_projects') || []
    const sameRoleCount = all.filter((p: any) => p.roleName === roleName).length
    return sameRoleCount === 0 ? roleName : `${roleName}-${sameRoleCount + 1}`
  } catch {
    return roleName
  }
}
