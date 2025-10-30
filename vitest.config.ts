import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
    plugins: [angular()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['src/test/setup.ts'],  // ← Cambiá esta línea
        include: ['**/*.spec.ts'],
    },
    resolve: {
        alias: {
            '@app': '/src/app',
        }
    }
});