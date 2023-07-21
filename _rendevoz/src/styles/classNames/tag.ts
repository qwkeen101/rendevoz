import { css } from "@emotion/css";
import ClassName from ".";
import FontSize from "@/consts/font";

export const TagBackgrounds = {
  blue: "rgba(228,239,254,1)",
  amber: "rgba(255,246,214,1)",
  grey: "rgba(0,0,0,0.07)",
  transparent: "rgba(255,255,255,0.6)",
};
export const tag = (
  background = TagBackgrounds.transparent,
  color = 'rgb(120,53,15)',
  backdropFilter?: string,
  fontSize = FontSize['11px']
) =>
  css([
    {
      background,
      color,
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize,
      backdropFilter
    },
    ClassName.ellipsisFont(1)
  ])

export const objectTag = css({
  textTransform: 'capitalize',
  color: 'var(--font-secondary)',
  background: 'var(--button-hover-background)',
  borderRadius: 999,
  padding: '0px 8px',
  fontFamily: 'Muli'
})
