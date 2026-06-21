# 数据与 AI 接入方案

## 结论

当前版本是纯前端原型，机位、姿势、文案都来自 `utils/data.js`。要解决数据规模和智能生成问题，建议分两条线推进：

1. 机位数据：用合规来源沉淀结构化数据库，不做绕过登录、Cookie、逆向接口、批量抓取小红书/抖音内容。
2. 文案和机位说明：接入豆包 API，但 API Key 必须放在云函数或后端，不能放在小程序前端。

## 平台数据怎么来

### 小红书

可行路径：

- 小红书小程序开放平台：适合把小程序作为经营入口，承接商家主页、笔记发布能力、POI 服务等。
- 小红书 Ark/开放平台电商接口：官方文档主要覆盖商品、订单、库存、物流等电商经营数据。
- 品牌或创作者授权：让用户手动上传/授权导出的笔记表现数据，再进入你的系统分析。
- 自建采编：用公开可引用的信息做景点基础库，人工补充机位、时间、构图、避坑。

不建议：

- 批量爬取笔记、评论、图片、视频。
- 使用 Cookie 登录、模拟 App、逆向隐藏接口。
- 未经授权保存用户内容、头像、评论和平台统计数据。

### 抖音

可行路径：

- 抖音开放平台 OAuth：用户授权后获取公开信息、相关 scope 下的数据。
- 抖音小程序/生活服务 OpenAPI：如果你的产品未来转抖音小程序或接生活服务商家，可走服务商/商家应用接口。
- 巨量引擎 Marketing API：适合广告投放、广告报表、账户资产，不适合直接拿全站内容数据。
- 创作者授权导入：让摄影师/KOC 授权自己的视频/账号数据，用于“我的作品分析”“爆款模板总结”。

不建议：

- 爬搜索页、视频页、评论区。
- 绕过平台风控拿播放量、点赞、评论、收藏等批量数据。

## 你的产品最适合的数据结构

### spots 机位

- `id`
- `name`
- `city`
- `location`
- `lat`
- `lng`
- `score`
- `badge`
- `bestTime`
- `summary`
- `locations`: 推荐拍摄点列表
- `tips`: 避坑提示
- `composition`: 构图建议
- `sourceType`: `editorial` / `creator_authorized` / `official_api`
- `sourceUrl`
- `reviewStatus`: `draft` / `approved` / `rejected`
- `updatedAt`

### creator_posts 授权内容

- `platform`: `xiaohongshu` / `douyin`
- `creatorId`
- `postId`
- `title`
- `publicUrl`
- `city`
- `spotName`
- `metrics`: 只存授权范围内允许保存的数据
- `authorizedAt`
- `expiresAt`

### ai_jobs AI 生成记录

- `type`: `caption` / `spot_summary` / `pose_suggestion`
- `input`
- `output`
- `model`
- `status`
- `createdAt`

## 豆包 API 接入方式

不要在小程序里直接请求豆包，因为前端代码包可以被反编译，API Key 会泄露。推荐链路：

```text
微信小程序 -> 微信云函数/自有后端 -> 火山方舟豆包 API -> 返回生成结果
```

后端需要保存：

- `ARK_API_KEY`
- `ARK_BASE_URL`: `https://ark.cn-beijing.volces.com/api/v3`
- `ARK_MODEL`: 模型名或火山方舟控制台创建的推理接入点 ID，例如 `doubao-seed-2-0-pro-260215` 或 `ep-...`

小程序只调用自己的云函数，例如：

```js
wx.cloud.callFunction({
  name: 'generateCaption',
  data: {
    keyword: '外滩夜景',
    style: '高级感'
  }
});
```

云函数再调用豆包：

```js
const response = await fetch(`${process.env.ARK_BASE_URL}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.ARK_API_KEY}`
  },
  body: JSON.stringify({
    model: process.env.ARK_MODEL,
    messages: [
      {
        role: 'system',
        content: '你是旅行摄影小程序的文案助手，只输出适合发布的中文短文案。'
      },
      {
        role: 'user',
        content: `关键词：外滩夜景；风格：高级感；生成 3 条，每条 28 字以内。`
      }
    ],
    temperature: 0.7
  })
});
```

## 推荐落地顺序

1. 先把 `utils/data.js` 迁到云数据库，保留本地数据作为兜底。
2. 做一个后台录入表：城市、机位、坐标、推荐角度、图片、来源、审核状态。
3. 接豆包生成文案：替换当前模板生成，让文案页真正可用。
4. 接豆包辅助生成机位摘要：后台录入基础信息后，由 AI 生成 summary、tips、composition，再人工审核。
5. 做创作者授权导入：先支持 CSV/表格导入，再考虑官方 OAuth/API。
6. 平台开放能力通过后，再接小红书/抖音官方授权接口。

## MVP 数据来源建议

第一版不要等官方接口全部申请下来，可以用这几类数据先跑起来：

- 官方景区信息：景点名、地址、经纬度、开放时间。
- 人工采编：最佳拍摄时间、构图、避坑。
- 用户投稿：用户提交机位，后台审核后发布。
- AI 增强：豆包负责改写、补充文案、生成姿势建议。

这条路线的好处是风险低、速度快，而且数据会变成你的资产，而不是依赖平台随时可能变化的页面结构。

## 需要申请或准备

- 微信云开发环境或自己的 Node.js 后端。
- 火山方舟账号、实名认证、开通模型服务。
- 方舟 API Key 和推理接入点 ID。
- 若接抖音：抖音开放平台应用、ClientKey、ClientSecret、所需 scope。
- 若接小红书：小红书小程序/开放平台主体资质，按业务申请对应权限。

## 参考入口

- 抖音开放平台 OAuth 授权码：https://open.douyin.com/platform/resource/docs/openapi/account-permission/douyin-get-permission-code
- 抖音获取用户公开信息：https://open.douyin.com/platform/resource/docs/openapi/account-management/get-account-open-info
- 抖音 OpenAPI 调用指南：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/tutorial/beginner/openapi-call-guide
- 小红书小程序开放平台：https://miniapp.xiaohongshu.com/
- 小红书 Ark 开放平台介绍：https://school.xiaohongshu.com/en/open/quick-start/introduction.html

## 已落地代码

- 小程序端数据读取：`utils/spots-service.js`
- 云端读取集合：`cloudfunctions/getSpots`
- 小红书授权/官方数据导入：`cloudfunctions/syncXhsData`
- 详细接入说明：`docs/xhs-data-integration.md`
- 火山方舟文档：https://www.volcengine.com/docs/82379/66619f91f281250274ef5000
