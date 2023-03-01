import { Content } from '@/components'
import styles from './index.module.less'
import { motion } from 'framer-motion'
import { IPdfDocument } from '~/typings/data'
const PdfPageHeader = ({ document }: { document?: IPdfDocument }) => {
  return (
    <Content className={styles.header} flex alignItems="center" justifyContent="space-between">
      <Content flex column>
        <div className={styles.title}>{document?.metadata?.title || document?.name}</div>
        <div className={styles.author}>{document?.metadata?.author || 'Unknown'}</div>
      </Content>
      <Content flex alignItems="center" style={{ gap: 20 }}></Content>
      <div className={styles.progressTrack}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${(document?.readProgress || 0) * 100}%` || `0%` }}
          transition={{ damping: 30, stiffness: 200, duration: 0.2 }}
          className={styles.progress}
        ></motion.div>
      </div>
    </Content>
  )
}

export default PdfPageHeader
