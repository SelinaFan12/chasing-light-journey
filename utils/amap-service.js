const { withCover } = require('./spots-service');

const AMAP_TIMEOUT = 10000;

function callAmapSearch(params) {
  if (!wx.cloud || !wx.cloud.callFunction) {
    return Promise.reject(new Error('当前环境未启用云开发'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('高德接口读取超时'));
    }, AMAP_TIMEOUT);

    wx.cloud.callFunction({
      name: 'amapSearch',
      data: params,
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

function searchAmapSpots(options = {}) {
  const keyword = String(options.keyword || '').trim();
  const city = String(options.city || '').trim();
  const location = options.location
    ? `${options.location.longitude},${options.location.latitude}`
    : '';

  return callAmapSearch({
    keyword: keyword || 'Citywalk 街区 路线 拍照打卡',
    city: city === '全部' ? '' : city,
    location,
    radius: options.radius || 3000,
    offset: options.offset || 20,
    page: options.page || 1
  }).then((res) => {
    const result = res && res.result ? res.result : {};
    const spots = Array.isArray(result.spots) ? result.spots.map(withCover) : [];

    return {
      configured: result.configured !== false,
      source: result.source || 'amap',
      count: Number(result.count || spots.length),
      spots,
      message: result.message || ''
    };
  });
}

module.exports = {
  searchAmapSpots
};
