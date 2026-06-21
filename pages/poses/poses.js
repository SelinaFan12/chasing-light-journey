const { poseData } = require('../../utils/data');
const { getThemeState } = require('../../utils/theme');

const categories = ['全部', '室内', '街巷', '海边', '山野', '古镇', '夜景', '台阶', '桥梁'];

Page({
  data: {
    ...getThemeState(),
    categories,
    activeCategory: '全部',
    poses: poseData,
    visiblePoses: poseData
  },

  onShow() {
    this.setData(getThemeState());
  },

  setCategory(event) {
    const activeCategory = event.currentTarget.dataset.category;
    const visiblePoses = activeCategory === '全部'
      ? poseData
      : poseData.filter((pose) => pose.category === activeCategory);

    this.setData({ activeCategory, visiblePoses });
  }
});
