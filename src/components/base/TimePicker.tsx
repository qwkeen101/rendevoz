import ClassName from "@/styles/classNames";
import { css } from "@emotion/css";
import { format } from "date-fns";
import Calendar from "react-calendar";

const TimePicker = ({
  className,
  onChange,
  value,
  maxDate,
  minDate,
}: {
  className?: string;
  onChange?: (date: Date) => void;
  value?: Date;
  maxDate?: Date;
  minDate?: Date;
}) => {
  return (
    <Calendar
      className={css([
        {
          button: [
            {
              outline: "none",
              border: "none",
              cursor: "pointer",
              background: "transparent",
              ":disabled": {
                color: "#F48484",
                cursor: "not-allowed",
              },
            },
            ClassName.flatButton(),
          ],
          abbr: {
            textDecoration: "none !important",
            cursor: "inherit !important",
          },
          ".react-calendar__month-view__weekdays": [ClassName.description()],
          ".react-calendar__navigation": {
            display: "flex",
            justifyContent: "center",
            fontWeight: 600,
          },
          ".react-calendar__navigation__label": {
            fontWeight: "inherit",
          },
          ".react-calendar__navigation__arrow": {
            fontWeight: "inherit",
          },
          ".react-calendar__month-view__weekdays__weekday": {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          ".react-calendar__month-view__days__day--neighboringMonth": {
            color: "rgba(31,34,39,0.3)",
          },
          ".react-calendar__month-view__days__day": {
            fontWeight: 600,
          },
          ".react-calendar__tile--active": {
            background: "rgba(31, 34, 37, 0.06)",
          },
        },
        className,
      ])}
      value={value}
      formatDay={(locale, date) => format(date, "d")}
      onChange={(v) => onChange?.(v)}
      maxDate={maxDate}
      minDate={minDate}
    />
  );
};

export default TimePicker;
