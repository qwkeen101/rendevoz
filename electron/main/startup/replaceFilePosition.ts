// 将原本存放在软件根目录下的文件移动到文档下
import * as Electron from 'electron'
import fs from 'fs'
import path from 'path'

export default (app: Electron.App) => {
  const originalAppPath =
    process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share')

  const p = fs.existsSync(path.resolve(originalAppPath, 'Rendevoz'))
    ? path.resolve(originalAppPath, 'Rendevoz')
    : path.resolve(originalAppPath, 'rendevoz')
  const documentsP = path.resolve(app.getPath('documents'), 'Rendevoz')
  if (!fs.existsSync(documentsP)) {
    fs.mkdirSync(documentsP)
  }
  if (fs.existsSync(path.resolve(p, 'files'))) {
    fs.renameSync(path.resolve(p, 'files'), path.resolve(documentsP, 'files'))
  }
  if (fs.existsSync(path.resolve(p, 'backup'))) {
    fs.renameSync(path.resolve(p, 'backup'), path.resolve(documentsP, 'backup'))
  }
  if (fs.existsSync(path.resolve(p, 'imgs'))) {
    fs.renameSync(path.resolve(p, 'imgs'), path.resolve(documentsP, 'imgs'))
  }
}
