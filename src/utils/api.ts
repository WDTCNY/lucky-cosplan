interface RoleRecommendParams {
  height: number
  weight: number
  gender: string
  temperaments: string
  photoBase64?: string
  bust?: string
  waist?: string
  hip?: string
  shoeSize?: string
  budget?: string
  experience?: string
  preferGender?: string
  style?: string
  workType?: string
  otherPreference?: string
}

// ======== Mock / AI 功能模块 ========
export const USE_MOCK = true

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ''

function deepseekCall(messages: any[], maxTokens = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://api.deepseek.com/v1/chat/completions',
      method: 'POST',
      header: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
      data: { model: 'deepseek-chat', messages, temperature: 0.7, max_tokens: maxTokens },
      timeout: 30000,
      success: (res) => { try { const c = (res.data as any).choices[0].message.content; const j = c.match(/\{[\s\S]*\}/); if (j) resolve(j[0]); else reject(new Error('no JSON')) } catch (e) { reject(e) } },
      fail: (err) => { reject(err) },
    })
  })
}

// ======== 智能策划方案 ========
export interface SmartPlanInput { roleName: string; anime: string; height: number; weight: number; bust?: string; waist?: string; hip?: string; targetDate?: string; budget?: number; }
export interface SmartPlanResult { timeline: any[]; materials: any[]; budget: any; personnel: any[]; risks: any[]; }

export async function getSmartPlan(input: SmartPlanInput): Promise<SmartPlanResult> {
  if (USE_MOCK) {
    return {
      timeline: [{ phase: '服装制作', days: 14 }, { phase: '道具制作', days: 7 }, { phase: '假发造型', days: 5 }, { phase: '试装调整', days: 3 }],
      materials: [
        { category: '服装', items: [{ name: '上衣', price: '150-300' }, { name: '下装', price: '100-250' }] },
        { category: '假发', items: [{ name: '假发', price: '80-200' }] },
        { category: '道具', items: [{ name: '武器/配件', price: '50-300' }] },
        { category: '化妆', items: [{ name: '化妆品套组', price: '50-150' }] },
      ],
      budget: { total: '500-1200', modes: [{ name: '省钱', total: '300-500' }, { name: '标准', total: '500-1200' }, { name: '顶配', total: '1200-3000' }] },
      personnel: [{ role: '毛娘', need: true, channel: '闲鱼/QQ群' }, { role: '道具师', need: true, channel: '小红书' }, { role: '摄影', need: true, channel: '小红书/微博' }],
      risks: [{ risk: '裙摆易脏，建议备一套清洁工具' }, { risk: '道具较大，提前确认运输方式' }],
    }
  }
  const prompt = `为Cos角色「${input.roleName}」生成策划方案，包含时间规划、物料清单、预算预估、人员建议、风险提示。返回JSON。`
  const raw = await deepseekCall([{ role: 'system', content: '你是Cosplay策划专家，输出JSON格式方案。' }, { role: 'user', content: prompt }], 1500)
  return JSON.parse(raw)
}

// ======== 场景/城市推荐 ========
export interface LocationRecommend { name: string; reason: string; tags: string[]; }
export async function getLocationRecommend(roleName: string, style: string, city: string): Promise<{ local: LocationRecommend[]; national: LocationRecommend[] }> {
  if (USE_MOCK) {
    return {
      local: [{ name: city + '城市公园', reason: '自然光线充足，适合外景拍摄', tags: ['公园', '自然光'] }, { name: city + '创意园区', reason: '工业风背景，适合酷炫风格角色', tags: ['工业风', '棚拍'] }],
      national: [{ name: '杭州西湖', reason: '古典建筑与自然景观，适合古风/和风角色', tags: ['古风', '园林'] }, { name: '上海外滩', reason: '现代都市背景，适合时尚/都市风格', tags: ['都市', '夜景'] }],
    }
  }
  const prompt = `推荐Cos角色「${roleName}」(风格:${style})在${city}及全国的拍摄场景，返回JSON格式{local:[],national:[]}。`
  const raw = await deepseekCall([{ role: 'system', content: '你是Cosplay拍摄场景推荐专家。' }, { role: 'user', content: prompt }])
  return JSON.parse(raw)
}

// ======== 摄影推荐 ========
export async function getPhotoRecommendation(roleName: string, style: string, city: string): Promise<{ style: string; channels: string[]; tips: string[] }> {
  if (USE_MOCK) {
    return {
      style: '情绪片 + 大光比',
      channels: ['小红书搜 "' + city + ' cos摄影"', 'QQ搜 "' + city + ' 二次元摄影群"'],
      tips: ['该角色裙摆较大，需要广角镜头', '建议提前沟通参考图'],
    }
  }
  const prompt = `推荐Cos角色「${roleName}」的摄影方案，在${city}拍摄，返回JSON。`
  const raw = await deepseekCall([{ role: 'system', content: '你是Cosplay摄影专家。' }, { role: 'user', content: prompt }])
  return JSON.parse(raw)
}

// ======== 电子名片生成 ========
export interface CardData { tags: string[]; recommendRoles: string[]; bio: string; }
export async function generateCard(photoBase64: string, cn?: string, roles?: string[], accounts?: string[]): Promise<CardData> {
  if (USE_MOCK) {
    return {
      tags: ['甜系', '御姐', '可塑性高'],
      recommendRoles: ['初音未来', '绫波丽', '木之本樱'],
      bio: cn ? cn + '，一个热爱Cos的二次元爱好者，擅长甜系与御姐风格' : '风格多变的Coser，擅长驾驭不同类型角色',
    }
  }
  const prompt = '根据照片分析Coser的风格标签、推荐角色和一句话简介，返回JSON。'
  const raw = await deepseekCall([{ role: 'system', content: '你是Cosplay风格分析专家。' }, { role: 'user', content: prompt }])
  return JSON.parse(raw)
}

// ======== 同角色Coser参考 ========
export async function getCoserReference(roleName: string): Promise<{ commonTraits: string[]; commonPractices: string[]; suggestions: string[] }> {
  if (USE_MOCK) {
    return {
      commonTraits: ['多数Coser选择强调腿部线条', '常见搭配为简约风格'],
      commonPractices: ['80%的人选择定制服装而非成品', '多数人提前2个月开始准备'],
      suggestions: ['你身高偏高，可以尝试站姿更有气势的版本', '建议在道具上增加细节差异化'],
    }
  }
  const prompt = `分析Cos角色「${roleName}」的常见cos做法和差异化建议，返回JSON。`
  const raw = await deepseekCall([{ role: 'system', content: '你是Cosplay数据分析师。' }, { role: 'user', content: prompt }])
  return JSON.parse(raw)
}

// ======== 搜索 ========
export async function searchAll(query: string): Promise<{ roles: any[]; expos: any[]; materials: any[] }> {
  const cache: any = { roles: [], expos: [], materials: [] }
  try {
    const favs = uni.getStorageSync('cosplan_favorites') || []
    const history = uni.getStorageSync('cosplan_history') || []
    const expos = uni.getStorageSync('cosplan_expos') || []
    const q = query.toLowerCase()
    cache.roles = [...favs, ...(Array.isArray(history) ? history.map((h: any) => h.data?.roles || []).flat() : [])]
      .filter((r: any) => r.name?.toLowerCase().includes(q))
    cache.expos = (Array.isArray(expos) ? expos : []).filter((e: any) => e.name?.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q))
    cache.materials = []
  } catch {}
  return cache
}

export async function searchRoles(query: string): Promise<any[]> {
  const all = await searchAll(query)
  return all.roles
}

// ======== 联想搜索 ========
export function getSearchSuggestions(query: string): string[] {
  const pool = ['雷电将军', '初音未来', '绫波丽', '木之本樱', '雷姆', '时崎狂三', '夏娜', 'Saber', '灶门炭治郎', '蝴蝶忍', '上海CP31', '广州萤火虫', '北京IDO']
  if (!query) return []
  const q = query.toLowerCase()
  return pool.filter(s => s.toLowerCase().includes(q)).slice(0, 5)
}

export type { RoleRecommendParams, RoleItem, RoleRecommendResult }
interface RoleItem {
  name: string
  anime: string
  reason: string
  difficulty: string
  matchScore: number
}

interface RoleRecommendResult {
  roles: RoleItem[]
}

export async function getRoleRecommend(
  params: RoleRecommendParams
): Promise<RoleRecommendResult> {
  const { height, weight, gender, temperaments, photoBase64, budget, experience, preferGender, style, workType, otherPreference } = params

  const parts = [`身高${height}cm，体重${weight}kg，性别${gender || '不限'}，气质${temperaments || '不限'}`]
  if (budget) parts.push(`预算: ${budget}`)
  if (experience) parts.push(`Cos经验: ${experience}`)
  if (preferGender) parts.push(`偏好性别: ${preferGender}`)
  if (style) parts.push(`风格偏好: ${style}`)
  if (workType) parts.push(`作品类型: ${workType}`)
  if (otherPreference) parts.push(`其他偏好: ${otherPreference}`)
  const userMessage = `请根据以下信息推荐角色：${parts.join('，')}`

  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://api.deepseek.com/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      data: {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是Cosplay角色推荐师。根据用户的身高、体重、气质，推荐3个最合适的动漫角色。只返回JSON，格式：{"roles":[{"name":"角色名","anime":"作品","reason":"理由","difficulty":"难度","matchScore":数字}]}',
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      timeout: 30000,
      success: (res) => {
        try {
          const data = res.data as any
          const content = data.choices[0].message.content
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            resolve(JSON.parse(jsonMatch[0]))
          } else {
            reject(new Error('未找到有效JSON'))
          }
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => {
        reject(err)
      },
    })
  })
}

// ======== 角色详情（人物画像+匹配分析） ========

export interface RoleDetailInput {
  roleName: string
  anime: string
  userInput: { height: number; weight: number; temperament: string }
}

export interface RoleDetailResult {
  portrait: {
    origin: string
    feature: string
    personality: string
    highlight: string
    heat: string
    vibe: string
  }
  match: {
    body: string
    temperament: string
    difficulty: string
    suggestion: string
  }
}

export async function getRoleDetail(
  params: RoleDetailInput
): Promise<RoleDetailResult> {
  const { roleName, anime, userInput } = params
  const prompt = `角色名：${roleName}，作品：${anime}，用户身高${userInput.height}cm体重${userInput.weight}kg气质${userInput.temperament}`

  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://api.deepseek.com/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      data: {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是资深二次元安利bot。根据用户提供的角色和用户自身条件，输出一段人物画像和匹配分析。

要求：
1. 每项必须包含具体信息，禁止说空话套话
2. 禁止使用以下词语：标志性、辨识度极高、层次丰富、关键力量、令人难忘、好评如潮、稍作调整、天然呼应、关键维度
3. 用圈内常用说法，像真人在给同好安利
4. 匹配分析要说具体差异和具体建议

只返回纯JSON，格式：
{"portrait":{"origin":"出处和身份，具体到作品名+定位","feature":"外貌特征，具体描述服装发型道具","personality":"性格，用圈内说法","highlight":"具体名场面或高光时刻","heat":"具体判断烫温冷门和漫展出镜情况","vibe":"整体感觉，圈内话"},"match":{"body":"体型匹配，说具体身高差距和建议","temperament":"气质匹配，说具体哪里像哪里不像","difficulty":"难度匹配，说具体成本和工期","suggestion":"综合建议，给明确结论如是否推荐入坑"}}`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      },
      timeout: 30000,
      success: (res) => {
        try {
          const data = res.data as any
          const content = data.choices[0].message.content
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            resolve(JSON.parse(jsonMatch[0]))
          } else {
            reject(new Error('未找到有效JSON'))
          }
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => {
        reject(err)
      },
    })
  })
}
