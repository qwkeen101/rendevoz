export default (html: string) => {
  const match = html.match(/ytInitialData = (.*?);/)
  if (match && match[1]) {
    const ytInitialData = JSON.parse(match[1])
    const contents = ytInitialData.contents?.twoColumnWatchNextResults?.results?.results?.contents
    const title = contents[0]?.videoPrimaryInfoRenderer?.title?.runs[0]?.text ?? ''
    const image = contents[1]?.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer?.thumbnail?.thumbnails.at(-1)?.url ?? ''
    const description = contents[1]?.videoSecondaryInfoRenderer?.attributedDescription?.content ?? ''
    return {
      title,
      image,
      description
    }
  }
}
