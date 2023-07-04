/// <reference types="react" />
declare const TimePicker: ({ className, onChange, value, maxDate, minDate }: {
    className?: string;
    onChange?: (date: Date) => void;
    value?: Date;
    maxDate?: Date;
    minDate?: Date;
}) => JSX.Element;
export default TimePicker;
