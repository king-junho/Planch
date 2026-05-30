import { ReactNode, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type TripDeadlinePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: ReactNode;
  disabled?: boolean;
};

type DatePickerHeaderProps = {
  date: Date;
  decreaseMonth: () => void;
  increaseMonth: () => void;
  prevMonthButtonDisabled: boolean;
  nextMonthButtonDisabled: boolean;
};

function padDateTimePart(value: number) {
  return String(value).padStart(2, "0");
}

function parseDateTimeLocalValue(value: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDateTimeLocalValue(date: Date | null) {
  if (!date) return "";

  return `${date.getFullYear()}-${padDateTimePart(
    date.getMonth() + 1
  )}-${padDateTimePart(date.getDate())}T${padDateTimePart(
    date.getHours()
  )}:${padDateTimePart(date.getMinutes())}`;
}

function formatDisplayValue(value: string) {
  const date = parseDateTimeLocalValue(value);

  if (!date) return "";

  return `${date.getFullYear()}.${padDateTimePart(
    date.getMonth() + 1
  )}.${padDateTimePart(date.getDate())} ${padDateTimePart(
    date.getHours()
  )}:${padDateTimePart(date.getMinutes())}`;
}

function getTodayStart() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function isSameDate(left: Date | null, right: Date | null) {
  if (!left || !right) return false;

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function DatePickerHeader({
  date,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}: DatePickerHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-11 items-center justify-center text-sm font-semibold text-stone-900">
        마감 기한 선택
      </div>
      <div className="mb-1 flex h-11 items-center justify-between px-3">
        <button
          className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
          disabled={prevMonthButtonDisabled}
          onClick={decreaseMonth}
          type="button"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold text-stone-900">
          {`${date.getFullYear()}.${padDateTimePart(date.getMonth() + 1)}`}
        </span>
        <button
          className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
          disabled={nextMonthButtonDisabled}
          onClick={increaseMonth}
          type="button"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function TripDeadlinePicker({
  value,
  onChange,
  label = "결정 마감기한",
  disabled = false,
}: TripDeadlinePickerProps) {
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const minSelectableDate = getTodayStart();
  const selectedDate = parseDateTimeLocalValue(value);
  const displayValue = formatDisplayValue(value);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleChange(date: Date | null) {
    const isTimeChanged =
      isSameDate(selectedDate, date) &&
      (selectedDate?.getHours() !== date?.getHours() ||
        selectedDate?.getMinutes() !== date?.getMinutes());

    onChange(formatDateTimeLocalValue(date));

    if (date && isTimeChanged) {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative min-w-0">
      <div className="mb-2 flex items-center gap-2">
        {typeof label === "string" ? (
          <span className="block text-[15px] font-semibold leading-[22.5px] text-stone-900">
            {label}
          </span>
        ) : (
          label
        )}
      </div>
      <button
        className="flex w-full min-w-0 items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-left text-[15px] text-stone-900 outline-none transition hover:border-stone-300 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={displayValue ? "" : "text-stone-400"}>
          {displayValue || "날짜와 시간을 선택하세요"}
        </span>
      </button>

      {isOpen ? (
        <div
          className="absolute z-30 mt-2 w-[420px] rounded-2xl border border-stone-200 bg-white p-3 shadow-xl"
          onClick={(event) => event.stopPropagation()}
          ref={pickerRef}
        >
          <DatePicker
            calendarClassName="planch-date-range-calendar planch-deadline-calendar"
            dateFormat="yyyy.MM.dd HH:mm"
            inline
            minDate={minSelectableDate}
            onChange={handleChange}
            renderCustomHeader={(props) => <DatePickerHeader {...props} />}
            selected={selectedDate}
            showTimeSelect
            timeCaption="시간"
            timeFormat="HH:mm"
            timeIntervals={5}
          />
          <button
            className="absolute right-3 top-3 rounded-full p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="hidden">
            <button
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              선택 완료
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
