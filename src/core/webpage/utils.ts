import { detectLanguage } from '@/utils/text'
import getSetting from '../setting/getSetting'

export const searchToUrl = (query: string) => {
  const setting = getSetting()
  const defaultSearchEngine = setting.general.defaultSearchEngine
  let webUrl = ''
  switch (defaultSearchEngine) {
    case 'google': {
      webUrl = 'https://google.com/search?q=' + query?.trim().replaceAll(' ', '+')
      break
    }
    case 'google scholar': {
      webUrl = 'https://scholar.google.com/scholar?q=' + query?.trim().replaceAll(' ', '+')
      break
    }
    case 'wikipedia': {
      let lang = 'en'
      if (query) {
        lang = detectLanguage(query) || 'en'
      }
      webUrl = `https://${lang}.wikipedia.org/w/index.php?fulltext=1&profile=advanced&search=${query?.trim()}`
      break
    }
    case 'baidu': {
      webUrl = 'https://www.baidu.com/s?&wd=' + query?.trim().replaceAll(' ', '+')
      break
    }
    case 'vocabulary': {
      webUrl =
        'https://www.vocabulary.com/dictionary/' +
        query
          ?.trim()
          .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g, ' ')
          .trim()
          .toLowerCase()
      break
    }
    case 'bing': {
      webUrl = 'https://www.bing.com/search?q=' + query?.trim().replaceAll(' ', '+')
      break
    }
    case 'bing dictionary': {
      webUrl = `https://www.bing.com/dict/search?q=${query?.trim().replaceAll(' ', '+')}&go=Search`
      break
    }
    case 'zhihu': {
      webUrl = `https://www.zhihu.com/search?q=${query?.trim()}&type=content`
      break
    }
    case 'semantic scholar': {
      webUrl = `https://www.semanticscholar.org/search?q=${query?.trim()}&sort=relevance`
      break
    }
    case 'youdao dictionary': {
      webUrl = `https://www.youdao.com/m/result?word=${query?.trim()}&lang=en`
      break
    }
  }
  return webUrl
}
