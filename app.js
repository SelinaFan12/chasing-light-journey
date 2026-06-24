const { applyThemeToNav } = require('./utils/theme');

App({
  globalData: {
    appName: '追光旅迹'
  },

  onLaunch() {
    applyThemeToNav();

    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true
      });
    }

    wx.removeStorageSync('feedbackRecords');
  }
});
