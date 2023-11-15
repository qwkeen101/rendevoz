import { Content, VirtualList } from '@/components/base'
import Icon from '@/components/base/Icon'
import getEmoji from '@/utils/emoji'
import classNames from 'classnames'
import { FC, useLayoutEffect, useState } from 'react'
import styles from './index.module.less'
import categoriesJson from '@/assets/categories.json?raw'
import { ClassName } from 'rendevoz'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { Colors } from '@/consts'

type ICategory = Record<string, string[]>
type ICategories = {
  Emotion: ICategory
  People: ICategory
  Component: ICategory
  Nature: ICategory
  Travel: ICategory
  Activities: ICategory
  Objects: ICategory
  Symbols: ICategory
  Flags: ICategory
}
const categories = JSON.parse(categoriesJson)
const EmojiPicker: FC<{
  onPick?: (name: string) => void
  width?: number | string
}> = ({ onPick, width }) => {
  const recentlyUsedIcons = KeyvalueStore.useValue('recentlyUsedIcons')
  const [recentlyUsedEmojis, setRecentlyUsedEmojis] = useState([])
  const [emojisWithCategory, setEmojisWithCategory] = useState<
    {
      category: string
      emojis: {
        imageSrc: string
        name: string
        x: number
        y: number
      }[]
    }[]
  >([])
  const [realEmojis, setRealEmojis] = useState([])

  const handlePick = (i: string) => {
    KeyvalueStore.updateOne('recentlyUsedIcons', [i, ...(recentlyUsedIcons?.filter(o => o !== i) || [])].slice(0, 20))
    onPick?.(i)
  }
  useLayoutEffect(() => {
    setRealEmojis(
      recentlyUsedEmojis.length ? [{ category: 'Recently', emojis: recentlyUsedEmojis }, ...emojisWithCategory] : emojisWithCategory
    )
  }, [emojisWithCategory, recentlyUsedEmojis])
  useLayoutEffect(() => {
    if (categories) {
      const emojisWithCate = Object.entries(categories).map(i => ({
        category: i[0],
        emojis: Object.values(i[1])
          .flat(1)
          .map(i => getEmoji(i))
      }))
      setEmojisWithCategory(emojisWithCate)
      console.log(emojisWithCate)
    }
  }, [categories])
  useLayoutEffect(() => {
    setRecentlyUsedEmojis([])
    if (categories && recentlyUsedIcons?.length) {
      setRecentlyUsedEmojis(recentlyUsedIcons.map(i => getEmoji(i)))
    }
  }, [recentlyUsedIcons, categories])

  return (
    <Content fullHeight fullWidth style={{ overflow: 'hidden' }}>
      {realEmojis.length ? (
        <VirtualList
          estimateSize={600}
          items={realEmojis}
          style={{
            width: '100%',
            height: '100%',
            padding: '6px 0px'
          }}
          renderItem={o => (
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: Colors.Font.Transparent,
                  marginLeft: 8
                }}
              >
                {o.category}
              </div>
              <div className={styles.emojisContainer} style={{ display: 'flex', flexFlow: 'wrap', padding: 4, width }}>
                {o.emojis?.map(i => (
                  <Content key={i.name} onClick={() => handlePick?.(i.name)} flex centered className={styles.emojiContainer}>
                    <img
                      src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundImage: `url(${i?.imageSrc})`,
                        backgroundPositionX: `${(i?.x * 100) / 60}%`,
                        backgroundPositionY: `${(i?.y * 100) / 60}%`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '6000% 6000%'
                      }}
                    />
                  </Content>
                ))}
              </div>
            </div>
          )}
        ></VirtualList>
      ) : (
        <Content flex centered fullWidth style={{ height: '270px' }}>
          <Icon name="park-rotation" size={50} spin />
        </Content>
      )}
    </Content>
  )
}

export default EmojiPicker
