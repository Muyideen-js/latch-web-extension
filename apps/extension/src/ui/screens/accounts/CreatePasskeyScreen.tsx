import React from 'react'

import logoUrl from 'url:../../../../assets/brand/latch-logo.svg'
import biometricsUrl from 'url:../../../../assets/icons/biometrics.svg'

export function CreatePasskeyScreen({
  routeContentMarginClass,
  flowHeightClass,
  passkeyPrefetchError,
  passkeyPrefetchReady,
  loading,
  onCreate,
  onGoBack,
}: {
  routeContentMarginClass: string
  flowHeightClass: string
  passkeyPrefetchError: string | null
  passkeyPrefetchReady: boolean
  loading: string | null
  onCreate: () => void
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
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Create Passkey</h2>
        <p className="mt-2 text-sm text-muted">Protect your account with biometrics</p>
      </div>

      <div className="mt-7 grid place-items-center">
        <div className="grid h-24 w-24 place-items-center rounded-3xl bg-surface shadow-soft">
          <img src={biometricsUrl} alt="Biometrics" className="h-14 w-14 object-contain" />
        </div>
      </div>

      <div className="mt-7 rounded-2xl bg-surface/70 px-4 py-4 shadow-soft">
        <div className="text-base font-extrabold">Biometric Security</div>
        <div className="mt-1 text-xs text-muted">
          Use your device&apos;s fingerprint or face recognition
        </div>
      </div>

      {passkeyPrefetchError ? (
        <div className="mt-4 rounded-2xl border border-border bg-surface/60 px-3 py-3 text-xs text-muted">
          {passkeyPrefetchError}
        </div>
      ) : null}

      <div className="mt-auto space-y-3">
        <button
          disabled={Boolean(loading) || !passkeyPrefetchReady}
          onClick={onCreate}
          className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft disabled:opacity-50"
        >
          {!passkeyPrefetchReady ? 'Preparing…' : loading ? loading : 'Create Passkey'}
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
