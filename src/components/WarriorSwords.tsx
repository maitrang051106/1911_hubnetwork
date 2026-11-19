export type SwordId =
  | 'tram-phong'
  | 'nhat-quang'
  | 'da-ngoc'
  | 'tinh-than'
  | 'kien-cuong'
  | 'mong-hoa'
  | 'minh-nguyet';

interface WarriorSwordProps {
  swordId: SwordId;
  swordName?: string;
  accentHex?: string;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

const SWORD_ASSETS: Record<SwordId, string> = {
  'tram-phong': '/assets/swords/tram-phong.png',
  'nhat-quang': '/assets/swords/nhat-quang.png',
  'da-ngoc': '/assets/swords/da-ngoc.png',
  'tinh-than': '/assets/swords/tinh-than.png',
  'kien-cuong': '/assets/swords/kien-cuong.png',
  'mong-hoa': '/assets/swords/mong-hoa.png',
  'minh-nguyet': '/assets/swords/minh-nguyet.png',
};

/**
 * Renders the member's high-detail bespoke forged fantasy sword PNG.
 */
export function WarriorSword({
  swordId,
  swordName,
  orientation = 'vertical',
  className = '',
}: WarriorSwordProps) {
  const src = SWORD_ASSETS[swordId];

  if (orientation === 'horizontal') {
    return (
      <div className={`relative inline-flex items-center justify-center overflow-visible ${className}`}>
        <img
          src={src}
          alt={swordName ?? swordId}
          draggable={false}
          className="h-[110px] w-auto -rotate-90 object-contain select-none pointer-events-none"
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={swordName ?? swordId}
      draggable={false}
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  );
}
