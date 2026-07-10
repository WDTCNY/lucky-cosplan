import { ref } from 'vue'

export function useSwipeDelete() {
  const deleteIdx = ref(-1)
  let startX = 0
  let swipeIdx = -1

  const touchStart = (e: any, idx: number) => {
    if (!e?.touches?.[0]) return
    startX = e.touches[0].clientX
    swipeIdx = idx
  }

  const touchEnd = (e: any) => {
    if (!e?.changedTouches?.[0]) return
    const endX = e.changedTouches[0].clientX
    if (startX - endX >= 80) {
      deleteIdx.value = swipeIdx
    } else {
      deleteIdx.value = -1
    }
  }

  const confirmDelete = (onDelete: () => void) => {
    uni.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除吗？',
      confirmText: '删除',
      confirmColor: '#ff4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          onDelete()
          deleteIdx.value = -1
          uni.showToast({ title: '已删除', icon: 'none' })
        } else {
          deleteIdx.value = -1
        }
      },
    })
  }

  return { deleteIdx, touchStart, touchEnd, confirmDelete }
}