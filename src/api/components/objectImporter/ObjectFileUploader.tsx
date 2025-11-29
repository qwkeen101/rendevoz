import { memo, useMemo, useState } from 'react'
import LocalImporter from '@/api/components/objectImporter/LocalImporter'
import WebImporter from '@/api/components/objectImporter/WebImporter'
import { FormFooter, Icon, Tooltip } from '@/components'
import { atom } from 'jotai/index'
import { createStore, Provider } from 'jotai'
import { IImportable } from '~/typings'
import BaidudiskImporter from '@/api/components/objectImporter/baidudisk/BaidudiskImporter'
import { useTranslation } from 'react-i18next'
import ToolTip from '@/components/base/Tooltip'
import ytb from '@/assets/images/youtube.png'
import xyz from './xiaoyuzhou.png?url'
import bilibili from './bilibili.png?url'
export const ImportStateAtom = atom<IImportable>({
  files: [],
  folders: [],
  urls: [],
  baidu: []
})

export type IFileUploaderTab = 'file' | 'url' | 'baidu'
export default memo(
  ({ onImport, onCancel, tab }: { onImport?: (i: IImportable) => void; onCancel?: VoidFunction; tab?: IFileUploaderTab }) => {
    const store = useMemo(() => createStore(), [])
    const { t } = useTranslation()
    return (
      <Provider store={store}>
        <div
          style={{
            width: tab === 'baidu' ? 'auto' : 480,
            minWidth: tab === 'baidu' ? 600 : undefined
          }}
        >
          <div className={'w-full'}>
            {tab !== 'baidu' && <div className={'flex text-lg pt-5 px-6 font-medium'}>{t('general.Import files')}</div>}
            {tab === 'file' && <LocalImporter />}
            {tab === 'url' && <WebImporter />}
            {tab === 'baidu' && <BaidudiskImporter />}
          </div>
          <FormFooter
            className={'border-top px-6 py-5'}
            onCancel={onCancel}
            left={
              tab === 'url' ? (
                <div className={'flex gap-3 items-center select-none font-size-12 transparent-font'}>
                  <div>{t('general.Supported sites')}:</div>
                  <Tooltip content={'Youtube'}>
                    <img className={'h-7 object-fill'} src={ytb} />
                  </Tooltip>
                  <Tooltip content={'Bilibili'}>
                    <img className={'h-5 object-fill'} src={bilibili} />
                  </Tooltip>
                  <Tooltip content={'X'}>
                    <svg className={'h-5'} viewBox='0 0 1200 1227' xmlns='http://www.w3.org/2000/svg'>
                      <path
                        fill='currentColor'
                        d='M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z'
                      />
                    </svg>
                  </Tooltip>
                  <Tooltip content={'Apple Podcasts'}>
                    <svg xmlns='http://www.w3.org/2000/svg' version='1.1' className={'h-6'} viewBox='0 0 73 73'>
                      <g>
                        <linearGradient id='SVGID_1_' gradientUnits='userSpaceOnUse' x1='36' y1='9.094947e-13' x2='36' y2='72'>
                          <stop offset='0' style={{ stopColor: '#D56EFC' }} />
                          <stop offset='1' style={{ stopColor: '#832BC1' }} />
                        </linearGradient>
                        <path
                          fill={'url(#SVGID_1_)'}
                          d='M72,22.523c0-0.86,0-1.72-0.005-2.58c-0.004-0.724-0.013-1.449-0.032-2.173    c-0.043-1.577-0.136-3.169-0.416-4.728c-0.285-1.584-0.749-3.058-1.482-4.497c-0.72-1.414-1.66-2.707-2.781-3.828    c-1.122-1.122-2.415-2.062-3.829-2.782c-1.438-0.732-2.912-1.197-4.495-1.481c-1.56-0.281-3.152-0.373-4.73-0.416    c-0.724-0.02-1.448-0.028-2.173-0.032C51.197,0,50.337,0,49.477,0H22.523c-0.86,0-1.72,0-2.58,0.005    c-0.724,0.004-1.449,0.013-2.173,0.032c-1.578,0.043-3.17,0.136-4.73,0.416c-1.583,0.285-3.056,0.749-4.495,1.481    c-1.414,0.72-2.707,1.66-3.829,2.782C3.595,5.838,2.654,7.131,1.935,8.544c-0.733,1.439-1.197,2.913-1.482,4.497    c-0.28,1.56-0.373,3.151-0.416,4.728c-0.02,0.724-0.028,1.448-0.032,2.173C0,20.803,0,21.663,0,22.523v26.955    c0,0.86,0,1.72,0.005,2.58c0.004,0.724,0.013,1.449,0.032,2.173c0.043,1.577,0.136,3.169,0.416,4.728    c0.285,1.584,0.749,3.058,1.482,4.497c0.72,1.414,1.66,2.707,2.781,3.828c1.122,1.122,2.415,2.062,3.829,2.782    c1.438,0.732,2.912,1.197,4.495,1.481c1.56,0.281,3.152,0.373,4.73,0.416c0.724,0.02,1.448,0.028,2.173,0.032    C20.803,72,21.663,72,22.523,72h26.955c0.86,0,1.72,0,2.58-0.005c0.724-0.004,1.449-0.013,2.173-0.032    c1.578-0.043,3.17-0.136,4.73-0.416c1.583-0.285,3.056-0.749,4.495-1.481c1.414-0.72,2.707-1.66,3.829-2.782    c1.122-1.122,2.062-2.415,2.781-3.828c0.733-1.439,1.197-2.913,1.482-4.497c0.28-1.56,0.373-3.151,0.416-4.728    c0.02-0.724,0.028-1.448,0.032-2.173C72,51.197,72,50.337,72,49.477V22.523z'
                        />
                      </g>
                      <path
                        fill={'#FFFFFF'}
                        d='M35.977,26.184c2.976,0,5.388,2.411,5.388,5.386c0,2.975-2.412,5.386-5.388,5.386   c-2.976,0-5.388-2.411-5.388-5.386C30.59,28.595,33.002,26.184,35.977,26.184z M51.486,33.458c0,5.315-2.69,10.014-6.78,12.808   c-0.208,0.142-0.491-0.019-0.475-0.27c0.057-0.945,0.075-1.782,0.026-2.643c-0.016-0.283,0.095-0.559,0.302-0.753   c2.439-2.289,3.965-5.54,3.965-9.141c0-7.08-5.899-12.809-13.042-12.533c-6.572,0.255-11.873,5.623-12.046,12.196   c-0.098,3.735,1.446,7.118,3.961,9.479c0.207,0.194,0.317,0.47,0.302,0.752c-0.048,0.861-0.031,1.698,0.027,2.644   c0.015,0.251-0.267,0.413-0.475,0.271c-4.143-2.829-6.849-7.612-6.78-13.011c0.105-8.208,6.688-14.972,14.894-15.29   C44.193,17.625,51.486,24.706,51.486,33.458z M35.91,10.316c12.796-0.036,23.217,10.359,23.217,23.143   c0,10.078-6.477,18.67-15.488,21.838c-0.221,0.078-0.445-0.106-0.41-0.337c0.119-0.792,0.232-1.587,0.335-2.37   c0.036-0.276,0.212-0.516,0.467-0.627c7.135-3.115,12.134-10.236,12.134-18.504c0-11.183-9.146-20.271-20.354-20.181   C24.848,13.366,15.896,22.301,15.79,33.26c-0.081,8.351,4.941,15.561,12.132,18.701c0.256,0.112,0.432,0.35,0.469,0.627   c0.103,0.783,0.216,1.579,0.335,2.371c0.035,0.232-0.189,0.415-0.41,0.337c-9.098-3.199-15.613-11.927-15.487-22.13   C12.985,20.571,23.31,10.352,35.91,10.316z M35.977,39.132c2.048,0,3.784,0.668,4.771,1.71c0.516,0.544,0.788,1.101,0.874,1.895   c0.166,1.538,0.073,2.862-0.107,4.978c-0.172,2.017-0.497,4.707-0.923,7.446c-0.303,1.95-0.549,3.002-0.773,3.755   c-0.363,1.221-1.72,2.289-3.842,2.289s-3.479-1.068-3.842-2.289c-0.224-0.753-0.47-1.806-0.773-3.755   c-0.425-2.739-0.751-5.429-0.923-7.446c-0.18-2.117-0.274-3.441-0.107-4.978c0.086-0.794,0.358-1.351,0.874-1.895   C32.194,39.8,33.929,39.132,35.977,39.132z'
                      />
                    </svg>
                  </Tooltip>
                  <Tooltip content={'小宇宙FM'}>
                    <img className={'h-[21.5px] object-cover'} src={xyz} />
                  </Tooltip>
                </div>
              ) : tab === 'file' ? (
                <ToolTip content={<div className={'max-w-72'}>{t('general.Upload file desc')}</div>}>
                  <div
                    className={'transparent-font font-medium hover-primary-color transition-colors flex items-center gap-2 cursor-pointer'}
                  >
                    <Icon strokeWidth={4} name={'park-help'} />
                    <div>{t('general.Supported formats')}</div>
                  </div>
                </ToolTip>
              ) : null
            }
            onConfirm={() => {
              onImport?.(store.get(ImportStateAtom))
            }}
          />
        </div>
      </Provider>
    )
  }
)
