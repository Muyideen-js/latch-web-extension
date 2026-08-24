import React from 'react'

import { ExternalLink } from 'lucide-react'

import logoUrl from 'url:../../../../assets/brand/latch-logo.svg'

import type { SignerId } from '../../routing/routes'

const headerIconClass = 'h-[18px] w-[18px]'

export function ChooseSignerScreen({
  routeContentMarginClass,
  flowHeightClass,
  enableOtherSigners,
  chooseSignerForExistingWallet,
  selectedSigner,
  onSelectSigner,
  onContinuePasskey,
  onContinueOther,
  onGoBack,
}: {
  routeContentMarginClass: string
  flowHeightClass: string
  enableOtherSigners: boolean
  chooseSignerForExistingWallet: boolean
  selectedSigner: SignerId
  onSelectSigner: (id: SignerId) => void
  onContinuePasskey: () => void
  onContinueOther: () => void
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
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Choose Signer</h2>
        <p className="mt-2 text-sm text-muted">
          {chooseSignerForExistingWallet
            ? 'Pick how you usually unlock your Latch wallet.'
            : 'Select a signer to secure your smart account'}
        </p>
      </div>

      {/* Choose signer screen */}
      <div className="flex flex-col items-center space-y-3">
        <div className="mt-6 space-y-3 w-full">
          {(enableOtherSigners
            ? ([
                {
                  id: 'freighter',
                  name: 'Freighter',
                  subtitle: 'Browser extension wallet for Stellar',
                },
                {
                  id: 'phantom',
                  name: 'Phantom',
                  subtitle: 'Wallet for message signing',
                },
                {
                  id: 'passkey',
                  name: 'Passkey',
                  subtitle: 'Biometric WebAuthn signer (P-256)',
                },
              ] as const)
            : ([
                {
                  id: 'passkey',
                  name: 'Passkey',
                  subtitle: 'Biometric WebAuthn signer (P-256)',
                },
              ] as const)
          ).map((s) => {
            const active = s.id === selectedSigner
            return (
              <button
                key={s.id}
                onClick={() => onSelectSigner(s.id)}
                className={[
                  'flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left',
                  'bg-surface/60 hover:bg-surface/70',
                  active ? 'border-primary' : 'border-border',
                ].join(' ')}
              >
                <div>
                  <div className="text-base font-extrabold">{s.name}</div>
                  <div className="mt-1 text-xs text-muted">{s.subtitle}</div>
                </div>
                <span className="text-fg/70">
                  <ExternalLink className={headerIconClass} strokeWidth={2} aria-hidden />
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-auto space-y-3 w-full">
          {selectedSigner === 'passkey' ? (
            <button
              onClick={onContinuePasskey}
              className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
            >
              {chooseSignerForExistingWallet ? 'Log in with Passkey' : 'Continue with Passkey'}
            </button>
          ) : (
            <button
              onClick={onContinueOther}
              className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
            >
              Continue
            </button>
          )}
          <button
            onClick={onGoBack}
            className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
