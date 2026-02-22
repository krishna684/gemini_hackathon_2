// Next.js configuration for Socratic Mirror hackathon project.
/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        // Allow importing GLSL shaders
        config.module.rules.push({
            test: /\.(glsl|vs|fs|vert|frag)$/,
            exclude: /node_modules/,
            use: ['raw-loader'],
        });

        return config;
    },
    // Enable CORS for WebSocket connections
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Content-Type, Authorization' },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
