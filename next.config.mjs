/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,

  // Firebase Auth, Google sign-in, and Next.js's inline bootstrap require the
  // listed origins and inline script/style allowances. Keep other capabilities
  // disabled by default.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js emits inline bootstrap scripts; Firebase and Google Auth
              // load their browser SDK/handler resources from these origins.
              "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.googleusercontent.com https://*.gstatic.com",
              "font-src 'self' data: https://*.gstatic.com",
              "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://*.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com https://*.gstatic.com https://accounts.google.com",
              "frame-src 'self' https://*.firebaseapp.com https://*.web.app https://accounts.google.com https://content.googleapis.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
              "frame-ancestors 'none'",
              ...(isProduction ? ['upgrade-insecure-requests'] : []),
            ].join('; '),
          },
          ...(isProduction
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
            : []),
        ],
      },
      // Cache static uploads
      {
        source: '/uploads/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
