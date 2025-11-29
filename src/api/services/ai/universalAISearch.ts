import { IAISearchSource } from '~/typings'
import { Id } from '@/utils'

// first use google, fallback to bing
export default async (query: string): Promise<IAISearchSource[] | undefined> => {
  const googleOk = await checkGoogle()
  const domain = googleOk ? 'https://www.google.com' : 'https://www.bing.com'
  let url = googleOk
    ? `${domain}/search?q=${encodeURIComponent(query)}&oq=${encodeURIComponent(query)}`
    : `${domain}/search?form=QBRE&q=${encodeURIComponent(query)}&cc=US`
  let res: IAISearchSource[] = []
  while (res.length < 10) {
    const { elements, next } = await (googleOk ? fetchGoogle : fetchBing)(url)
    res = [...res, ...elements]
    if (next) {
      url = `${domain}${next}`
    } else {
      break
    }
  }
  return res
}
let lastCheck: {
  result: boolean
  time?: number
} = {
  result: false,
  time: undefined
}
const checkGoogle = async () => {
  if (lastCheck.time) {
    if (Date.now() - lastCheck.time < 1000 * 10) return lastCheck.result
  }
  const url = 'https://www.google.com/generate_204'
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 1000)
    await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      mode: 'no-cors'
    })
  } catch (e) {
    lastCheck = {
      result: false,
      time: Date.now()
    }
    return false
  }
  lastCheck = {
    result: true,
    time: Date.now()
  }
  return true
}

const fetchBing = async (
  url: string
): Promise<{
  next?: string
  elements: IAISearchSource[]
}> => {
  const res = new DOMParser().parseFromString(await fetch(url).then(i => i.text()), 'text/html')
  const liElements = Array.from(res.querySelectorAll('#b_results > .b_algo'))
  const next = res.querySelector('div#b_content nav[role="navigation"] a.sb_pagN')?.getAttribute('href') ?? ''
  const elements = liElements.map(li => {
    const headerElement = li.querySelector('.b_tpcn')
    const source = headerElement?.querySelector('.tptt')?.textContent
    const logo = headerElement?.querySelector('.siteicon')?.firstElementChild?.getAttribute('data-src') ?? ''
    const titleEle = li.querySelector('h2')
    const abstract = li.querySelector('.b_caption, .b_imgcap_altitle, .b_imgcap_nosc > p')?.textContent ?? ''
    const link = titleEle?.querySelector('a')
    const url = link?.getAttribute('href') ?? ''
    const title = link?.textContent ?? ''
    return { abstract, url, title, source, logo, id: Id.getId(), type: 'web' }
  })
  return {
    elements,
    next
  }
}

async function fetchGoogle(url: string): Promise<{
  next?: string
  elements: IAISearchSource[]
}> {
  const doc = new DOMParser().parseFromString(await fetch(url).then(i => i.text()), 'text/html')
  const liElements = Array.from(doc.querySelectorAll("[jscontroller='SC7lYd']"))
  const next = doc.querySelector('div[role="navigation"] a#pnnext')?.getAttribute('href') ?? ''
  const elements = liElements.map(li => {
    const linkElement = li.querySelector('a')
    const url = linkElement?.getAttribute('href') ?? ''
    const logo = `https://www.google.com/s2/favicons?domain=${url}`
    const title = linkElement?.querySelector('h3')?.textContent ?? ''
    const source = li.querySelector('span.VuuXrf')?.textContent
    const abstract = li.querySelector('.VwiC3b')?.textContent ?? ''
    return { abstract, title, url, logo, source, id: Id.getId(), type: 'web' }
  })
  return {
    elements,
    next
  }
}
