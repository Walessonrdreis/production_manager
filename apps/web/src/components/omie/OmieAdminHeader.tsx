import { Link } from 'react-router-dom';

export function OmieAdminHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <h1 style={{ margin: 0 }}>OMIE Admin</h1>
      <Link to="/" style={{ fontSize: 14 }}>
        Home
      </Link>
    </div>
  );
}
``