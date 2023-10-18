import callback from './callback'
import { BrowserWindow, dialog } from 'electron'
import fs from 'fs'

callback(
  'printPDF',
  async (
    options: { name?: string; size?: string; margin?: 'default' | 'none'; horizontal?: boolean } = {
      name: 'Untitled',
      size: 'A4',
      margin: 'default',
      horizontal: false
    }
  ) => {
    const pdf = await BrowserWindow.getAllWindows()
      .map(i => i.webContents)
      .find(i => i.getTitle().includes('PDF'))
      .printToPDF?.({
        printBackground: true,
        pageSize: options.size,
        landscape: options.horizontal,
        margins: {
          marginType: options.margin
        }
      })

    const pos = await dialog.showSaveDialog({
      defaultPath: `${options.name}.pdf`,
      title: 'Save PDF'
    })
    if (pos.filePath) {
      await new Promise(res => {
        fs.writeFile(pos.filePath, pdf, {}, () => {
          res(true)
        })
      })
      return 'OK'
    }
    return 'Cancel'
  }
)
