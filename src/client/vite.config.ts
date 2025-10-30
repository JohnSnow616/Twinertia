import { defineConfig } from 'vite';

export default defineConfig({
  base: "/Twinertia/",L
}); => {
  return {
    build: {
      outDir: '../../dist/client',
      sourcemap: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            phaser: ['phaser'],
          },
        },
      },
      ...(mode === 'production' && {
        minify: 'terser',
        terserOptions: {
          compress: {
            passes: 2,
          },
          mangle: true,
          format: {
            comments: false,
          },
        },
      }),
    },
  };
});
