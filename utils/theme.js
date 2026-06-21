const THEME_KEY = 'themeMode';

function getThemeMode() {
  return wx.getStorageSync(THEME_KEY) || 'dark';
}

function getThemeClass() {
  return getThemeMode() === 'light' ? 'theme-light' : 'theme-dark';
}

function applyThemeToNav() {
  const mode = getThemeMode();

  wx.setNavigationBarColor({
    frontColor: mode === 'light' ? '#000000' : '#ffffff',
    backgroundColor: mode === 'light' ? '#f7f2e8' : '#121217'
  });

  if (wx.setTabBarStyle) {
    wx.setTabBarStyle({
      color: mode === 'light' ? '#7c7368' : '#8d8a82',
      selectedColor: mode === 'light' ? '#8a611f' : '#f2d28a',
      backgroundColor: mode === 'light' ? '#fffaf0' : '#121217',
      borderStyle: 'black'
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
  getThemeState,
  toggleTheme
};
