const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://api.weather.yandex.ru',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // убирает /api из пути
      },
    })
  );
};
