import React from 'react'

import logoUrl from 'url:../../../../assets/brand/latch-logo.svg'
import successAvatarUrl from 'url:../../../../assets/avatars/success.png'

export function PasskeyCreatedScreen({
  routeContentMarginClass,
  flowHeightClass,
  onGoToDashboard,
}: {
  routeContentMarginClass: string
  flowHeightClass: string
  onGoToDashboard: () => void
}) {
  return (
    <div
      className={[
        `${routeContentMarginClass} flex flex-col items-center animate-screenIn`,
        flowHeightClass,
      ].join(' ')}
    >
      <img src={logoUrl} alt="Latch" className="mt-3 h-10 w-10 object-contain" />

      <div className="mt-12 grid place-items-center">
        <img src={successAvatarUrl} alt="" className="h-44 w-44 object-contain animate-pop" />
      </div>

      <h2 className="mt-8 text-center text-3xl font-extrabold tracking-tight">Passkey Created!</h2>
      <p className="mt-3 text-center text-sm text-muted">Your account has been set up.</p>

      <div className="mt-auto w-full">
        <button
          onClick={onGoToDashboard}
          className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
