const { getCachedSpots, loadSpots } = require('../../utils/spots-service');
const { searchAmapSpots } = require('../../utils/amap-service');
const { getThemeState } = require('../../utils/theme');

const DEFAULT_VISIBLE_LIMIT = 60;
const LIST_BATCH_SIZE = 60;
const initialSpots = getCachedSpots();
const themeFilters = ['全部主题', 'Citywalk', '热门', '小众', '夜景', '亲水', '山野', '古城', '街拍', '人文', '美食'];

function uniqueValues(spots, key) {
  return ['全部'].concat(
    spots
      .map((spot) => spot[key])
      .filter((value, index, list) => value && list.indexOf(value) === index)
  );
}

function buildProvinces(spots) {
  return uniqueValues(spots, 'province');
}

function buildCities(spots, activeProvince = '全部') {
  const scopedSpots = activeProvince === '全部'
    ? spots
    : spots.filter((spot) => spot.province === activeProvince);
  return uniqueValues(scopedSpots, 'city');
}

function buildFavoriteMap(favoriteIds) {
  return favoriteIds.reduce((map, id) => {
    map[String(id)] = true;
    return map;
  }, {});
}

function buildCardSpot(spot, favoriteMap, distanceText = '') {
  const primaryLocation = (spot.locations || [])[0] || {};

  return {
    id: spot.id,
    coverImage: spot.coverImage,
    coverStyle: spot.coverStyle,
    archiveNo: spot.archiveNo,
    imageLabel: spot.imageLabel || '拍摄参考',
    coverCue: primaryLocation.cue || primaryLocation.type || spot.badge,
    coverLens: primaryLocation.lens || '1x 标准',
    city: spot.city,
    badge: spot.badge,
    name: spot.name,
    sourceLabel: spot.sourceLabel,
    score: spot.score,
    distanceText,
    summary: spot.summary,
    displayTags: spot.displayTags,
    palette: spot.palette,
    favorited: Boolean(favoriteMap[String(spot.id)])
  };
}

function splitSpotColumns(spots) {
  return spots.reduce((columns, spot, index) => {
    columns[index % 2].push(spot);
    return columns;
  }, [[], []]);
}

const provinces = buildProvinces(initialSpots);
const cities = buildCities(initialSpots);
const initialFilteredSpots = getVisibleSpots(initialSpots, null, DEFAULT_VISIBLE_LIMIT)
  .map((spot) => buildCardSpot(spot, {}, ''));

function formatAngleCount(spots) {
  const total = spots.reduce((sum, spot) => sum + ((spot.locations || []).length), 0);
  return `${total}+`;
}

function buildStats(spots, provinceCount) {
  return [
    { value: String(spots.length), label: '旅行点位' },
    { value: String(provinceCount), label: '覆盖省份' },
    { value: formatAngleCount(spots), label: '拍摄角度' }
  ];
}

function getVisibleSpots(spots, controls, limit) {
  return spots.slice(0, limit || DEFAULT_VISIBLE_LIMIT);
}

function toRadians(value) {
  return value * Math.PI / 180;
}

function getDistanceKm(from, spot) {
  if (!from || !spot.lat || !spot.lng) return null;

  const earthRadiusKm = 6371;
  const deltaLat = toRadians(spot.lat - from.latitude);
  const deltaLng = toRadians(spot.lng - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(spot.lat);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function formatDistance(distanceKm) {
  if (distanceKm === null || Number.isNaN(distanceKm)) return '';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
  if (distanceKm < 100) return `${distanceKm.toFixed(1)}km`;
  return `${Math.round(distanceKm)}km`;
}

function activeThemeToKeyword(theme) {
  const keywordMap = {
    Citywalk: 'Citywalk 街区 路线 拍照打卡',
    美食: '美食 打卡',
    夜景: '夜景 打卡',
    古城: '古城 老街',
    街拍: '街拍 小店 路牌',
    亲水: '江边 湖边 公园',
    山野: '公园 徒步 观景台'
  };

  return keywordMap[theme] || '';
}

Page({
  allSpots: initialSpots,
  searchTimer: null,
  amapSpotIds: {},

  data: {
    ...getThemeState(),
    provinces,
    activeProvince: '全部',
    cities,
    activeCity: '全部',
    themeFilters,
    activeTheme: '全部主题',
    keyword: '',
    recommendMode: 'plan',
    userLocation: null,
    locationText: '需要附近推荐时再开启定位',
    locationLoading: false,
    amapLoading: false,
    amapText: '可用高德补充真实地点',
    filteredSpots: initialFilteredSpots,
    spotColumns: splitSpotColumns(initialFilteredSpots),
    filteredTotal: initialSpots.length,
    remainingCount: Math.max(initialSpots.length - initialFilteredSpots.length, 0),
    visibleLimit: DEFAULT_VISIBLE_LIMIT,
    favoriteIds: [],
    dataSourceText: '本地精选点位',
    stats: buildStats(initialSpots, provinces.length - 1)
  },

  onLoad() {
    const favoriteIds = wx.getStorageSync('favoriteSpotIds') || [];
    this.setData({
      favoriteIds
    });
    this.loadRemoteSpots();
  },

  onShow() {
    const favoriteIds = wx.getStorageSync('favoriteSpotIds') || [];
    this.setData({
      favoriteIds,
      ...getThemeState()
    });
    this.filterSpots();
  },

  onUnload() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  },

  loadRemoteSpots() {
    loadSpots().then(({ spots, source, message }) => {
      this.allSpots = spots;
      const provinces = buildProvinces(spots);
      const cities = buildCities(spots, this.data.activeProvince);

      this.setData({
        provinces,
        cities,
        dataSourceText: source === 'cloud' ? '已同步点位' : '本地精选点位',
        stats: buildStats(spots, provinces.length - 1)
      });
      this.filterSpots({ resetLimit: true });

      if (source !== 'cloud' && message) {
        console.warn('[spots]', message);
      }
    });
  },

  setPlanMode() {
    this.setData({
      recommendMode: 'plan',
      locationText: this.data.userLocation ? '已定位，可随时切回附近' : '需要附近推荐时再开启定位'
    });
    this.filterSpots();
  },

  useNearby() {
    if (!wx.getFuzzyLocation) {
      this.setData({ locationText: '当前环境不支持定位' });
      return;
    }

    this.setData({
      locationLoading: true,
      locationText: '正在定位...'
    });

    wx.getFuzzyLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          recommendMode: 'nearby',
          activeCity: '全部',
          userLocation: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          locationText: '已按当前位置推荐附近机位',
          locationLoading: false
        });
        this.filterSpots();
      },
      fail: () => {
        this.setData({
          recommendMode: 'plan',
          locationText: '未开启定位，可手动选择城市',
          locationLoading: false
        });
        wx.showToast({
          title: '可手动选择城市',
          icon: 'none'
        });
      }
    });
  },

  onSearch(event) {
    this.setData({
      keyword: event.detail.value,
      recommendMode: 'plan'
    });
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.filterSpots({ resetLimit: true });
    }, 120);
  },

  submitSearch() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }

    const query = this.data.keyword.trim().toLowerCase();
    const nextState = {
      recommendMode: 'plan',
      activeTheme: '全部主题',
      visibleLimit: DEFAULT_VISIBLE_LIMIT
    };

    if (query) {
      const cityMatch = this.allSpots.find((spot) => {
        const city = String(spot.city || '').toLowerCase();
        return city && (city.includes(query) || query.includes(city));
      });
      const provinceMatch = this.allSpots.find((spot) => {
        const province = String(spot.province || '').toLowerCase();
        return province && (province.includes(query) || query.includes(province));
      });
      const matchedScope = cityMatch || provinceMatch;

      if (matchedScope) {
        nextState.activeProvince = matchedScope.province || '全部';
        nextState.activeCity = cityMatch ? cityMatch.city : '全部';
        nextState.cities = buildCities(this.allSpots, nextState.activeProvince);
      } else {
        nextState.activeProvince = '全部';
        nextState.activeCity = '全部';
        nextState.cities = buildCities(this.allSpots);
      }
    }

    this.setData(nextState);
    this.filterSpots({ resetLimit: true });
  },

  selectCity(event) {
    this.setData({
      activeCity: event.currentTarget.dataset.city,
      recommendMode: 'plan',
      visibleLimit: DEFAULT_VISIBLE_LIMIT
    });
    this.filterSpots({ resetLimit: true });
  },

  selectProvince(event) {
    const activeProvince = event.currentTarget.dataset.province;
    this.setData({
      activeProvince,
      activeCity: '全部',
      cities: buildCities(this.allSpots, activeProvince),
      recommendMode: 'plan',
      visibleLimit: DEFAULT_VISIBLE_LIMIT
    });
    this.filterSpots({ resetLimit: true });
  },

  selectTheme(event) {
    this.setData({
      activeTheme: event.currentTarget.dataset.theme,
      recommendMode: 'plan',
      visibleLimit: DEFAULT_VISIBLE_LIMIT
    });
    this.filterSpots({ resetLimit: true });
  },

  filterSpots(options = {}) {
    const { activeProvince, activeCity, activeTheme, keyword, recommendMode, userLocation } = this.data;
    const query = keyword.trim().toLowerCase();
    const favoriteMap = buildFavoriteMap((wx.getStorageSync('favoriteSpotIds') || []).map(String));
    const visibleLimit = options.resetLimit ? DEFAULT_VISIBLE_LIMIT : this.data.visibleLimit;
    const matchedSpots = this.allSpots.map((spot) => {
      const distanceKm = getDistanceKm(userLocation, spot);
      return {
        spot,
        distanceKm,
        distanceText: formatDistance(distanceKm)
      };
    }).filter(({ spot }) => {
      const matchProvince = activeProvince === '全部' || spot.province === activeProvince;
      const matchCity = activeCity === '全部' || spot.city === activeCity;
      const target = spot.searchText || '';
      const matchTheme = activeTheme === '全部主题' || target.includes(activeTheme.toLowerCase());
      return matchProvince && matchCity && matchTheme && (!query || target.includes(query));
    }).sort((a, b) => {
      if (recommendMode !== 'nearby' || !userLocation) return 0;
      const distanceA = a.distanceKm === null ? Infinity : a.distanceKm;
      const distanceB = b.distanceKm === null ? Infinity : b.distanceKm;
      return distanceA - distanceB;
    });
    const filteredSpots = getVisibleSpots(matchedSpots, {
      activeProvince,
      activeCity,
      activeTheme,
      keyword,
      recommendMode
    }, visibleLimit).map(({ spot, distanceText }) => buildCardSpot(spot, favoriteMap, distanceText));

    this.setData({
      filteredSpots,
      spotColumns: splitSpotColumns(filteredSpots),
      filteredTotal: matchedSpots.length,
      remainingCount: Math.max(matchedSpots.length - filteredSpots.length, 0),
      visibleLimit
    });
  },

  loadMoreSpots() {
    this.setData({
      visibleLimit: this.data.visibleLimit + LIST_BATCH_SIZE
    });
    this.filterSpots();
  },

  loadAmapSpots() {
    const { keyword, activeCity, activeProvince, userLocation } = this.data;
    const city = activeCity !== '全部' ? activeCity : '';
    const fallbackKeyword = activeThemeToKeyword(this.data.activeTheme) || (activeProvince !== '全部' ? `${activeProvince} Citywalk 街区 路线` : 'Citywalk 街区 路线 拍照打卡');
    const searchKeyword = keyword.trim() || fallbackKeyword;

    this.setData({
      amapLoading: true,
      amapText: '正在从高德补充真实地点...'
    });

    searchAmapSpots({
      keyword: searchKeyword,
      city,
      location: this.data.recommendMode === 'nearby' ? userLocation : null,
      radius: 5000,
      offset: 20
    }).then(({ configured, spots, message }) => {
      if (!configured) {
        this.setData({
          amapLoading: false,
          amapText: '未配置高德 Key，已继续使用本地数据'
        });
        wx.showToast({ title: '请先配置高德Key', icon: 'none' });
        return;
      }

      const newSpots = spots.filter((spot) => {
        const key = String(spot.id);
        if (this.amapSpotIds[key]) return false;
        this.amapSpotIds[key] = true;
        return true;
      });

      if (!newSpots.length) {
        this.setData({
          amapLoading: false,
          amapText: message || '高德暂无新的匹配地点'
        });
        wx.showToast({ title: '暂无新地点', icon: 'none' });
        return;
      }

      this.allSpots = newSpots.concat(this.allSpots);
      const provinces = buildProvinces(this.allSpots);
      const cities = buildCities(this.allSpots, this.data.activeProvince);

      this.setData({
        amapLoading: false,
        amapText: `高德已补充 ${newSpots.length} 个真实地点`,
        provinces,
        cities,
        dataSourceText: '本地 + 高德地点',
        stats: buildStats(this.allSpots, provinces.length - 1)
      });
      this.filterSpots({ resetLimit: true });
    }).catch((error) => {
      this.setData({
        amapLoading: false,
        amapText: error.message || '高德地点读取失败'
      });
      wx.showToast({ title: '高德读取失败', icon: 'none' });
    });
  },

  openSpot(event) {
    const id = String(event.currentTarget.dataset.id);
    const spot = this.allSpots.find((item) => String(item.id) === id);

    if (spot && id.indexOf('amap-') === 0) {
      wx.setStorageSync(`temporarySpot:${id}`, spot);
    }

    wx.navigateTo({
      url: `/pages/spot-detail/spot-detail?id=${id}`
    });
  },

  toggleFavorite(event) {
    const id = String(event.currentTarget.dataset.id);
    const current = (wx.getStorageSync('favoriteSpotIds') || []).map(String);
    const exists = current.includes(id);
    const next = exists ? current.filter((item) => item !== id) : current.concat(id);

    wx.setStorageSync('favoriteSpotIds', next);
    this.setData({ favoriteIds: next });
    this.filterSpots();

    wx.showToast({
      title: exists ? '已取消' : '已收藏',
      icon: 'success'
    });
  },

  goPoses() {
    wx.switchTab({ url: '/pages/poses/poses' });
  },

  goCaptions() {
    wx.switchTab({ url: '/pages/captions/captions' });
  },

  onShareAppMessage() {
    return {
      title: '追光旅迹：一起找全国旅行拍照机位',
      path: '/pages/index/index',
      imageUrl: '/assets/spots/shanghai-bund-ai.jpg'
    };
  },

  onShareTimeline() {
    return {
      title: '追光旅迹：全国旅行拍照机位与姿势指南',
      query: '',
      imageUrl: '/assets/spots/shanghai-bund-ai.jpg'
    };
  }
});
