// Vercel Serverless Proxy — CommonJS (required for CRA projects)
// Forwards ALL requests including POST + multipart file uploads to Railway

const RAILWAY = 'https://web-production-de43d.up.railway.app';

// Required: tell Vercel not to parse the body so we can forward it raw
module.exports.config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

module.exports.default = async function handler(req, res) {
  const targetUrl = `${RAILWAY}${req.url}`;

  // Read raw body into a buffer
  const bodyBuffer = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  // Forward all headers except host
  const forwardHeaders = {};
  for (const [key, val] of Object.entries(req.headers)) {
    if (key.toLowerCase() === 'host') continue;
    forwardHeaders[key] = val;
  }

  try {
    const upstream = await fetch(targetUrl, {
      method:  req.method,
      headers: forwardHeaders,
      body:    ['GET', 'HEAD'].includes(req.method) ? undefined : bodyBuffer,
    });

    // CORS headers — always
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');

    // Forward response headers from Railway
    upstream.headers.forEach((val, key) => {
      if (['transfer-encoding', 'connection', 'keep-alive'].includes(key.toLowerCase())) return;
      res.setHeader(key, val);
    });

    res.status(upstream.status);

    const responseBuffer = Buffer.from(await upstream.arrayBuffer());
    res.end(responseBuffer);

  } catch (err) {
    console.error('[proxy] error:', err.message);
    res.status(502).json({ error: 'Proxy error', detail: err.message });
  }
};
