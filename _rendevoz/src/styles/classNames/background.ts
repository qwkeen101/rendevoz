import Colors from "@/consts/colors";
import { css } from "@emotion/css";

export const blurBackground = css({
  background: Colors.Background.Linear,
  backdropFilter: "saturate(1.5) blur(32px)",
});

export const pseudoBlubBackground = css({
  position: 'relative',
  '::before': {
    position: 'absolute',
    pointerEvents: 'none',
    borderRadius: 'inherit',
    overflow: 'hidden',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    content: '""',
    zIndex: -1,
    background: Colors.Background.Linear,
    backdropFilter: 'saturate(1.5) blur(32px)'
  }
})

export const pseudoBlurContrastBackground = css({
  position: 'relative',
  '::before': {
    position: 'absolute',
    pointerEvents: 'none',
    borderRadius: 'inherit',
    overflow: 'hidden',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    content: '""',
    zIndex: -1,
    background: Colors.Background.HighContrast,
    backdropFilter: 'saturate(1.5) blur(32px)'
  }
})
