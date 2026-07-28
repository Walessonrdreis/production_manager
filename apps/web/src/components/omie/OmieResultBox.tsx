type Props = {
  error?: string | null;
  success?: string | null;
};

export function OmieResultBox({ error, success }: Props) {
  if (!error && !success) return null;

  if (error) {
    return (
      <div style={{ marginTop: 10, background: '#ffecec', color: '#8a1c1c', padding: 10, borderRadius: 6 }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10, background: '#edf7ed', color: '#1f5130', padding: 10, borderRadius: 6 }}>
      {success}
    </div>
  );
}
``