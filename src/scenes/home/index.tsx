import { Container } from '@/components'
import { FC, useState } from 'react'
import { RecentlyAddCard, RecentlyVisitCard } from './Card'
import styles from './index.module.less'
import { Content } from '@/components'
import { css } from '@emotion/css'
import { useTheme } from '@/hooks'
import { undeletedNotesAtom } from '@/stores/note.store'
import NoteItem from './NoteItem'
import HomeBrief from './Brief'
import { useAtomValue } from 'jotai/react'
import { globalStore } from '@/stores'
import { useMeasure } from 'react-use'
import { useTranslation } from 'react-i18next'
import TabTitle from '@/components/layout/TabTitle'

export const HomePage: FC = () => {
  const { defaultBackgroundColor } = useTheme('defaultBackgroundColor')
  const { t } = useTranslation()
  return (
    <Container className={css({ background: defaultBackgroundColor, userSelect: 'none' })} auto column>
      <TabTitle title={t('general.home')} />
      <Content className={styles.body}>
        <HomeBrief />
        <DocumentCard />
        <NoteCard />
      </Content>
    </Container>
  )
}

const DocumentCard = () => {
  const [sortMode, setSortMode] = useState<'recently read' | 'recently add'>('recently read')
  const [ref, { width }] = useMeasure()
  const { t } = useTranslation()
  return (
    <Content flex column>
      <Content
        flex
        gap={20}
        alignItems="baseline"
        className={css({
          marginBottom: 20
        })}
      >
        <div
          className={css({
            fontSize: 24,
            fontWeight: 600
          })}
        >
          {t('home.books')}
        </div>
        <div
          onClick={() => setSortMode('recently read')}
          className={css({
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 12,
            ':hover': {
              background: 'rgba(0,0,0,0.07)'
            }
          })}
        >
          {t('home.recently read')}
        </div>
        <div
          onClick={() => setSortMode('recently add')}
          className={css({
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 12,
            ':hover': {
              background: 'rgba(0,0,0,0.07)'
            }
          })}
        >
          {t('home.recently add')}
        </div>
      </Content>
      <div ref={ref} style={{ minHeight: 120 }}>
        {sortMode === 'recently read' ? <RecentlyVisitCard width={width} /> : <RecentlyAddCard width={width} />}
      </div>
    </Content>
  )
}
const NoteCard = () => {
  const undeletedNotes = useAtomValue(undeletedNotesAtom, { store: globalStore })
  const { t } = useTranslation()
  return (
    <div
      className={css({
        marginTop: 30
      })}
    >
      <div
        className={css({
          fontSize: 24,
          fontWeight: 600,
          marginBottom: 15
        })}
      >
        {t('home.notes')}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(200px, 1fr))',
          rowGap: 24,
          columnGap: 32
        }}
      >
        {undeletedNotes.slice(0, 20).map(i => (
          <NoteItem key={i.id} note={i} />
        ))}
      </div>
    </div>
  )
}
