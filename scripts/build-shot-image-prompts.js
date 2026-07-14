const fs = require('fs');
const path = require('path');
const { getCachedSpots } = require('../utils/spots-service');

function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function buildPrompt(spot, location) {
  const scene = [
    spot.name,
    spot.city,
    location.name,
    location.type,
    location.time,
    location.desc,
    location.result,
    location.stand,
    location.action,
    location.angle,
    location.lens
  ].filter(Boolean).join('；');

  return [
    'Use case: photorealistic-natural',
    'Asset type: WeChat mini program per-location shot example, vertical Xiaohongshu-style direct photo',
    `Primary request: Generate one refined check-in photo matching this exact shooting location: ${scene}`,
    'Subject: one young adult woman traveler, natural realistic pose, clear face and body proportions, copyable standing or sitting action.',
    'Style/medium: photorealistic mobile travel photography, polished Xiaohongshu check-in style, realistic and intuitive.',
    'Composition/framing: vertical 4:5 crop, show where the person stands and keep the destination/background recognizable. Leave clean safe margins on all sides, especially 8%-12% headroom above the hair/head; do not crop the head, feet, hands, landmark roofline, or key background.',
    'Lighting/mood: natural travel lighting matching the described time, clean tones, no heavy filter.',
    'Constraints: no text, no watermark, no UI, no logos, no distorted hands, no duplicated people, no fantasy style.'
  ].join('\n');
}

function buildManifest() {
  const spots = getCachedSpots();
  const items = [];

  spots.forEach((spot) => {
    (spot.locations || []).forEach((location, index) => {
      const spotSlug = slugify(`${spot.city}-${spot.name}`);
      const locationSlug = slugify(location.name || `shot-${index + 1}`);
      const fileName = `${String(spot.id)}-${String(index + 1).padStart(2, '0')}-${locationSlug}.jpg`;
      items.push({
        spotId: spot.id,
        spotName: spot.name,
        city: spot.city,
        locationIndex: index,
        locationName: location.name,
        locationType: location.type,
        targetPath: `assets/location-shots/${spotSlug}/${fileName}`,
        prompt: buildPrompt(spot, location)
      });
    });
  });

  return {
    generatedAt: new Date().toISOString(),
    total: items.length,
    items
  };
}

const outPath = path.join(__dirname, 'shot-image-prompts.json');
fs.writeFileSync(outPath, `${JSON.stringify(buildManifest(), null, 2)}\n`);
console.log(outPath);
