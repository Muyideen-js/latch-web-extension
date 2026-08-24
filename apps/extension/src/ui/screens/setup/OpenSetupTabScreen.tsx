import React from 'react'

import logoUrl from 'url:../../../../assets/brand/latch-logo.svg'

export function OpenSetupTabScreen({
  routeContentMarginClass,
  flowHeightClass,
  onOpenSetupTab,
}: {
  routeContentMarginClass: string
  flowHeightClass: string
  onOpenSetupTab: () => void
}) {
  return (
    <div
      className={[
        `${routeContentMarginClass} flex flex-col items-center justify-between h-full pb-6 animate-screenIn`,
        flowHeightClass,
      ].join(' ')}
    >
      <div className="flex flex-col items-center text-center">
        <img src={logoUrl} alt="Latch" className="mt-4 h-10 w-10 object-contain" />
        <h1 className="mt-8 text-2xl font-extrabold tracking-tight">Set up Latch</h1>
        <p className="mt-4 max-w-[280px] text-sm text-muted">
          Wallet setup runs in a full browser tab. If it didn&apos;t open, use the button below.
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenSetupTab}
        className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
      >
        Open setup tab
      </button>
    </div>
  )
}
