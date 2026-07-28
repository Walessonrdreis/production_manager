import { useOmieAdmin } from '../hooks/omie/useOmieAdmin'
import { OmieAdminHeader } from '../components/omie/OmieAdminHeader'
import { OmieActions } from '../components/omie/OmieActions'
import { OmieCategories } from '../components/omie/OmieCategories'
import { OmieSearch } from '../components/omie/OmieSearch'
import { OmieLookup } from '../components/omie/OmieLookup'
import { OmieResultBox } from '../components/omie/OmieResultBox.tsx'

export function OmieAdminPage() {
  const admin = useOmieAdmin()

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <OmieAdminHeader />

      <p style={{ color: '#555', marginTop: 8 }}>
        Tela para operar os endpoints administrativos definidos em <code>routes/omie.ts</code>.
      </p>

      <OmieResultBox error={admin.error} success={admin.resultMessage} />

      <OmieActions admin={admin} />
      <OmieCategories admin={admin} />
      <OmieSearch admin={admin} />
      <OmieLookup admin={admin} />
    </div>
  )
}
