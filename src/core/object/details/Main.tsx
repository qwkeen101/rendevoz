import { MetaStore } from '@/api/stores'
import { AnimatePopover, Button, Content, Icon, IconWithPopover, Image, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { AttachmentWrapper, GlobalGraphInstance, useRenderObject } from '@/core'
import { css } from '@emotion/css'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalInstance } from '@/hooks'
import { RelatedPanel } from '@/core/object/details/Related'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import Tag from '@/core/object/ObjectTag'
import LabelDetailsRenderer from '@/core/object/renderer/LabelDetailsRenderer'
import MetaPropDisplayer from '@/core/object/renderer/properties/MetaPropDisplayer'
import ParentItems from '@/core/object/details/ParentItems'
import Backlinks from '@/core/object/details/Backlinks'
import { useEffect, useState } from 'react'
import calculateContains from '@/core/object/objectList/calculateContains'
import classnames from 'classnames'
import './index.less'

const flatButton = classnames([
  css({
    padding: '4px 12px 4px 10px !important',
    borderRadius: '6px !important'
  }),
  'border-box-shadow',
  'hover-s-transparent-box-shadow'
])

const SectionMargin = '20px 0px 8px'
const MetaMainDetails = ({ metaId, visible }: { metaId: number; visible?: boolean }) => {
  const object = MetaStore.useValue(metaId)
  const { renderWhole, metaObject } = useRenderObject({ metaObjectId: metaId })
  const { t } = useTranslation()
  const [showContains, setShowContains] = useState(false)
  useEffect(() => {
    if (GlobalInstance.metaOps?.canViewContains(metaId)) {
      const m = MetaStore.getCachedMetaObject(metaId)
      if (m && !m.deleted) {
        calculateContains(m).then(res => {
          if (res?.length) {
            setShowContains(true)
            return
          }
          setShowContains(false)
        })
        return
      }
      setShowContains(false)
      return
    }
    setShowContains(false)
  }, [metaId, visible])
  if (!object) return null

  return (
    <Content flex column fullHeight>
      <Content flex gap={12}>
        {object?.coverImgSrc && (
          <Image
            preview={true}
            src={object.coverImgSrc}
            width={96}
            height={96}
            containerStyle={{
              borderRadius: 8
            }}
            style={{ objectFit: 'cover' }}
          />
        )}
        <Content flex column auto gap={5} justifyContent={'center'}>
          {metaObject?.type?.includes('Label') ? (
            <LabelDetailsRenderer
              showImage={false}
              showVideo={false}
              showAudio={false}
              metaId={metaId}
              style={{
                border: '1px solid var(--border-background)',
                borderRadius: 8,
                fontSize: 14
              }}
            />
          ) : (
            renderWhole({
              columnGap: 3,
              titleOptions: {
                style: {
                  maxWidth: 'calc(100% - 16px)',
                  zIndex: 30,
                  fontSize: 15,
                  lineHeight: 1.5
                }
              },
              renderOptions: {
                renderTags: false,
                renderImage: false
              }
            })
          )}
        </Content>
      </Content>
      <Content style={{ marginTop: 16, flexWrap: 'wrap' }} flex gap={12}>
        <Button.IconButton
          onClick={() => {
            Rendevoz.Actions.Open.Meta.openEditMetaDialog(metaId)
            GlobalInstance.metaOps?.closeDetails()
          }}
          style={{
            background: 'transparent'
          }}
          text={t('general.edit')}
          icon={'park-edit'}
          className={flatButton}
        ></Button.IconButton>
        {showContains && (
          <Button.IconButton
            style={{
              background: 'transparent'
            }}
            icon={'park-hamburger-button'}
            text={t('general.View included objects')}
            onClick={() => {
              GlobalInstance.metaOps?.viewContains(metaId)
            }}
            className={flatButton}
          />
        )}
        <Button.IconButton
          onClick={() => {
            GlobalInstance.metaOps?.closeDetails()
            GlobalInstance.metaOps?.openGraph(metaId)
          }}
          style={{
            background: 'transparent'
          }}
          text={t('general.graph')}
          icon={'park-share-one'}
          className={flatButton}
        ></Button.IconButton>
        <Button.IconButton
          text={t('general.Copy link')}
          onClick={() => {
            GlobalInstance.metaOps?.copyLink(metaId)
          }}
          style={{
            background: 'transparent'
          }}
          icon={'park-link'}
          className={flatButton}
        />
        <Button.IconButton
          text={t('general.delete')}
          icon={'park-delete-one'}
          dangerous={true}
          className={'details-hover-delete-button'}
          onClick={() => {
            GlobalInstance.metaOps?.closeDetails()
            MetaStore.deleteMetaObject(metaId)
          }}
        ></Button.IconButton>
      </Content>
      <Backlinks metaId={metaId} visible={visible} />
      <Content
        flex
        alignItems={'center'}
        gap={8}
        style={{
          fontSize: 14,
          margin: SectionMargin
        }}
      >
        <Icon name={'park-tag-one'} size={16} />
        {t('general.Tags')}
      </Content>
      <AnimatePopover
        positions={['bottom', 'top']}
        reposition
        align={'start'}
        withClickCover
        content={
          <WithBorder width={360}>
            <MetaTagPicker
              style={{
                flexShrink: 0,
                borderRadius: 8
              }}
              alreadyTags={object?.tags || []}
              onChange={tags => {
                MetaStore.updateMetaObject({ id: metaId, tags })
              }}
            />
          </WithBorder>
        }
      >
        <Content
          flex
          gap={6}
          style={{
            flexWrap: 'wrap',
            cursor: 'pointer',
            border: '1px solid var(--border-background)',
            borderRadius: 8,
            padding: '8px',
            width: '100%'
          }}
        >
          {object.tags?.length ? (
            object.tags?.map(i => <Tag square hideDelete hideSize tag={i} key={i} />)
          ) : (
            <Button.IconButton
              icon={'park-plus'}
              style={{
                fontSize: 14,
                padding: '5px 6px',
                color: Colors.Font.Transparent,
                minWidth: 160
              }}
              text={`${t('general.Add tags')}`}
            ></Button.IconButton>
          )}
        </Content>
      </AnimatePopover>
      <Content
        flex
        alignItems={'center'}
        gap={8}
        style={{
          fontSize: 14,
          margin: SectionMargin
        }}
      >
        <Icon name={'custom-property'} size={18} />
        {t('general.Properties')}
      </Content>
      <Content
        style={{
          padding: 8,
          width: '100%',
          borderRadius: 8,
          border: Colors.Consts.Border
        }}
      >
        <MetaPropDisplayer metaId={metaId} showAddPropPlaceholder={true} />
      </Content>
      <Content
        flex
        alignItems={'center'}
        gap={8}
        style={{
          fontSize: 14,
          margin: SectionMargin
        }}
      >
        <Icon name={'park-share-one'} size={16} />
        {t('general.Linked objects')}
      </Content>
      <RelatedPanel
        style={{
          minHeight: 140,
          borderRadius: 8,
          maxHeight: 400,
          overflowY: 'auto',
          padding: '6px',
          border: '1px solid var(--border-background)'
        }}
        metaId={metaId}
      />
      <ParentItems metaId={metaId} />
      <Content
        flex
        alignItems={'center'}
        gap={8}
        style={{
          fontSize: 14,
          margin: SectionMargin
        }}
      >
        <Icon name={'park-link-three'} size={16} />
        {t('general.Attachments')}
      </Content>
      <AttachmentWrapper
        showField={false}
        innerContainerStyle={{
          justifyContent: 'space-between',
          height: '100%',
          overflowY: 'auto'
        }}
        visible={true}
        maxVisibleAttachments={10}
        metaId={metaId}
      />
    </Content>
  )
}

export default MetaMainDetails
