import { useGlobalAtomValue } from '@/hooks'
import { UrlToWebpageMap } from '@/core/components/webpage/hooks/useWebpageContent'
import { useMemo } from 'react'
import { ObjectStore } from '@/api/stores'

const useWebpageIsMeta = (url: string) => {
  const urlMap = useGlobalAtomValue(UrlToWebpageMap)
  const isMeta = useMemo(() => {
    if (urlMap.has(url)) {
      const objId = urlMap.get(url)
      const webpage = ObjectStore('webpage').getOneById(objId)
    }
    return false
  }, [urlMap])

  return isMeta
}

export default useWebpageIsMeta
