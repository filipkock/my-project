import moment from "moment";

export interface DayInfo {
  date: string; // YYYY-MM-DD
  day: string; // Mon, Tue, etc.
  dateNum: number; // 1, 2, etc.
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  index: number; // Added for stable scrolling
}

export const generateDaysRange = (
  startDate: moment.Moment,
  count: number,
  selectedDate: string,
  currentMonth: string,
  startIndex: number = 0
): DayInfo[] => {
  const days: DayInfo[] = [];
  const today = moment().format("YYYY-MM-DD");

  for (let i = 0; i < count; i++) {
    const currentDate = startDate.clone().add(i, "days");
    const dateStr = currentDate.format("YYYY-MM-DD");
    const monthStr = currentDate.format("YYYY-MM");
    
    days.push({
      date: dateStr,
      day: currentDate.format("ddd"),
      dateNum: currentDate.date(),
      isToday: dateStr === today,
      isSelected: dateStr === selectedDate,
      isCurrentMonth: monthStr === currentMonth,
      index: startIndex + i,
    });
  }

  return days;
};

export const formatMonthLabel = (date: string): string => {
  return moment(date).format("MMMM YYYY");
};

export const isToday = (date: string): boolean => {
  return moment(date).isSame(moment(), "day");
};

export const isSameDay = (date1: string, date2: string): boolean => {
  return moment(date1).isSame(moment(date2), "day");
};

export const getTodayString = (): string => {
  return moment().format("YYYY-MM-DD");
};

export const getCurrentMonth = (): string => {
  return moment().format("YYYY-MM");
};

export const getTodayIndex = (days: DayInfo[]): number => {
  return days.findIndex(day => day.isToday);
};

export const getDateIndex = (days: DayInfo[], date: string): number => {
  return days.findIndex(day => day.date === date);
}; 