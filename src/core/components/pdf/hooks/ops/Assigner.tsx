import PDFNavigation from './PDFNavigation'
import PDFActions from '@/core/components/pdf/hooks/ops/PDFActions'
import PDFKeyboard from '@/core/components/pdf/hooks/ops/PDFKeyboard'

export default function PDFOpsAssigner() {
  return (
    <>
      <PDFNavigation />
      <PDFActions />
      <PDFKeyboard />
    </>
  )
}
