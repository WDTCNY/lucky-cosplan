 /**
  * Inline vitest runner – uses programmatic API with configFile: false
  * to avoid esbuild spawn EPERM on Windows sandbox.
  */
 import { startVitest } from 'vitest/node'
 import { resolve } from 'path'
 import { fileURLToPath } from 'url'
 
 const __dirname = fileURLToPath(new URL('.', import.meta.url))
 
 const config = {
   configFile: false,
   resolve: {
     alias: {
       '@': resolve(__dirname, 'src'),
     },
   },
   test: {
     environment: 'happy-dom',
     setupFiles: [resolve(__dirname, 'src/test-setup.ts')],
     include: ['src/**/*.spec.ts'],
     root: __dirname,
   },
 }
 
 try {
   const vitest = await startVitest('test', undefined, config)
   process.exit(vitest ? 0 : 1)
 } catch (e) {
   console.error(e)
   process.exit(1)
 }
