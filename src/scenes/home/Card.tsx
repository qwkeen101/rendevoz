import { Content, Icon, Image } from '@/components'
import { undeletedDocumentsAtom } from '@/stores/document.store'
import { FC, memo, ReactNode, useMemo } from 'react'
import { IPdfDocument } from '~/typings/data'
import styles from './index.module.less'
import { useAtomValue } from 'jotai/react'
import { globalStore } from '@/stores'
import { orderBy } from 'lodash'
import Actions from '@/Actions'
interface CardProps {
  title: string
  children: ReactNode
}
const Card: FC<CardProps> = ({ title, children }) => {
  return (
    <Content className={styles.card} flex column>
      {title && (
        <Content className={styles.title} flex alignItems="center">
          <span>{title}</span>
          <span className={styles.divider}></span>
        </Content>
      )}
      {children}
    </Content>
  )
}

export default Card

export const RecentlyVisitCard = memo(({ width }: { width: number }) => {
  const undeletedDocuments = useAtomValue(undeletedDocumentsAtom, { store: globalStore })
  const recentlyRead = useMemo(
    () =>
      orderBy(
        undeletedDocuments.filter(i => i.lastReadAt),
        'lastReadAt',
        'desc'
      ),
    [undeletedDocuments]
  )
  const count = Math.floor(width / 300)
  return (
    <div
      style={{
        gridTemplateColumns: `repeat(${count},minmax(0,1fr))`
      }}
      className={styles.cardList}
    >
      {Array.from(Array(count * 2).keys()).map(
        (i, idx) => recentlyRead[idx] && <RecentlyReadCardItemV2 key={recentlyRead[idx].id} document={recentlyRead[idx]} />
      )}
    </div>
  )
})

const RecentlyReadCardItemV2 = ({ document }: { document: IPdfDocument }) => {
  return (
    <Content flex className={styles.itemWrapperV2}>
      <div style={{ minHeight: 80, minWidth: 90 }}>
        <Content fullWidth fullHeight flex centered className={styles.coverWrapperV2}>
          <Image
            placeHolder={
              <div style={{ inset: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={40} fill="#8590aea8" name="park-pic" />
              </div>
            }
            width="100%"
            ratio={1.33}
            draggable={false}
            className={styles.coverV2}
            src={document.metadata?.coverUrl || 'https://picsum.photos/200/300'}
          />
        </Content>
      </div>
      <Content flex alignItems="flex-end" className={styles.detailsWrapper}>
        <Content flex column className={styles.details} fullHeight justifyContent="space-between">
          <div className={styles.titleV2}>{document.metadata?.title || document.name}</div>
          <div className={styles.descV2}>{document.metadata?.author || 'Unknown'}</div>
          <div className={styles.progressTrack}>
            <div className={styles.progressThumb} style={{ width: `${(document.readProgress || 0) * 100}%` }}></div>
          </div>
        </Content>
        <Content
          className={styles.iconWrapper}
          onClick={() => Actions.openPdf(document.id)}
          flex
          alignItems="flex-end"
          style={{ marginLeft: 10 }}
        >
          <Icon name="park-right" size={24} style={{ padding: 8, borderRadius: 999, background: '#8590ae', color: 'white' }} />
        </Content>
      </Content>
    </Content>
  )
}

export const RecentlyAddCard = memo(({ width }: { width: number }) => {
  const undeletedDocuments = useAtomValue(undeletedDocumentsAtom, { store: globalStore })
  const recentlyCreated = useMemo(() => orderBy(undeletedDocuments, 'createdAt', 'desc'), [undeletedDocuments])
  const count = Math.floor(width / 300)
  return (
    <div
      style={{
        gridTemplateColumns: `repeat(${count},minmax(0,1fr))`
      }}
      className={styles.cardList}
    >
      {Array.from(Array(count * 2).keys()).map(
        (i, idx) => recentlyCreated[idx] && <RecentlyReadCardItemV2 key={recentlyCreated[idx].id} document={recentlyCreated[idx]} />
      )}
    </div>
  )
})
