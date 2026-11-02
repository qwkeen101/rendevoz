// Loads the main process's native modules out of a packaged app.asar using
// the packaged Electron itself (ELECTRON_RUN_AS_NODE=1), so a missing module
// or a binary built for the wrong ABI fails here instead of on users' machines.
//   ELECTRON_RUN_AS_NODE=1 Rendevoz.exe check-native.cjs <path to app.asar>
const path = require('path')

const asar = process.argv[2]
if (!asar) {
  console.error('usage: check-native.cjs <path to app.asar>')
  process.exit(2)
}
for (const name of ['usearch', 'onnxruntime-node', 'sharp']) {
  try {
    require(path.join(path.resolve(asar), 'node_modules', name))
    console.log('ok  ', name)
  } catch (e) {
    console.error('FAIL', name, '-', e.message)
    process.exitCode = 1
  }
}
