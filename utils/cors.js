export function allowCors(handler) {
  return async (req, res) => {
    const allowedOrigins = [
      'https://chvapps.in',
      'https://www.chvapps.in',
      'https://chvapps-admin.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    try {
      return await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: error.message
      });
    }
  };
}