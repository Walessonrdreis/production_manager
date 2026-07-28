import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { apiClient } from '../api/client';
import { usePlanDetails } from '../hooks/api/usePlanQueries';
import { useProducts } from '../hooks/api/useProducts';
import { useSectors } from '../hooks/api/useSectors';

import { usePlanCalendar } from '../hooks/plans/usePlanCalendar';

import { PlanDetailHeader } from '../components/plans/PlanDetailHeader';
import { PlanStatsCards } from '../components/plans/PlanStatsCards';
import { PlanSummaryBar } from '../components/plans/PlanSummaryBar';
import { PlanCalendar } from '../components/plans/PlanCalendar/PlanCalendar';
import { PlanEntryEditorModal } from '../components/plans/PlanEntryEditor/PlanEntryEditorModal';


import {
  exportPlanCsv,
  buildPlanPdfHtml,
  exportPlanPdf,
} from '../services/plans/planExport';

export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: plan, isLoading: isLoadingPlan } = usePlanDetails(id!);
  const { data: productsData } = useProducts();
  const { data: sectorsData } = useSectors();

  const calendar = usePlanCalendar({
    plan,
    products: productsData?.items ?? [],
    sectors: sectorsData?.items ?? [],
  });

  /* =========================
     Exportações
     ========================= */

  const handleExportCsv = async () => {
    try {
      await exportPlanCsv({
        baseUrl: apiClient.baseUrl,
        planId: id!,
      });
      toast.success('CSV exportado com sucesso.');
    } catch (error: any) {
      toast.error(`Erro ao exportar CSV: ${error.message}`);
    }
  };

  const handleExportPdf = () => {
    if (!plan || !calendar.selectedSegment) return;

    const html = buildPlanPdfHtml({
      planName: plan.name,
      startDate: plan.startDate,
      endDate: plan.endDate,
      calendarMode: calendar.calendarMode,
      totalEntries: calendar.totalEntries,
      totalQuantity: calendar.totalQuantity,
      selectedSegment: calendar.selectedSegment,
      holidayMap: calendar.holidayMap,
      calendarData: calendar.calendarData,
      productsById: calendar.productsById,
      sectorsById: calendar.sectorsById,
    });

    const ok = exportPlanPdf({
      html,
      onBlocked: () =>
        toast.error('Não foi possível abrir a janela para gerar o PDF.'),
    });

    if (ok) {
      toast.success('Na janela de impressão, escolha “Salvar como PDF”.');
    }
  };

  /* =========================
     Estados de carregamento
     ========================= */

  if (isLoadingPlan) {
    return <div style={{ padding: '2rem' }}>Carregando detalhes do plano…</div>;
  }

  if (!plan) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        Plano não encontrado.
      </div>
    );
  }

  /* =========================
     Render
     ========================= */

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      {/* Header (voltar + título + exportações) */}
      <PlanDetailHeader
        planName={plan.name}
        startDate={plan.startDate}
        endDate={plan.endDate}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
      />

      {/* Cards de resumo */}
      <PlanStatsCards
        daysCount={calendar.dateKeys.length}
        totalEntries={calendar.totalEntries}
        totalQuantity={calendar.totalQuantity}
      />

      {/* Controles de modo/segmento + totais */}
      <PlanSummaryBar
        planName={plan.name}
        calendarMode={calendar.calendarMode}
        onModeChange={calendar.setCalendarMode}
        segments={calendar.segments}
        selectedSegmentKey={calendar.selectedSegmentKey}
        onSegmentChange={calendar.setSelectedSegmentKey}
        totalEntries={calendar.totalEntries}
        totalQuantity={calendar.totalQuantity}
      />

      {/* Calendário */}
      <PlanCalendar
        visibleDateKeys={calendar.visibleDateKeys}
        calendarData={calendar.calendarData}
        holidayMap={calendar.holidayMap}
        productsById={calendar.productsById}
        sectorsById={calendar.sectorsById}
        onAddEntry={calendar.openNewEntryForm}
        onEditEntry={calendar.openEditEntryForm}
        onRemoveEntry={calendar.removeEntry}
      />

      {/* Editor (modal) */}
      <PlanEntryEditorModal
        editor={calendar.editor}
        productOptions={calendar.productOptions}
        sectorOptions={calendar.sectorOptions}
        getDefaultSectorId={calendar.getDefaultSectorIdForProduct}
        onChange={calendar.setEditor}
        onSave={calendar.saveEntry}
        onClose={calendar.closeEditor}
      />

      {/* Navegação auxiliar */}
      <div style={{ marginTop: '2rem' }}>
        <Link to="/plans" style={{ color: '#2563eb', fontWeight: 600 }}>
          ← Voltar para Planos
        </Link>
      </div>
    </div>
  );
}
