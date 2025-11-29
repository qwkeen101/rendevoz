import { ObjectStore } from '@/api/stores'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useSetAtom } from 'jotai'
import { PDFStateAtom } from '@/core/components/pdf/hooks/usePDFState'
import { IPDFLabel } from '~/typings'

export default (id: number) => {
  const pdf = ObjectStore('pdf').useValue(id)
  const labels = ObjectStore('pdfLabel').useMultiple(useMemo(() => pdf?.labels, [pdf?.labels]))
  const setState = useSetAtom(PDFStateAtom)
  useLayoutEffect(() => {
    setState(s => {
      const record: Record<number, IPDFLabel[]> = {}
      labels.forEach(l => {
        record[l.page] = [...(record[l.page] || []), l]
      })
      return {
        ...s,
        pageToLabels: record
      }
    })
  }, [labels])
}
