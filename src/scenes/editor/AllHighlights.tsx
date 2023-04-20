import Colors from '@/consts/colors'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai'
import { CustomEditor } from '~/typings'
import { EditorHighlightsAtom } from './useEditorFilter'
import Actions from '@/core/Actions'
import { useState } from 'react'
import fuzzysort from 'fuzzysort'
import { Content, Icon } from '@/components'

const AllHighlights = ({ editor }: { editor: CustomEditor }) => {
  const allHighlights = useAtomValue(EditorHighlightsAtom)
  const [search, setSearch] = useState<typeof allHighlights[0][]>()
  return (
    <>
      <Content
        flex
        gap={6}
        style={{
          borderRadius: 6,
          border: `1px solid ${Colors.Background.Border}`,
          padding: '4px 8px',
          marginBottom: '12px'
        }}
      >
        <Icon name="park-search" />
        <input
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none'
          }}
          onChange={e => {
            const v = e.target.value
            if (v.length) {
              const result = fuzzysort.go(e.target.value, allHighlights, { key: 'str' })
              setSearch(result.map(i => i.obj))
            } else {
              setSearch(undefined)
            }
          }}
        />
      </Content>
      <ol
        className={css({
          height: '100%',
          counterReset: 'my-counter',
          overflowY: 'auto',
          paddingLeft: 0,
          paddingRight: 20,
          li: {
            display: 'flex',
            counterIncrement: 'my-counter',
            '::before': {
              content: 'counter(my-counter) "."',
              marginRight: 10,
              whiteSpace: 'nowrap'
            }
          },
          '> *': {
            ':not(:last-child)': {
              borderBottom: `1px solid ${Colors.Background.Border}`
            }
          }
        })}
      >
        {(search || allHighlights)?.map(i => (
          <li
            key={i.highlightId}
            className={css([
              {
                transition: 'color 0.2s ease',
                cursor: 'pointer',
                ':hover': {
                  color: '#8ab4f8'
                }
              },
              ClassName.ellipsisFont(1)
            ])}
            onClick={() => {
              console.log(i.highlightId, editor)
              Actions.goToNoteLabel(i.highlightId, editor)
            }}
          >
            {i.str}
          </li>
        ))}
      </ol>
    </>
  )
}

export default AllHighlights
