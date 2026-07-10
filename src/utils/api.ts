interface RoleRecommendParams {
  height: number
  weight: number
  temperament: string
  photoBase64?: string
}

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
  const { height, weight, temperament, photoBase64 } = params

  const userMessage = `请根据以下信息推荐角色：身高${height}cm，体重${weight}kg，气质${temperament}`

  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://api.deepseek.com/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer sk-901d6ff43d374c1aabbbf75c12e33425',
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
        Authorization: 'Bearer sk-901d6ff43d374c1aabbbf75c12e33425',
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
