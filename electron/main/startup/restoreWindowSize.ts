import { BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
export default (win: BrowserWindow) => {
  const getConfig = () => {
    const p = path.resolve(__dirname, 'windowConfig.json')
    const hasFile = fs.existsSync(p)
    if (!hasFile) {
      return {}
    } else {
      const file = fs.readFileSync(p, 'utf8')
      try {
        return JSON.parse(file)
      } catch (e) {
        return {}
      }
    }
  }
  const config = getConfig()
  if (config.max) {
    win.maximize()
  }
  if (config.size) {
    win.setSize(config.size[0], config.size[1])
  }
  if (config.position) {
    win.setPosition(config.position[0], config.position[1])
  }
  if (config.fullScreen) {
    win.setFullScreen(true)
  }
  const writeConfig = (config: any) => {
    const p = path.resolve(__dirname, 'windowConfig.json')
    fs.writeFileSync(p, JSON.stringify(config), 'utf8')
  }
  win.on('move', () => {
    const currConfig = getConfig()
    const position = win.getPosition()
    currConfig.position = position
    writeConfig(currConfig)
  })
  win.on('resize', () => {
    const currConfig = getConfig()
    const size = win.getSize()
    currConfig.size = size
    writeConfig(currConfig)
  })
  win.on('enter-full-screen', () => {
    const currConfig = getConfig()
    currConfig.fullScreen = true
    writeConfig(currConfig)
  })
  win.on('leave-full-screen', () => {
    const currConfig = getConfig()
    currConfig.fullScreen = false
    writeConfig(currConfig)
  })
  win.on('maximize', () => {
    const currConfig = getConfig()
    currConfig.max = true
    writeConfig(currConfig)
  })
  win.on('unmaximize', () => {
    const currConfig = getConfig()
    currConfig.max = false
    writeConfig(currConfig)
  })
}
