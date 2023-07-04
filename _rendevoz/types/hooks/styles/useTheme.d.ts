declare const defaultTheme: {
    primaryColor: string;
    defaultBackgroundColor: string;
    defaultBackGroundColorLightGrey: string;
    defaultFontColorBlack: string;
    defaultFontColorGrey: string;
    defaultFontColorLightGrey: string;
    defaultFontColorRed: string;
    defaultFontColorLightBlue: string;
    defaultButtonHoverBackgroundColor: string;
    defaultBorderColorCream: string;
    defaultBorderColorGrey: string;
};
type Theme = keyof typeof defaultTheme;
type RemoveArrayRepeats<T extends readonly any[]> = {
    [K in keyof T]: T[number] extends {
        [P in keyof T]: P extends K ? never : T[P];
    }[number] ? never : T[K];
};
export declare function useTheme<T extends Theme[]>(...themes: RemoveArrayRepeats<T> & T): Partial<{
    primaryColor: string;
    defaultBackgroundColor: string;
    defaultBackGroundColorLightGrey: string;
    defaultFontColorBlack: string;
    defaultFontColorGrey: string;
    defaultFontColorLightGrey: string;
    defaultFontColorRed: string;
    defaultFontColorLightBlue: string;
    defaultButtonHoverBackgroundColor: string;
    defaultBorderColorCream: string;
    defaultBorderColorGrey: string;
}>;
export declare const useSetTheme: (name: keyof typeof defaultTheme) => any;
export {};
