import path from 'path'
import fs from 'fs'

export class VideoController {
  constructor() {}
  private cachedDir = {
    dirname: undefined,
    files: undefined,
    matchSubtitleFiles: undefined
  }
  // videoPath should be absolute
  public async getVideoSubtitle(videoPath: string) {
    const parsed = path.parse(videoPath)
    const targetFolder = parsed.dir
    const name = parsed.name

    if (targetFolder !== this.cachedDir.dirname || !this.cachedDir.matchSubtitleFiles) {
      const files = fs.readdirSync(targetFolder)
      const matched = files.filter(f => {
        const ext = path.extname(f)
        if (ext === '.srt' || ext === '.vtt') {
          return true
        }
        return false
      })
      this.cachedDir = {
        dirname: targetFolder,
        files,
        matchSubtitleFiles: matched
      }
    }

    const targetMatchedSubtitleFile = (this.cachedDir.matchSubtitleFiles as string[]).find(i => {
      const sname = path.parse(i).name
      if (name === sname) {
        return true
      }
      return false
    })

    return targetMatchedSubtitleFile
  }

  @IpcInvoke('endVideoFetch')
  public async endVideoFeteh() {
    this.cachedDir = {
      dirname: undefined,
      files: undefined,
      matchSubtitleFiles: undefined
    }
  }
}
