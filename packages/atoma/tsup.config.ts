import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts', 'src/adapters/index.ts', 'src/hooks/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: ['react', 'jotai', 'immer', 'dexie', 'lodash']
})
