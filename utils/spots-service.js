const { spotData } = require('./data');

const CACHE_TTL = 5 * 60 * 1000;
const CLOUD_TIMEOUT = 8000;

const AI_FALLBACK_IMAGES = [
  { keywords: ['上海', '外滩'], image: '/assets/spots/shanghai-bund-ai.jpg' },
  { keywords: ['上海', '武康'], image: '/assets/spots/shanghai-wukang-ai.jpg' },
  { keywords: ['北京', '故宫'], image: '/assets/spots/beijing-palace-ai.jpg' },
  { keywords: ['北京', '国贸'], image: '/assets/spots/beijing-cbd-ai.jpg' },
  { keywords: ['杭州', '西湖'], image: '/assets/spots/hangzhou-westlake-ai.jpg' },
  { keywords: ['南京', '秦淮'], image: '/assets/spots/nanjing-qinhuai-ai.jpg' },
  { keywords: ['南京', '城墙'], image: '/assets/spots/nanjing-citywall-ai.jpg' },
  { keywords: ['苏州', '平江'], image: '/assets/spots/suzhou-pingjiang-ai.jpg' },
  { keywords: ['广州', '广州塔'], image: '/assets/spots/guangzhou-canton-ai.jpg' },
  { keywords: ['广州', '骑楼'], image: '/assets/spots/guangzhou-arcade-ai.jpg' },
  { keywords: ['深圳', '人才公园'], image: '/assets/spots/shenzhen-talent-ai.jpg' },
  { keywords: ['成都', '太古里'], image: '/assets/spots/chengdu-taikooli-ai.jpg' },
  { keywords: ['大理', '洱海'], image: '/assets/spots/dali-erhai-ai.jpg' },
  { keywords: ['重庆', '洪崖洞'], image: '/assets/spots/chongqing-hongyadong-ai.jpg' },
  { keywords: ['西安', '城墙'], image: '/assets/spots/xian-citywall-ai.jpg' },
  { keywords: ['武汉', '黄鹤楼'], image: '/assets/spots/wuhan-yellowcrane-ai.jpg' },
  { keywords: ['长沙', 'IFS'], image: '/assets/spots/changsha-ifs-ai.jpg' },
  { keywords: ['厦门', '鼓浪屿'], image: '/assets/spots/xiamen-gulangyu-ai.jpg' },
  { keywords: ['青岛', '八大峡'], image: '/assets/spots/qingdao-seaside-ai.jpg' },
  { keywords: ['丽江', '古城'], image: '/assets/spots/lijiang-oldtown-ai.jpg' },
  { keywords: ['三亚', '椰梦'], image: '/assets/spots/sanya-coconut-ai.jpg' },
  { keywords: ['桂林', '遇龙河'], image: '/assets/spots/guilin-yulong-ai.jpg' },
  { keywords: ['哈尔滨', '索菲亚'], image: '/assets/spots/harbin-sophia-ai.jpg' },
  { keywords: ['海西', '茶卡'], image: '/assets/spots/haixi-chaka-ai.jpg' },
  { keywords: ['天津', '海河'], image: '/assets/spots/tianjin-haihe-ai.jpg' },
  { keywords: ['洛阳', '龙门'], image: '/assets/spots/luoyang-longmen-ai.jpg' },
  { keywords: ['张家界', '峰'], image: '/assets/spots/zhangjiajie-peaks-ai.jpg' },
  { keywords: ['敦煌', '鸣沙'], image: '/assets/spots/dunhuang-desert-ai.jpg' },
  { keywords: ['拉萨', '布达拉'], image: '/assets/spots/lhasa-potala-ai.jpg' },
  { keywords: ['澳门', '大三巴'], image: '/assets/spots/macau-ruins-ai.jpg' }
];

let cachedSpots = spotData.map(normalizeSpot);
let cachedCoveredSpots = null;
let cachedSource = 'local';
let lastLoadedAt = 0;
let pendingLoad = null;

function getAiFallbackImage(spot) {
  const text = `${spot.name || ''}${spot.city || ''}${spot.location || ''}`;
  const match = AI_FALLBACK_IMAGES.find((item) => item.keywords.some((keyword) => text.includes(keyword)));

  return match ? match.image : '';
}

function enhanceSummary(spot) {
  const summary = String(spot.summary || '').trim();

  if (summary.length >= 70) return summary;

  const city = spot.city || '这座城市';
  const bestTime = spot.bestTime || '日落前后';
  const locationCount = Array.isArray(spot.locations) && spot.locations.length ? spot.locations.length : 1;
  const suffix = `适合第一次到${city}旅行、周末短途和专门拍照打卡，建议预留1-2小时，按${bestTime}安排到达；现场可围绕${locationCount}个机位完成环境照、人像照和封面照。`;

  return summary ? `${summary}${suffix}` : suffix;
}

function normalizeScore(score) {
  const value = Number(score || 4.5);
  return Number((Number.isFinite(value) ? value : 4.5).toFixed(1));
}

function normalizeSpot(spot) {
  const palette = Array.isArray(spot.palette) && spot.palette.length >= 3
    ? spot.palette
    : ['#e8d7b9', '#c06739', '#4b6178'];
  const aiExampleImage = spot.aiExampleImage || getAiFallbackImage(spot);
  const rawCoverImage = spot.coverKind === 'ai' ? '' : (spot.coverImage || spot.imageUrl || spot.coverUrl || '');
  const aiCoverImage = rawCoverImage ? '' : aiExampleImage;
  const coverImage = rawCoverImage || aiCoverImage;
  const coverKind = rawCoverImage ? 'real' : (aiCoverImage ? 'ai' : '');

  return {
    id: spot.id || spot._id || `${spot.sourcePlatform || 'local'}-${spot.sourcePoiId || Date.now()}`,
    name: spot.name || '未命名机位',
    city: spot.city || '未知',
    province: spot.province || spot.provinceName || spot.region || spot.city || '未知',
    location: spot.location || spot.address || '',
    lat: Number(spot.lat || spot.latitude || 0),
    lng: Number(spot.lng || spot.longitude || 0),
    score: normalizeScore(spot.score),
    badge: spot.badge || '小红书来源',
    archiveNo: spot.archiveNo || buildArchiveNo(spot),
    bestTime: spot.bestTime || '待补充',
    summary: enhanceSummary(spot),
    aiExampleImage,
    aiExampleLabel: spot.aiExampleLabel || (aiExampleImage ? '拍摄参考' : ''),
    aiExamplePrompt: spot.aiExamplePrompt || '',
    coverImage,
    coverKind,
    coverCredit: spot.coverCredit || spot.imageCredit || spot.authorName || (coverKind === 'ai' ? '拍摄参考' : ''),
    coverSourceUrl: spot.coverSourceUrl || spot.imageSourceUrl || '',
    palette,
    tags: Array.isArray(spot.tags) ? spot.tags : [],
    themeTags: Array.isArray(spot.themeTags) ? spot.themeTags : [],
    locations: normalizeLocations(spot.locations),
    tips: Array.isArray(spot.tips) && spot.tips.length ? spot.tips : ['该地点来自外部数据源，发布前建议人工复核。'],
    composition: Array.isArray(spot.composition) && spot.composition.length ? spot.composition : ['先确认主体和背景关系，再补充具体构图。'],
    sourceType: spot.sourceType || (spot.sourcePlatform ? 'official_api' : 'editorial'),
    sourcePlatform: spot.sourcePlatform || '',
    sourceName: spot.sourceName || '',
    sourceUrl: spot.sourceUrl || '',
    sourcePoiId: spot.sourcePoiId || '',
    syncedAt: spot.syncedAt || ''
  };
}

function normalizeLocations(locations) {
  if (Array.isArray(locations) && locations.length) {
    return locations.map((location, index) => ({
      name: location.name || `推荐机位 ${index + 1}`,
      address: location.address || location.location || '',
      mapKeyword: location.mapKeyword || location.navigationName || location.name || '',
      desc: location.desc || '待补充机位描述。',
      time: location.time || '待补充',
      tip: location.tip || '待补充拍摄技巧。',
      type: location.type || '机位',
      angle: location.angle || '',
      lens: location.lens || '',
      direction: location.direction || '',
      example: location.example || '',
      result: location.result || '',
      stand: location.stand || '',
      action: location.action || '',
      visual: location.visual || '',
      pose: location.pose || '',
      cue: location.cue || '',
      diagramNote: location.diagramNote || '',
      caseImage: location.caseImage || location.imageUrl || location.image || '',
      caseImageCredit: location.caseImageCredit || location.imageCredit || location.authorName || '',
      caseSourceName: location.caseSourceName || location.sourceName || '',
      caseSourceUrl: location.caseSourceUrl || location.sourceUrl || ''
    }));
  }

  return [
    {
      name: '官方 POI 入口',
      desc: '这是从授权数据源同步的地点入口，可作为后续采编的基础点位。',
      time: '待补充',
      tip: '先补充实地拍摄角度、光线时间和避坑提示，再开放给用户。',
      type: '待采编'
    }
  ];
}

function buildArchiveNo(spot) {
  const city = String(spot.city || 'XHS').slice(0, 2).toUpperCase();
  const raw = String(spot.sourcePoiId || spot.id || spot._id || Date.now()).slice(-4);
  return `${city}-${raw}`;
}

function withCover(spot) {
  const normalized = normalizeSpot(spot);
  const imageLabel = normalized.coverKind === 'ai' ? (normalized.aiExampleLabel || '拍摄参考') : '真人打卡';
  const dataCompleteness = getDataCompleteness(normalized);
  const displayTags = buildDisplayTags(normalized);

  return {
    ...normalized,
    imageLabel,
    displayTags,
    dataCompleteness,
    dataCompletenessText: `${dataCompleteness}%`,
    coverStyle: `linear-gradient(135deg, ${normalized.palette[1]} 0%, ${normalized.palette[0]} 48%, ${normalized.palette[2]} 100%)`,
    searchText: buildSearchText(normalized, displayTags),
    sourceLabel: normalized.coverKind === 'ai'
      ? '拍摄参考'
      : (normalized.sourcePlatform === 'xiaohongshu' ? '小红书 POI' : '实例机位')
  };
}

function buildDisplayTags(spot) {
  const tags = []
    .concat(spot.themeTags || [])
    .concat(spot.tags || [])
    .filter(Boolean)
    .filter((tag) => !['city', 'water', 'oldtown', 'mountain', 'palace'].includes(tag));
  const seen = {};

  return tags.filter((tag) => {
    if (seen[tag]) return false;
    seen[tag] = true;
    return true;
  }).slice(0, 4);
}

function buildSearchText(spot, displayTags) {
  const locationText = (spot.locations || [])
    .map((location) => `${location.name}${location.desc}${location.type}${location.tip}`)
    .join('');
  const tagText = (spot.tags || [])
    .concat(spot.themeTags || [])
    .concat(displayTags || [])
    .join('');

  return `${spot.name}${spot.province}${spot.city}${spot.location}${spot.badge}${spot.summary}${spot.bestTime}${tagText}${locationText}`.toLowerCase();
}

function getDataCompleteness(spot) {
  const checks = [
    spot.name,
    spot.city,
    spot.location,
    spot.lat && spot.lng,
    spot.bestTime,
    spot.summary,
    spot.coverImage,
    Array.isArray(spot.locations) && spot.locations.length >= 3,
    Array.isArray(spot.tips) && spot.tips.length >= 3,
    Array.isArray(spot.composition) && spot.composition.length >= 3
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function mergeSpots(cloudSpots) {
  const merged = [];
  const seen = {};

  cloudSpots.concat(spotData).forEach((spot) => {
    const normalized = normalizeSpot(spot);
    const key = String(normalized.id || `${normalized.city}-${normalized.name}`);

    if (seen[key]) return;
    seen[key] = true;
    merged.push(normalized);
  });

  return merged;
}

function getCoveredSpots() {
  if (!cachedCoveredSpots) {
    cachedCoveredSpots = cachedSpots.map(withCover);
  }

  return cachedCoveredSpots;
}

function callGetSpots() {
  if (!wx.cloud || !wx.cloud.callFunction) {
    return Promise.reject(new Error('当前环境未启用云开发'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('云端数据读取超时，已使用缓存数据'));
    }, CLOUD_TIMEOUT);

    wx.cloud.callFunction({
      name: 'getSpots',
      data: {
        reviewStatus: 'approved'
      },
      success: (res) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(res);
      },
      fail: (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    });
  });
}

function loadSpots(options = {}) {
  const now = Date.now();
  const cacheIsFresh = cachedSource === 'cloud' && now - lastLoadedAt < CACHE_TTL;

  if (!options.force && cacheIsFresh) {
    return Promise.resolve({
      spots: getCoveredSpots(),
      source: cachedSource,
      message: 'cached'
    });
  }

  if (!options.force && pendingLoad) {
    return pendingLoad;
  }

  pendingLoad = callGetSpots()
    .then((res) => {
      const list = res && res.result && Array.isArray(res.result.spots)
        ? res.result.spots
        : [];

      if (!list.length) {
        return {
          spots: getCoveredSpots(),
          source: 'local',
          message: '云端暂无数据，已使用本地示例。'
        };
      }

      cachedSpots = mergeSpots(list);
      cachedCoveredSpots = null;
      cachedSource = 'cloud';
      lastLoadedAt = Date.now();

      return {
        spots: getCoveredSpots(),
        source: 'cloud',
        message: res.result.source || 'cloud'
      };
    })
    .catch((error) => ({
      spots: getCoveredSpots(),
      source: cachedSource,
      message: error.message || '云端数据读取失败，已使用本地示例。'
    }))
    .then((result) => {
      pendingLoad = null;
      return result;
    });

  return pendingLoad;
}

function getCachedSpots() {
  return getCoveredSpots();
}

function getSpotById(id) {
  const targetId = String(id);
  const found = cachedSpots.find((spot) => String(spot.id) === targetId || String(spot._id) === targetId);

  if (found) {
    return Promise.resolve(withCover(found));
  }

  return loadSpots().then(({ spots }) => (
    spots.find((spot) => String(spot.id) === targetId || String(spot._id) === targetId) || spots[0]
  ));
}

module.exports = {
  getCachedSpots,
  getSpotById,
  loadSpots,
  normalizeSpot,
  withCover
};
