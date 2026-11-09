import { STORE_LINKS, platformOf, storeOrder, type Platform } from '../../utils/getApp';

type Size = 'sm' | 'lg';

// Google's badge file has clear space built in, so it is drawn taller to match Apple's.
const HEIGHTS: Record<Size, { ios: string; android: string }> = {
  sm: { ios: 'h-10', android: 'h-[58px] -my-[9px]' },
  lg: { ios: 'h-12', android: 'h-[70px] -my-[11px]' },
};

const BADGES = {
  ios: { src: '/badges/app-store.svg', label: 'Download Affinity Echo on the App Store' },
  android: { src: '/badges/google-play.png', label: 'Get Affinity Echo on Google Play' },
} as const;

interface StoreBadgesProps {
  size?: Size;
  className?: string;
  platform?: Platform;
}

export function StoreBadges({ size = 'lg', className = '', platform = platformOf() }: StoreBadgesProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {storeOrder(platform).map((store) => (
        <a
          key={store}
          href={STORE_LINKS[store]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={BADGES[store].label}
          className="inline-flex rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
        >
          <img src={BADGES[store].src} alt={BADGES[store].label} className={`${HEIGHTS[size][store]} w-auto`} loading="lazy" decoding="async" width={store === 'ios' ? 120 : 646} height={store === 'ios' ? 40 : 250} />
        </a>
      ))}
    </div>
  );
}
