import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
            animation: {
                'shimmer': 'shimmer 3s linear infinite',
                'fadeIn': 'fadeIn 0.6s ease-out',
                'slideIn': 'slideIn 0.4s ease-out',
                'waveform': 'waveform 1s ease-in-out infinite',
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '0% center' },
                    '100%': { backgroundPosition: '200% center' },
                },
                fadeIn: {
                    from: {
                        opacity: '0',
                        transform: 'translateY(20px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
                slideIn: {
                    from: {
                        opacity: '0',
                        transform: 'translateX(-20px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateX(0)',
                    },
                },
                waveform: {
                    '0%, 100%': {
                        height: '30%',
                    },
                    '50%': {
                        height: '100%',
                    },
                },
            },
        },
    },
    plugins: [],
};

export default config;
