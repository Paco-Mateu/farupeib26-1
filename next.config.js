/** @type {import('next').NextConfig} */
const backendBaseUrl =
  process.env.INTERNAL_BACKEND_URL ||
  `http://127.0.0.1:${process.env.BACKEND_PORT || "8001"}`;

const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? `${backendBaseUrl}/api/:path*`
            : "/api/",
      },
      {
        source: "/docs",
        destination:
          process.env.NODE_ENV === "development"
            ? `${backendBaseUrl}/docs`
            : "/api/docs",
      },
      {
        source: "/openapi.json",
        destination:
          process.env.NODE_ENV === "development"
            ? `${backendBaseUrl}/openapi.json`
            : "/api/openapi.json",
      },
    ];
  },
};

module.exports = nextConfig;
