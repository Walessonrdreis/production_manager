import { Link } from 'react-router-dom';
import { PlanExportActions } from './PlanExportActions';

type Props = {
  planName: string;
  startDate: string | Date;
  endDate: string | Date;

  onExportCsv: () => void;
  onExportPdf: () => void;
};

export function PlanDetailHeader({ planName, startDate, endDate, onExportCsv, onExportPdf }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <Link to="/plans" style={{ textDecoration: 'none', color: '#007bff', fontSize: '0.875rem' }}>
          &larr; Voltar para Planos
        </Link>
        <h1 style={{ margin: '0.5rem 0' }}>{planName}</h1>
        <p style={{ margin: 0, color: '#555' }}>
          Período: {new Date(startDate).toLocaleDateString('pt-BR')} até {new Date(endDate).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <PlanExportActions onExportCsv={onExportCsv} onExportPdf={onExportPdf} />
    </div>
  );
}