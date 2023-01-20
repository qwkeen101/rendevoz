import { Content, Icon } from '@/components'
import { GlobalScope } from '@/jotai/jotaiScope'
import { undeletedDocumentsAtom } from '@/stores/document.store'
import { undeletedMetaLinksAtom, undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { undeletedNotesAtom } from '@/stores/note.store'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai'
import { ReactNode } from 'react'

const NumberClazz = css({
  fontSize: 22,
  fontWeight: 600,
  fontFamily: 'sans-serif'
})
const HomeBrief = () => {
  const documents = useAtomValue(undeletedDocumentsAtom, GlobalScope)
  const metaObjects = useAtomValue(undeletedMetaObjectsAtom, GlobalScope)
  const notes = useAtomValue(undeletedNotesAtom, GlobalScope)
  const metaLinks = useAtomValue(undeletedMetaLinksAtom, GlobalScope)
  return (
    <div
      style={{
        marginBottom: 18,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        rowGap: '30px',
        columnGap: '48px'
      }}
    >
      <Card title="Notes" content={<span className={NumberClazz}>{notes.length}</span>} icon="park-notes" />
      <Card title="Books" content={<span className={NumberClazz}>{documents.length}</span>} icon="park-book" />
      <Card title="Objects" content={<span className={NumberClazz}>{metaObjects.length}</span>} icon="park-share-one" />
      <Card title="Links" content={<span className={NumberClazz}>{metaLinks.length}</span>} icon="park-link-one" />
    </div>
  )
}

const Card = ({ title, icon, content }: { title: string; icon: string; content: ReactNode }) => {
  return (
    <Content
      style={{
        padding: '12px 48px 12px 0px',
        // background: 'rgba(238, 238, 238, 0.7)',
        // boxShadow: 'rgba(100, 100, 111, 0.2) 0px 0px 16px 1px',
        borderRight: '1px solid rgba(222,222,222,0.4)',
        // borderRadius: 16,
        maxWidth: 300,
        minWidth: 200
      }}
      className={css({
        ':last-child': {
          borderRight: 'none !important'
        }
      })}
      gap={8}
      auto
      flex
      column
    >
      <Content flex justifyContent="space-between">
        <span className={ClassName.defaultFont()} style={{ fontSize: 15, fontWeight: 600, fontFamily: 'sans-serif' }}>
          {title}
        </span>
        <Icon name={icon} size={20} />
      </Content>
      {content}
    </Content>
  )
}
export default HomeBrief
