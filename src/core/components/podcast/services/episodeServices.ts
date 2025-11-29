export default {
  getPodcastIdByURL: (url: string) => {
    const u = new URL(url)
    const id = u.pathname
      .split('/')
      .find(i => i.startsWith('id'))
      ?.replace('id', '')
    return id
  },
  getEpisodeDetailsByURL: async (url: string) => {
    const text = await fetch(url).then(i => i.text())
    if (text) {
      const page = new DOMParser().parseFromString(text, 'text/html')
      const data = page.querySelector('#shoebox-media-api-cache-amp-podcasts')
      if (data) {
        const parsed = JSON.parse(data.innerHTML)
        const res = JSON.parse(Object.values(parsed)[0])
        const details = res.d[0].attributes as {
          releaseDateTime: Date
          assetUrl: string
          description: { standard: string }
          durationInMilliseconds: number
          name: string
        }
        return details
      }
    }
  }
}
