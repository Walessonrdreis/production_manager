import type { CalendarMode, CalendarData, DailyEntry, Segment } from '../../domain/plans/types';
import { parseDateKey } from '../../domain/plans/calendar';
import { getNonProductionReason } from '../../domain/plans/holidays';

export type ProductLite = {
  id: string;
  nickname?: string | null;
  description?: string | null;
  omieProduct?: { description?: string | null } | null;
};

export type SectorLite = {
  id: string;
  name?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function groupBySector(entries: DailyEntry[]) {
  const grouped = new Map<string, DailyEntry[]>();
  for (const entry of entries) {
    const current = grouped.get(entry.sectorId) ?? [];
    current.push(entry);
    grouped.set(entry.sectorId, current);
  }
  return grouped;
}

export async function exportPlanCsv(params: { baseUrl: string; planId: string }) {
  const { baseUrl, planId } = params;

  const response = await fetch(`${baseUrl}/v1/plans/${planId}/export.csv`);
  if (!response.ok) {
    throw new Error('Falha ao exportar CSV');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `plano-${planId}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}

export function buildPlanPdfHtml(params: {
  planName: string;
  startDate: string | Date;
  endDate: string | Date;

  calendarMode: CalendarMode;
  totalEntries: number;
  totalQuantity: number;

  selectedSegment: Segment;
  holidayMap: Map<string, string>;
  calendarData: CalendarData;

  productsById: Map<string, ProductLite>;
  sectorsById: Map<string, SectorLite>;
}) {
  const {
    planName,
    startDate,
    endDate,
    calendarMode,
    totalEntries,
    totalQuantity,
    selectedSegment,
    holidayMap,
    calendarData,
    productsById,
    sectorsById,
  } = params;

  const modeLabel = calendarMode === 'day' ? 'Diário' : calendarMode === 'week' ? 'Semanal' : 'Mensal';

  const sections = selectedSegment.dateKeys
    .map((dateKey) => {
      const nonProductionReason = getNonProductionReason(dateKey, holidayMap);
      const entries = calendarData[dateKey] ?? [];

      const groupedBySector = groupBySector(entries);

      const content = nonProductionReason
        ? `<div style="padding: 12px 0; color: #b45309; font-weight: 700;">Sem produção: ${escapeHtml(
            nonProductionReason
          )}</div>`
        : (Array.from(groupedBySector.entries())
            .map(([sectorId, sectorEntries]) => {
              const sectorName = sectorsById.get(sectorId)?.name ?? 'Sem setor';

              const rows = sectorEntries
                .map((entry) => {
                  const product = productsById.get(entry.productId);
                  const productName =
                    product?.omieProduct?.description ??
                    product?.nickname ??
                    product?.description ??
                    'Produto removido';

                  return `
                    <tr>
                      <td style="border: 1px solid #d0d7de; padding: 8px;">
                        ${escapeHtml(productName)}
                      </td>
                      <td style="border: 1px solid #d0d7de; padding: 8px; text-align: right;">
                        ${entry.quantity}
                      </td>
                    </tr>
                  `;
                })
                .join('');

              return `
                <div style="margin-top: 12px;">
                  <h3 style="margin: 0 0 8px;">${escapeHtml(String(sectorName))}</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                      <tr>
                        <th style="border: 1px solid #d0d7de; padding: 8px; text-align: left;">Produto</th>
                        <th style="border: 1px solid #d0d7de; padding: 8px; text-align: right;">Qtd.</th>
                      </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                  </table>
                </div>
              `;
            })
            .join('') ||
          `<div style="padding: 12px 0; color: #64748b;">Sem itens neste dia.</div>`);

      return `
        <section style="margin-top: 24px;">
          <h2 style="margin: 0 0 8px;">
            ${parseDateKey(dateKey).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            })}
          </h2>
          ${content}
        </section>
      `;
    })
    .join('');

  // HTML final (igual ao seu layout atual)
  return `
    <html>
      <head>
        <title>${escapeHtml(planName)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2328; }
          .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
          .card { border: 1px solid #d0d7de; border-radius: 10px; padding: 12px; }
          .label { font-size: 12px; color: #57606a; margin-bottom: 6px; }
          .value { font-size: 24px; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1 style="margin: 0;">${escapeHtml(planName)}</h1>
        <div style="margin-top: 8px; color: #57606a;">
          Período ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}
        </div>

        <div class="cards">
          <div class="card">
            <div class="label">Modelo</div>
            <div class="value">${modeLabel}</div>
          </div>
          <div class="card">
            <div class="label">Itens no período visível</div>
            <div class="value">${totalEntries}</div>
          </div>
          <div class="card">
            <div class="label">Quantidade total</div>
            <div class="value">${totalQuantity}</div>
          </div>
        </div>

        ${sections}
      </body>
    </html>
  `;
}

export function exportPlanPdf(params: {
  html: string;
  onBlocked?: () => void;
  delayMs?: number;
}) {
  const { html, onBlocked, delayMs = 300 } = params;

  const printWindow = window.open('', '_blank', 'width=1400,height=900');
  if (!printWindow) {
    onBlocked?.();
    return false;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, delayMs);

  return true;
}
