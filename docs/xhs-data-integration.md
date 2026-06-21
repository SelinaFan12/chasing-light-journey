# 小红书数据接入说明

## 当前落地方式

小程序现在使用“云端优先、本地兜底”的数据链路：

```text
小程序首页/详情页
  -> 云函数 getSpots
  -> 云数据库 spots
  -> 失败或无数据时回退 utils/data.js
```

小红书数据进入系统的方式：

```text
小红书官方/授权数据
  -> 云函数 syncXhsData
  -> 云数据库 spots
  -> 小程序自动展示
```

## 合规边界

可以接：

- 小红书小程序/开放平台允许你调用的官方接口数据。
- 专业号、商家、创作者明确授权给你的 POI 或内容数据。
- 人工采编后录入的地点、拍摄角度、机位说明。

不要接：

- 批量爬取小红书搜索页、笔记页、评论、图片、视频。
- 使用 Cookie、模拟登录、逆向接口或绕过风控。
- 未授权保存博主头像、笔记图片、评论、互动数据。

## 云数据库集合

创建集合：

- `spots`

建议字段：

```js
{
  id: 'xhs-123456',
  name: '地点名',
  city: '城市',
  location: '地址',
  lat: 0,
  lng: 0,
  score: 4.5,
  badge: '小红书来源',
  archiveNo: 'XHS-3456',
  bestTime: '待采编',
  summary: '地点简介',
  palette: ['#f0dfc4', '#c05f43', '#4d718a'],
  locations: [
    {
      name: '推荐机位',
      desc: '机位说明',
      time: '拍摄时间',
      tip: '拍摄技巧',
      type: '人像',
      caseImage: 'cloud://xxx/authorized/xhs-001-case.jpg',
      caseImageCredit: '作者/博主名',
      caseSourceName: '小红书',
      caseSourceUrl: 'https://www.xiaohongshu.com/...'
    }
  ],
  tips: ['避坑提示'],
  composition: ['构图建议'],
  sourceType: 'official_api',
  sourcePlatform: 'xiaohongshu',
  sourceName: '小红书',
  sourcePoiId: '123456',
  sourceUrl: '',
  coverImage: 'cloud://xxx/authorized/xhs-001-cover.jpg',
  coverCredit: '已授权创作者昵称',
  coverSourceUrl: 'https://www.xiaohongshu.com/...',
  reviewStatus: 'draft',
  searchText: '地点 城市 地址 小红书',
  syncedAt: '2026-05-25T00:00:00.000Z',
  updatedAt: '2026-05-25T00:00:00.000Z'
}
```

`reviewStatus` 建议流程：

- `draft`：刚从小红书同步或人工导入，未审核，不在小程序默认展示。
- `approved`：采编完成并审核通过，小程序展示。
- `rejected`：不展示。

## 云函数

### getSpots

小程序调用，用于读取审核通过的机位。

入参：

```js
{
  reviewStatus: 'approved',
  city: '上海',
  keyword: '外滩'
}
```

### syncXhsData

用于同步或导入小红书数据。

#### 方式一：导入授权整理数据

适合先用后台、表格、CSV、人工采编数据跑通。

```js
wx.cloud.callFunction({
  name: 'syncXhsData',
  data: {
    mode: 'import',
    records: [
      {
        poiId: 'xhs-poi-001',
        name: '某个热门拍照点',
        city: '上海',
        address: '上海市黄浦区...',
        latitude: 31.23,
        longitude: 121.49,
        coverImage: 'cloud://你的云环境/authorized/xhs-poi-001-cover.jpg',
        coverCredit: '已授权创作者昵称',
        sourceUrl: 'https://www.xiaohongshu.com/...',
        reviewStatus: 'draft'
      }
    ]
  }
});
```

#### 方式二：导入全国种子数据

适合先把首页从 1 条数据扩展到全国多城市。该种子数据是按“小红书热门拍照点”口径整理的采编示例，不是未授权爬取的小红书笔记。

```js
wx.cloud.callFunction({
  name: 'syncXhsData',
  data: {
    mode: 'seed'
  }
});
```

#### 方式三：接官方 POI 接口

适合拿到小红书开放平台授权后使用。

云函数环境变量：

- `XHS_POI_LIST_URL`：小红书官方 POI 列表接口地址。
- `XHS_AUTH_ACCESS_TOKEN`：官方授权得到的访问凭证。

调用：

```js
wx.cloud.callFunction({
  name: 'syncXhsData',
  data: {
    mode: 'officialPoi',
    page: 1,
    pageSize: 50
  }
});
```

注意：不要把小红书 token 放在小程序前端。正式版本应由后台或定时任务触发同步云函数。

## 真人打卡照片怎么接

小程序必须使用你有权使用的照片。建议流程：

1. 取得创作者/摄影师授权，确认允许在你的微信小程序展示。
2. 下载或接收原图，不直接热链小红书图片地址。
3. 上传到微信云存储，得到 `cloud://...` 文件 ID。
4. 在导入数据里填写：
   - `coverImage`：列表封面真人打卡图。
   - `coverCredit`：创作者昵称或授权来源。
   - `locations[].caseImage`：详情页某个机位的真人案例图。
   - `locations[].caseImageCredit`：该案例图来源。

可直接复制填写的模板见：`docs/xhs-photo-import-template.json`。

当前小程序已内置 `assets/spots/*-ai.jpg` 作为拍摄参考示意图，占位展示全国成熟旅游城市和热门拍照点。它们只用于让用户理解地点氛围；拿到授权真人照片后，可以用 `coverImage` 和 `caseImage` 覆盖即可。

示例：

```js
wx.cloud.callFunction({
  name: 'syncXhsData',
  data: {
    mode: 'import',
    records: [
      {
        poiId: 'xhs-bund-photo-001',
        name: '外滩夜景拍照点',
        city: '上海',
        address: '上海市黄浦区中山东一路',
        latitude: 31.239692,
        longitude: 121.499763,
        coverImage: 'cloud://你的环境ID/authorized/bund-cover.jpg',
        coverCredit: '摄影师/创作者昵称',
        sourceUrl: '授权来源链接',
        reviewStatus: 'approved',
        locations: [
          {
            name: '外白渡桥南侧',
            desc: '桥体线条自带纵深，能同时带到陆家嘴天际线。',
            time: '18:40-19:30',
            tip: '人物站桥侧 45 度，保留车流光轨。',
            type: '远景',
            caseImage: 'cloud://你的环境ID/authorized/bund-case-01.jpg',
            caseImageCredit: '摄影师/创作者昵称'
          }
        ]
      }
    ]
  }
});
```

## 推荐上线顺序

1. 建 `spots` 集合。
2. 部署 `getSpots` 和 `syncXhsData` 云函数。
3. 用 `mode: import` 导入 5-20 条授权/采编数据。
4. 在云数据库把确认可展示的数据改为 `reviewStatus: approved`。
5. 小程序首页确认来源显示为“已同步点位”。
6. 申请/配置小红书官方权限后，再切到 `mode: officialPoi`。
