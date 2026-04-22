import { createPortal } from 'react-dom';

type Props = {
  enabled: boolean;
  hovered: boolean;
  onHoverChange: (value: boolean) => void;
  overlayScrollRef: React.RefObject<HTMLDivElement | null>;
  overlayInnerRef: React.RefObject<HTMLDivElement | null>;
};

export function OmieCatalogOverlayScrollbar({
  enabled,
  hovered,
  onHoverChange,
  overlayScrollRef,
  overlayInnerRef,
}: Props) {
  if (!enabled) return null;
  if (typeof document === 'undefined') return null;

  const node = (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '10px',
        width: 'min(1200px, calc(100% - 48px))',
        padding: '8px 10px',
        borderRadius: '12px',
        backgroundColor: 'rgba(15, 23, 42, 0.15)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(148, 163, 184, 0.45)',
        opacity: hovered ? 1 : 0.35,
        transition: 'opacity 140ms ease',
        pointerEvents: 'auto',
        zIndex: 1000,
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div
        ref={overlayScrollRef}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          height: '14px',
          scrollbarWidth: 'thin',
        }}
      >
        <div ref={overlayInnerRef} style={{ height: '1px' }} />
      </div>
    </div>
  );

  return createPortal(node, document.body);
}