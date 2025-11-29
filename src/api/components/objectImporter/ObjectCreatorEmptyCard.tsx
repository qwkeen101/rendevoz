import { Colors } from '@/consts'
import { memo } from 'react'
import { range } from 'lodash'
import './index.less'
import { Icon } from '@/components'
import { useTranslation } from 'react-i18next'

const Note = memo(({ onClick }: { onClick: VoidFunction }) => {
  const color = Colors.getAdaptColor('rgb(51, 126, 169)')
  const { t } = useTranslation()
  return (
    <div
      style={{
        border: `1px solid rgba(from ${color} r g b / 0.3)`,
        background: `rgba(from ${color} r g b / var(--tw-bg-opacity))`,
        height: 168
      }}
      onClick={onClick}
      className={'px-5 pt-4 group overflow-hidden cursor-pointer default-transition bg-opacity-[0.22] rounded-xl hover:bg-opacity-35'}
    >
      <div className={'font-medium'}>{Global.utils.getTypeName('note')}</div>
      <div className={'small-transparent'}>{t('general.Start writing, keep thinking')}</div>
      <div className={'relative mt-3'}>
        <div
          style={{
            width: 'calc(100% + 2rem)',
            background: 'var(--popover-background)',
            height: 168
          }}
          className={'object-creator-empty-card transition-transform group-hover:-translate-y-1 pt-2 px-3 rounded-md'}
        >
          <div className={'super-transparent-font font-medium mb-2'}>Untitled</div>
          {range(0, 5).map(i => (
            <div
              style={{
                width: `calc(100% - 2rem - ${i % 2 !== 0 ? '2rem' : '0px'})`,
                height: 8,
                borderRadius: 6
              }}
              key={i}
              className={'bg-button-hover mb-2'}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
})

const Whiteboard = memo(({ onClick }: { onClick: VoidFunction }) => {
  const color = Colors.getAdaptColor('rgb(45, 153, 100)')
  const { t } = useTranslation()
  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid rgba(from ${color} r g b / 0.26)`,
        background: `rgba(from ${color} r g b / var(--tw-bg-opacity))`,
        height: 168
      }}
      className={'px-5 pt-4 group overflow-hidden cursor-pointer default-transition bg-opacity-[0.16] rounded-xl hover:bg-opacity-35'}
    >
      <div className={'font-medium'}>{Global.utils.getTypeName('whiteboard')}</div>
      <div className={'small-transparent'}>{t('general.Manage knowledge visually')}</div>
      <div className={'relative mt-3'}>
        <div
          style={{
            width: 'calc(100% + 2rem)',
            height: 168,
            background: 'var(--popover-background)'
          }}
          className={'transition-transform group-hover:-translate-y-1 object-creator-empty-card rounded-md'}
        >
          <svg preserveAspectRatio={'none'} className={'w-full h-full'}>
            <path fill={'none'} stroke={'var(--button-hover-background)'} strokeWidth={1.5} d={'M45 30 C55 30, 70 55, 80 55'}></path>
            <path fill={'none'} stroke={'var(--button-hover-background)'} strokeWidth={1.5} d={'M45 80 C55 80, 70 55, 80 55'}></path>
            <path fill={'none'} stroke={'var(--button-hover-background)'} strokeWidth={1.5} d={'M130 55 C140 55, 150 45, 168 45'}></path>
            <rect x={15} y={65} width={30} height={30} rx={4} fill={'var(--button-hover-background)'} />
            <rect x={15} y={15} width={30} height={30} rx={4} fill={'var(--button-hover-background)'} />
            <rect x={80} y={40} width={50} height={30} rx={4} fill={'var(--button-hover-background)'} />
            <rect x={168} y={15} width={30} height={60} rx={4} fill={'var(--button-hover-background)'} />
          </svg>
        </div>
      </div>
    </div>
  )
})

const Group = memo(({ onClick }: { onClick: VoidFunction }) => {
  const color = Colors.getAdaptColor('rgb(222, 85, 88)')
  const { t } = useTranslation()
  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid rgba(from ${color} r g b / 0.3)`,
        background: `rgba(from ${color} r g b / var(--tw-bg-opacity))`,
        height: 170
      }}
      className={'px-5 pt-4 group overflow-hidden cursor-pointer transition-colors bg-opacity-[0.22] rounded-xl hover:bg-opacity-35'}
    >
      <div className={'font-medium'}>{Global.utils.getTypeName('group')}</div>
      <div className={'small-transparent'}>{t('general.Efficient file organization')}</div>
      <div className={'relative mt-3'}>
        <div
          style={{
            width: 'calc(100% + 2rem)',
            height: 170,
            background: 'var(--popover-background)'
          }}
          className={'transition-transform group-hover:-translate-y-1 pt-2 px-3 object-creator-empty-card rounded-md'}
        >
          <div className={'font-medium font-size-12 mb-1 flex items-center gap-2 pl-0.5'}>
            <Icon size={14} name={'park-bookshelf'} theme={'filled'} style={{ color }} />
            Ideas
          </div>
          <div className={'grid grid-cols-3 w-full'}>
            <div className={'flex flex-col'}>
              <div style={{ fontSize: 9 }} className={'small-transparent border-bottom pb-0.5 pl-1'}>
                Name
              </div>
              <div
                style={{
                  height: 19,
                  width: '100%'
                }}
                className={'flex items-center border-bottom pl-1'}
              >
                <div
                  className={'bg-button-hover'}
                  style={{
                    width: '65%',
                    height: 5,
                    borderRadius: 6
                  }}
                ></div>
              </div>
              <div
                style={{
                  height: 19,
                  width: '100%'
                }}
                className={'flex items-center border-bottom pl-1'}
              >
                <div
                  className={'bg-button-hover'}
                  style={{
                    width: '60%',
                    height: 5,
                    borderRadius: 6
                  }}
                ></div>
              </div>
              <div
                style={{
                  height: 19,
                  width: '100%'
                }}
                className={'flex items-center border-bottom pl-1'}
              >
                <div
                  className={'bg-button-hover'}
                  style={{
                    width: '65%',
                    height: 5,
                    borderRadius: 6
                  }}
                ></div>
              </div>
            </div>
            <div className={'flex flex-col'}>
              <div style={{ fontSize: 9 }} className={'small-transparent border-bottom pb-0.5 pl-1'}>
                Tags
              </div>
              <div
                style={{
                  height: 19,
                  width: '100%'
                }}
                className={'flex items-center border-bottom pl-1'}
              >
                <div
                  style={{
                    color: Colors.getAdaptFontColor('rgb(233, 126, 35)'),
                    background: `rgba(from ${Colors.getAdaptColor('rgb(233, 126, 35)')} r g b / 0.45)`,
                    fontSize: 8,
                    lineHeight: '12px',
                    height: 12,
                    padding: '0px 4px',
                    borderRadius: 3
                  }}
                >
                  Culture
                </div>
              </div>
              <div
                style={{
                  height: 19,
                  width: '100%'
                }}
                className={'flex items-center border-bottom pl-1'}
              >
                <div
                  style={{
                    fontSize: 8,
                    height: 12,
                    padding: '0px 4px',
                    borderRadius: 3,
                    lineHeight: '12px',
                    color: Colors.getAdaptFontColor('rgb(45, 153, 100)'),
                    background: `rgba(from ${Colors.getAdaptColor('rgb(45, 153, 100)')} r g b / 0.45)`
                  }}
                >
                  Economy
                </div>
              </div>
              <div
                style={{
                  height: 19,
                  width: '100%'
                }}
                className={'flex items-center border-bottom pl-1'}
              >
                <div
                  style={{
                    fontSize: 8,
                    height: 12,
                    padding: '0px 4px',
                    borderRadius: 3,
                    lineHeight: '12px',
                    color: Colors.getAdaptFontColor('rgb(51, 126, 169)'),
                    background: `rgba(from ${Colors.getAdaptColor('rgb(51, 126, 169)')} r g b / 0.45)`
                  }}
                >
                  Biology
                </div>
              </div>
            </div>
            <div className={'flex flex-col'}>
              <div style={{ fontSize: 9 }} className={'small-transparent border-bottom pb-0.5 pl-1'}>
                Date
              </div>
              <div
                style={{
                  height: 19,
                  width: '100%'
                }}
                className={'flex items-center border-bottom pl-1'}
              >
                <div
                  className={'bg-button-hover'}
                  style={{
                    width: '65%',
                    height: 5,
                    borderRadius: 6
                  }}
                ></div>
              </div>
              <div
                style={{
                  height: 19,
                  width: '100%'
                }}
                className={'flex items-center border-bottom pl-1'}
              >
                <div
                  className={'bg-button-hover'}
                  style={{
                    width: '60%',
                    height: 5,
                    borderRadius: 6
                  }}
                ></div>
              </div>
              <div
                style={{
                  height: 19,
                  width: '100%'
                }}
                className={'flex items-center border-bottom pl-1'}
              >
                <div
                  className={'bg-button-hover'}
                  style={{
                    width: '65%',
                    height: 5,
                    borderRadius: 6
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

const Chat = memo(({ onClick }: { onClick: VoidFunction }) => {
  const color = Colors.getAdaptColor('rgb(162, 105, 50)')
  const { t } = useTranslation()
  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid rgba(from ${color} r g b / 0.39)`,
        background: `rgba(from ${color} r g b / var(--tw-bg-opacity))`,
        height: 168
      }}
      className={'px-5 pt-4 group overflow-hidden cursor-pointer default-transition bg-opacity-[0.17] rounded-xl hover:bg-opacity-35'}
    >
      <div className={'font-medium'}>{Global.utils.getTypeName('chat')}</div>
      <div className={'small-transparent'}>{t('general.Study better with AI')}</div>
      <div className={'relative mt-3'}>
        <div
          style={{
            width: 'calc(100% + 2rem)',
            background: 'var(--popover-background)',
            height: 168
          }}
          className={'shadow transition-transform group-hover:-translate-y-1 object-creator-empty-card p-3 rounded-md'}
        >
          <div
            className={'ml-auto mr-3 bg-button-hover'}
            style={{
              width: '10%',
              height: 6,
              borderRadius: 2
            }}
          ></div>
          <div className={'chat-bubble right'}></div>
          <div
            className={'mr-auto bg-button-hover'}
            style={{
              width: '10%',
              height: 6,
              borderRadius: 2
            }}
          ></div>
          <div className={'chat-bubble left'}></div>
          <div
            className={'ml-auto mr-3 bg-button-hover'}
            style={{
              width: '10%',
              height: 6,
              borderRadius: 2
            }}
          ></div>
          <div style={{ maxWidth: '40%' }} className={'chat-bubble right'}></div>
        </div>
      </div>
    </div>
  )
})

const Exam = memo(({ onClick }: { onClick: VoidFunction }) => {
  const color = Colors.getAdaptColor('rgb(186, 147, 216)')
  const { t } = useTranslation()
  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid rgba(from ${color} r g b / 0.39)`,
        background: `rgba(from ${color} r g b / var(--tw-bg-opacity))`,
        height: 168
      }}
      className={'px-5 pt-4 group overflow-hidden cursor-pointer default-transition bg-opacity-[0.2] rounded-xl hover:bg-opacity-35'}
    >
      <div className={'font-medium'}>{Global.utils.getTypeName('exam')}</div>
      <div className={'small-transparent'}>{t('general.Master knowledge through Q&A')}</div>
      <div className={'relative mt-3'}>
        <div
          style={{
            width: 'calc(100% + 2rem)',
            background: 'var(--popover-background)',
            height: 168
          }}
          className={'shadow transition-transform group-hover:-translate-y-1 object-creator-empty-card p-3 rounded-md'}
        >
          <div className={'flex super-transparent-font font-medium items-center gap-3 mb-1'}>
            1.
            <div
              className={'bg-button-hover'}
              style={{
                height: 12,
                borderRadius: 6,
                width: 'calc(100% - 3rem)'
              }}
            ></div>
          </div>
          <div className={'flex super-transparent-font font-medium items-center gap-3 mb-1'}>
            2.
            <div
              className={'bg-button-hover'}
              style={{
                height: 12,
                borderRadius: 6,
                width: 'calc(100% - 5rem)'
              }}
            ></div>
          </div>
          <div className={'flex super-transparent-font font-medium items-center gap-3 mb-1'}>
            3.
            <div
              className={'bg-button-hover'}
              style={{
                height: 12,
                borderRadius: 6,
                width: 'calc(100% - 4rem)'
              }}
            ></div>
          </div>
          <div className={'flex super-transparent-font font-medium items-center gap-3'}>
            4.
            <div
              className={'bg-button-hover'}
              style={{
                height: 12,
                borderRadius: 6,
                width: 'calc(100% - 6rem)'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
})

const FileImporter = ({ onClick }: { onClick: VoidFunction }) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 18px'
      }}
      className={'border font-medium flex flex-col items-start gap-2 rounded-xl cursor-pointer light-hover transition-colors'}
    >
      <Icon size={19} className={'transparent-font'} name={'park-file-addition-one'} />
      <div>上传文件</div>
    </div>
  )
}

const URLImporter = ({ onClick }: { onClick: VoidFunction }) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 18px'
      }}
      className={'border font-medium flex flex-col items-start gap-2 rounded-xl cursor-pointer light-hover transition-colors'}
    >
      <Icon size={19} className={'transparent-font'} name={'park-link-one'} />
      <div>导入URL</div>
    </div>
  )
}

const BaiduImporter = ({ onClick }: { onClick: VoidFunction }) => {
  const isChinese = navigator.language === 'zh-CN'
  if (!isChinese) return null
  return (
    <div
      style={{
        padding: '16px 18px'
      }}
      onClick={onClick}
      className={'border font-medium flex flex-col items-start gap-2 rounded-xl cursor-pointer light-hover transition-colors'}
    >
      <Icon size={19} className={'transparent-font'} name={'park-hard-disk'} />
      <div>从百度网盘导入</div>
    </div>
  )
}
export default {
  Exam,
  Note,
  Whiteboard,
  Group,
  Chat,
  FileImporter,
  URLImporter,
  BaiduImporter
}
