import { Content } from "@/components/base";
import Icon from "@/components/base/Icon";
import getEmoji from "@/utils/emoji";
import classNames from "classnames";
import { FC, useLayoutEffect, useState } from "react";
import styles from "./index.module.less";
import categoriesJson from "@/assets/categories.json?raw";

type ICategory = Record<string, string[]>;
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
const EmojiPicker: FC<{ onPick?: (name: string) => void; width?: number | string }> = ({ onPick, width }) => {
  const [currentCategory, setCurrentCategory] = useState<keyof ICategories>('Emotion')
  const [currentEmojis, setCurrentEmojis] = useState<[]>()
  useLayoutEffect(() => {
    setCurrentEmojis(undefined)
    if (categories) {
      const shortNames = Object.values(categories?.[currentCategory]).flat(1)
      setCurrentEmojis(shortNames.map(i => getEmoji(i)))
    }
  }, [currentCategory, categories])
  return (
    <Content flex column>
      <Content>
        {currentEmojis ? (
          <div className={styles.emojisContainer} style={{ display: 'flex', flexFlow: 'wrap', padding: 4, width }}>
            {currentEmojis?.map(i => (
              <Content key={i.name} onClick={() => onPick?.(i.name)} flex centered className={styles.emojiContainer}>
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
        ) : (
          <Content flex centered fullWidth style={{ height: '270px' }}>
            <Icon name="park-rotation" size={50} spin />
          </Content>
        )}
      </Content>
      <Content flex className={styles.categories} style={{ width: width }}>
        {categories &&
          Object.keys(categories).map(i => (
            <Content
              flex
              centered
              key={i}
              className={classNames(styles.category, i === currentCategory && styles.selected)}
              onClick={() => {
                setCurrentCategory(i)
              }}
            >
              {i}
            </Content>
          ))}
      </Content>
    </Content>
  )
}

export default EmojiPicker
