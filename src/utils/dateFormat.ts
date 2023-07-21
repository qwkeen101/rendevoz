import {
  format,
  formatDistanceToNow,
  formatDistanceToNowStrict,
} from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import i18next from "i18next";

const getLocale = () => {
  const lang = i18next.language;
  if (lang === "zh-CN") {
    return zhCN;
  } else {
    return enUS;
  }
};
export const DateFormat = {
  format: (date: number | Date, f: string) => format(date, f),
  formatDistanceToNow: (date: number) => formatDistanceToNow(date),
  formatDistanceToNowStrict: (date: number, suffix = false) =>
    formatDistanceToNowStrict(date, { locale: getLocale(), addSuffix: suffix }),
  Formats: {
    default: "Y/M/d",
    withMinute: "Y/M/d H:mm",
  },
};

export default DateFormat;
