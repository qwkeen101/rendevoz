import Container from '@/components/base/container'
import DocumentDetails from '@/components/documentDetail'
import { FC, useCallback, useEffect, useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { RecentlyAddCard, RecentlyVisitCard } from './Card'
import { AnimatePresence, motion, PanInfo, useDragControls } from 'framer-motion'
import styles from './index.module.less'
import { Content } from '@/components'
import { useGlobalLocation } from '@/routes/globalLocation'
import { css } from '@emotion/css'
import { useTheme } from '@/hooks'
import useNoteStore from '@/stores/note.store'
import NoteItem from './NoteItem'

export const HomePage: FC = () => {
  const { defaultBackgroundColor } = useTheme('defaultBackgroundColor')
  const location = useGlobalLocation()
  const homeBackground = location?.state && location.state.homeBackground
  return (
    <Container className={css({ background: defaultBackgroundColor, userSelect: 'none' })} auto column>
      {/* <Header /> */}
      <Content className={styles.body}>
        <DocumentCard />
        <NoteCard />
      </Content>
      <AnimatePresence>
        {homeBackground && location && (
          <Routes location={location} key={location.pathname}>
            <Route path="document/details">
              <Route path=":id" element={<AnimatedDocumentDetails />} />
            </Route>
          </Routes>
        )}
      </AnimatePresence>
    </Container>
  )
}

const DocumentCard = () => {
  const [sortMode, setSortMode] = useState<'recently read' | 'recently add'>('recently read')
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
      <div style={{minHeight: 120}}>{sortMode === 'recently read' ? <RecentlyVisitCard /> : <RecentlyAddCard />}</div>
    </Content>
  )
}
const NoteCard = () => {
  const { all } = useNoteStore()
  return (
    <Content
      flex
      column
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
      {all.slice(0, 20).map(i => (
        <NoteItem key={i.id} note={i} />
      ))}
    </Content>
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
