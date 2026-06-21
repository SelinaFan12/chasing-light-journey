const HISTORY_KEY = 'spotBrowseHistory';
const MAX_HISTORY = 60;

function getHistory() {
  const history = wx.getStorageSync(HISTORY_KEY) || [];
  return Array.isArray(history) ? history : [];
}

function saveHistory(list) {
  wx.setStorageSync(HISTORY_KEY, list.slice(0, MAX_HISTORY));
}

function recordSpotView(spot) {
  if (!spot || !spot.id) return;

  const id = String(spot.id);
  const current = getHistory().filter((item) => String(item.id) !== id);
  const record = {
    id,
    name: spot.name,
    city: spot.city,
    badge: spot.badge,
    archiveNo: spot.archiveNo,
    summary: spot.summary,
    coverImage: spot.coverImage,
    imageLabel: spot.imageLabel,
    viewedAt: Date.now()
  };

  saveHistory([record].concat(current));
}

function clearHistory() {
  wx.removeStorageSync(HISTORY_KEY);
}

function formatHistoryTime(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const pad = (value) => String(value).padStart(2, '0');
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (sameDay) return `今天 ${time}`;

  return `${date.getMonth() + 1}月${date.getDate()}日 ${time}`;
}

module.exports = {
  clearHistory,
  formatHistoryTime,
  getHistory,
  recordSpotView
};
