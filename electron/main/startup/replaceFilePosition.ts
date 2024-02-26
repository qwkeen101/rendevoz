// 将原本存放在软件根目录下的文件移动到文档下
import * as Electron from 'electron'
import fs from 'fs'
import path from 'path'

export default (app: Electron.App) => {
  const p = app.getPath('appData')
  console.log(p)
  const documentsP = path.resolve(app.getPath('documents'), 'rendevoz')
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
