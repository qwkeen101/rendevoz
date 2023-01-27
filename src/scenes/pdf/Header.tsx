import { Content } from '@/components'
import usePdfInfo from '@/components/pdf/hooks/usePdfInfo'
import styles from './index.module.less'
import { motion } from 'framer-motion'
import useCleanMode from '@/components/pdf/hooks/useCleanMode'
import useViewer from './useViewer'

const PdfPageHeader = () => {
  const [pdfInfo, setPdfInfo] = usePdfInfo()
  const [cleanMode, setCleanMode] = useCleanMode()
  const viewer = useViewer().current

  return (
    <Content className={styles.header} flex alignItems="center" justifyContent="space-between">
      <Content flex column>
        <div className={styles.title}>{pdfInfo?.metadata?.title || pdfInfo?.name}</div>
        <div className={styles.author}>{pdfInfo?.metadata?.author || 'Unknown'}</div>
      </Content>
      <Content flex alignItems="center" style={{ gap: 20 }}>

      </Content>
      <div className={styles.progressTrack}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${(pdfInfo?.readProgress || 0) * 100}%` || `0%` }}
          transition={{ damping: 30, stiffness: 200, duration: 0.2 }}
          className={styles.progress}
        ></motion.div>
      </div>
    </Content>
  )
}

export default PdfPageHeader
