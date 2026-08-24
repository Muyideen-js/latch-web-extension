import React from 'react'

import { ExternalLink } from 'lucide-react'

import logoUrl from 'url:../../../../assets/brand/latch-logo.svg'

const headerIconClass = 'h-[18px] w-[18px]'

export function AddAnotherAccountScreen({
  routeContentMarginClass,
  flowHeightClass,
  onPasskey,
  onImportSeed,
  onCancel,
}: {
  routeContentMarginClass: string
  flowHeightClass: string
  onPasskey: () => void
  onImportSeed: () => void
  onCancel: () => void
}) {
  return (
    <div
      className={[routeContentMarginClass, 'flex flex-col animate-screenIn', flowHeightClass].join(
        ' '
      )}
    >
      <div className="text-center">
        <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Add account</h2>
        <p className="mt-2 text-sm text-muted">Choose how you want to add another signer</p>
      </div>

      <div className="mt-6 space-y-3 w-full">
        <button
          onClick={onPasskey}
          className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface/60 px-4 py-4 text-left hover:bg-surface/70"
        >
          <div>
            <div className="text-base font-extrabold">Passkey</div>
            <div className="mt-1 text-xs text-muted">Log in with an existing passkey</div>
          </div>
          <ExternalLink className={headerIconClass} strokeWidth={2} aria-hidden />
        </button>

        <button
          onClick={onImportSeed}
          className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface/60 px-4 py-4 text-left hover:bg-surface/70"
        >
          <div>
            <div className="text-base font-extrabold">Recovery phrase</div>
            <div className="mt-1 text-xs text-muted">Add a seed-based account</div>
          </div>
          <ExternalLink className={headerIconClass} strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="mt-auto space-y-3 w-full">
        <button
          onClick={onCancel}
          className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
