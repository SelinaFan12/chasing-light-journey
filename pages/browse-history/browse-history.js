const { clearHistory, formatHistoryTime, getHistory } = require('../../utils/browse-history');
const { getThemeState } = require('../../utils/theme');

Page({
  data: {
    ...getThemeState(),
    history: []
  },

  onShow() {
    this.setData({
      ...getThemeState(),
      history: getHistory().map((item) => ({
        ...item,
        viewedText: formatHistoryTime(item.viewedAt)
      }))
    });
  },

  openSpot(event) {
    wx.navigateTo({
      url: `/pages/spot-detail/spot-detail?id=${event.currentTarget.dataset.id}`
    });
  },

  clearAll() {
    wx.showModal({
      title: '清空浏览历史',
      content: '确定清空全部浏览记录吗？',
      confirmText: '清空',
      success: (res) => {
        if (res.confirm) {
          clearHistory();
          this.setData({ history: [] });
        }
      }
    });
  }
});
