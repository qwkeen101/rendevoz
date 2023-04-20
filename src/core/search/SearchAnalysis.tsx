import { useGlobalAtomValue } from '@/hooks'
import { GlobalSearchResultsAtom } from './SearchDialog'
import { useEffect, useState } from 'react'
import { Content } from '@/components'
import { ObjectStore, globalStore } from '@/stores'
import { metaObjectsAtom } from '@/stores/meta.store'

const SearchAnalysis = () => {
  const searchResults = useGlobalAtomValue(GlobalSearchResultsAtom)
  const [searchAna, setSearchAna] = useState<{
    total: number
    count?: {
      webpage?: number
      note?: number
      pdf?: number
      normal?: number
    }
  }>({
    total: 0
  })

  useEffect(() => {
    const setResult = async () => {
      const values = Array.from(searchResults.values())
      const total = values.map(i => i.items.length).reduce((a, b) => a + b, 0)
      const count = {
        webpage: 0,
        note: 0,
        pdf: 0,
        normal: 0
      }
      console.log(searchResults, values, total)
      const promises = values.map(async group => {
        if (group.type === 'pdf') {
          count.pdf += 1
        }
        if (group.type === 'note') {
          const note = await ObjectStore('note').getOneById(group.id)
          if (!note) {
            return
          }
          if (note.metaId) {
            const meta = globalStore.get(metaObjectsAtom).get(note.metaId)
            if (meta) {
              switch (meta.type) {
                case 'normal':
                  count.normal += 1
                  break
                case 'webpage':
                  count.webpage += 1
                  break
              }
            }
            return
          }
          count.note += 1
        }
      })
      await Promise.all(promises)
      setSearchAna({
        total,
        count
      })
    }
    setResult()
  }, [searchResults])
  return (
    <Content flex gap={10}>
      <div>Total: {searchAna?.total || 0}</div>
      {searchAna?.count && (
        <>
          Category:
          <div>pdf: {searchAna.count.pdf}</div>
          <div>note: {searchAna.count.note}</div>
          <div>webpage: {searchAna.count.webpage}</div>
        </>
      )}
    </Content>
  )
}

export default SearchAnalysis
