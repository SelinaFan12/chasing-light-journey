const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

function cleanKeyword(value) {
  return String(value || '').trim().slice(0, 40);
}

exports.main = async (event = {}) => {
  const city = String(event.city || '').trim();
  const keyword = cleanKeyword(event.keyword);
  const reviewStatus = event.reviewStatus || 'approved';
  const where = {};

  if (reviewStatus !== 'all') {
    where.reviewStatus = reviewStatus;
  }

  if (city && city !== '全部') {
    where.city = city;
  }

  if (keyword) {
    where.searchText = db.RegExp({
      regexp: keyword,
      options: 'i'
    });
  }

  const result = await db
    .collection('spots')
    .where(where)
    .orderBy('updatedAt', 'desc')
    .limit(80)
    .get();

  return {
    source: 'cloud-db',
    count: result.data.length,
    spots: result.data
  };
};
