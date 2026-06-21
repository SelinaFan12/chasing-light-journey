const https = require('https');
const cloud = require('wx-server-sdk');
const seedRecords = require('./seed-records');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function nowIso() {
  return new Date().toISOString();
}

function requestJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const req = https.request({
      method: 'GET',
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      headers
    }, (res) => {
      let raw = '';

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        let data;

        try {
          data = JSON.parse(raw);
        } catch (error) {
          reject(new Error(`小红书接口返回解析失败：${raw.slice(0, 80)}`));
          return;
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(data.msg || data.message || `小红书接口请求失败：${res.statusCode}`));
          return;
        }

        resolve(data);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function pick(data, keys, fallback = '') {
  for (const key of keys) {
    if (data && data[key] !== undefined && data[key] !== null && data[key] !== '') {
      return data[key];
    }
  }

  return fallback;
}

function normalizeRecord(raw, index) {
  const poiId = String(pick(raw, ['poi_id', 'poiId', 'id', 'sourcePoiId'], `manual-${Date.now()}-${index}`));
  const name = String(pick(raw, ['poi_name', 'poiName', 'name', 'title'], '未命名小红书地点')).trim();
  const city = String(pick(raw, ['city', 'city_name', 'cityName'], '待分组')).trim();
  const address = String(pick(raw, ['address', 'location', 'addr'], '')).trim();
  const lat = Number(pick(raw, ['latitude', 'lat', 'poi_latitude'], 0)) || 0;
  const lng = Number(pick(raw, ['longitude', 'lng', 'poi_longitude'], 0)) || 0;
  const sourceUrl = String(pick(raw, ['sourceUrl', 'url', 'share_link', 'shareLink'], '')).trim();
  const coverImage = String(pick(raw, ['coverImage', 'cover_image', 'imageUrl', 'image_url', 'coverUrl', 'cover_url'], '')).trim();
  const coverCredit = String(pick(raw, ['coverCredit', 'imageCredit', 'authorName', 'creatorName', 'nickname'], '')).trim();
  const coverSourceUrl = String(pick(raw, ['coverSourceUrl', 'imageSourceUrl', 'noteUrl', 'note_url'], sourceUrl)).trim();
  const syncedAt = nowIso();

  return {
    id: `xhs-${poiId}`,
    name,
    city,
    location: address,
    lat,
    lng,
    score: Number(raw.score || 4.5),
    badge: raw.badge || '小红书来源',
    archiveNo: raw.archiveNo || `XHS-${poiId.slice(-4).toUpperCase()}`,
    bestTime: raw.bestTime || '待采编',
    summary: raw.summary || `${name} 来自小红书授权/官方 POI 数据，建议补充拍摄机位、角度和案例后发布。`,
    coverImage,
    coverCredit,
    coverSourceUrl,
    palette: raw.palette || ['#f0dfc4', '#c05f43', '#4d718a'],
    locations: raw.locations || [
      {
        name: 'POI 官方入口',
        desc: address || '待补充具体拍摄点位。',
        time: '待采编',
        tip: '从小红书热度地点进入，后续由人工补充拍摄角度和避坑提示。',
        type: '待采编'
      }
    ],
    tips: raw.tips || ['外部数据源仅作为地点线索，发布前需要人工复核。'],
    composition: raw.composition || ['先补充实拍角度，再确定构图建议。'],
    sourceType: raw.sourceType || 'official_api',
    sourcePlatform: 'xiaohongshu',
    sourceName: raw.sourceName || '小红书',
    sourcePoiId: poiId,
    sourceUrl,
    reviewStatus: raw.reviewStatus || 'draft',
    searchText: `${name} ${city} ${address} 小红书 ${poiId}`,
    syncedAt,
    updatedAt: syncedAt,
    rawXhs: raw
  };
}

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray(response.data.list)) return response.data.list;
  if (response.data && Array.isArray(response.data.poi_list)) return response.data.poi_list;
  if (response.result && Array.isArray(response.result.list)) return response.result.list;
  return [];
}

async function upsertSpot(spot) {
  const collection = db.collection('spots');
  const existed = await collection
    .where({
      sourcePlatform: 'xiaohongshu',
      sourcePoiId: spot.sourcePoiId
    })
    .limit(1)
    .get();

  if (existed.data.length) {
    await collection.doc(existed.data[0]._id).update({
      data: {
        ...spot,
        createdAt: existed.data[0].createdAt || spot.updatedAt
      }
    });

    return {
      action: 'updated',
      id: existed.data[0]._id
    };
  }

  const result = await collection.add({
    data: {
      ...spot,
      createdAt: spot.updatedAt
    }
  });

  return {
    action: 'created',
    id: result._id
  };
}

async function syncRecords(records) {
  const normalized = records.map(normalizeRecord);
  const results = [];

  for (const spot of normalized) {
    results.push(await upsertSpot(spot));
  }

  return {
    imported: normalized.length,
    results
  };
}

async function fetchOfficialPoiList(event) {
  const endpoint = process.env.XHS_POI_LIST_URL || event.poiListUrl;
  const accessToken = process.env.XHS_AUTH_ACCESS_TOKEN || event.accessToken;

  if (!endpoint) {
    throw new Error('请配置 XHS_POI_LIST_URL，或在调用参数传入 poiListUrl');
  }

  if (!accessToken) {
    throw new Error('请配置 XHS_AUTH_ACCESS_TOKEN，或在调用参数传入 accessToken');
  }

  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${endpoint}${separator}page=${event.page || 1}&page_size=${event.pageSize || 50}`;
  const response = await requestJson(url, {
    Authorization: `Bearer ${accessToken}`,
    'Access-Token': accessToken,
    access_token: accessToken
  });

  return extractList(response);
}

exports.main = async (event = {}) => {
  const mode = event.mode || 'import';

  if (mode === 'seed') {
    return {
      mode,
      ...(await syncRecords(seedRecords))
    };
  }

  if (mode === 'officialPoi') {
    const records = await fetchOfficialPoiList(event);
    return {
      mode,
      ...(await syncRecords(records))
    };
  }

  if (mode === 'import') {
    const records = Array.isArray(event.records) ? event.records : [];

    if (!records.length) {
      throw new Error('请传入 records 数组，用于导入已授权的小红书 POI/笔记整理数据');
    }

    return {
      mode,
      ...(await syncRecords(records))
    };
  }

  throw new Error(`未知同步模式：${mode}`);
};
