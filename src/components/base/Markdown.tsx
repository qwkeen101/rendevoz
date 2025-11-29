import React, { forwardRef, memo, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import classnames from 'classnames'
import prism from 'prismjs'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { Markmap } from 'markmap-view'
import { Transformer } from 'markmap-lib'
import { useMeasure, useUpdate } from 'react-use'
import { CheckBox, DotLoading, WithBorder } from '@/components'
import ToolTip from '@/components/base/Tooltip'

const URL_TO_DETAILS_CACHE: Record<
  string,
  {
    title: string
    description: string
    favicon: string
    sitename: string
    image?: string
  }
> = {}

const preprocessMarkdown = (markdownText: string) => {
  // Replace \[ with $$ and \] with $$ to ensure compatibility
  const processedText = markdownText
    .replace(/\\([[\]()])/g, '$$$')
    .replace(/<br\s*\/?>/gi, '&#10;')
    .replace(/\(\[([^\]]+)\]\(([^\)]+)\)\)/g, '[ai-citation-$1]($2)\n')
  return processedText
}

const ReactMarkdown = memo(
  ({ children, className, onChange }: { children: ReactNode; className?: string; onChange?: (v: string) => void }) => {
    const strChildren = String(children)
    if (!strChildren || strChildren === 'undefined') return null
    const content = useMemo(() => preprocessMarkdown(strChildren), [strChildren])
    console.log(children, content)
    return (
      <Markdown
        rehypePlugins={[rehypeKatex]}
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        className={classnames('markdown', className)}
        components={{
          code(props) {
            const { children, className, ...rest } = props
            if (className?.includes('language-markmap')) {
              return <MarkmapRenderer value={String(children)} />
            }
            const match = /language-(\w+)/.exec(className || '')
            return match && prism.languages[match[1]] ? (
              <code
                {...rest}
                dangerouslySetInnerHTML={{ __html: prism.highlight(String(children), prism.languages[match[1]], match[1]) }}
              />
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            )
          },
          a(props) {
            console.log(props)
            return <LinkRenderer children={props.children} url={props.href || ''} />
          }
        }}
      >
        {content}
      </Markdown>
    )
  },
  (prev, curr) => prev.children === curr.children && prev.className === curr.className
)

const transformer = new Transformer()

const MarkmapRenderer = memo(({ value }: { value: string }) => {
  // Ref for SVG element
  const refSvg = useRef<SVGSVGElement>(null)
  // Ref for markmap object
  const refMm = useRef<Markmap>()
  useEffect(() => {
    // Create markmap and save to refMm
    if (refMm.current) return
    const mm = Markmap.create(refSvg.current)
    refMm.current = mm
  }, [refSvg.current])
  const [ref, { width }] = useMeasure()
  useEffect(() => {
    // Update data for markmap once value is changed
    const mm = refMm.current
    if (!mm || !value) return
    const { root } = transformer.transform(value)
    mm.setData(root, {
      spacingVertical: 10,
      autoFit: true,
      pan: true,
      zoom: true,
      duration: 0
    })
  }, [refMm.current, value, width])
  return (
    <div
      className={'border rounded-lg'}
      style={{
        overflow: 'auto',
        maxWidth: '100%',
        width: 99999
      }}
      ref={ref}
    >
      <svg
        style={{
          width: '100%',
          aspectRatio: '1 / 1'
        }}
        ref={refSvg}
      />
    </div>
  )
})

const LinkRenderer = ({ url, children }: { url: string; children: string }) => {
  if (url.startsWith('https://www.google.com/maps/search/')) {
    return <GoogleMapRenderer search={url.replace('https://www.google.com/maps/search/', '')} />
  }
  if (children.startsWith('ai-citation')) {
    return (
      <ToolTip contentTouchable disableDefaultContent content={<LinkHoverRenderer url={url} />}>
        <span
          className={'bg-third cursor-pointer hover-after-bg-hover'}
          style={{
            borderRadius: '2em',
            fontSize: '0.7em',
            lineHeight: 1,
            padding: '0.3em 0.8em'
          }}
          onClick={e => {
            e.preventDefault()
            Global.utils.openSpecificURL(url)
          }}
        >
          {children.replace('ai-citation-', '')}
        </span>
      </ToolTip>
    )
  }
  return (
    <a
      href={url}
      onClick={e => {
        e.preventDefault()
        Global.utils.openSpecificURL(url)
      }}
    >
      {children}
    </a>
  )
}

const GoogleMapRenderer = ({ search }: { search: string }) => {
  const key = 'REDACTED'
  return (
    <iframe
      width="100%"
      height="400"
      loading="lazy"
      style={{
        borderRadius: '12px'
      }}
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps/embed/v1/place?key=${key}
    &q=${search}`}
    ></iframe>
  )
}

const LinkHoverRenderer = forwardRef(({ url }: { url: string }, ref) => {
  const [loading, setLoading] = useState(false)
  const details = URL_TO_DETAILS_CACHE[url]
  useEffect(() => {
    if (loading || details) {
      return
    }
    setLoading(true)
    Global.utils
      .fetchDetails(url)
      .then(res => {
        URL_TO_DETAILS_CACHE[url] = {
          title: res.title,
          description: res.description || '',
          sitename: res.sitename || '',
          image: res.image,
          favicon: `https://www.google.com/s2/favicons?domain=${url}`
        }
      })
      .finally(() => setLoading(false))
  }, [url, details])
  return (
    <WithBorder ref={ref}>
      {loading || !details ? (
        <div className={'w-64 h-40 flex items-center justify-center'}>
          <DotLoading />
        </div>
      ) : (
        <div
          style={{
            minWidth: '15rem',
            maxWidth: '26rem'
          }}
          onClick={() => {
            Global.utils.openSpecificURL(url)
          }}
          className={'p-3 flex cursor-pointer flex-col gap-1'}
        >
          {details.image ? (
            <img src={details.image} className={'w-full overflow-hidden max-h-52 object-cover mb-2 rounded-lg'} />
          ) : (
            details.sitename && (
              <div className={'flex items-center gap-3'}>
                <img src={details.favicon} className={'size-4'} />
                <span className={'font-size-12'}>{details.sitename}</span>
              </div>
            )
          )}
          <div className={'break-all font-medium'}>{details.title}</div>
          {details.description && <div className={'line-clamp-2 font-size-13'}>{details.description}</div>}
        </div>
      )}
    </WithBorder>
  )
})
export default ReactMarkdown
