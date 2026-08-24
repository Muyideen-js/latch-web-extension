import type {
  PrepareSwapTxRequest,
  PrepareSwapTxResponse,
  SetupSwapRulesRequest,
  SetupSwapRulesResponse,
  StoredAccount,
} from '@latch/types'

import { signAndSubmitBuiltTx } from './signBuiltTx'
import { friendlyError, sendToBackground } from './backgroundClient'
import {
  isNoContextRuleError,
  isPrepareSignMissingSetupError,
  isSwapRuleReconfigureError,
  passkeySetupPrerequisiteError,
} from './sendTx'
import {
  buildSetupSwapRequestFromQuote,
  swapBuildNeedsSignerReconfigure,
  swapSetupPrerequisiteError,
} from './swapTx'
import type { SwapQuoteVm } from '../swap/swapVm'
import type { Surface } from '../routing/routes'

export async function executeSwapWithSetupLoop(args: {
  quoteForTx: SwapQuoteVm
  activeAccount: StoredAccount
  surface: Surface
}): Promise<PrepareSwapTxResponse> {
  const { quoteForTx, activeAccount, surface } = args
  if (!activeAccount?.id) throw new Error('No active account')

  const isSoroswap = quoteForTx.quotePayload.providerId === 'soroswap'

  async function runSwapRuleSetup(): Promise<void> {
    const setupPayload = await buildSetupSwapRequestFromQuote(
      quoteForTx.quotePayload,
      activeAccount
    )
    if (!setupPayload) {
      throw new Error(
        (await swapSetupPrerequisiteError(activeAccount, quoteForTx.quotePayload)) ??
          passkeySetupPrerequisiteError(activeAccount) ??
          'Invalid swap setup details'
      )
    }

    // Match ensureSendRulesConfigured: keep calling until alreadyConfigured or remaining=0.
    for (let setupAttempt = 0; setupAttempt < 5; setupAttempt++) {
      const setupRes = await sendToBackground<SetupSwapRulesRequest, SetupSwapRulesResponse>({
        type: 'SETUP_SWAP_RULES',
        payload: setupPayload,
      })
      if (!setupRes.ok) {
        const code = setupRes.error?.code
        if (code === 'signer_already_exists') {
          return
        }
        throw new Error(friendlyError(setupRes.error))
      }
      const setup = setupRes.data!
      if (setup.alreadyConfigured) {
        return
      }
      await signAndSubmitBuiltTx({
        build: setup,
        activeAccount,
        surface,
      })
      if ((setup.remainingSetupCount ?? 0) <= 0) {
        return
      }
    }
    throw new Error('Swap setup did not complete')
  }

  // prepare-sign-integration-guide: setup-swap-rules must run before the first
  // prepare-sign for that signer/network. Soroswap prepare-sign returns a generic
  // internal_error (not NO_CONTEXT_RULE) when rules are missing — so ensure setup first.
  if (isSoroswap) {
    await runSwapRuleSetup()
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const prepareRes = await sendToBackground<PrepareSwapTxRequest, PrepareSwapTxResponse>({
      type: 'PREPARE_SWAP_TX',
      payload: {
        accountId: activeAccount.id,
        quote: quoteForTx.quotePayload,
      },
    })

    if (prepareRes.ok && prepareRes.data) {
      if (swapBuildNeedsSignerReconfigure(prepareRes.data, activeAccount)) {
        await runSwapRuleSetup()
        continue
      }
      return prepareRes.data
    }

    if (isNoContextRuleError(prepareRes.error) || isSwapRuleReconfigureError(prepareRes.error)) {
      await runSwapRuleSetup()
      continue
    }

    // Soroswap / prepare-sign: missing swap rules can surface as opaque 400 internal_error.
    // Retry setup + prepare a few times (setup tx may still be landing).
    if (isSoroswap && isPrepareSignMissingSetupError(prepareRes.error) && attempt < 4) {
      await runSwapRuleSetup()
      continue
    }

    throw new Error(friendlyError(prepareRes.error))
  }

  throw new Error('Swap setup did not complete')
}
