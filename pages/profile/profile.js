const { getCachedSpots, loadSpots } = require('../../utils/spots-service');
const { getHistory } = require('../../utils/browse-history');
const { getThemeState, toggleTheme } = require('../../utils/theme');

const USER_KEY = 'wechatUserProfile';
const DEFAULT_NICK_NAME = '追光旅人';

function getStorageArray(key) {
  const value = wx.getStorageSync(key) || [];
  return Array.isArray(value) ? value : [];
}

function getStorageObject(key) {
  const value = wx.getStorageSync(key) || null;
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function normalizeUserProfile(value = {}) {
  const nickName = typeof value.nickName === 'string' ? value.nickName.trim() : '';
  const avatarUrl = typeof value.avatarUrl === 'string' ? value.avatarUrl : '';

  return {
    ...value,
    nickName,
    avatarUrl
  };
}

Page({
  data: {
    ...getThemeState(),
    hasWechatLogin: false,
    nickName: '',
    avatarUrl: '',
    profileDraftName: DEFAULT_NICK_NAME,
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
    const userProfile = normalizeUserProfile(getStorageObject(USER_KEY));
    const nickName = userProfile.nickName || '';
    const avatarUrl = userProfile.avatarUrl || '';

    return {
      hasWechatLogin: Boolean(userProfile.loginAt || nickName || avatarUrl),
      nickName,
      avatarUrl,
      profileDraftName: nickName || DEFAULT_NICK_NAME
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

  saveUserProfile(patch = {}) {
    const current = normalizeUserProfile(getStorageObject(USER_KEY));
    const nickName = typeof patch.nickName === 'string'
      ? patch.nickName.trim()
      : current.nickName || DEFAULT_NICK_NAME;
    const nextProfile = {
      ...current,
      ...patch,
      nickName: nickName || DEFAULT_NICK_NAME,
      avatarUrl: typeof patch.avatarUrl === 'string' ? patch.avatarUrl : current.avatarUrl || '',
      loginAt: current.loginAt || Date.now(),
      updatedAt: Date.now()
    };

    wx.setStorageSync(USER_KEY, nextProfile);
    this.setData({
      hasWechatLogin: true,
      nickName: nextProfile.nickName,
      avatarUrl: nextProfile.avatarUrl,
      profileDraftName: nextProfile.nickName
    });

    return nextProfile;
  },

  loginWithWechat() {
    const saveLogin = (loginRes = {}) => {
      this.saveUserProfile({
        nickName: this.data.profileDraftName || DEFAULT_NICK_NAME,
        hasLoginCode: Boolean(loginRes.code),
        loginCodeAt: Date.now()
      });
      wx.showToast({ title: '已进入档案', icon: 'success' });
    };

    if (!wx.login) {
      saveLogin();
      return;
    }

    wx.login({
      success: saveLogin,
      fail: () => saveLogin()
    });
  },

  onChooseAvatar(event) {
    const avatarUrl = event.detail && event.detail.avatarUrl;

    if (!avatarUrl) {
      wx.showToast({ title: '未选择头像', icon: 'none' });
      return;
    }

    this.saveUserProfile({ avatarUrl });
    wx.showToast({ title: '头像已更新', icon: 'success' });
  },

  onNicknameInput(event) {
    const value = event.detail && typeof event.detail.value === 'string' ? event.detail.value : '';
    this.setData({ profileDraftName: value });
  },

  saveNickname(event) {
    const value = event.detail && typeof event.detail.value === 'string'
      ? event.detail.value
      : this.data.profileDraftName;
    this.saveUserProfile({ nickName: value || DEFAULT_NICK_NAME });
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
      title: nickName ? `${nickName} 邀你一起找旅行拍照机位` : '追光旅迹：一起找全国旅行拍照机位',
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
