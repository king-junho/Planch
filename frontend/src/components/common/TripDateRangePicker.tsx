import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type TripDateRangePickerProps = {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  label?: string;
  disabled?: boolean;
};

type DatePickerHeaderProps = {
  date: Date;
  decreaseMonth: () => void;
  increaseMonth: () => void;
  prevMonthButtonDisabled: boolean;
  nextMonthButtonDisabled: boolean;
};

function parseDateInput(value: string) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDateInput(date: Date | null) {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  if (!value) return "";

  return value.replaceAll("-", ".");
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
        기간 선택
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
          {`${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`}
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

export default function TripDateRangePicker({
  startDate,
  endDate,
  onChange,
  label = "여행 일정",
  disabled = false,
}: TripDateRangePickerProps) {
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const parsedStartDate = parseDateInput(startDate);
  const parsedEndDate = parseDateInput(endDate);
  const displayValue =
    startDate && endDate
      ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
      : startDate
        ? `${formatDisplayDate(startDate)} - 종료일 선택`
        : "";

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

  function handleChange(dates: [Date | null, Date | null]) {
    const [nextStartDate, nextEndDate] = dates;

    onChange(formatDateInput(nextStartDate), formatDateInput(nextEndDate));

    if (nextStartDate && nextEndDate) {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative min-w-0">
      <span className="mb-2 block text-[15px] font-semibold leading-[22.5px] text-stone-900">
        {label}
      </span>
      <button
        className="flex w-full min-w-0 items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-[14px] text-left text-[15px] text-stone-900 outline-none transition hover:border-stone-300 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={displayValue ? "" : "text-stone-400"}>
          {displayValue || "시작일과 종료일을 선택하세요"}
        </span>
      </button>

      {isOpen ? (
        <div
          className="absolute z-30 mt-2 w-[340px] rounded-2xl border border-stone-200 bg-white p-3 shadow-xl"
          onClick={(event) => event.stopPropagation()}
          ref={pickerRef}
        >
          <DatePicker
            calendarClassName="planch-date-range-calendar"
            endDate={parsedEndDate}
            inline
            onChange={handleChange}
            renderCustomHeader={(props) => <DatePickerHeader {...props} />}
            selected={parsedStartDate}
            selectsRange
            startDate={parsedStartDate}
          />
          <button
            className="absolute right-3 top-3 rounded-full p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
