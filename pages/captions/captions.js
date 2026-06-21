const { captionData } = require('../../utils/data');
const { getThemeState } = require('../../utils/theme');

const styleTabs = [
  { label: '文艺', value: 'literary' },
  { label: '简约', value: 'simple' },
  { label: '松弛', value: 'funny' },
  { label: '高级', value: 'elegant' },
  { label: '英文', value: 'english' }
];

const libraryTemplates = {
  literary: [
    '{keyword}这段路，像被光轻轻收藏。',
    '把{keyword}装进口袋，风也变得温柔。',
    '{keyword}不只是一站，是今天最柔软的注脚。',
    '在{keyword}慢下来，才发现风景也会等人。'
  ],
  simple: [
    '{keyword}，今日份打卡完成。',
    '到过{keyword}，也被这里治愈了一下。',
    '{keyword}很好拍，适合慢慢逛。',
    '记录一下：{keyword}，值得来。'
  ],
  funny: [
    '为了{keyword}走了很多路，照片负责证明值得。',
    '{keyword}：腿累，但相册很满意。',
    '今日营业：在{keyword}假装不经意地出片。',
    '来{keyword}的理由很简单：好看，好拍，好发。'
  ],
  elegant: [
    '{keyword}的光线刚好，适合留一张干净的旅行封面。',
    '以{keyword}为背景，把今天整理成一帧画面。',
    '{keyword}，城市质感和松弛感都在这一刻对齐。',
    '在{keyword}取一段光，作为这趟旅程的封面。'
  ],
  english: [
    'Chasing the light in {keyword}.',
    '{keyword}, softly saved in my camera roll.',
    'A little light, a quiet view, and {keyword}.',
    'Some places feel like a frame. {keyword} does.'
  ]
};

function pickTemplate(list, keyword, style) {
  const seed = `${keyword}${style}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return list[seed % list.length];
}

function buildMatchedCaption(keyword, style) {
  const templates = libraryTemplates[style] || libraryTemplates.literary;
  return pickTemplate(templates, keyword, style).replace(/\{keyword\}/g, keyword);
}

Page({
  data: {
    ...getThemeState(),
    styleTabs,
    activeStyle: 'literary',
    keyword: '',
    captions: captionData.literary,
    matchedCaption: '',
    isSearching: false
  },

  onShow() {
    this.setData(getThemeState());
  },

  setStyle(event) {
    const activeStyle = event.currentTarget.dataset.style;
    this.setData({
      activeStyle,
      captions: captionData[activeStyle]
    });
  },

  onKeyword(event) {
    this.setData({ keyword: event.detail.value });
  },

  searchCaptionLibrary() {
    if (this.data.isSearching) return;

    const keyword = this.data.keyword.trim() || '这趟旅程';
    this.setData({ isSearching: true });

    const matchedCaption = buildMatchedCaption(keyword, this.data.activeStyle);

    setTimeout(() => {
      this.setData({
        matchedCaption,
        isSearching: false
      });
      wx.showToast({ title: '已匹配', icon: 'success' });
    }, 180);
  },

  copyCaption(event) {
    const text = event.currentTarget.dataset.text;
    wx.setClipboardData({ data: text });
  }
});
