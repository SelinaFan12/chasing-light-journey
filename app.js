App({
  globalData: {
    appName: '追光旅迹'
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true
      });
    }

    wx.removeStorageSync('feedbackRecords');
  }
});
