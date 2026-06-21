# 豆包 API 接入清单

项目内置 `cloudfunctions/generateCaption` 云函数，可选接入火山方舟/豆包生成旅行文案。默认前端文案页使用本地文案库匹配；如果需要启用云函数生成，可在前端调用该云函数并配置以下环境变量。

## 准备工作

1. 在火山方舟控制台创建 API Key。
2. 确认模型名称或推理接入点 ID。
3. 在微信开发者工具中开通云开发。
4. 部署 `cloudfunctions/generateCaption` 云函数。

## 环境变量

在微信云开发控制台为 `generateCaption` 配置：

```text
ARK_API_KEY=你的火山方舟 API Key
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```

可选：

```text
ARK_MODEL=doubao-seed-2-0-pro-260215
```

如果使用推理接入点，可以将 `ARK_MODEL` 设置为接入点 ID，例如：

```text
ARK_MODEL=ep-xxxxxxxx
```

## 部署

在微信开发者工具文件树中：

1. 找到 `cloudfunctions/generateCaption`。
2. 右键选择“上传并部署：云端安装依赖”。
3. 重新编译小程序。

## 测试

可以在小程序或云函数测试面板传入：

```json
{
  "keyword": "外滩夜景",
  "style": "文艺"
}
```

成功时云函数会返回 3 条文案。失败时会返回本地兜底文案和错误信息。

## 安全提醒

不要提交：

- `ARK_API_KEY`
- 云开发环境密钥
- 微信账号密码
- 验证码

真实密钥只应放在云函数环境变量或安全的服务端配置中。
