import { Toolbar, Content, IconWithPopover } from '@/components'
import BlockColorPicker from '@/core/editor/components/BlockColorPicker'
import { TextSelectEvent } from '~/typings/event'
import ClassName from '@/styles/classNames'
import { FC } from 'react'
import useSWRImmutable from 'swr/immutable'
import styles from './index.module.less'
import Colors from '@/consts/colors'

interface TextSelectionToolbarProps {
  textSelect?: TextSelectEvent
  onTranslate?: (e: React.MouseEvent) => void
  onHighlight?: (color: string, specType?: 'underline') => void
  onSearch?: (e: React.MouseEvent) => void
}
const TextSelectionToolbar: FC<TextSelectionToolbarProps> = ({ textSelect, onHighlight, onTranslate, onSearch }) => {
  return (
    <Toolbar>
      <Toolbar.Item
        iconName="park-copy-one"
        onClick={e => textSelect?.selectedText && navigator.clipboard.writeText(textSelect?.selectedText)}
      ></Toolbar.Item>
      <Toolbar.Item iconName="park-search" onClick={onSearch}></Toolbar.Item>
      <Toolbar.Item iconName="park-translate" onClick={e => onTranslate?.(e)}></Toolbar.Item>
      <Toolbar.Item>
        <IconWithPopover
          name="park-text-underline"
          placement={['top', 'bottom', 'right']}
          zIndex={10000}
          content={
            <BlockColorPicker
              bgBackDefault={false}
              showFont={false}
              onPickBackgroundColor={c => {
                onHighlight?.(c, 'underline')
              }}
            />
          }
        />
      </Toolbar.Item>
      <Toolbar.Item>
        <IconWithPopover
          name="park-background-color"
          placement={['top', 'bottom', 'right']}
          zIndex={10000}
          content={<BlockColorPicker bgBackDefault={false} showFont={false} onPickBackgroundColor={onHighlight} />}
        />
      </Toolbar.Item>
    </Toolbar>
  )
}
export type WikiSearchResult = {
  description: string
  title: string
  extract: string
  thumbnail?: {
    height: number
    width: number
    source: string
  }
  type: 'standard' | 'disambiguation'
}
export type WikiSections = {
  lead: {
    sections: {
      id: number
      toclevel: number
      anchor: string
      line: string
    }[]
  }
  remaining: {
    sections: {
      id: number
      text: string
      toclevel: number
      line: string
      anchor: string
    }[]
  }
}
export const TextSelectionSearch: FC<{ searchInput?: string }> = ({ searchInput }) => {
  const normalizedInput = searchInput?.replace(/\./g, ' ').replace(/ /g, '_').trim()
  const fetcher = (url: string) => fetch(url).then(res => res.json())
  const { data: more } = useSWRImmutable<WikiSections>(
    `https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${normalizedInput}`,
    fetcher
  )
  const { data, error } = useSWRImmutable<WikiSearchResult>(`https://en.wikipedia.org/api/rest_v1/page/summary/${normalizedInput}`, fetcher)
  const parser = new DOMParser()
  const section = (text: string) => {
    const doc = parser.parseFromString(text, 'text/html')
    const list = doc.querySelector('ul')
    console.log(list)
    const items = list?.querySelectorAll('li') || []
    return Array.from(items).map(i => {
      let isSubLi = false
      if (i.parentNode.tagName === 'UL' && i.parentNode?.parentNode.tagName === 'LI') {
        isSubLi = true
      }
      const a = i.querySelector('a')
      const title = a?.textContent
      const link = a?.getAttribute('href')
      a?.remove()
      const t = i.textContent
      return (
        <Content style={{ paddingLeft: isSubLi ? 20 : 0 }}>
          <a
            target="_blank"
            onClick={() => {
              if (navigator.userAgent.indexOf('Electron') >= 0) {
                window.open(`https://en.wikipedia.org${link}`)
              }
            }}
            href={`https://en.wikipedia.org${link}`}
          >
            {title}
          </a>
          {t}
        </Content>
      )
    })
  }
  return data ? (
    <Content flex column style={{ overflow: 'auto', minWidth: 200, maxWidth: 800 }}>
      <Content className={styles.title} flex alignItems="center" justifyContent="flex-start">
        {data.title}
      </Content>
      {data.type === 'standard' && (
        <Content flex alignItems="center">
          {data.thumbnail && <img className={styles.thumbnail} src={data.thumbnail.source} />}
          <Content flex column justifyContent="flex-start">
            <Content className={styles.subtitle} flex>
              {data.description}
            </Content>
            <Content className={styles.extract} flex>
              {data.extract}
            </Content>
          </Content>
        </Content>
      )}
      {data.type === 'disambiguation' && (
        <Content className={styles.disambiguationContainer} flex column alignItems="center">
          {more?.remaining.sections.map(i => (
            <Content fullWidth flex column>
              <div className={styles.line}>{i?.line}</div>
              {section(i.text)}
            </Content>
          ))}
        </Content>
      )}
    </Content>
  ) : error ? (
    <div>error</div>
  ) : (
    <div>loading</div>
  )
}
export const TextSelectionTranslate: FC<{ translateInput?: string }> = ({ translateInput }) => {
  // const [targetLang,setTargetLang] = useState('')
  const normalizedInput = translateInput?.replace(/\n/g, '')
  const fetcher = () => {
    if (normalizedInput) {
      const base = 'https://translate.googleapis.com/translate_a/single'
      const url = `${base}?client=gtx&sl=auto&tl=zh&dt=t&q=${encodeURI(normalizedInput)}`
      return fetch(url).then(data => data.json())
      // return googleTranslate(normalizedInput, 'en', 'zh-CN')
    }
  }
  const { data, error } = useSWRImmutable(`/api/translate/${normalizedInput}`, fetcher)
  // const result = data[0]?.map(i => i?.[0]).join()
  let result = ''
  if (data) {
    result = (data[0].map(n => n[0]) as string[]).join('')
  }
  return (
    <Content flex style={{ maxHeight: 600, overflow: 'auto', minWidth: 600, maxWidth: 800, color: Colors.Font.Primary }}>
      <Content flex column>
        <Content flex className={ClassName.description('1rem')}>
          Translate Result
        </Content>
        <Content flex>
          {data ? (
            // <div className={styles.extract}>{data.data.trans.paragraphs[0]}</div>
            <div>{result}</div>
          ) : error ? (
            <div>Some errors happened</div>
          ) : (
            <div>loading</div>
          )}
        </Content>
      </Content>
    </Content>
  )
}
export default TextSelectionToolbar
