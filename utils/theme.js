const THEME_KEY = 'themeMode';
const THEME_COLORS = {
  dark: {
    page: '#121217',
    navFront: '#ffffff',
    tabText: '#8d8a82',
    tabActive: '#f2d28a',
    tabBg: '#121217',
    tabBorder: 'black'
  },
  light: {
    page: '#f7f2e8',
    navFront: '#000000',
    tabText: '#7c7368',
    tabActive: '#8a611f',
    tabBg: '#fffaf0',
    tabBorder: 'white'
  }
};

function getThemeMode() {
  return wx.getStorageSync(THEME_KEY) || 'dark';
}

function getThemeClass() {
  return getThemeMode() === 'light' ? 'theme-light' : 'theme-dark';
}

function applyThemeToNav() {
  const mode = getThemeMode();
  const colors = THEME_COLORS[mode] || THEME_COLORS.dark;

  wx.setNavigationBarColor({
    frontColor: colors.navFront,
    backgroundColor: colors.page
  });

  if (wx.setBackgroundColor) {
    try {
      wx.setBackgroundColor({
        backgroundColor: colors.page,
        backgroundColorTop: colors.page,
        backgroundColorBottom: colors.page
      });
    } catch (error) {
      console.warn('[theme] set background color failed', error);
    }
  }

  if (wx.setTabBarStyle) {
    wx.setTabBarStyle({
      color: colors.tabText,
      selectedColor: colors.tabActive,
      backgroundColor: colors.tabBg,
      borderStyle: colors.tabBorder
    });
  }
}

function getThemeState() {
  const mode = getThemeMode();
  applyThemeToNav();

  return {
    themeMode: mode,
    themeClass: mode === 'light' ? 'theme-light' : 'theme-dark',
    isLightTheme: mode === 'light',
    themeText: mode === 'light' ? '白色模式' : '深色模式'
  };
}

function toggleTheme() {
  const next = getThemeMode() === 'light' ? 'dark' : 'light';
  wx.setStorageSync(THEME_KEY, next);

  return getThemeState();
}

module.exports = {
  applyThemeToNav,
  getThemeState,
  toggleTheme
};
