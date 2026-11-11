# dsh-feiyu-image

[![npm](https://img.shields.io/npm/v/dsh-feiyu-image)](https://www.npmjs.com/package/dsh-feiyu-image)
[![license](https://img.shields.io/npm/l/dsh-feiyu-image)](./LICENSE)
[![node](https://img.shields.io/badge/node-%E2%89%A522-informational)](https://nodejs.org/)

给陪伴角色一个相机：模型调一个工具就能「拍一张」，**自动带上她此刻的穿着和所在场景**，
存成本地图片，回复里写 `![描述](路径)` 就能发到 QQ。

生图走 **火山方舟 Seedream 5.0**（默认 `doubao-seedream-5-0-pro-260628`）。
设置页的模型下拉是**实时问方舟要的**（`GET /models`，筛图像生成），新模型上线会自动出现，也能手填。

有参考图之后，**角色形象是锁死的**：把 `~/.dsh/feiyu-image/角色设定/正面.jpg` 传进去，
脸、发色渐变、鲸鱼鳍耳、呆毛、鲸鱼尾、女仆装款式都跟着这张图走。
画风是**二次元**（日系成人向动画、赛璐璐上色），角色是**鲸鱼娘**（蓝发、鲸鱼鳍耳、鲸鱼尾、女仆装），
长相靠「固定特征 + 固定 seed」钉住，衣服是可变量。

## 为什么不是 dsh-image-studio

[dsh-image-studio](https://github.com/meliodascz89/dsh-image-studio) 停在 0.1.7（2026-08），
依赖 `@deepseek-ai/dsh-tools ^0.1.0-rc.6`、`dsh-settings ^0.1.1-rc.2`，跟 dsh 0.2.x 不兼容，
要装得给确切版本盖豁免（可能崩、可能丢数据）。而这里真正有用的只有一个工具，就自己写了。

## 能力

| 工具 | 说明 |
| --- | --- |
| `shoot` | `提示`（可选，画面里还想要什么）+ `类型`（`selfie` 自拍 / `scene` 只拍场景）→ 生成并保存 |

- 提示词自动拼：**固定特征**（长相/发色/耳/尾/瞳色，一字不差每次带上）+ **可变服装**（默认女仆装，睡衣、浴巾、外出服以画面描述为准）+ 此刻穿着（读 `dsh-feiyu-life` 的今日剧本）+ 场景 + 光线 + 画风；
- 硬比例约束：日系成人向、七头身、非 Q 版；
- 固定 `seed`，同一个角色跨场景保持同一张脸（发色、发型、瞳色、鲸鱼发夹、卫衣）；
- 出图存 `~/.dsh/feiyu-image/feiyu-<时间戳>.png`；
- 节流：默认每天 8 张、两次至少隔 30 秒（配置可调）；
- 生图失败会返回原因，不会卡住整轮对话。

## 安装

```sh
dsh plugin --profile web add dsh-feiyu-image
```

需要 `~/.dsh/ark/config.json`（方舟的 `apiKey` 和 `baseUrl`）。

## 配置

`~/.dsh/feiyu-image-config.json`（没有就用默认）：

```json
{
  "总开关": true,
  "模型": "doubao-seedream-5-0-pro-260628",
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

- 实测这条接口**不接受图片输入**（传参考图会 400：`Either 'text' or 'image' must be provided, but not both`），
  所以没法用「角色参考图 + 指令」的方式锁脸；现在靠固定设定 + 固定 seed，能做到「一看就是同一个人」，但细节会飘。
  要真正锁死得上 LoRA 或支持 image-edit 的接口；
- 角色设定图存在 `~/.dsh/feiyu-image/角色-设定.png`，改设定时对着它改；
- 中文文字（黑板、书页）容易糊成乱码，尽量别让画面里出现要认的字；
- 依赖 `dsh-feiyu-life` 才有「穿着/场景」；没装也能用，只是提示词里少这两项。

## 反馈

开 [issue](https://github.com/Vansnc/dsh-feiyu-image/issues)，带上版本和那张图。
