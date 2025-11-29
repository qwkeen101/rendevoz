import { Switch, TabPane, Tabs } from '@/components'
import { memo } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { IMediaSubtitle } from '~/index'
import { useGetMediaState, useSelectMediaState } from '../../../hooks/useMediaState'
import classNames from 'classnames'

function formatTime(seconds: number) {
  return DateFormat.formatDuration(seconds)
}

const toCSV = (subtitles: IMediaSubtitle[], trans?: boolean) => {
  return (
    `Time,Subtitle${trans ? ',Translation' : ''}\n` +
    subtitles
      .map(sub => {
        return (
          `${formatTime(sub.start)},"${sub.text.replace(/"/g, '""')}"` +
          (trans && sub.translation ? `,"${sub.translation.replace(/"/g, '""')}"` : '')
        )
      })
      .join('\n')
  )
}

const toPDF = (subtitles: IMediaSubtitle[], name: string, trans?: boolean, time?: boolean) => {
  const html = renderToStaticMarkup(
    <html>
      <head>
        <title>{name}</title>
        <style>
          {`
      body{
        margin: 50px auto;
        width: 1080px;
        border: 1px solid #e4e4e4;
        padding: 50px;
        border-radius: 16px;
        font-family: Times, 'Times New Roman', Georgia, serif;
      }

      .btn-export-pdf{
        position: fixed;
        width: 200px;
        right: 30px;
        bottom: 30px;
        font-size: 15px;
        background: #1c122a;
        padding: 20px;
        color: #fff;
        border-radius: 8px;
        cursor: pointer;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }

      .btn-export-pdf .title{
        margin-top: 10px;
        font-size: 14px;
        font-weight: bold;
        margin-bottom:10px

      }

      .btn-export-pdf .step{
        font-size: 13px;
        margin-top: 4px;
        line-height: 1.5em;
        color: rgba(255,255,255,0.7);
      }

      .btn-export-pdf .trancy-svg-icon{
        font-size: 18px;
        margin-right: 6px;
      }


      .btn-export-pdf .trancy-svg-icon svg{
        width: 24px;
        height: 24px;
      }

      .btn-export-pdf:active{
        transform: scale(0.9);
      }

      h2{
        font-size: 16pt;
      }

      table{
        width: 100%;
        margin-top: 32px;
        border-collapse: collapse;
      }

      td{
        padding: 8px 16px 8px 16px;
        border-bottom: 1px solid #f2f2f2;
        font-size: 15px;
        line-height: 1.5;
      }

      .time{
        width: 6%;
        color: rgb(151 151 151);
        padding-left: 1px;
      }

      .primary-subtitle{
        width: 50% ;
        word-break: break-word;
      }

      .secondary-subtitle{
        width: 44%;
        word-break: break-word;
      }

      .highlight {
        color: #700cff;
        font-weight: bold;
      }

      .pdf-wordlist{
        margin-top: 80px;
        page-break-before: always;
      }

      .words-card{
        display: flex;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f2f2f2;
        font-size: 15px;
      }

      .wordlist-title{
        margin: 2em 0;
      }

      .text{
        margin-right: 16px;
        font-weight: bold;
        width: 12%;
        flex-shrink: 0;
      }

      .phonetic{
        margin-right: 16px;
        width: 12%;
        flex-shrink: 0;
      }

      @page {
        size: A4 portrait;
        margin: 0.5in;
      }

      @media (max-width: 1440px) {
        body{
          width: 960px;
        }
    }

      @media print { 
        body{ 
          margin: 0;
          width: 100%;
          border: none;
          padding: 0;
          border-radius: 0;
        }
        .pdf-wordlist{
          margin-top: 0;
        }
        td{
          font-size: 10pt;
        }
        .btn-export-pdf{
          display: none;
        }
      }
    `}
        </style>
      </head>
      <body>
        <div>
          <h2>{name}</h2>
          <table>
            <tbody>
              {subtitles.map((i, idx) => (
                <tr key={idx}>
                  {time && <td className='time'>{formatTime(i.start)}</td>}
                  <td className='primary-subtitle'>{i.text}</td>
                  {trans && <td>{i.translation}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  )
  const win = window.open('', '_blank', 'toolbar=no,status=no,menubar=no,scrollbars=no,resizable=no,left=10000,top=10000,width=0,height=0')
  win?.document.write(html)
  if (win) {
    win.onafterprint = () => {
      win.close()
    }
    win.print()
  }
}

const toSRT = (subtitles: IMediaSubtitle[], trans?: boolean) => {
  function formatTime(seconds: number) {
    const date = new Date(seconds * 1000)
    const pad = num => String(num).padStart(2, '0')
    const ms = String(date.getMilliseconds()).padStart(3, '0')
    return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())},${ms}`
  }
  return subtitles
    .map((sub, index) => {
      return (
        `${index + 1}
${formatTime(sub.start)} --> ${formatTime(sub.end)}
${sub.text.replaceAll('\n', '')}` + (trans && sub.translation ? `\n${sub.translation.replaceAll('\n', '')}` : '')
      )
    })
    .join('\n')
}

export default memo(() => {
  const subtitles = useSelectMediaState(s => s.subtitles)
  if (!subtitles) return null
  const renderOption = (
    key: 'label' | 'translation' | 'timestamp' | 'highlight',
    value?: boolean,
    onChange?: VoidFunction,
    border?: boolean
  ) => {
    const renderItem = (text: string, value?: boolean, onChange?: VoidFunction, border?: boolean) => {
      return (
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.8)'
          }}
          className={classNames(border && 'border-bottom', 'p-3 flex items-center justify-between')}
        >
          {text}
          <Switch value={value} onChange={onChange} />
        </div>
      )
    }
    switch (key) {
      case 'label':
        return renderItem('在底部列出标注', value, onChange, border)
      case 'timestamp':
        return renderItem('导出时间', value, onChange, border)
      case 'translation':
        return renderItem('导出字幕翻译', value, onChange, border)
      case 'highlight':
        return renderItem('字幕中标注高亮', value, onChange, border)
    }
  }
  const renderExport = (onClick: VoidFunction) => {
    return (
      <div onClick={onClick} className='reverse-theme-button text-center w-full py-2'>
        导出字幕
      </div>
    )
  }
  const getState = useGetMediaState()
  return (
    <div className='p-5'>
      <Tabs tabNavMode='switch'>
        <TabPane key='pdf' tab='PDF'>
          <div className='rounded-lg border mt-5 mb-5'>
            {renderOption('label', false, () => {}, true)}
            {renderOption('highlight', false, () => {}, true)}
            {renderOption('translation', false, () => {}, true)}
            {renderOption('timestamp', false, () => {})}
          </div>
          {renderExport(() => {
            toPDF(subtitles, getState().name, true, true)
          })}
        </TabPane>
        <TabPane key='csv' tab='CSV'>
          <div className='rounded-lg border mt-5 mb-5'>
            {renderOption('translation', false, () => {}, true)}
            {renderOption('timestamp', false, () => {})}
          </div>
          {renderExport(() => {
            const blob = new Blob([toCSV(subtitles, true)])
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `${getState().name}.csv`
            link.click()
          })}
        </TabPane>
        <TabPane key='srt' tab='SRT'>
          <div className='rounded-lg border mt-5 mb-5'>{renderOption('translation', false, () => {}, false)}</div>
          {renderExport(() => {
            const blob = new Blob([toSRT(subtitles, true)])
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `${getState().name}.csv`
            link.click()
          })}
        </TabPane>
      </Tabs>
    </div>
  )
})
