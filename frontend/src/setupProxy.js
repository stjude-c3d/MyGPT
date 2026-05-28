const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
	const target = process.env.REACT_APP_SJ_RAY_API || 'https://svltgpt01a.stjude.org/';
	app.use(
		'/sjray',
		createProxyMiddleware({
			target,
			changeOrigin: true,
			pathRewrite: { '^/sjray': '' },
			secure: false,
		})
	);
};
