import callback from './callback'
import fs from 'fs'

callback('installPlugins', async (pluginPath: string) => {
  if (fs.existsSync(pluginPath)) {
    const allPluginsFolders = fs.readdirSync(pluginPath)
    const installablePluginsPaths = allPluginsFolders
      .map(i => {
        console.log(i)
        try {
          const fileNames = fs.readdirSync(`${pluginPath}/${i}`)
          if (fileNames.includes('manifest.json') && fileNames.includes('main.js')) {
            const manifest = fs.readFileSync(`${pluginPath}/${i}/manifest.json`, 'utf-8')
            const parsedManifest = JSON.parse(manifest)
            return {
              name: parsedManifest.name,
              version: parsedManifest.version,
              author: parsedManifest.author,
              entry: `${pluginPath}/${i}/main.js`
            }
          }
        } catch (e) {
          console.log(e)
        }
      })
      .filter(i => i)
    return installablePluginsPaths
  }
})
