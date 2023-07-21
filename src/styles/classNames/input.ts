import Colors from "@/consts/colors";
import FontSize from "@/consts/font";
import { css } from "@emotion/css";

export const input = () =>
  css({
    padding: "12px 16px",
    width: "100%",
    outline: "none",
    position: "relative",
    fontSize: FontSize["14px"],
    fontWeight: 500,
    letterSpacing: "-0.04px",
    borderRadius: 6,
    background: "transparent",
    border: `1px solid ${Colors.Background.Border}`,
    transition: "all 0.2s ease",
    ":hover": {
      background: `${Colors.Background.Border}`,
    },
    ":focus": {
      border: "1px solid var(--font-secondary)",
    },
  });

export const noStyleInput = css({
  outline: "none",
  border: "none",
  background: "transparent",
  color: Colors.Font.Primary,
});
