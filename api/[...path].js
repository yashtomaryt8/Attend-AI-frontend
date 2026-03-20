// frontend/api/[...path].js
// Vercel serverless function — proxies ALL requests to Railway backend
// Supports GET, POST, DELETE, multipart file uploads, everything.

const RAILWAY = 'https://web-production-de43d.up.railway.app';

export const config = {
  api: {
    bodyParser: false,     // must be false — we stream the raw body as-is
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  // Build the target URL from the request path
  // req.url will be like /api/scan/ → we forward to Railway /api/scan/
  const targetUrl = `${RAILWAY}${req.url}`;

  // Copy all incoming headers except host
  const headers = {};
  for (const [key, val] of Object.entries(req.headers)) {
    if (key.toLowerCase() === 'host') continue;
    headers[key] = val;
  }

  try {
    // Stream the raw request body directly to Railway
    const upstream = await fetch(targetUrl, {
      method:  req.method,
      headers: headers,
      body:    req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
      // @ts-ignore — duplex needed for streaming body in Node 18+
      duplex:  'half',
    });

    // Forward status + headers back to client
    res.status(upstream.status);
    upstream.headers.forEach((val, key) => {
      // Skip headers that cause issues
      if (['transfer-encoding', 'connection'].includes(key.toLowerCase())) return;
      res.setHeader(key, val);
    });

    // Always add CORS headers
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');

    // Stream response body back
    const buffer = await upstream.arrayBuffer();
    res.end(Buffer.from(buffer));

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Proxy failed', detail: err.message });
  }
}
