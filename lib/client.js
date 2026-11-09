/**
 * dsh-feiyu-image —— 浏览器半端（设置 → 鱼的照片）
 *
 * 这一页干四件事：
 *   · 看状态：后端通不通、今天拍了几张、参考图在不在
 *   · 调后端：方舟 / 百炼、模型、种子、节流
 *   · 调形象：固定特征、默认服装、画风（这三段就是提示词里那几句）
 *   · 试拍：不进对话也能直接出一张，看看当前配置长什么样
 *
 * 改动先落在本地，点「保存」才写盘；试拍用的是「保存后的」配置，免得以为改了没生效。
 */
window.__ModuleLoader__.load({
  id: 'dsh-feiyu-image',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect } = React

    const API = '/dsh-feiyu-image'

    const CSS = `
[data-fi-wrap]{display:flex;flex-direction:column;gap:14px;padding:4px 2px 24px;color-scheme:light dark;font-size:13px;}
[data-fi-wrap] input,[data-fi-wrap] select,[data-fi-wrap] textarea{background:Canvas;color:CanvasText;border:1px solid rgba(127,127,127,.35);border-radius:6px;padding:5px 8px;font-size:13px;font-family:inherit;}
[data-fi-wrap] textarea{width:100%;min-height:64px;resize:vertical;line-height:1.5;}
[data-fi-wrap] input[type=number]{width:88px;}
[data-fi-sec]{display:flex;flex-direction:column;gap:8px;}
[data-fi-h]{font-size:13px;font-weight:600;opacity:.85;padding-top:10px;border-top:1px solid rgba(127,127,127,.18);}
[data-fi-note]{font-size:12px;opacity:.62;line-height:1.55;}
[data-fi-row]{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
[data-fi-btn]{padding:5px 12px;border-radius:7px;border:1px solid rgba(127,127,127,.35);background:rgba(127,127,127,.08);color:inherit;cursor:pointer;font-size:13px;}
[data-fi-btn]:hover{background:rgba(127,127,127,.16);}
[data-fi-btn][disabled]{opacity:.45;cursor:default;}
[data-fi-btn][data-primary]{background:rgba(64,128,255,.16);border-color:rgba(64,128,255,.5);}
[data-fi-grid]{display:flex;gap:8px;flex-wrap:wrap;}
[data-fi-grid] img{width:104px;height:104px;object-fit:cover;border-radius:8px;border:1px solid rgba(127,127,127,.3);}
[data-fi-chip]{font-size:12px;padding:2px 8px;border-radius:999px;background:rgba(127,127,127,.14);}
[data-fi-chip][data-ok]{background:rgba(60,180,110,.18);}
[data-fi-chip][data-bad]{background:rgba(230,90,80,.18);}
[data-fi-msg]{font-size:12px;min-height:16px;opacity:.75;}
[data-fi-preview]{max-width:100%;border-radius:10px;border:1px solid rgba(127,127,127,.3);}
`

    function 字段(props) {
      return h('label', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
        h('span', { style: { fontSize: 12, opacity: 0.7 } }, props.label),
        props.children)
    }

    function Panel() {
      const [st, setSt] = useState(null)
      const [cfg, setCfg] = useState(null)
      const [msg, setMsg] = useState('')
      const [busy, setBusy] = useState(false)
      const [试拍, set试拍] = useState({ 提示: '在宿舍书桌前托腮看镜头', 穿着: '', 表情: '', 类型: 'selfie' })
      const [结果, set结果] = useState(null)

      const 拉 = async () => {
        try {
          const r = await fetch(`${API}/state`, { credentials: 'same-origin' })
          const d = await r.json()
          if (!d.ok) throw new Error(d.error || '读不到状态')
          setSt(d); setCfg(d.配置)
        } catch (e) { setMsg('读取失败：' + String(e.message || e)) }
      }
      useEffect(() => { 拉() }, [])

      const 改 = (k) => (e) => setCfg({ ...cfg, [k]: e && e.target ? e.target.value : e })
      const 改数 = (k) => (e) => setCfg({ ...cfg, [k]: Number(e.target.value) })
      const 改勾 = (k) => (e) => setCfg({ ...cfg, [k]: Boolean(e.target.checked) })

      const 保存 = async () => {
        setBusy(true); setMsg('保存中…')
        try {
          const r = await fetch(`${API}/save`, {
            method: 'POST', credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ 配置: cfg }),
          })
          const d = await r.json()
          if (!d.ok) throw new Error(d.error || '保存失败')
          setMsg('已保存，下一张就按新配置走'); setCfg(d.配置)
          await 拉()
        } catch (e) { setMsg('保存失败：' + String(e.message || e)) } finally { setBusy(false) }
      }

      const 去拍 = async () => {
        setBusy(true); setMsg('正在拍，方舟大概 30 秒…'); set结果(null)
        try {
          const r = await fetch(`${API}/test`, {
            method: 'POST', credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(试拍),
          })
          const d = await r.json()
          if (!d.ok) throw new Error(d.error || '试拍失败')
          const 名 = String(d.图 || '').split('/').pop()
          set结果({ url: `${API}/file?n=${encodeURIComponent(名)}`, 提示词: d.提示词, 大小: d.大小 })
          setMsg('拍好了')
          await 拉()
        } catch (e) { setMsg('试拍失败：' + String(e.message || e)) } finally { setBusy(false) }
      }

      if (!st || !cfg) return h('div', { 'data-fi-wrap': '' }, h('div', { 'data-fi-note': '' }, msg || '读取中…'))

      const 照片 = st.照片 || []
      const 用Ark = cfg.后端 === 'ark'

      return h('div', { 'data-fi-wrap': '' },
        // 状态
        h('div', { 'data-fi-row': '' },
          h('span', { 'data-fi-chip': '', 'data-ok': st.ark && st.ark.ok ? '' : undefined },
            st.ark && st.ark.ok ? '方舟 已连接' : '方舟 未配置'),
          h('span', { 'data-fi-chip': '', 'data-bad': st.有参考图 ? undefined : '' },
            st.有参考图 ? '参考图 有' : '参考图 缺'),
          h('span', { 'data-fi-chip': '' }, `今日 ${st.今日}/${st.上限}`),
          h('span', { 'data-fi-chip': '' }, `后端 ${cfg.后端}`)),

        // 后端
        h('div', { 'data-fi-sec': '' },
          h('div', { 'data-fi-h': '' }, '后端'),
          h('div', { 'data-fi-row': '' },
            h(字段, { label: '生图后端' },
              h('select', { value: cfg.后端, onChange: 改('后端') },
                h('option', { value: 'ark' }, '火山方舟 Seedream（推荐）'),
                h('option', { value: 'bailian' }, '百炼 Token Plan（备用）'))),
            h(字段, { label: '模型' }, h('input', { value: cfg.模型, onChange: 改('模型'), style: { width: 300 } })),
            h(字段, { label: '种子' }, h('input', { type: 'number', value: cfg.种子, onChange: 改数('种子') }))),
          h('div', { 'data-fi-row': '' },
            h('label', { 'data-fi-row': '' },
              h('input', { type: 'checkbox', checked: Boolean(cfg.用参考图), onChange: 改勾('用参考图') }),
              h('span', {}, '用参考图锁角色（方舟专用）')),
            h(字段, { label: '参考图路径' },
              h('input', { value: cfg.参考图 || '', onChange: 改('参考图'), placeholder: '留空 = ~/.dsh/feiyu-image/角色设定/正面.jpg', style: { width: 420 } }))),
          h('div', { 'data-fi-note': '' },
            '方舟：doubao-seedream-5-0-pro-260628（约 35 秒一张）。百炼：wan2.7-image。参考图只有方舟认。')),

        // 形象
        h('div', { 'data-fi-sec': '' },
          h('div', { 'data-fi-h': '' }, '形象与画风'),
          h(字段, { label: '固定特征（长相，每次一字不差带上）' },
            h('textarea', { value: cfg.外观 || '', onChange: 改('外观') })),
          h(字段, { label: '默认服装（可被「穿着」参数覆盖）' },
            h('textarea', { value: cfg.服装 || '', onChange: 改('服装') })),
          h(字段, { label: '画风' },
            h('textarea', { value: cfg.风格 || '', onChange: 改('风格') })),
          h(字段, { label: '镜头（自拍时用）' },
            h('textarea', { value: cfg.镜头 || '', onChange: 改('镜头') })),
          h(字段, { label: '默认表情' },
            h('input', { value: cfg.表情 || '', onChange: 改('表情') })),
          h(字段, { label: '画面细节（越具体越像真的）' },
            h('textarea', { value: cfg.细节 || '', onChange: 改('细节') })),
          h('div', { 'data-fi-row': '' },
            h(字段, { label: '画幅' },
              h('select', { value: cfg.画幅 || '竖幅', onChange: 改('画幅') },
                h('option', { value: '竖幅' }, '竖幅 1440×1920（手机自拍）'),
                h('option', { value: '方形' }, '方形 2048×2048'),
                h('option', { value: '横幅' }, '横幅 1920×1440'))),
            h('div', { 'data-fi-note': '', style: { flex: 1 } },
              '方舟一张大概 60–100 秒（带参考图更慢）；百炼 20 秒左右但画质差一档。'))),

        // 节流
        h('div', { 'data-fi-sec': '' },
          h('div', { 'data-fi-h': '' }, '节流'),
          h('div', { 'data-fi-row': '' },
            h(字段, { label: '每天最多' }, h('input', { type: 'number', value: cfg.每日上限, onChange: 改数('每日上限') })),
            h(字段, { label: '两次最短间隔（秒）' }, h('input', { type: 'number', value: cfg.最短间隔秒, onChange: 改数('最短间隔秒') })),
            h(字段, { label: '存图目录（留空=默认）' }, h('input', { value: cfg.存图目录 || '', onChange: 改('存图目录'), style: { width: 320 } })))),

        // 保存
        h('div', { 'data-fi-row': '' },
          h('button', { 'data-fi-btn': '', 'data-primary': '', disabled: busy, onClick: 保存 }, '保存'),
          h('button', { 'data-fi-btn': '', disabled: busy, onClick: 拉 }, '重新读取'),
          h('span', { 'data-fi-msg': '' }, msg)),

        // 试拍
        h('div', { 'data-fi-sec': '' },
          h('div', { 'data-fi-h': '' }, '试拍（不进对话，直接看效果）'),
          h('div', { 'data-fi-row': '' },
            h(字段, { label: '画面' },
              h('input', { value: 试拍.提示, onChange: (e) => set试拍({ ...试拍, 提示: e.target.value }), style: { width: 360 } })),
            h(字段, { label: '穿着（可空）' },
              h('input', { value: 试拍.穿着, onChange: (e) => set试拍({ ...试拍, 穿着: e.target.value }), placeholder: '睡衣 / 卫衣 / 浴巾' })),
            h(字段, { label: '表情（可空）' },
              h('input', { value: 试拍.表情 || '', onChange: (e) => set试拍({ ...试拍, 表情: e.target.value }), placeholder: '偷笑 / 困 / 委屈' })),
            h(字段, { label: '类型' },
              h('select', { value: 试拍.类型, onChange: (e) => set试拍({ ...试拍, 类型: e.target.value }) },
                h('option', { value: 'selfie' }, '自拍'),
                h('option', { value: 'scene' }, '只拍场景'))),
            h('button', { 'data-fi-btn': '', 'data-primary': '', disabled: busy, onClick: 去拍 }, 用Ark ? '拍一张（约 35 秒）' : '拍一张')),
          h('div', { 'data-fi-note': '' }, '用的是保存后的配置；如果刚改过参数，先点保存。'),
          result(结果) ? h('div', { 'data-fi-sec': '' },
            h('img', { 'data-fi-preview': '', src: 结果.url, alt: '试拍结果' }),
            h('div', { 'data-fi-note': '' }, `提示词：${结果.提示词}`)) : null),

        // 最近照片
        h('div', { 'data-fi-sec': '' },
          h('div', { 'data-fi-h': '' }, `最近的照片（${照片.length}）`),
          h('div', { 'data-fi-grid': '' },
            ...照片.map((p) => h('img', {
              key: p.名,
              src: `${API}/file?n=${encodeURIComponent(p.名)}`,
              title: `${p.名} · ${Math.round(p.大小 / 1024)}KB`,
              alt: p.名,
            }))))
      )
    }

    function result(x) { return x && x.url }

    return {
      inject: ['slots'],
      apply(ctx) {
        const style = document.createElement('style')
        style.setAttribute('data-plugin-css', 'dsh-feiyu-image')
        style.textContent = CSS
        document.head.appendChild(style)
        ctx.effect(() => () => style.remove(), 'dsh-feiyu-image: 设置页样式')

        const slots = (typeof ctx.get === 'function' ? ctx.get('slots') : undefined) || ctx.slots
        if (!slots) return
        slots.inject('settings.section', () => slots.register(
          { name: 'settings.section', id: 'feiyu-image', order: 57, label: '鱼的照片' },
          () => h(Panel),
        ))
      },
    }
  },
})
