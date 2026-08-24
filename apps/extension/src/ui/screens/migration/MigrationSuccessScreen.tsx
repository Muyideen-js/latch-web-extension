import React from 'react'

import successAvatarUrl from 'url:../../../../assets/avatars/success.png'

export function MigrationSuccessScreen({
  routeContentMarginClass,
  flowHeightClass,
  onBackToHome,
}: {
  routeContentMarginClass: string
  flowHeightClass: string
  onBackToHome: () => void
}) {
  return (
    <div
      className={[
        `${routeContentMarginClass} flex min-h-0 flex-1 flex-col items-center animate-screenIn`,
        flowHeightClass,
      ].join(' ')}
    >
      <img src={successAvatarUrl} alt="" className="h-16 w-16 object-contain" />
      <h2 className="mt-6 text-center text-2xl font-extrabold tracking-tight">
        Migration complete
      </h2>
      <p className="mt-3 max-w-[280px] text-center text-sm leading-relaxed text-muted">
        Your transactions were submitted to the network. Balances may take a moment to update
        on-chain.
      </p>
      <button
        type="button"
        className="mt-8 h-12 w-full max-w-xs rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
        onClick={onBackToHome}
      >
        Back to home
      </button>
    </div>
  )
}
