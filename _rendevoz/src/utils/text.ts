import { iso6393To1 } from "@/consts/iso-639-to-iso-631";
import { franc } from "franc";

export const highlightElementText = (ele: HTMLElement) => {
  if (window.getSelection) {
    const range = document.createRange();
    range.selectNodeContents(ele);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  }
};

export const detectLanguage = (text: string): string | undefined => {
  return iso6393To1[franc(text, { minLength: 1, only: ['eng', 'zho', 'cmn'] })]
}
