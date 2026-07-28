export type CalendarMode = 'day' | 'week' | 'month';

export type DailyEntry = {
  id: string;
  productId: string;
  sectorId: string;
  quantity: number;
  note: string;
};

export type CalendarData = Record<string, DailyEntry[]>;

export type Segment = {
  key: string;
  label: string;
  dateKeys: string[];
};

export type EntryEditor =
  | {
      dateKey: string;
      entryId: string | null;
      productId: string;
      sectorId: string;
      quantity: string;
      note: string;
    }
  | null;