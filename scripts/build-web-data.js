const fs = require('fs');
const path = require('path');

const { getCachedSpots } = require('../utils/spots-service');
const { poseData, captionData } = require('../utils/data');

const outDir = path.resolve(__dirname, '..', 'web');
const outFile = path.join(outDir, 'data.js');

function uniqueValues(items, key) {
  return Array.from(new Set(items.map((item) => item[key]).filter(Boolean)));
}

function formatAngleCount(spots) {
  const total = spots.reduce((sum, spot) => sum + ((spot.locations || []).length), 0);
  return `${total}+`;
}

function pickLocation(location) {
  return {
    name: location.name,
    address: location.address,
    mapKeyword: location.mapKeyword,
    desc: location.desc,
    time: location.time,
    tip: location.tip,
    type: location.type,
    angle: location.angle,
    lens: location.lens,
    direction: location.direction,
    example: location.example,
    result: location.result,
    stand: location.stand,
    action: location.action,
    cue: location.cue
  };
}

function pickSpot(spot) {
  return {
    id: spot.id,
    name: spot.name,
    city: spot.city,
    province: spot.province,
    location: spot.location,
    lat: spot.lat,
    lng: spot.lng,
    score: spot.score,
    badge: spot.badge,
    archiveNo: spot.archiveNo,
    bestTime: spot.bestTime,
    summary: spot.summary,
    imageLabel: spot.imageLabel,
    sourceLabel: spot.sourceLabel,
    coverImage: spot.coverImage,
    coverKind: spot.coverKind,
    coverCredit: spot.coverCredit,
    coverStyle: spot.coverStyle,
    aiExampleImage: spot.aiExampleImage,
    aiExampleLabel: spot.aiExampleLabel,
    palette: spot.palette,
    displayTags: spot.displayTags,
    themeTags: spot.themeTags,
    tags: spot.tags,
    routeMap: spot.routeMap,
    locations: (spot.locations || []).map(pickLocation),
    tips: spot.tips,
    composition: spot.composition
  };
}

function buildPayload() {
  const spots = getCachedSpots().map(pickSpot);
  const provinces = uniqueValues(spots, 'province').sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  const cities = uniqueValues(spots, 'city').sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

  return {
    generatedAt: new Date().toISOString(),
    stats: {
      spotCount: spots.length,
      provinceCount: provinces.length,
      cityCount: cities.length,
      angleCount: formatAngleCount(spots)
    },
    provinces,
    cities,
    spots,
    poses: poseData,
    captions: captionData
  };
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const payload = buildPayload();
  const source = `window.ZHUI_GUANG_WEB_DATA = ${JSON.stringify(payload, null, 2)};\n`;
  fs.writeFileSync(outFile, source);
  console.log(`Wrote ${path.relative(process.cwd(), outFile)} with ${payload.spots.length} spots.`);
}

main();
