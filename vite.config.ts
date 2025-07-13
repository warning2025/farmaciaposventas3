import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // Importar el plugin de React

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [
        react({
          jsxRuntime: 'automatic' // Cambiar a 'automatic' para React 17+
        })
      ], // Usar el plugin de React
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        include: ['html5-qrcode'],
      },
      build: {
        commonjsOptions: {
          include: [/node_modules/],
          transformMixedEsModules: true, // Intentar transformar módulos mixtos
        },
        rollupOptions: {
          external: ['html5-qrcode'], // Externalizar html5-qrcode
          // Externalizar qrcode.react si sigue dando problemas, aunque ya lo importamos como QRCodeSVG
          // external: ['qrcode.react'],
          // output: {
          //   globals: {
          //     'qrcode.react': 'QRCodeReact',
          //   },
          // },
        },
      },
    };
});
