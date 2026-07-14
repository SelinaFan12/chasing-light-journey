const { getSpotById } = require('../../utils/spots-service');
const { getThemeState } = require('../../utils/theme');
const { recordSpotView } = require('../../utils/browse-history');

const SCENE_CASE_IMAGES = [
  {
    pattern: /树荫|树影|梧桐|树下|树林|林荫/,
    images: ['/assets/xhs-examples/tree-portrait.jpg', '/assets/xhs-examples/tree-portrait-v2.jpg'],
    label: '树荫直拍'
  },
  {
    pattern: /花墙|花丛|花枝|花园|花海/,
    images: ['/assets/xhs-examples/foreground-frame.jpg', '/assets/xhs-examples/foreground-frame-v2.jpg'],
    label: '花墙直拍'
  },
  {
    pattern: /前景|树枝|门洞|窗格|框景/,
    images: ['/assets/xhs-examples/foreground-frame.jpg', '/assets/xhs-examples/foreground-frame-v2.jpg'],
    label: '前景直拍'
  },
  {
    pattern: /街巷|街角|慢走|行走|Citywalk|路牌|转角|坡道|老街|小路/,
    images: ['/assets/xhs-examples/street-walk.jpg', '/assets/xhs-examples/street-walk-v2.jpg'],
    label: '街巷直拍'
  },
  {
    pattern: /台阶|楼梯|石阶|阶梯|上行/,
    images: ['/assets/xhs-examples/steps-sit.jpg', '/assets/xhs-examples/steps-sit-v2.jpg'],
    label: '台阶直拍'
  },
  {
    pattern: /夜景|灯牌|橱窗|补光|亮灯|灯光|蓝调/,
    images: ['/assets/xhs-examples/night-fill.jpg', '/assets/xhs-examples/night-fill-v2.jpg'],
    label: '夜景直拍'
  },
  {
    pattern: /海边|湖岸|水面|江面|河岸|亲水|码头|岸线/,
    images: ['/assets/xhs-examples/water-rail.jpg', '/assets/xhs-examples/water-rail-v2.jpg', '/assets/xhs-examples/stone-rail-v2.jpg'],
    label: '水边直拍'
  },
  {
    pattern: /山野|山峰|远山|峰林|观景台|远望|草地|云海|沙漠|沙丘|高原/,
    image: '/assets/xhs-examples/mountain-wide.jpg',
    label: '山野直拍'
  },
  {
    pattern: /墙|红墙|门窗|侧身|墙面|建筑立面/,
    images: ['/assets/xhs-examples/wall-halfbody.jpg', '/assets/xhs-examples/wall-halfbody-v2.jpg'],
    label: '墙边直拍'
  },
  {
    pattern: /天际线|地标|全景|封面|主体完整|城市建筑|广场/,
    images: ['/assets/xhs-examples/landmark-wide.jpg', '/assets/xhs-examples/landmark-wide-v2.jpg'],
    label: '地标直拍'
  },
  {
    pattern: /栏杆|扶栏|护栏|桥侧|桥上|桥梁|栈桥|江堤/,
    images: ['/assets/xhs-examples/water-rail.jpg', '/assets/xhs-examples/water-rail-v2.jpg', '/assets/xhs-examples/stone-rail-v2.jpg'],
    label: '栏杆直拍'
  },
  {
    pattern: /半身|人像|侧脸|回头/,
    images: ['/assets/xhs-examples/wall-halfbody.jpg', '/assets/xhs-examples/wall-halfbody-v2.jpg', '/assets/xhs-examples/stone-rail-v2.jpg'],
    label: '人像直拍'
  }
];

const SCENE_NAME_CASE_IMAGES = [
  {
    pattern: /树荫|树影|梧桐|树下|树林|林荫/,
    images: ['/assets/xhs-examples/tree-portrait.jpg', '/assets/xhs-examples/tree-portrait-v2.jpg'],
    label: '树荫直拍'
  },
  {
    pattern: /花墙|花丛|花枝|花园|花海/,
    images: ['/assets/xhs-examples/foreground-frame.jpg', '/assets/xhs-examples/foreground-frame-v2.jpg'],
    label: '花墙直拍'
  },
  {
    pattern: /前景|树枝|门洞|窗格|框景/,
    images: ['/assets/xhs-examples/foreground-frame.jpg', '/assets/xhs-examples/foreground-frame-v2.jpg'],
    label: '前景直拍'
  },
  {
    pattern: /街巷|街角|慢走|行走|Citywalk|路牌|转角|坡道|老街|小路/,
    images: ['/assets/xhs-examples/street-walk.jpg', '/assets/xhs-examples/street-walk-v2.jpg'],
    label: '街巷直拍'
  },
  {
    pattern: /台阶|楼梯|石阶|阶梯|上行/,
    images: ['/assets/xhs-examples/steps-sit.jpg', '/assets/xhs-examples/steps-sit-v2.jpg'],
    label: '台阶直拍'
  },
  {
    pattern: /天际线|地标|全景|封面|主体完整|城市建筑|广场/,
    images: ['/assets/xhs-examples/landmark-wide.jpg', '/assets/xhs-examples/landmark-wide-v2.jpg'],
    label: '地标直拍'
  },
  {
    pattern: /栏杆|扶栏|护栏|桥侧|桥上|桥梁|栈桥|江堤/,
    images: ['/assets/xhs-examples/water-rail.jpg', '/assets/xhs-examples/water-rail-v2.jpg', '/assets/xhs-examples/stone-rail-v2.jpg'],
    label: '栏杆直拍'
  },
  {
    pattern: /夜景|灯牌|橱窗|补光|亮灯|灯光|蓝调/,
    images: ['/assets/xhs-examples/night-fill.jpg', '/assets/xhs-examples/night-fill-v2.jpg'],
    label: '夜景直拍'
  },
  {
    pattern: /海边|湖岸|水面|江面|河岸|亲水|码头|岸线/,
    images: ['/assets/xhs-examples/water-rail.jpg', '/assets/xhs-examples/water-rail-v2.jpg', '/assets/xhs-examples/stone-rail-v2.jpg'],
    label: '水边直拍'
  },
  {
    pattern: /山野|山峰|远山|峰林|观景台|远望|草地|云海|沙漠|沙丘|高原|人小景大/,
    image: '/assets/xhs-examples/mountain-wide.jpg',
    label: '山野直拍'
  },
  {
    pattern: /墙|红墙|门窗|侧身|墙面|建筑立面/,
    images: ['/assets/xhs-examples/wall-halfbody.jpg', '/assets/xhs-examples/wall-halfbody-v2.jpg'],
    label: '墙边直拍'
  },
  {
    pattern: /半身|人像|侧脸|回头/,
    images: ['/assets/xhs-examples/wall-halfbody.jpg', '/assets/xhs-examples/wall-halfbody-v2.jpg', '/assets/xhs-examples/stone-rail-v2.jpg'],
    label: '人像直拍'
  }
];

function stableHash(value) {
  return String(value || '').split('').reduce((hash, char) => (
    ((hash << 5) - hash + char.charCodeAt(0)) >>> 0
  ), 0);
}

function pickVariant(item, seed) {
  const images = item.images || [item.image];
  return images[stableHash(seed) % images.length];
}

function getSceneText(location, spot, guide, defaultGuide) {
  return [
    location.name,
    location.desc,
    location.tip,
    location.type,
    location.time,
    location.angle,
    location.direction,
    location.result,
    location.stand,
    location.action,
    location.cue,
    guide.angle,
    guide.direction,
    guide.result,
    guide.stand,
    guide.action,
    defaultGuide.result,
    defaultGuide.stand,
    defaultGuide.action,
    spot.name,
    spot.badge
  ].filter(Boolean).join(' ');
}

function pickSceneCase(location, spot, guide, defaultGuide) {
  const nameText = [location.name, location.type, location.cue].filter(Boolean).join(' ');
  const nameMatched = SCENE_NAME_CASE_IMAGES.find((item) => item.pattern.test(nameText));

  if (nameMatched) {
    return {
      image: pickVariant(nameMatched, `${spot.id}-${location.name}`),
      label: nameMatched.label,
      dedicated: false
    };
  }

  const sceneText = getSceneText(location, spot, guide, defaultGuide);
  const matched = SCENE_CASE_IMAGES.find((item) => item.pattern.test(sceneText));

  if (matched) {
    return {
      image: pickVariant(matched, `${spot.id}-${location.name}-${location.desc}`),
      label: matched.label,
      dedicated: false
    };
  }

  return {
    image: '/assets/xhs-examples/street-walk.jpg',
    label: '直拍参考',
    dedicated: false
  };
}

function parseDistanceKm(distanceText) {
  const match = String(distanceText || '').match(/([\d.]+)\s*公?里/);
  return match ? Number(match[1]) : 0;
}

function splitDistance(totalDistanceKm, count) {
  if (!totalDistanceKm || count <= 1) return '';
  const segment = totalDistanceKm / (count - 1);
  return `${segment.toFixed(1)}km`;
}

function splitWalkMinutes(totalDistanceKm, count) {
  if (!totalDistanceKm || count <= 1) return '';
  const segment = totalDistanceKm / (count - 1);
  const minutes = Math.max(3, Math.round((segment / 5) * 60));
  return `${minutes}分钟`;
}

function parseRouteMeta(spot) {
  const location = String(spot.location || '');
  const match = location.match(/（([^，）]+)，([^）]+)）/);

  if (match) {
    return {
      distanceText: match[1],
      durationText: match[2]
    };
  }

  return {
    distanceText: spot.routeDistance || '约 3 公里',
    durationText: spot.routeDuration || '2.5-3 小时'
  };
}

function buildRouteMap(spot) {
  if (spot.badge !== 'Citywalk') return null;

  const routeMeta = parseRouteMeta(spot);
  const totalDistanceKm = parseDistanceKm(routeMeta.distanceText);
  const locations = spot.locations || [];
  const nodes = locations.map((location, index) => ({
    no: index + 1,
    name: String(location.name || '').replace(/^\d+\.\s*/, ''),
    type: location.type || (index === 0 ? '起点' : (index === locations.length - 1 ? '终点' : '途经点')),
    desc: location.desc || '',
    segmentText: index === 0 ? '' : splitDistance(totalDistanceKm, locations.length),
    segmentTimeText: index === 0 ? '' : splitWalkMinutes(totalDistanceKm, locations.length),
    side: index % 2 === 0 ? 'left' : 'right'
  }));

  return {
    title: `${spot.city} Citywalk 路线图`,
    start: nodes[0] ? nodes[0].name : spot.city,
    end: nodes[nodes.length - 1] ? nodes[nodes.length - 1].name : spot.city,
    distanceText: routeMeta.distanceText,
    durationText: routeMeta.durationText,
    stopCount: nodes.length,
    nodes
  };
}

const LOCATION_CASES = {
  西北角楼河岸: {
    angle: '河岸低机位，镜头离水面约 80cm',
    lens: '2x 长焦 / 70mm 等效',
    direction: '面向角楼斜 30 度，水面占下半幅',
    example: '示例：人物站右下三分线，角楼倒影完整落在画面中心。',
    result: '拍出角楼、护城河和倒影同框的人小景大封面。',
    stand: '人站在河岸右下三分线，别挡住角楼和倒影。',
    action: '手机放低到腰部以下，用 2x 先对角楼构图，再让人进入画面。',
    diagramNote: '低机位看倒影，人物只做画面锚点。',
    visual: 'palace',
    pose: 'lower-right',
    cue: '右下三分线'
  },
  筒子河北侧树影: {
    angle: '树枝前景贴近镜头，人物离镜头 4-6 米',
    lens: '人像模式 / 50mm 等效',
    direction: '顺着河岸侧拍，人物轻微回头',
    example: '示例：前景树影虚化，红墙和角楼保持清晰轮廓。',
    result: '拍出树影遮挡的旅行杂志感，画面比正面照更有层次。',
    stand: '人离树枝 4-6 米，站在树影后方的亮处。',
    action: '让树枝贴近镜头边缘，点按人物对焦，背景保持可辨认。',
    diagramNote: '前景贴镜头虚化，人物和地标分成前中后三层。',
    visual: 'palace',
    pose: 'side-look',
    cue: '树影前景'
  },
  神武门外红墙: {
    angle: '正侧 15 度，保持墙线水平',
    lens: '1x 标准镜头',
    direction: '人物离墙 1 米，身体朝光源侧转',
    example: '示例：红墙占满背景，人物在画面左侧留出呼吸感。',
    result: '拍出干净红墙人像，重点是人物和墙面颜色对比。',
    stand: '人离墙至少 1 米，站左侧，右边留出一整块墙面。',
    action: '保持手机水平，人物侧身 30 度，脸朝有光的一边。',
    diagramNote: '墙当纯背景，留白比站正中更高级。',
    visual: 'wall',
    pose: 'left-wall',
    cue: '侧身留白'
  },
  外白渡桥南侧: {
    angle: '桥面斜线入画，镜头略低于胸口',
    lens: '1x 广角 / 夜景模式',
    direction: '人物站桥侧 45 度，天际线放在肩后',
    example: '示例：桥梁线条指向陆家嘴，车流灯光做背景层次。',
    result: '拍出桥梁线条把视线带向城市天际线的夜景大片。',
    stand: '人站桥侧，不要站正中，把栏杆斜线让出来。',
    action: '打开夜景模式，手机略低，等人流间隙连拍 3 张。',
    diagramNote: '桥线负责引导，人物只占一侧。',
    visual: 'city',
    pose: 'bridge-45',
    cue: '桥线引导'
  },
  北京东路口江堤: {
    angle: '江堤平视横构图',
    lens: '2x 人像 / 曝光 -0.3',
    direction: '人物面向江风，背景保留完整灯带',
    example: '示例：人物半身在右侧，黄浦江灯光铺满左侧。',
    result: '拍出半身人像加江面灯带，适合头像和笔记封面。',
    stand: '人靠右侧栏杆，脸朝江面或补光方向。',
    action: '用 2x 拍半身，曝光下拉一点，保住背景灯光细节。',
    diagramNote: '右侧拍人，左侧留给江面和灯带。',
    visual: 'city',
    pose: 'half-right',
    cue: '半身右侧'
  },
  海关大楼对街: {
    angle: '街对面仰拍 10 度',
    lens: '2x 长焦',
    direction: '人物靠近斑马线边缘，钟楼在头顶后方',
    example: '示例：建筑立面压缩成复古背景，人物只占画面三分之一。',
    result: '拍出复古建筑压缩感，人小一点更像城市海报。',
    stand: '人站街对面安全区域，建筑主体完整露出来。',
    action: '用 2x 或 3x，摄影者后退，等车流空档按快门。',
    diagramNote: '长焦压缩建筑，人物不要挡住主体立面。',
    visual: 'city',
    pose: 'small-center',
    cue: '小比例人像'
  },
  断桥东侧湖岸: {
    angle: '湖岸低机位，桥线横向铺开',
    lens: '1x 标准 / 保持水平',
    direction: '人物坐岸边或侧身站立，避开桥上人群',
    example: '示例：湖面留白占一半，断桥和远山只做轻背景。',
    result: '拍出江南湖面留白，画面安静、干净、不拥挤。',
    stand: '人坐或站在湖岸一侧，桥放远处，不要贴画面边。',
    action: '打开网格线，把水平线放上三分之一，湖面留够一半。',
    diagramNote: '大面积湖面留白，人物只占一角。',
    visual: 'lake',
    pose: 'seated-left',
    cue: '湖面留白'
  },
  北山街梧桐下: {
    angle: '树干贴边做遮挡，镜头平视',
    lens: '2x 人像',
    direction: '顺着北山街慢走，头微微看向湖面',
    example: '示例：树影在画面边缘，人物和湖景同框不拥挤。',
    result: '拍出梧桐树影下的松弛街拍，比站定合影更自然。',
    stand: '人沿树荫边缘慢走，脸转向湖面或镜头外侧。',
    action: '用 2x 连拍，摄影者站路侧，让树干贴画面边缘。',
    diagramNote: '树干做前景，人物慢走经过。',
    visual: 'lake',
    pose: 'walk-look',
    cue: '边走回望'
  },
  白堤入口石阶: {
    angle: '台阶下方向上拍 8-12 度',
    lens: '1x 标准',
    direction: '人物沿阶梯侧身上行，脚步放慢',
    example: '示例：台阶线条带出纵深，人物背影轻轻进入画面。',
    result: '拍出台阶向上延伸的旅行感，像正在走进景区。',
    stand: '人走在台阶一侧，留出中间线条。',
    action: '摄影者站低一级，手机略向上，抓回头或背影。',
    diagramNote: '台阶制造纵深，人放在线条旁边。',
    visual: 'steps',
    pose: 'stairs-back',
    cue: '背影上行'
  },
  才村码头木栈道: {
    angle: '栈道尽头回拍，线条从脚边延伸',
    lens: '1x 广角',
    direction: '人物面向风来方向，身体不要正对镜头',
    example: '示例：木栈道作引导线，洱海和苍山留在上半幅。',
    result: '拍出栈道通向洱海的开阔感，风景比人物更重要。',
    stand: '人站栈道尽头或中轴偏侧，面向风来的方向。',
    action: '用 1x 广角，手机保持水平，让栈道线条从脚边延伸。',
    diagramNote: '栈道线条从脚下通向远方。',
    visual: 'sea',
    pose: 'boardwalk',
    cue: '栈道尽头'
  },
  龙龛码头孤树: {
    angle: '树冠完整入画，人物站树影边缘',
    lens: '2x 长焦',
    direction: '树、人物、湖面分三层摆放',
    example: '示例：孤树在左，人物在右，湖面形成干净底色。',
    result: '拍出孤树、人物、湖面的三层关系，画面更有故事。',
    stand: '人站树影边缘，不要贴着树干，和树拉开一点距离。',
    action: '用 2x 后退拍，让树和人分开，湖面做干净背景。',
    diagramNote: '树在一边，人站另一边，湖面做底色。',
    visual: 'sea',
    pose: 'tree-right',
    cue: '树人分层'
  },
  廊道弯月湖岸: {
    angle: '沿湖岸弧线横拍',
    lens: '1x 标准',
    direction: '人物放在弧线终点，面向水面',
    example: '示例：岸线像箭头一样把视线带到人物身上。',
    result: '拍出岸线弯向人物的引导感，适合安静背影照。',
    stand: '人站在岸线转弯处，面对水面。',
    action: '沿湖岸横拍，把弧线完整放进画面下方。',
    diagramNote: '弧线终点就是人物站位。',
    visual: 'sea',
    pose: 'curve-end',
    cue: '弧线终点'
  },
  千厮门大桥人行道: {
    angle: '桥内侧平视，护栏只保留底部',
    lens: '1x 夜景 / 稳定 2 秒',
    direction: '人物靠桥内侧，洪崖洞在斜后方',
    example: '示例：桥梁结构框住洪崖洞，江面反光垫在下方。',
    result: '拍出桥梁框住洪崖洞的层次，山城夜景更立体。',
    stand: '人靠桥内侧站，洪崖洞放斜后方，不要挡住灯楼。',
    action: '夜景模式稳定 2 秒，先对亮楼曝光，再让人物保持不动。',
    diagramNote: '用桥当画框，背景灯楼放框里。',
    visual: 'night',
    pose: 'bridge-frame',
    cue: '框住背景'
  },
  嘉滨路对岸: {
    angle: '江对岸远景，人物小比例',
    lens: '2x 长焦 / 夜景',
    direction: '人物站路灯侧，建筑灯光占满背景',
    example: '示例：人像只占 20%，吊脚楼灯光成为主视觉。',
    result: '拍出人小景大的山城灯海，适合做旅行封面。',
    stand: '人站路灯或栏杆旁，身体面对洪崖洞方向。',
    action: '用 2x 拉近背景，人物保持小比例，曝光别拉太亮。',
    diagramNote: '人缩小，灯楼变成主角。',
    visual: 'night',
    pose: 'night-small',
    cue: '人小景大'
  },
  戴家巷步道: {
    angle: '楼梯转角斜拍',
    lens: '1x 标准',
    direction: '人物侧身上楼，脸朝灯光方向',
    example: '示例：楼梯线条切出山城层次，背后灯光做氛围。',
    result: '拍出山城楼梯的高低错落，比正面站拍更有动线。',
    stand: '人走在楼梯侧边，脸朝有灯的方向。',
    action: '摄影者站在下一级斜拍，连拍上楼和回头两个动作。',
    diagramNote: '楼梯线条带路，人顺着线条走。',
    visual: 'steps',
    pose: 'steps-side',
    cue: '楼梯侧身'
  },
  日光岩观景台: {
    angle: '观景台俯拍，海湾放在远处',
    lens: '0.5x/1x 广角',
    direction: '人物靠栏杆侧边，避开遮挡海岸线',
    example: '示例：红瓦房顶形成纹理，人物只做前景标记。',
    result: '拍出红瓦屋顶和海湾全景，人物只是旅行坐标。',
    stand: '人靠栏杆一侧，别站在正中挡住海岸线。',
    action: '用 0.5x 或 1x，先框住海湾，再把人物放下方角落。',
    diagramNote: '俯拍全景，人物做小小前景。',
    visual: 'island',
    pose: 'overlook',
    cue: '栏杆前景'
  },
  晃岩路坡道: {
    angle: '坡道下方回拍，机位略低',
    lens: '1x 标准',
    direction: '人物慢走回头，建筑和花墙贴边',
    example: '示例：坡道线条向上延伸，照片像电影过场。',
    result: '拍出坡道向上的电影感，适合边走边回头。',
    stand: '人从坡道中段往上走，身体别正对镜头。',
    action: '摄影者站坡道下方，连拍慢走和回头。',
    diagramNote: '坡道是动线，人沿着坡道走。',
    visual: 'island',
    pose: 'slope-walk',
    cue: '慢走回头'
  },
  菽庄花园海边: {
    angle: '侧逆光平视，海平线保持水平',
    lens: '2x 人像',
    direction: '人物站海边阴影边缘，脸朝反光面',
    example: '示例：海浪在下方留白，发丝被日落光勾出来。',
    result: '拍出发丝发亮的海边逆光，人像更柔和。',
    stand: '人站阴影边缘，脸转向海面反光，不要背光死黑。',
    action: '用 2x 人像，点脸部对焦，曝光略降保住天空。',
    diagramNote: '太阳在侧后方，海面负责补脸。',
    visual: 'sea',
    pose: 'backlight',
    cue: '侧逆光'
  }
};

const DEFAULT_GUIDES = {
  远景: {
    result: '拍出人小景大的旅行封面，让地标或风景先被看见。',
    stand: '人站在画面下方三分之一处，避开主体正中心。',
    action: '打开网格线，先把地标放稳，再让人物进入边缘位置。',
    diagramNote: '人物小一点，景物才有尺度感。'
  },
  人像: {
    result: '拍出清楚的人像和可识别的目的地背景。',
    stand: '人离背景 1 米以上，身体侧转 30 度，脸朝亮的一边。',
    action: '用 1x 或 2x，先点脸对焦，再微调背景不要穿头。',
    diagramNote: '人物和背景分开，脸部优先清楚。'
  },
  近景: {
    result: '拍出门窗、树枝或花墙包住人物的杂志感。',
    stand: '人站在前景后方，露出脸和上半身即可。',
    action: '把前景贴近镜头边缘，点人物对焦，让前景自然虚化。',
    diagramNote: '前景靠近镜头，主体保持清晰。'
  },
  街拍: {
    result: '拍出正在旅行的抓拍感，动作比站定更自然。',
    stand: '人沿道路、桥面或街边慢走，头可以轻轻回看。',
    action: '用连拍抓 3-5 张，选择手脚最自然的一张。',
    diagramNote: '线条给方向，人顺着方向走。'
  },
  夜景: {
    result: '拍出灯光背景和清楚人脸，不让夜景糊成一片。',
    stand: '人靠近路灯、橱窗或栏杆，脸朝补光方向。',
    action: '开夜景模式，曝光下拉一点，按下后保持 2 秒不动。',
    diagramNote: '灯光做背景，补光照脸。'
  },
  小众: {
    result: '拍出安静、不像游客照的路线感。',
    stand: '人站在线条终点或画面一侧，把环境留出来。',
    action: '先拍一张空景找线条，再让人物进入线条终点。',
    diagramNote: '先找线条，再放人物。'
  },
  动态: {
    result: '拍出正在走进风景里的动态感。',
    stand: '人沿步道、台阶或岸线慢走，身体不要僵硬看镜头。',
    action: '摄影者站低一点连拍，抓回头、迈步或衣摆摆动。',
    diagramNote: '人在动线上，画面更像旅途。'
  }
};

function enrichSpot(spot) {
  const enriched = {
    ...spot,
    locations: spot.locations.map((location) => {
      const guide = LOCATION_CASES[location.name] || {};
      const defaultGuide = DEFAULT_GUIDES[location.type] || DEFAULT_GUIDES.人像;
      const sceneCase = pickSceneCase(location, spot, guide, defaultGuide);
      return {
        ...location,
        angle: guide.angle || location.angle || '先找最明显的线条或主体，再决定人物站位',
        lens: guide.lens || location.lens || '1x 标准镜头',
        direction: guide.direction || location.direction || '人物不要挡住地标主体，和背景错开站',
        example: guide.example || location.example || '示例：人物和地标错开，保留前景、中景、背景三层。',
        result: guide.result || location.result || defaultGuide.result,
        stand: guide.stand || location.stand || defaultGuide.stand,
        action: guide.action || location.action || defaultGuide.action,
        visual: guide.visual || location.visual || spot.kind || 'city',
        pose: guide.pose || location.pose || 'small-center',
        cue: guide.cue || location.cue || '看站位示意',
        diagramNote: guide.diagramNote || location.diagramNote || defaultGuide.diagramNote,
        caseImage: sceneCase.image,
        hasCaseImage: Boolean(sceneCase.image),
        hasDedicatedCaseImage: sceneCase.dedicated,
        caseImageCredit: sceneCase.dedicated ? (location.caseImageCredit || spot.coverCredit || '') : '',
        caseSourceName: location.caseSourceName || spot.sourceName || '',
        caseSourceLabel: sceneCase.label,
        caseSourceUrl: location.caseSourceUrl || spot.sourceUrl || '',
        caseStyle: `linear-gradient(135deg, ${spot.palette[1]} 0%, ${spot.palette[0]} 52%, ${spot.palette[2]} 100%)`
      };
    })
  };
  return {
    ...enriched,
    routeMap: buildRouteMap(enriched)
  };
}

Page({
  data: {
    ...getThemeState(),
    spot: null,
    isFavorite: false
  },

  onLoad(options) {
    getSpotById(options.id).then((spot) => {
      const enriched = enrichSpot(spot);
      wx.setNavigationBarTitle({ title: enriched.name });
      this.setData({ spot: enriched });
      recordSpotView(enriched);
      this.refreshFavorite();
    });
  },

  onShow() {
    this.setData(getThemeState());
    this.refreshFavorite();
  },

  refreshFavorite() {
    const spot = this.data.spot;
    if (!spot) return;
    const favoriteIds = (wx.getStorageSync('favoriteSpotIds') || []).map(String);
    this.setData({ isFavorite: favoriteIds.includes(String(spot.id)) });
  },

  toggleFavorite() {
    const { spot, isFavorite } = this.data;
    const spotId = String(spot.id);
    const current = (wx.getStorageSync('favoriteSpotIds') || []).map(String);
    const next = isFavorite ? current.filter((id) => id !== spotId) : current.concat(spotId);
    wx.setStorageSync('favoriteSpotIds', next);
    this.setData({ isFavorite: !isFavorite });
    wx.showToast({ title: isFavorite ? '已取消' : '已收藏', icon: 'success' });
  },

  navigateTo(event) {
    const index = Number(event.currentTarget.dataset.index);
    const { spot } = this.data;
    const target = spot.locations[index];
    const mapKeyword = target.mapKeyword || `${target.name} ${target.address || spot.location}`;
    const navText = [
      `${spot.name} / ${target.name}`,
      target.address || spot.location,
      `导航关键词：${mapKeyword}`,
      `拍摄角度：${target.angle}`
    ].filter(Boolean).join('\n');

    wx.showActionSheet({
      itemList: ['复制导航信息', '复制高德搜索链接', '复制百度搜索链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.copyText(navText);
        }

        if (res.tapIndex === 1) {
          this.copyText(`https://uri.amap.com/search?keyword=${encodeURIComponent(mapKeyword)}`);
        }

        if (res.tapIndex === 2) {
          this.copyText(`https://map.baidu.com/search/${encodeURIComponent(mapKeyword)}`);
        }
      }
    });
  },

  copyText(data) {
    wx.setClipboardData({
      data,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '复制失败，请重试', icon: 'none' });
      }
    });
  },

  onShareAppMessage() {
    const { spot } = this.data;
    const title = spot ? `${spot.name}：${spot.city}拍照机位指南` : '追光旅迹：旅行拍照机位指南';
    const path = spot ? `/pages/spot-detail/spot-detail?id=${spot.id}` : '/pages/index/index';

    return {
      title,
      path,
      imageUrl: spot && spot.coverImage ? spot.coverImage : '/assets/spots/shanghai-bund-ai.jpg'
    };
  },

  onShareTimeline() {
    const { spot } = this.data;
    return {
      title: spot ? `${spot.name}：${spot.city}拍照机位指南` : '追光旅迹：全国旅行拍照机位与姿势指南',
      query: spot ? `id=${spot.id}` : '',
      imageUrl: spot && spot.coverImage ? spot.coverImage : '/assets/spots/shanghai-bund-ai.jpg'
    };
  }
});
