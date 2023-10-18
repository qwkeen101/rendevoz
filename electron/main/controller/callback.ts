import { ipcMain } from 'electron'

const callback = (channel: string, cb: (...args: any[]) => Promise<any>) => {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      const result = await cb(...args)
      return {
        data: result
      }
    } catch (e) {
      console.log('ERROR:', e)
    }
  })
}

export default callback
