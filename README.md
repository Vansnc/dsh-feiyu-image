# dsh-feiyu-image

[![npm](https://img.shields.io/npm/v/dsh-feiyu-image)](https://www.npmjs.com/package/dsh-feiyu-image)
[![license](https://img.shields.io/npm/l/dsh-feiyu-image)](./LICENSE)
[![node](https://img.shields.io/badge/node-%E2%89%A522-informational)](https://nodejs.org/)

给陪伴角色一个相机：模型调一个工具就能「拍一张」，**自动带上她此刻的穿着和所在场景**，
存成本地图片，回复里写 `![描述](路径)` 就能发到 QQ。

生图走 **阿里百炼 Token Plan**（`wan2.7-image`，compatible-mode `chat/completions`，回图片 URL，2048×2048）。

## 为什么不是 dsh-image-studio

[dsh-image-studio](https://github.com/meliodascz89/dsh-image-studio) 停在 0.1.7（2026-08），
依赖 `@deepseek-ai/dsh-tools ^0.1.0-rc.6`、`dsh-settings ^0.1.1-rc.2`，跟 dsh 0.2.x 不兼容，
要装得给确切版本盖豁免（可能崩、可能丢数据）。而这里真正有用的只有一个工具，就自己写了。

## 能力

| 工具 | 说明 |
| --- | --- |
| `shoot` | `提示`（可选，画面里还想要什么）+ `类型`（`selfie` 自拍 / `scene` 只拍场景）→ 生成并保存 |

- 提示词自动拼：外观（配置）+ 此刻穿着（读 `dsh-feiyu-life` 的今日剧本）+ 所在场景 + 光线 + 风格；
- 出图存 `~/.dsh/feiyu-image/feiyu-<时间戳>.png`；
- 节流：默认每天 8 张、两次至少隔 30 秒（配置可调）；
- 生图失败会返回原因，不会卡住整轮对话。

## 安装

```sh
dsh plugin --profile web add dsh-feiyu-image
```

需要 `~/.dsh/bailian-tp/config.json`（Token Plan 的 key 和 base，跟 `bailian-tp` 插件共用）。

## 配置

`~/.dsh/feiyu-image-config.json`（没有就用默认）：

```json
{
  "总开关": true,
  "模型": "wan2.7-image",
  "外观": "中国大陆 21 岁女大学生，素颜淡妆，黑色齐肩发，皮肤偏白，身形偏瘦",
  "风格": "手机随手拍，自然光，轻微胶片颗粒，真实质感，不过度磨皮",
  "每日上限": 8,
  "最短间隔秒": 30,
  "存图目录": ""
}
```

## 用法

模型侧：

```
shoot 类型=selfie 提示="把刚取到的画册摊在桌上，低头看画面"
shoot 类型=scene  提示="宿舍窗台上的绿萝，傍晚的光"
```

回复里用 markdown 引用路径即可发图（QQ 桥会把 `![描述](绝对路径)` 抽成图片段）。

## 成本与耗时

- 单张约 **18–22 秒**，2048×2048 PNG（7MB 左右）；
- 按 Token Plan 的图片额度计费，一张一次。

## 已知边界

- 同一个人的脸**只能做到「像同一个人」**，不是完全一致；要稳定得配 LoRA 或参考图（未实现）；
- 中文文字（黑板、书页）容易糊成乱码，尽量别让画面里出现要认的字；
- 依赖 `dsh-feiyu-life` 才有「穿着/场景」；没装也能用，只是提示词里少这两项。

## 反馈

开 [issue](https://github.com/Vansnc/dsh-feiyu-image/issues)，带上版本和那张图。
