interface ExpenseItem {
  id: string
  name: string
  amount: number
  category: string
  status: string
  link?: string
  note?: string
}

interface Budget {
  projectId: string
  totalBudget: number
  items: ExpenseItem[]
}

const BUDGET_KEY = 'cosplan_budgets'

export function saveBudget(projectId: string, totalBudget: number, items: ExpenseItem[]): void {
  const all = getAllBudgets()
  const idx = all.findIndex((b) => b.projectId === projectId)
  const budget: Budget = { projectId, totalBudget, items }
  if (idx >= 0) all[idx] = budget
  else all.unshift(budget)
  uni.setStorageSync(BUDGET_KEY, all)
}

export function getBudget(projectId: string): Budget | null {
  const all = getAllBudgets()
  return all.find((b) => b.projectId === projectId) || null
}

export function getAllBudgets(): Budget[] {
  try {
    const data = uni.getStorageSync(BUDGET_KEY)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function addExpense(
  projectId: string,
  totalBudget: number,
  item: ExpenseItem
): void {
  const budget = getBudget(projectId)
  const items = budget?.items ? [...budget.items, item] : [item]
  saveBudget(projectId, totalBudget, items)
}

export function deleteExpense(projectId: string, itemId: string): void {
  const budget = getBudget(projectId)
  if (!budget) return
  budget.items = budget.items.filter((i) => i.id !== itemId)
  saveBudget(projectId, budget.totalBudget, budget.items)
}

export function getTotalSpent(projectId: string): number {
  const budget = getBudget(projectId)
  if (!budget) return 0
  return budget.items.reduce((sum, i) => sum + i.amount, 0)
}

export type { ExpenseItem, Budget }
