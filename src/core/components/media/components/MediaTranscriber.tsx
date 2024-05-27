import { SessionManager, AvailableModels, InferenceSession, DecodingOptionsBuilder, initialize } from 'whisper-turbo'
import { useEffect, useRef, useState } from 'react'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { Button, Content, Modal } from '@/components'
import Select from '@/components/base/select'
import { Colors } from '@/consts'
import { toast } from 'react-hot-toast'
import { assignProperties } from '@/utils'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import useMediaSidebarState from '@/core/components/media/hooks/useMediaSidebarState'
import toWebVTT from 'srt-webvtt'
import { useTranslation } from 'react-i18next'

const deleteModel = async (name: AvailableModels) => {
  const request = window.indexedDB.open('models')
  const dbs = await window.indexedDB.databases()
  request.onsuccess = ev => {
    const db = request.result
    if (db) {
      const transaction = (db as IDBDatabase).transaction(['availableModels'], 'readwrite')
      const store = transaction.objectStore('availableModels')
      const request = store.get(name)
      request.onsuccess = () => {
        const key = request.result
        store.delete(name)
        const t = (db as IDBDatabase).transaction(['models'], 'readwrite')
        const ms = t.objectStore('models')
        ms.delete(key)
        const t2 = (db as IDBDatabase).transaction(['tokenizer'], 'readwrite')
        const ms2 = t2.objectStore('tokenizer')
        ms2.delete(key)
      }
    }
  }
}

const getAvailableModels = async (): Promise<string[]> => {
  const dbs = await window.indexedDB.databases()
  if (dbs.some(i => i.name === 'models')) {
    const request = window.indexedDB.open('models')
    return new Promise(res => {
      try {
        request.onsuccess = ev => {
          const db = request.result
          if (db) {
            const transaction = (db as IDBDatabase).transaction('availableModels')
            const store = transaction.objectStore('availableModels')
            const request = store.getAllKeys()
            request.onsuccess = () => {
              res(request.result)
            }
          }
        }
      } catch (e) {
        return
      }
    })
  }
}
export default () => {
  const [transcribeState, setTranscribeState] = useState<{
    visible: boolean
    availableModels: string[]
    loading: boolean
    selectedModel?: string
    loadProgress?: string
    loaded?: boolean
  }>({
    loaded: false,
    visible: false,
    availableModels: [],
    loading: false
  })
  const instance = useMediaInstance()
  const [, setSidebarState] = useMediaSidebarState()
  const { t } = useTranslation()
  assignProperties(instance, {
    transcribe: () => {
      setTranscribeState(s => ({ ...s, visible: true }))
    }
  })
  const [, setMediaState] = useMediaState()
  useEffect(() => {
    setTimeout(() => {
      getAvailableModels().then(res => {
        if (res && res.length) {
          setTranscribeState(s => ({ ...s, availableModels: res, selectedModel: res.length ? res[0] : undefined }))
        }
      })
    })
    return () => {
      session.current?.destroy()
    }
  }, [])
  useEffect(() => {
    getAvailableModels().then(res => {
      if (res && res.length) {
        setTranscribeState(s => ({ ...s, availableModels: res, selectedModel: s.selectedModel }))
      }
    })
  }, [transcribeState.selectedModel])
  const session = useRef<InferenceSession>(null)
  const loadModel = async () => {
    if (session.current) {
      session.current.destroy()
    }
    if (transcribeState.loading) {
      return
    }
    if (!transcribeState.selectedModel) {
      return
    }
    setTranscribeState(s => ({ ...s, loading: true, loadProgress: '0', loaded: false }))
    const manager = new SessionManager()
    const loadResult = await manager.loadModel(
      transcribeState.selectedModel,
      () => {
        getAvailableModels().then(res => {
          if (res && res.length) {
            setTranscribeState(s => ({ ...s, availableModels: res, selectedModel: s.selectedModel }))
          }
        })
        setTranscribeState(s => ({
          ...s,
          loaded: true,
          loading: false,
          loadProgress: '0'
        }))
      },
      (p: number) => {
        setTranscribeState(s => ({ ...s, loadProgress: p.toFixed(0) }))
      }
    )
    if (loadResult.isErr) {
      toast.error(t('media.Failed to load model'))
    } else {
      session.current = loadResult.value
    }
  }
  function srtTimestamp(seconds) {
    let $milliseconds = seconds * 1000

    let $seconds = Math.floor($milliseconds / 1000)
    let $minutes = Math.floor($seconds / 60)
    let $hours = Math.floor($minutes / 60)
    $milliseconds = $milliseconds % 1000
    $seconds = $seconds % 60
    $minutes = $minutes % 60
    return (
      ($hours < 10 ? '0' : '') +
      $hours +
      ':' +
      ($minutes < 10 ? '0' : '') +
      $minutes +
      ':' +
      ($seconds < 10 ? '0' : '') +
      $seconds +
      ',' +
      ($milliseconds < 100 ? '0' : '') +
      ($milliseconds < 10 ? '0' : '') +
      $milliseconds
    )
  }

  const runSession = async () => {
    const audio = await instance.getAudioFile?.()
    if (audio) {
      const bf = await audio.arrayBuffer()
      if (bf) {
        let count = 0
        function inputToSRT(s) {
          return ++count + '\r\n' + srtTimestamp(s.start) + ' --> ' + srtTimestamp(s.stop) + '\r\n' + s.text?.trim() + '\r\n\r\n'
        }
        let str = ''
        let lastProcessDate = Date.now()
        instance.on?.({ type: 'transcribe' })
        instance.cancelTranscribe = () => {
          session.current?.destroy()
          setMediaState(s => ({ ...s, isTranscribing: false }))
        }
        setMediaState(s => ({
          ...s,
          isTranscribing: true,
          subtitleList: [
            ...(s.subtitleList || []),
            {
              lang: 'Transcription'
            }
          ],
          subtitleLang: 'Transcription',
          subtitles: []
        }))
        await initialize()
        let options = new DecodingOptionsBuilder().setTask('transcribe').build()
        console.log(options)
        session.current
          ?.transcribe(new Uint8Array(bf), false, options, s => {
            lastProcessDate = Date.now()
            console.log(s)
            // if 15s not making new transcription, throw error
            setTimeout(() => {
              if (Date.now() - lastProcessDate > 25000) {
                session.current?.destroy()
                setMediaState(s => ({ ...s, isTranscribing: false }))
                throw new Error()
              }
            }, 30000)
            if (s.start < s.stop && s.text) {
              setSidebarState(b => ({ ...b, showSubtitles: true }))
              setMediaState(b => ({
                ...b,
                subtitles: [
                  ...(b.subtitles || []),
                  {
                    startTime: s.start,
                    endTime: s.stop,
                    text: s.text?.trim()
                  }
                ]
              }))
              str += inputToSRT(s)
            }
          })
          .then(async () => {
            const vttFileUrl = await toWebVTT(new Blob([str]))
            const blob = await (await fetch(vttFileUrl)).blob()
            const path = await instance.on?.({ type: 'transcribeFinished', vttText: blob })
            setMediaState(s => ({ ...s, isTranscribing: false, subtitleUrl: path }))
          })
          .catch(e => {
            console.log(e)
            toast.error(t('media.Failed to load model'))
          })
          .finally(() => {
            setMediaState(s => ({ ...s, isTranscribing: false }))
          })
      }
    }
  }
  return (
    <Modal visible={transcribeState.visible} onClose={() => setTranscribeState(s => ({ ...s, visible: false }))}>
      <Content flex column style={{ padding: 16, width: 400 }}>
        <div style={{ fontWeight: 600, fontSize: 20 }}>{t('media.Transcribe audio')}</div>
        <div style={{ fontSize: 12, color: Colors.Font.Transparent, marginBottom: 24 }}>{t('media.Transcribe tips')}</div>
        <Content flex justifyContent={'space-between'}>
          <div>{t('media.Select one model')}</div>
          <Select
            defaultValue={AvailableModels.WHISPER_BASE}
            placeholder={'Select'}
            value={transcribeState.selectedModel}
            closeOnSelect={true}
            onSelect={v => setTranscribeState(s => ({ ...s, selectedModel: v[0] as string }))}
            options={[
              {
                value: AvailableModels.WHISPER_TINY,
                children: 'Tiny - 51MB'
              },
              {
                value: AvailableModels.WHISPER_BASE,
                children: 'Base - 96MB'
              },
              {
                value: AvailableModels.WHISPER_SMALL,
                children: 'Small - 310MB'
              },
              {
                value: AvailableModels.WHISPER_MEDIUM,
                children: 'Medium - 970MB'
              }
            ]}
          />
        </Content>

        <Content flex gap={12} alignItems={'center'} style={{ fontSize: 13, marginTop: 12 }}>
          {transcribeState.availableModels.includes(transcribeState.selectedModel || '') ? (
            <>
              <Button.IconButton
                style={{ border: `1px solid ${Colors.Background.Border}` }}
                text={t('general.Load')}
                spin={transcribeState.loading}
                icon={transcribeState.loading ? 'park-loading-four' : 'park-tool'}
                onClick={() => {
                  loadModel()
                }}
              ></Button.IconButton>
              <Button.IconButton
                style={{ border: `1px solid ${Colors.Background.Border}` }}
                text={t('general.delete')}
                onClick={() => {
                  deleteModel(transcribeState.selectedModel)
                  setTimeout(() => {
                    getAvailableModels().then(res => setTranscribeState(s => ({ ...s, availableModels: res })))
                  })
                }}
                icon={'park-delete-one'}
              />
              {transcribeState.loaded && (
                <Button.IconButton
                  style={{
                    width: 'fit-content',
                    border: `1px solid ${Colors.Background.Border}`
                  }}
                  text={t('media.Transcribe')}
                  onClick={() => runSession()}
                />
              )}
            </>
          ) : (
            <>
              <Button.IconButton
                style={{ border: `1px solid ${Colors.Background.Border}` }}
                text={t('media.Download model')}
                onClick={() => {
                  loadModel()
                }}
                icon={'park-download'}
              ></Button.IconButton>
              {transcribeState.loadProgress && transcribeState.loading && <div>{transcribeState.loadProgress}%</div>}
            </>
          )}
        </Content>
      </Content>
    </Modal>
  )
}
