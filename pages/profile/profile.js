const { getCachedSpots, loadSpots } = require('../../utils/spots-service');
const { getHistory } = require('../../utils/browse-history');
const { getThemeState, toggleTheme } = require('../../utils/theme');

const USER_KEY = 'wechatUserProfile';

function getStorageArray(key) {
  const value = wx.getStorageSync(key) || [];
  return Array.isArray(value) ? value : [];
}

function getStorageObject(key) {
  const value = wx.getStorageSync(key) || null;
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

Page({
  data: {
    ...getThemeState(),
    hasWechatLogin: false,
    nickName: '',
    avatarUrl: '',
    favoriteSpots: [],
    records: [
      { value: '0', label: '浏览机位' },
      { value: '0', label: '收藏机位' },
      { value: 'Lite', label: '当前版本' }
    ],
    actions: [
      { title: '浏览历史', desc: '查看最近打开过的机位和路线线索。', type: 'history' },
      { title: '设置', desc: '切换主题、清理浏览历史和本地缓存。', type: 'settings' }
    ]
  },

  onShow() {
    this.setData({
      ...getThemeState(),
      ...this.getLoginState()
    });
    const favoriteIds = getStorageArray('favoriteSpotIds').map(String);
    const applyFavorites = (spots) => {
      const favoriteSpots = spots.filter((spot) => favoriteIds.includes(String(spot.id)));
      this.setProfileData(favoriteSpots);
    };

    applyFavorites(getCachedSpots());
    loadSpots()
      .then(({ spots }) => applyFavorites(spots))
      .catch(() => applyFavorites(getCachedSpots()));
  },

  getLoginState() {
    const userProfile = getStorageObject(USER_KEY);
    const nickName = userProfile && userProfile.nickName ? userProfile.nickName : '';
    const avatarUrl = userProfile && userProfile.avatarUrl ? userProfile.avatarUrl : '';

    return {
      hasWechatLogin: Boolean(nickName),
      nickName,
      avatarUrl
    };
  },

  setProfileData(favoriteSpots) {
    const historyCount = getHistory().length;

    this.setData({
      favoriteSpots,
      records: [
        { value: String(historyCount), label: '浏览机位' },
        { value: String(favoriteSpots.length), label: '收藏机位' },
        { value: 'Lite', label: '当前版本' }
      ]
    });
  },

  toggleThemeMode() {
    this.setData(toggleTheme());
  },

  loginWithWechat() {
    if (!wx.getUserProfile) {
      wx.showToast({ title: '当前微信版本不支持授权登录', icon: 'none' });
      return;
    }

    wx.getUserProfile({
      desc: '用于展示分享身份和保存本地拍照档案',
      success: (profileRes) => {
        wx.login({
          success: (loginRes) => {
            const userProfile = {
              ...profileRes.userInfo,
              loginAt: Date.now(),
              hasLoginCode: Boolean(loginRes.code)
            };

            wx.setStorageSync(USER_KEY, userProfile);
            this.setData({
              hasWechatLogin: true,
              nickName: userProfile.nickName || '',
              avatarUrl: userProfile.avatarUrl || ''
            });
            wx.showToast({ title: '已登录微信', icon: 'success' });
          },
          fail: () => {
            const userProfile = {
              ...profileRes.userInfo,
              loginAt: Date.now(),
              hasLoginCode: false
            };

            wx.setStorageSync(USER_KEY, userProfile);
            this.setData({
              hasWechatLogin: true,
              nickName: userProfile.nickName || '',
              avatarUrl: userProfile.avatarUrl || ''
            });
            wx.showToast({ title: '已保存头像昵称', icon: 'success' });
          }
        });
      },
      fail: () => {
        wx.showToast({ title: '需要授权后才能分享身份', icon: 'none' });
      }
    });
  },

  openSpot(event) {
    wx.navigateTo({
      url: `/pages/spot-detail/spot-detail?id=${event.currentTarget.dataset.id}`
    });
  },

  clearFavorites() {
    wx.showModal({
      title: '清空收藏',
      content: '确定清空全部收藏机位吗？',
      confirmText: '清空',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('favoriteSpotIds');
          this.setProfileData([]);
        }
      }
    });
  },

  openAction(event) {
    const { type } = event.currentTarget.dataset;
    const pageMap = {
      history: '/pages/browse-history/browse-history',
      settings: '/pages/settings/settings'
    };

    if (!pageMap[type]) return;

    wx.navigateTo({
      url: pageMap[type]
    });
  },

  onShareAppMessage() {
    const { nickName } = this.data;

    return {
      title: nickName ? `${nickName} 邀你一起找旅行拍照机位` : '追光地图：一起找全国旅行拍照机位',
      path: '/pages/index/index',
      imageUrl: '/assets/spots/shanghai-bund-ai.jpg'
    };
  },

  onShareTimeline() {
    return {
      title: '追光地图：全国旅行拍照机位与姿势指南',
      query: '',
      imageUrl: '/assets/spots/shanghai-bund-ai.jpg'
    };
  }
});
