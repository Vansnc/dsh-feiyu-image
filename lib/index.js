// dsh-feiyu-image —— 给大肥鱼一个相机
//
// 为什么自己做：dsh-image-studio 停在 0.1.7（8 月），跟 dsh 0.2.x 的依赖对不上，
// 要装就得给它盖版本豁免，风险不值当。而真正有用的只有一件事：
//   让模型能「拍一张」——自动带上她此刻的穿着和所在场景，存成本地文件，能直接发到 QQ。
//
// 生图走百炼 Token Plan（wan2.7-image，compatible-mode chat/completions，回图片 URL）。
// 外观和风格写在配置里，跟生活线（dsh-feiyu-life）的今日剧本联动。

import { readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const DSH_HOME = process.env.DSH_HOME ?? join(homedir(), '.dsh')
const CONFIG = join(DSH_HOME, 'feiyu-image-config.json')
const OUT_DIR = join(DSH_HOME, 'feiyu-image')
const TP_CFG = join(DSH_HOME, 'bailian-tp', 'config.json')
const ARK_CFG = join(DSH_HOME, 'ark', 'config.json')
const DAYS = join(DSH_HOME, 'feiyu-life-days')

const 默认 = {
  总开关: true,
  后端: 'ark',                       // ark = 火山方舟 Seedream；bailian = 百炼 Token Plan
  模型: 'doubao-seedream-5-0-pro-260628',
  备用模型: 'doubao-seedream-5-0-flash-260915',
  用参考图: true,
  参考图: '',                         // 留空 = ~/.dsh/feiyu-image/角色设定/正面.jpg
  种子: 20261109,
  外观: '鲸鱼娘：深蓝色及腰长卷发，发尾渐变成浅蓝；头顶一撮鲸鱼尾形状的呆毛；白色蕾丝女仆头饰，头饰右侧一个小蓝蝴蝶结；两侧各有一只鲸鱼鳍形状的耳，耳内侧白色；蓝色大眼，皮肤白皙，圆脸，21 岁成年女性的比例',
  服装: '深蓝色长袖女仆连衣裙，胸前白色荷叶边衬衣，白色大围裙，裙摆金色藤蔓刺绣，袖口白色荷叶边；身后一条深蓝色鲸鱼尾巴，尾鳍浅蓝；白色连裤袜，深蓝色玛丽珍鞋',
  风格: '偏成熟比例的日系动画人设，赛璐璐上色，清晰线稿，柔和光，非 Q 版，背景干净',
  每日上限: 8,
  最短间隔秒: 30,
  存图目录: '',
}

export const inject = ['tools']

function 读配置() {
  try {
    const raw = JSON.parse(readFileSync(CONFIG, 'utf8'))
    return { ...默认, ...raw }
  } catch { return { ...默认 } }
}

function 存配置(patch) {
  const next = { ...读配置(), ...patch }
  try { mkdirSync(DSH_HOME, { recursive: true }); writeFileSync(CONFIG, JSON.stringify(next, null, 2), 'utf8') } catch {}
  return next
}

function 生活此刻() {
  try {
    const now = new Date()
    const 北京 = new Date(now.getTime() + 8 * 3600e3)
    const ymd = 北京.toISOString().slice(0, 10)
    const 分 = 北京.getUTCHours() * 60 + 北京.getUTCMinutes()
    const day = JSON.parse(readFileSync(join(DAYS, ymd + '.json'), 'utf8'))
    const items = day.items || []
    let cur = null
    for (const x of items) if (分 >= x.起 && 分 < x.止) cur = x
    const 时 = 北京.getUTCHours()
    const 光线 = 时 < 6 ? '天还没亮' : 时 < 9 ? '清晨的柔光' : 时 < 11 ? '上午的日光' : 时 < 14 ? '正午偏亮的光' : 时 < 17 ? '午后的斜光' : 时 < 19 ? '傍晚的金色光' : 时 < 22 ? '夜里的室内灯' : '深夜只开着台灯'
    return { 在: cur?.在 || '', 穿: cur?.穿 || '', 光线, 场景: cur?.在 || '' }
  } catch { return { 在: '', 穿: '', 光线: '自然光', 场景: '' } }
}

function 拼提示词(cfg, 参数) {
  const 生活 = 生活此刻()
  const 类型 = String(参数.类型 || 'selfie')
  const 主体 = String(参数.提示 || 参数.prompt || '').trim()
  if (cfg.后端 === 'ark' && cfg.用参考图) {
    // 有参考图时：不再复述设定，也不自动塞日程里的穿着（会跟图里的女仆装打架）
    const 句 = ['保持参考图里这个角色的一切特征不变：发色渐变、鲸鱼鳍耳、头顶呆毛、蓝瞳、鲸鱼尾、女仆装款式']
    const 穿 = String(参数.穿着 || '').trim()
    if (穿) 句.push(`服装换成${穿}`)
    const 动作 = 主体.replace(/^[在正]/, '')
    if (动作) 句.push(`画她在${动作}`)
    else if (类型 === 'selfie') 句.push('画她的手机自拍，脸在画面里，表情自然')
    else 句.push('画这个场景，不出现人物')
    句.push(`光线：${生活.光线}`)
    句.push('日系精细插画，赛璐璐分色加柔和厚涂阴影，柔和光，清晰线稿')
    return 句.join('；')
  }
  // 只锁「长相」；衣服是变量 —— 不然洗澡、睡觉、出门都会被女仆装顶掉
  const 片段 = [`【角色固定特征，长相必须一致】${cfg.外观}。`]
  片段.push(`默认服装：${cfg.服装}；如果画面描述里指定了别的穿着（睡衣、浴巾、外套等），以画面描述为准。`)
  if (类型 === 'selfie') {
    if (生活.穿) 片段.push(`此刻穿着：${生活.穿}`)
    if (生活.场景) 片段.push(`场景：${生活.场景}`)
    片段.push('第一人称手持手机自拍构图，脸在画面里，表情自然')
  } else {
    if (生活.场景) 片段.push(`场景：${生活.场景}`)
  }
  if (主体) 片段.push(`画面：${主体}`)
  片段.push(生活.光线)
  片段.push(`画风：${cfg.风格}`)
  return 片段.filter(Boolean).join('；')
}

function life_context(生活, 类型) {
  const 段 = []
  if (生活.穿) 段.push(`穿${生活.穿}`)
  if (生活.场景) 段.push(`场景：${生活.场景}`)
  if (生活.光线) 段.push(生活.光线)
  return 段.join('，')
}

async function 生图(cfg, prompt) {
  if (cfg.后端 === 'ark') return await 生图Ark(cfg, prompt)
  const tp = JSON.parse(readFileSync(TP_CFG, 'utf8'))
  const r = await fetch(tp.chatBaseUrl.replace(/\/+$/, '') + '/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + tp.tokenPlanKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.模型,
      ...(Number(cfg.种子) ? { seed: Number(cfg.种子) } : {}),
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
    }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error('生图接口 ' + r.status + '：' + JSON.stringify(data).slice(0, 200))
  const content = data?.output?.choices?.[0]?.message?.content || []
  const url = content.find?.((x) => x && x.image)?.image
  if (!url) throw new Error('返回里没有图片：' + JSON.stringify(data).slice(0, 200))
  const img = await fetch(url)
  if (!img.ok) throw new Error('下载失败 ' + img.status)
  const buf = Buffer.from(await img.arrayBuffer())
  const dir = cfg.存图目录 || OUT_DIR
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `feiyu-${Date.now()}.png`)
  writeFileSync(path, buf)
  return { path, bytes: buf.length, prompt }
}

function 读参考图(cfg) {
  const p = cfg.参考图 || join(OUT_DIR, '角色设定', '正面.jpg')
  try { return 'data:image/jpeg;base64,' + readFileSync(p).toString('base64') } catch { return '' }
}

async function 生图Ark(cfg, prompt) {
  const ark = JSON.parse(readFileSync(ARK_CFG, 'utf8'))
  const body = {
    model: cfg.模型,
    prompt,
    size: '2048x2048',
    response_format: 'url',
    watermark: false,
  }
  const 参考 = cfg.用参考图 ? 读参考图(cfg) : ''
  if (参考) body.image = [参考]
  const r = await fetch(ark.baseUrl.replace(/\/+$/, '') + '/images/generations', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + ark.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error('方舟 ' + r.status + '：' + JSON.stringify(data).slice(0, 220))
  const url = data?.data?.[0]?.url
  if (!url) throw new Error('方舟返回里没有图片：' + JSON.stringify(data).slice(0, 200))
  const img = await fetch(url)
  if (!img.ok) throw new Error('下载失败 ' + img.status)
  const buf = Buffer.from(await img.arrayBuffer())
  const dir = cfg.存图目录 || OUT_DIR
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `feiyu-${Date.now()}.png`)
  writeFileSync(path, buf)
  return { path, bytes: buf.length, prompt }
}

/** 今日已出图数 / 上次出图时间（简单节流，够用） */
function 今日用量(cfg) {
  const dir = cfg.存图目录 || OUT_DIR
  try {
    const 今天 = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10)
    let n = 0
    let 最后 = 0
    for (const f of 列目录(dir)) {
      if (!/^feiyu-.*\.png$/.test(f)) continue  // 角色设定图不算拍的照片
      const st = statSync(join(dir, f))
      if (new Date(st.mtimeMs + 8 * 3600e3).toISOString().slice(0, 10) === 今天) n++
      最后 = Math.max(最后, st.mtimeMs)
    }
    return { n, 最后 }
  } catch { return { n: 0, 最后: 0 } }
}

function 列目录(dir) {
  try { return readdirSync(dir) } catch { return [] }
}

export function apply(ctx) {
  ctx.effect(() => ctx.tools.register({
    name: 'shoot',
    description: '拍一张照片并保存成图片文件（自拍 / 随手拍）。会自动带上她此刻的穿着和所在场景，跟她今天的日程对得上。回复里拿到路径后用 ![描述](路径) 发出去。',
    parameters: {
      type: 'object',
      properties: {
        提示: { type: 'string', description: '画面里还想要什么（姿势、表情、手里的东西、场景细节）。不填就按此刻的状态拍' },
        类型: { type: 'string', enum: ['selfie', 'scene'], description: 'selfie=自拍（有她本人），scene=只拍场景/物（不出现人）' },
        穿着: { type: 'string', description: '可选：这一张想让她穿什么（睡衣、卫衣、浴巾…）。不填就沿用参考图里的女仆装' },
      },
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object', properties: { ok: { type: 'boolean' }, 图: { type: 'string' }, 说: { type: 'string' }, 提示词: { type: 'string' } }, additionalProperties: true },
      render: (_a, v) => [{ type: 'text', text: String(v?.说 || '') + (v?.图 ? '\n图片：' + v.图 : '') }],
    },
    async execute(参数 = {}) {
      const cfg = 读配置()
      if (!cfg.总开关) return { ok: false, 说: '相机没开' }
      const 用 = 今日用量(cfg)
      if (用.n >= cfg.每日上限) return { ok: false, 说: `今天已经拍了 ${用.n} 张，够了` }
      if (Date.now() - 用.最后 < cfg.最短间隔秒 * 1000) return { ok: false, 说: '刚拍过，等会儿再拍' }
      const prompt = 拼提示词(cfg, 参数)
      try {
        const r = await 生图(cfg, prompt)
        return { ok: true, 图: r.path, 说: `拍好了（${Math.round(r.bytes / 1024)}KB）`, 提示词: prompt }
      } catch (e) {
        return { ok: false, 说: '没拍成：' + String((e && e.message) || e).slice(0, 160) }
      }
    },
  }))
}

export { 拼提示词, 生图, 读配置, 存配置 }
