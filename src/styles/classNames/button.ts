import Colors from "@/consts/colors";
import { css } from "@emotion/css";

export const circleButton = (padding = 4, borderRadius = 999) => {
  return css({
    transition: "all 0.2s ease",
    padding,
    cursor: "pointer",
    borderRadius,
    '&[data-active="true"]': {
      background: `${Colors.Background.ButtonHover} !important`,
    },
    ":hover": {
      background: `${Colors.Background.ButtonHover} !important`,
    },
    ":active": {
      background: `${Colors.Background.ButtonActive} !important`,
    },
  });
};

export const flatButton = (
  borderRadius = 4,
  padding = "4px 8px",
  background = Colors.Background.ButtonHover,
  border = false
) => {
  return css({
    transition: "all 0.2s ease",
    borderRadius,
    padding,
    cursor: "pointer",
    userSelect: "none",
    border: border ? `1px solid ${Colors.Background.Border}` : undefined,
    '&[data-active="true"]': {
      background: `${background} !important`,
    },
    ":hover": {
      background: `${background} !important`,
    },
    ":active": {
      background: `${Colors.Background.ButtonActive} !important`,
    },
  });
};
