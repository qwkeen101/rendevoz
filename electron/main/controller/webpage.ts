import callback from './callback'
import { getGnewsRedirect, loadWebpageContent } from '../service/webpage'

callback('loadWebpage', async url => {
  return await loadWebpageContent(url)
})

callback('gnews', async url => {
  return await getGnewsRedirect(url)
})