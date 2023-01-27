import { Content } from '@/components/base'
import { GlobalScope } from '@/jotai/jotaiScope'
import { documentsAtom } from '@/stores/document.store'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { atom } from 'jotai/vanilla'
import { useAtomValue } from 'jotai/react'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetaObject } from '~/typings/data'
import { TitleWrapperClassName, TitleClassName } from './DatabaseCard'
import { globalStore } from '@/stores/stores'

const MetaDocumentCard = ({ m, onCoverChange }: { m: MetaObject; onCoverChange?: (url: string) => void }) => {
  const docId = m.objectId
  const documentAtom = useMemo(() => (docId ? atom(get => get(documentsAtom).get(docId)) : atom(null)), [docId])
  const document = useAtomValue(documentAtom, { store: globalStore })
  useEffect(() => {
    document?.metadata?.coverUrl && onCoverChange?.(document?.metadata?.coverUrl)
  }, [document?.metadata?.coverUrl])
  const navigate = useNavigate()
  return (
    <Content flex column>
      <Content className={TitleWrapperClassName}>
        <div
          className={TitleClassName}
          onClick={() => {
            navigate(`/pdf/${docId}`)
          }}
        >
          {document?.name || m.name}
        </div>
        {document?.metadata?.author && (
          <div style={{ marginBottom: 10 }} className={css([ClassName.description(), ClassName.ellipsisFont(1)])}>
            {document?.metadata?.author}
          </div>
        )}
        <div className={css([ClassName.description(), ClassName.ellipsisFont(6)])}>{m.description}</div>
      </Content>
    </Content>
  )
}

export default MetaDocumentCard
