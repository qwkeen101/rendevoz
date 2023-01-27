import Container from '@/components/base/container'
import DocumentDetails from '@/components/documentDetail'
import { FC, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RecentlyAddCard, RecentlyVisitCard } from './Card'
import { motion, PanInfo, useDragControls } from 'framer-motion'
import styles from './index.module.less'
import { Content } from '@/components'
import { useGlobalLocation } from '@/routes/globalLocation'
import { css } from '@emotion/css'
import { useTheme } from '@/hooks'
import { undeletedNotesAtom } from '@/stores/note.store'
import NoteItem from './NoteItem'
import HomeBrief from './Brief'
import { useAtomValue } from 'jotai/react'
import { globalStore } from '@/stores/stores'
import { useMeasure } from 'react-use'

export const HomePage: FC = () => {
  const { defaultBackgroundColor } = useTheme('defaultBackgroundColor')
  const location = useGlobalLocation()
  const homeBackground = location?.state && location.state.homeBackground
  return (
    <Container className={css({ background: defaultBackgroundColor, userSelect: 'none' })} auto column>
      <Content className={styles.body}>
        <HomeBrief />
        <DocumentCard />
        <NoteCard />
      </Content>
      {/* <AnimatePresence>
        {homeBackground && location && (
          <Routes location={location} key={location.pathname}>
            <Route path="document/details">
              <Route path=":id" element={<AnimatedDocumentDetails />} />
            </Route>
          </Routes>
        )}
      </AnimatePresence> */}
    </Container>
  )
}

const DocumentCard = () => {
  const [sortMode, setSortMode] = useState<'recently read' | 'recently add'>('recently read')
  const [ref, { width }] = useMeasure()
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
          Books
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
          Recently Read
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
          Recently Add
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
        Notes
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
const AnimatedDocumentDetails = () => {
  const [draggable, setDraggable] = useState(true)
  const navigate = useNavigate()
  const dragControls = useDragControls()
  function startDrag(event) {
    dragControls.start(event)
    document.addEventListener('mousemove', dragHandler)
  }
  const dragHandler = useCallback(e => {
    e.preventDefault()
  }, [])
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    event.preventDefault()
    const windowHeight = window.innerHeight
    const distance = windowHeight - info.point.y
    if (distance / windowHeight < 0.1 && draggable) {
      setDraggable(false)
      navigate('/home')
      document.removeEventListener('mousemove', dragHandler)
    }
  }
  const handleDragEnd = () => {
    document.removeEventListener('mousemove', dragHandler)
  }
  return (
    <motion.div className={styles.documentDetailsContainer}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className={styles.documentDetailsOverlay}
        onClick={() => navigate('/home')}
      ></motion.div>
      <motion.div
        initial={{ y: '100%' }}
        className={styles.documentDetailsContent}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.4, stiffness: 200, damping: 30 }}
        drag={draggable ? 'y' : false}
        dragControls={dragControls}
        dragConstraints={{ top: 0 }}
        dragElastic={0}
        dragListener={false}
        dragMomentum={false}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <div onPointerDown={startDrag} className={styles.documentDetailsDragHandleContainer}>
          <div className={styles.documentDetailsDragHandle}></div>
        </div>
        <DocumentDetails />
      </motion.div>
    </motion.div>
  )
}
