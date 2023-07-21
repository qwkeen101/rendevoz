const FontSize = {
  // 14px
  "14px": "1rem",
  // 13px
  "13px": "0.928rem",
  // 12px
  "12px": "0.857rem",
  // 11px
  "11px": "0.786rem",
  // 10px
  "10px": "0.714rem",
  "15px": "1.07rem",
  "16px": "1.14rem",
  "18px": "1.29rem",
  "20px": "1.43rem",
};
export const pixelToRem = (pixel: number) => {
  return `${pixel / 14}rem`;
};
export default FontSize;
