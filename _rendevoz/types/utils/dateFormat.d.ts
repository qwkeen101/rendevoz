export declare const DateFormat: {
    format: (date: number | Date, f: string) => string;
    formatDistanceToNow: (date: number) => string;
    formatDistanceToNowStrict: (date: number, suffix?: boolean) => string;
    Formats: {
        default: string;
        withMinute: string;
    };
};
export default DateFormat;
