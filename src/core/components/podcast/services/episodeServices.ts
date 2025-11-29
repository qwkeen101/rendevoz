export default {
  getPodcastIdByURL: (url: string) => {
    const u = new URL(url)
    const id = u.pathname
      .split('/')
      .find(i => i.startsWith('id'))
      ?.replace('id', '')
    return Number(id)
  },
  getEpisodeDetailsByURL: async (url: string) => {
    const text = await fetch(url).then(i => i.text())
    const page = new DOMParser().parseFromString(text, 'text/html')
    const data = page.querySelector('#serialized-server-data')
    if (data) {
      const str = data.innerHTML
      let description = page.getElementById('schema:episode')?.innerHTML
      if (description) {
        description = JSON.parse(description).description
      }
      const details = {
        releaseDateTime: new Date(str.match(/"releaseDate":\s*"(.*?)"/)?.[1]),
        assetUrl: str.match(/"streamUrl":\s*"(.*?)"/)?.[1],
        description,
        duration: parseInt(str.match(/"duration":\s*(\d+)/)?.[1] ?? '0'),
        title: str.match(/"title":\s*"(.*?)"/)?.[1],
        image: page.querySelector('[property="og:image"]')?.getAttribute('content') || ''
      } as {
        releaseDateTime: Date
        image: string
        assetUrl: string
        description: string
        duration: number
        title: string
      }
      return details
    }
  }
}
