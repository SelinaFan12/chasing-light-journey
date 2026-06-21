const { clearHistory, getHistory } = require('../../utils/browse-history');
const { getThemeState, toggleTheme } = require('../../utils/theme');

Page({
  data: {
    ...getThemeState(),
    historyCount: 0
  },

  onShow() {
    this.refreshSettingsData();
  },

  refreshSettingsData() {
    this.setData({
      ...getThemeState(),
      historyCount: getHistory().length
    });
  },

  toggleThemeMode() {
    this.setData(toggleTheme());
  },

  clearHistoryData() {
    wx.showModal({
      title: '清空浏览历史',
      content: '确定清空本机浏览历史吗？',
      confirmText: '清空',
      success: (res) => {
        if (res.confirm) {
          clearHistory();
          this.setData({ historyCount: 0 });
        }
      }
    });
  },

  clearLocalCache() {
    wx.showModal({
      title: '清理本地缓存',
      content: '会清空浏览历史和收藏记录，界面主题会保留。',
      confirmText: '清理',
      success: (res) => {
        if (res.confirm) {
          clearHistory();
          wx.removeStorageSync('favoriteSpotIds');
          this.setData({ historyCount: 0 });
          wx.showToast({ title: '已清理', icon: 'success' });
        }
      }
    });
  }
});
