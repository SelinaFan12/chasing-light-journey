# 高德 API 接入说明

## 已接入能力

- 云函数：`cloudfunctions/amapSearch`
- 前端封装：`utils/amap-service.js`
- 首页入口：搜索框下方「高德补充」按钮

小程序端不会保存高德 Key，所有请求都通过云函数代理。

## 配置步骤

1. 登录高德开放平台，创建应用并添加 `Web 服务` 类型 Key。
2. 在微信云开发控制台或云函数配置里，为 `amapSearch` 设置环境变量：

```text
AMAP_WEB_SERVICE_KEY=你的高德Web服务Key
```

3. 在微信开发者工具中上传并部署云函数 `amapSearch`。
4. 进入首页，输入关键词，例如 `Citywalk`、`武康路`、`东山口`，点击「高德补充」。

## 降级逻辑

如果没有配置 `AMAP_WEB_SERVICE_KEY`，首页会提示「未配置高德 Key」，并继续使用本地数据，不会影响现有打卡点。

## 使用的高德接口

- 关键字搜索：`https://restapi.amap.com/v3/place/text`
- 周边搜索：`https://restapi.amap.com/v3/place/around`

当前返回结果会转换成项目内统一的点位卡结构，包含名称、城市、省份、地址、经纬度、导航链接和拍摄建议。
