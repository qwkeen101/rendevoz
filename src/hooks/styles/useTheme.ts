import { useGlobalAtomValue, useGlobalSetAtom } from "@/hooks/jotai";
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

const defaultTheme = {
  primaryColor: "#8590ae",
  defaultBackgroundColor: "#ffffff",
  defaultBackGroundColorLightGrey: "#f9fafa",
  defaultFontColorBlack: "#121212",
  defaultFontColorGrey: "#37352f80",
  defaultFontColorLightGrey: "#0000000f",
  defaultFontColorRed: "#e0245e",
  defaultFontColorLightBlue: "#8590ae",
  defaultButtonHoverBackgroundColor: "#eff0f0",
  defaultBorderColorCream: "#eeeae2",
  defaultBorderColorGrey: "#dee0e3",
};

const themeAtomFamily = atomFamily((key: keyof typeof defaultTheme) =>
  atom(defaultTheme[key])
);
type Theme = keyof typeof defaultTheme;
type RemoveArrayRepeats<T extends readonly any[]> = {
  [K in keyof T]: T[number] extends {
    [P in keyof T]: P extends K ? never : T[P];
  }[number]
    ? never
    : T[K];
};
export function useTheme<T extends Theme[]>(
  ...themes: RemoveArrayRepeats<T> & T
) {
  const theme: Partial<typeof defaultTheme> = {};
  themes.map((key) => {
    const value = useGlobalAtomValue(themeAtomFamily(key));
    theme[key] = value;
  });
  return theme;
}

export const useSetTheme = (name: keyof typeof defaultTheme) => {
  const atom = themeAtomFamily(name);
  return useGlobalSetAtom(atom);
};
