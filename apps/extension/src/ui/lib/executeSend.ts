import type { BuildSendTxRequest, BuildSendTxResponse, StoredAccount } from '@latch/types'

import { extractTransactionHash, signAndSubmitBuiltTx } from './signBuiltTx'
import { friendlyError, sendToBackground } from './backgroundClient'
import {
  buildSendRequestFromDraft,
  buildSetupRequestFromDraft,
  ensureSendRulesConfigured,
  explainSendDraftNotBuildable,
  isNoContextRuleError,
  isBuildSendMissingSetupError,
  passkeySetupPrerequisiteError,
} from './sendTx'
import type { SendDraft, SendResult } from '../types/send'
import type { Surface } from '../routing/routes'

export async function executeSendWithSetupLoop(args: {
  draft: SendDraft
  activeAccount: StoredAccount
  sendTokenPriceUsd: number | null
  activeNetwork: 'testnet' | 'mainnet'
  surface: Surface
  onProgress: (label: string | null) => void
}): Promise<SendResult> {
  const {
    draft,
    activeAccount: account,
    sendTokenPriceUsd,
    activeNetwork,
    surface,
    onProgress,
  } = args

  // Do NOT call /api/smart-account/webauthn here. With a network-specific factory,
  // create-or-connect returns a *new* C-address and aborts before passkey signing,
  // while build-send already works for the funded account the user is sending from.
  const buildBody = buildSendRequestFromDraft(draft, account, sendTokenPriceUsd, activeNetwork)
  if (!buildBody) {
    throw new Error(
      explainSendDraftNotBuildable(draft, account, sendTokenPriceUsd) ?? 'Invalid send details'
    )
  }

  let configuredSendRulesInLoop = false
  for (let attempt = 0; attempt < 5; attempt++) {
    onProgress('Building…')
    const buildRes = await sendToBackground<BuildSendTxRequest, BuildSendTxResponse>({
      type: 'BUILD_SEND_TX',
      payload: buildBody,
    })

    if (buildRes.ok && buildRes.data) {
      const submitData = await signAndSubmitBuiltTx({
        build: buildRes.data,
        activeAccount: account,
        surface,
        onProgress,
      })
      return {
        status: 'success',
        hash: extractTransactionHash(submitData),
        submittedAt: new Date().toISOString(),
      }
    }

    // Missing CallContract send rules: API may return 409 NO_CONTEXT_RULE or opaque
    // 400 internal_error ("failed to build transaction") — same as prepare-sign.
    if (isBuildSendMissingSetupError(buildRes.error)) {
      const setupBody = buildSetupRequestFromDraft(draft, account, undefined, activeNetwork)
      if (!setupBody) {
        throw new Error(
          passkeySetupPrerequisiteError(account) ??
            'Cannot set up send rules for this account. Sign in with your passkey again.'
        )
      }
      const setupResult = await ensureSendRulesConfigured({
        setupBody,
        signAndSubmit: (build) =>
          signAndSubmitBuiltTx({
            build,
            activeAccount: account,
            surface,
            onProgress,
          }),
        onProgress,
      })
      if (setupResult === 'configured') configuredSendRulesInLoop = true
      // Opaque build failure with rules already present is usually simulation (balance,
      // etc.), not missing setup — unless we just configured and the rule may still be landing.
      if (
        setupResult === 'already_configured' &&
        !configuredSendRulesInLoop &&
        !isNoContextRuleError(buildRes.error)
      ) {
        throw new Error(friendlyError(buildRes.error))
      }
      continue
    }

    throw new Error(friendlyError(buildRes.error))
  }

  throw new Error('Send setup did not complete')
}
