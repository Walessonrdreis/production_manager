import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { CalendarMode, CalendarData, DailyEntry, EntryEditor, Segment } from '../../domain/plans/types';
import { buildSegments, enumerateDateKeys, normalizeCalendarData } from '../../domain/plans/calendar';
import { buildHolidayMap, getNonProductionReason } from '../../domain/plans/holidays';
import { useLocalStorageState } from './useLocalStorageState';

type PlanLite = {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
};

type OmieProductLite = {
  description?: string | null;
  rawPayload?: any;
  stockQuantity?: string | null; // se algum endpoint admin ainda retorna isso
};

type ProductLite = {
  id: string;
  nickname?: string | null;
  description?: string | null;
  stockQuantity?: string | null; // novo contrato público
  omieProduct?: OmieProductLite | null;
  productSector?: { sectorId?: string | null } | null;
};

type SectorLite = {
  id: string;
  name?: string | null;
};

type Option = { value: string; label: string };

function safeUUID() {
  try {
    return crypto.randomUUID();
  } catch {
    return String(Date.now()) + '-' + Math.random().toString(16).slice(2);
  }
}

// fallback simples (caso você ainda use rawPayload em algum lugar)
function getLegacyStockLabel(rawPayload: any) {
  const candidates = [
    rawPayload?.saldo_estoque,
    rawPayload?.saldo,
    rawPayload?.estoque_atual,
    rawPayload?.quantidade_estoque,
    rawPayload?.qtde_estoque,
    rawPayload?.estoque,
    rawPayload?.produto_estoque,
    rawPayload?.nSaldo,
  ];

  const stock = candidates.find((v: any) => v !== undefined && v !== null && v !== '');
  if (stock === undefined) return 'Não informado';
  return String(stock);
}

function getProductDefaultSectorId(product?: ProductLite) {
  return product?.productSector?.sectorId ?? '';
}

function getProductOptionLabel(product: ProductLite) {
  const name =
    product?.omieProduct?.description ??
    product?.nickname ??
    product?.description ??
    product?.id ??
    'Produto';

  // preferência: stockQuantity do contrato público
  const stock =
    product?.stockQuantity ??
    product?.omieProduct?.stockQuantity ??
    (product?.omieProduct?.rawPayload ? getLegacyStockLabel(product.omieProduct.rawPayload) : null);

  const finalStock = stock === null || stock === undefined || stock === '' ? 'Não informado' : String(stock);
  return `${name} • estoque ${finalStock}`;
}

type UsePlanCalendarParams = {
  plan: PlanLite | null | undefined;
  products: ProductLite[];
  sectors: SectorLite[];
};

export function usePlanCalendar({ plan, products, sectors }: UsePlanCalendarParams) {
  // ----- base state -----
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');
  const [selectedSegmentKey, setSelectedSegmentKey] = useState('');
  const [editor, setEditor] = useState<EntryEditor>(null);

  // ----- computed: date keys -----
  const dateKeys = useMemo(() => {
    if (!plan) return [];
    return enumerateDateKeys(plan.startDate, plan.endDate);
  }, [plan]);

  // ----- localStorage key -----
  const storageKey = plan ? `production-plan-calendar:${plan.id}` : null;

  // ----- calendar data persisted -----
  const [calendarData, setCalendarData] = useLocalStorageState<CalendarData>(
    storageKey,
    {},
    {
      revive: (raw) => normalizeCalendarData(dateKeys, raw as any),
    }
  );

  // garante que quando dateKeys muda (ex.: modo/segmento não muda, mas plano muda), a estrutura seja preservada
  useEffect(() => {
    if (!plan) return;
    setCalendarData((current) => normalizeCalendarData(dateKeys, current));
  }, [plan?.id, dateKeys.join('|')]);

  // ----- maps -----
  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const sectorsById = useMemo(() => new Map(sectors.map((s) => [s.id, s])), [sectors]);

  // ----- holidays -----
  const holidayMap = useMemo(() => buildHolidayMap(dateKeys), [dateKeys]);

  // ----- segments -----
  const segments = useMemo(() => buildSegments(dateKeys, calendarMode), [dateKeys, calendarMode]);

  useEffect(() => {
    if (segments.length === 0) {
      setSelectedSegmentKey('');
      return;
    }
    if (!segments.some((s) => s.key === selectedSegmentKey)) {
      setSelectedSegmentKey(segments[0].key);
    }
  }, [segments, selectedSegmentKey]);

  const selectedSegment = useMemo<Segment | null>(() => {
    if (segments.length === 0) return null;
    return segments.find((s) => s.key === selectedSegmentKey) ?? segments[0];
  }, [segments, selectedSegmentKey]);

  const visibleDateKeys = selectedSegment?.dateKeys ?? [];

  // ----- totals -----
  const totalEntries = useMemo(() => {
    return visibleDateKeys.reduce((sum, dateKey) => sum + (calendarData[dateKey]?.length ?? 0), 0);
  }, [calendarData, visibleDateKeys]);

  const totalQuantity = useMemo(() => {
    return visibleDateKeys.reduce(
      (sum, dateKey) => sum + (calendarData[dateKey] ?? []).reduce((daySum, entry) => daySum + entry.quantity, 0),
      0
    );
  }, [calendarData, visibleDateKeys]);

  // ----- options for modal -----
  const productOptions: Option[] = useMemo(
    () => products.map((p) => ({ value: p.id, label: getProductOptionLabel(p) })),
    [products]
  );

  const sectorOptions: Option[] = useMemo(
    () => sectors.map((s) => ({ value: s.id, label: s.name ?? s.id })),
    [sectors]
  );

  const getDefaultSectorIdForProduct = (productId: string) => {
    return getProductDefaultSectorId(productsById.get(productId));
  };

  // ----- actions -----
  const openNewEntryForm = (dateKey: string) => {
    const nonProductionReason = getNonProductionReason(dateKey, holidayMap);
    if (nonProductionReason) {
      toast.error(`Não há produção em ${nonProductionReason.toLowerCase()}.`);
      return;
    }

    setEditor({
      dateKey,
      entryId: null,
      productId: '',
      sectorId: '',
      quantity: '1',
      note: '',
    });
  };

  const openEditEntryForm = (dateKey: string, entry: DailyEntry) => {
    setEditor({
      dateKey,
      entryId: entry.id,
      productId: entry.productId,
      sectorId: entry.sectorId,
      quantity: String(entry.quantity),
      note: entry.note,
    });
  };

  const closeEditor = () => setEditor(null);

  const saveEntry = () => {
    if (!editor) return;

    const quantity = Number(editor.quantity);
    const nonProductionReason = getNonProductionReason(editor.dateKey, holidayMap);

    if (nonProductionReason) {
      toast.error(`Não é permitido programar produção em ${nonProductionReason.toLowerCase()}.`);
      return;
    }

    if (!editor.productId || !editor.sectorId || !quantity || quantity <= 0) {
      toast.error('Escolha produto, setor e uma quantidade válida.');
      return;
    }

    setCalendarData((current) => {
      const dayEntries = [...(current[editor.dateKey] ?? [])];

      if (editor.entryId) {
        const index = dayEntries.findIndex((e) => e.id === editor.entryId);
        if (index >= 0) {
          dayEntries[index] = {
            ...dayEntries[index],
            productId: editor.productId,
            sectorId: editor.sectorId,
            quantity,
            note: editor.note,
          };
        }
      } else {
        dayEntries.push({
          id: safeUUID(),
          productId: editor.productId,
          sectorId: editor.sectorId,
          quantity,
          note: editor.note,
        });
      }

      return {
        ...current,
        [editor.dateKey]: dayEntries,
      };
    });

    toast.success(editor.entryId ? 'Item atualizado.' : 'Item adicionado.');
    closeEditor();
  };

  const removeEntry = (dateKey: string, entryId: string) => {
    setCalendarData((current) => ({
      ...current,
      [dateKey]: (current[dateKey] ?? []).filter((e) => e.id !== entryId),
    }));

    if (editor?.entryId === entryId) closeEditor();
    toast.success('Item removido.');
  };

  // ----- derived helpers for UI -----
  const isDayBlocked = (dateKey: string) => !!getNonProductionReason(dateKey, holidayMap);

  return {
    // raw data
    plan,
    dateKeys,
    calendarData,
    setCalendarData,

    products,
    sectors,
    productsById,
    sectorsById,

    // calendar controls
    calendarMode,
    setCalendarMode,
    segments,
    selectedSegmentKey,
    setSelectedSegmentKey,
    selectedSegment,
    visibleDateKeys,

    // totals
    totalEntries,
    totalQuantity,

    // editor
    editor,
    setEditor,
    openNewEntryForm,
    openEditEntryForm,
    closeEditor,
    saveEntry,
    removeEntry,

    // options for modal
    productOptions,
    sectorOptions,
    getDefaultSectorIdForProduct,

    // helpers
    holidayMap,
    isDayBlocked,
  };
}
