const https = require('https');
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const AMAP_HOST = 'restapi.amap.com';
const AMAP_TEXT_PATH = '/v3/place/text';
const AMAP_AROUND_PATH = '/v3/place/around';
const DEFAULT_KEYWORDS = 'Citywalk|街区|步行街|景点';
const DEFAULT_RADIUS = 3000;
const MAX_OFFSET = 25;

function cleanText(value, maxLength = 80) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function splitLocation(location) {
  const [lng, lat] = String(location || '').split(',').map(Number);
  return {
    lng: Number.isFinite(lng) ? lng : 0,
    lat: Number.isFinite(lat) ? lat : 0
  };
}

function buildQuery(params) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

function requestAmap(path, params) {
  const query = buildQuery(params);
  const options = {
    hostname: AMAP_HOST,
    path: `${path}?${query}`,
    method: 'GET',
    timeout: 8000
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error('高德返回数据解析失败'));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('高德接口请求超时'));
    });
    req.on('error', reject);
    req.end();
  });
}

function pickPhoto(poi) {
  if (!Array.isArray(poi.photos) || !poi.photos.length) return '';
  return poi.photos.find((photo) => photo && photo.url) ? poi.photos.find((photo) => photo && photo.url).url : '';
}

function buildLocations(poi, city, address) {
  const baseName = poi.name || '高德地点';

  return [
    {
      name: `${baseName}门头外景`,
      address,
      mapKeyword: `${city}${baseName}`,
      desc: '先拍门头、入口、招牌或建筑外立面，让用户一眼知道这里是什么地点。',
      time: '上午柔光 / 下午 3 点后',
      tip: '不要挡住门口通行和排队动线，人物站在招牌侧边更自然。',
      type: '高德POI',
      angle: '保留完整门头和街区环境，人物放在画面一侧。',
      lens: '1x 标准 / 2x 半身',
      direction: '人物离门头半步到一步，脸朝有光的一侧。',
      result: '拍出清楚的地点识别和探店封面感。',
      stand: '站在门头侧边或外摆旁，不挡店名。',
      action: '先拍空景确认招牌，再让人物进入画面。',
      cue: '门头外景'
    },
    {
      name: `${baseName}街角行走`,
      address,
      mapKeyword: `${city}${baseName}`,
      desc: '沿地点周边的街角、斑马线、树影或橱窗慢走，补一张 Citywalk 动态照。',
      time: '上午 / 傍晚',
      tip: '连拍三到五张，选手脚最自然的一张。',
      type: 'Citywalk',
      angle: '让道路、窗框或树影形成引导线。',
      lens: '1x 标准',
      direction: '人物顺着街道慢走，不必一直看镜头。',
      result: '拍出正在逛街的生活方式感。',
      stand: '站在街道线条旁边，留出行走方向。',
      action: '摄影者后退半步连拍，抓回头或低头整理包带。',
      cue: '街角慢走'
    },
    {
      name: `${baseName}细节补充`,
      address,
      mapKeyword: `${city}${baseName}`,
      desc: '拍杯子、票根、窗边、招牌局部、墙面纹理或手部动作，补齐一组打卡图。',
      time: '室内亮处 / 窗边',
      tip: '细节图不要太杂，只保留 1-2 个主体。',
      type: '细节',
      angle: '靠近主体，背景只留少量环境信息。',
      lens: '2x / 人像模式',
      direction: '手部动作自然，不要把主体挤到画面边缘。',
      result: '拍出一组更完整的小红书式打卡内容。',
      stand: '靠窗、靠桌边或靠墙面，避开杂乱背景。',
      action: '点主体对焦，压低曝光，保留质感。',
      cue: '细节补充'
    }
  ];
}

function normalizePoi(poi, index, keyword) {
  const { lng, lat } = splitLocation(poi.location);
  const city = cleanText(poi.cityname || poi.city || poi.pname || '未知', 20);
  const province = cleanText(poi.pname || city || '未知', 20);
  const address = cleanText([poi.adname, poi.address].filter(Boolean).join(' '), 120);
  const name = cleanText(poi.name || '高德地点', 60);
  const photo = pickPhoto(poi);
  const tag = cleanText(poi.type || keyword || '高德地点', 80);

  return {
    id: `amap-${poi.id || `${Date.now()}-${index}`}`,
    name,
    city,
    province,
    location: address,
    lat,
    lng,
    score: 4.5,
    badge: '高德POI',
    archiveNo: `AMAP-${String(index + 1).padStart(3, '0')}`,
    bestTime: '上午柔光、下午 3 点后、傍晚蓝调时刻',
    summary: `${name}来自高德 POI 搜索，适合补充真实地点、导航地址和附近打卡路线。建议结合现场光线，拍门头、街角行走和细节三组照片。`,
    aiExampleImage: photo,
    aiExampleLabel: photo ? '高德地点图片' : '',
    aiExamplePrompt: '',
    coverImage: photo,
    coverKind: photo ? 'real' : '',
    coverCredit: photo ? '高德地图' : '',
    coverSourceUrl: `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(name)}`,
    palette: ['#e4d7c5', '#4c5d52', '#b87a4b'],
    tags: [province, city, '高德POI', keyword, tag].filter(Boolean),
    themeTags: ['高德POI', keyword, '真实地点'].filter(Boolean),
    locations: buildLocations({ ...poi, name }, city, address),
    tips: [
      '高德地点信息会随商户和景区更新，出发前建议再次确认营业时间。',
      '真实地点拍照时注意避开客人正脸、车牌和私人空间。',
      '如果是街区路线，优先拍路牌、门头、街角、橱窗和终点地标。'
    ],
    composition: [
      '先拍完整门头或地标，再拍人物，最后补细节。',
      '用街道、橱窗、树影、栏杆或斑马线做引导。',
      '一组图按“环境-人像-细节”排序，会更像真实打卡攻略。'
    ],
    sourceType: 'official_api',
    sourcePlatform: 'amap',
    sourceName: '高德地图',
    sourceUrl: `https://uri.amap.com/search?keyword=${encodeURIComponent(name)}`,
    sourcePoiId: poi.id || '',
    syncedAt: new Date().toISOString()
  };
}

exports.main = async (event = {}) => {
  const key = process.env.AMAP_WEB_SERVICE_KEY;

  if (!key) {
    return {
      source: 'amap',
      configured: false,
      count: 0,
      spots: [],
      message: '未配置 AMAP_WEB_SERVICE_KEY'
    };
  }

  const keyword = cleanText(event.keyword || DEFAULT_KEYWORDS, 40);
  const city = cleanText(event.city === '全部' ? '' : event.city, 40);
  const page = Math.max(1, normalizeNumber(event.page, 1));
  const offset = Math.min(MAX_OFFSET, Math.max(1, normalizeNumber(event.offset, 20)));
  const location = cleanText(event.location, 40);
  const radius = Math.max(500, Math.min(50000, normalizeNumber(event.radius, DEFAULT_RADIUS)));
  const path = location ? AMAP_AROUND_PATH : AMAP_TEXT_PATH;
  const params = {
    key,
    keywords: keyword,
    city,
    citylimit: city ? 'true' : '',
    location,
    radius: location ? radius : '',
    offset,
    page,
    extensions: 'all',
    output: 'JSON'
  };
  const data = await requestAmap(path, params);

  if (data.status !== '1') {
    return {
      source: 'amap',
      configured: true,
      count: 0,
      spots: [],
      message: data.info || '高德接口请求失败',
      infocode: data.infocode || ''
    };
  }

  const pois = Array.isArray(data.pois) ? data.pois : [];

  return {
    source: 'amap',
    configured: true,
    count: Number(data.count || pois.length),
    spots: pois.map((poi, index) => normalizePoi(poi, index, keyword)),
    suggestion: data.suggestion || null
  };
};
