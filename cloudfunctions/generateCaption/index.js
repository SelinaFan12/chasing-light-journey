const https = require('https');

const ARK_BASE_URL = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const DEFAULT_MODEL = 'doubao-seed-2-0-pro-260215';
const REQUEST_TIMEOUT = 25000;

function buildFallbackCaptions(keyword, style) {
  return [
    `${keyword}，把今天交给光。`,
    `路过${keyword}，也路过一段好天气。`,
    `${style}一点，和${keyword}一起入镜。`
  ];
}

function requestArk(payload) {
  const apiKey = process.env.ARK_API_KEY;
  const model = process.env.ARK_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error('请先配置云函数环境变量 ARK_API_KEY');
  }

  const body = JSON.stringify({
    model,
    input: payload.input,
    temperature: 0.7,
    max_output_tokens: 800,
    thinking: {
      type: 'disabled'
    }
  });

  const url = new URL(`${ARK_BASE_URL}/responses`);

  return new Promise((resolve, reject) => {
    const req = https.request({
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let raw = '';

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        let data;

        try {
          data = JSON.parse(raw);
        } catch (error) {
          reject(new Error('豆包返回内容解析失败'));
          return;
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(data.error && data.error.message ? data.error.message : '豆包请求失败'));
          return;
        }

        resolve(data);
      });
    });

    req.setTimeout(REQUEST_TIMEOUT, () => {
      req.destroy(new Error('豆包请求超时，请检查模型权限或稍后重试'));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseCaptions(content) {
  return String(content || '')
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(\d+[.)、]|[-*])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

function getResponseText(data) {
  if (typeof data.output_text === 'string') {
    return data.output_text;
  }

  if (Array.isArray(data.output)) {
    return data.output.map((item) => {
      if (typeof item.content === 'string') {
        return item.content;
      }

      if (Array.isArray(item.content)) {
        return item.content.map((contentItem) => (
          contentItem.text || contentItem.output_text || ''
        )).join('\n');
      }

      return '';
    }).filter(Boolean).join('\n');
  }

  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content || '';
  }

  return collectText(data).join('\n');
}

function collectText(value) {
  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectText);
  }

  if (typeof value !== 'object') {
    return [];
  }

  const pieces = [];
  const textKeys = ['text', 'output_text'];

  textKeys.forEach((key) => {
    if (typeof value[key] === 'string' && value[key].trim()) {
      pieces.push(value[key].trim());
    }
  });

  if (typeof value.content === 'string' && value.content.trim()) {
    pieces.push(value.content.trim());
  }

  Object.keys(value).forEach((key) => {
    if (['id', 'model', 'role', 'status', 'type', 'created_at'].includes(key)) {
      return;
    }

    if (typeof value[key] === 'object') {
      pieces.push(...collectText(value[key]));
    }
  });

  return pieces;
}

exports.main = async (event) => {
  const keyword = String(event.keyword || '旅行').trim().slice(0, 30);
  const style = String(event.style || '文艺').trim().slice(0, 12);

  try {
    const data = await requestArk({
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `关键词：${keyword}；风格：${style}。生成3条适合朋友圈/小红书的中文旅行摄影短文案，每条28字以内，每条单独一行，只输出文案。`
            }
          ]
        }
      ]
    });

    const content = getResponseText(data);
    const captions = parseCaptions(content);

    if (!captions.length) {
      return {
        ok: false,
        source: 'fallback',
        error: '豆包没有返回可用文案',
        raw: JSON.stringify(data).slice(0, 1200),
        captions: buildFallbackCaptions(keyword, style)
      };
    }

    return {
      ok: true,
      source: 'doubao',
      captions,
      raw: content
    };
  } catch (error) {
    return {
      ok: false,
      source: 'fallback',
      error: error.message || '豆包调用失败',
      captions: buildFallbackCaptions(keyword, style)
    };
  }
};
