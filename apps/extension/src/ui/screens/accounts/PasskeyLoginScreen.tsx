import React from 'react'

import logoUrl from 'url:../../../../assets/brand/latch-logo.svg'

export function PasskeyLoginScreen({
  routeContentMarginClass,
  flowHeightClass,
  passkeyPrefetchError,
  passkeyPrefetchReady,
  loading,
  onContinue,
  onGoBack,
}: {
  routeContentMarginClass: string
  flowHeightClass: string
  passkeyPrefetchError: string | null
  passkeyPrefetchReady: boolean
  loading: string | null
  onContinue: () => void
  onGoBack: () => void
}) {
  return (
    <div
      className={[routeContentMarginClass, 'flex flex-col animate-screenIn', flowHeightClass].join(
        ' '
      )}
    >
      <div className="text-center">
        <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Passkey login</h2>
        <p className="mt-2 text-sm text-muted">Use your existing passkey to connect</p>
      </div>

      {passkeyPrefetchError ? (
        <div className="mt-4 rounded-2xl border border-border bg-surface/60 px-3 py-3 text-xs text-muted">
          {passkeyPrefetchError}
        </div>
      ) : null}

      <div className="mt-auto space-y-3 w-full">
        <button
          disabled={Boolean(loading) || !passkeyPrefetchReady}
          onClick={onContinue}
          className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft disabled:opacity-50"
        >
          {!passkeyPrefetchReady ? 'Preparing…' : loading ? loading : 'Continue with Passkey'}
        </button>
        <button
          onClick={onGoBack}
          className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}
