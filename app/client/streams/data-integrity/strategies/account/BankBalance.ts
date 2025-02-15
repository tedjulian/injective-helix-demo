import { Coin } from '@injectivelabs/ts-types'
import { indexerAccountPortfolioApi } from '@shared/Service'
import { ConcreteDataIntegrityStrategy } from '@/app/client/streams/data-integrity/types'
import { BaseDataIntegrityStrategy } from '@/app/client/streams/data-integrity/strategies'

export class BankBalanceIntegrityStrategy
  extends BaseDataIntegrityStrategy<void>
  implements ConcreteDataIntegrityStrategy<void, Coin[]>
{
  static make(): BankBalanceIntegrityStrategy {
    return new BankBalanceIntegrityStrategy()
  }

  async validate(): Promise<void> {
    const accountStore = useAccountStore()
    const sharedWalletStore = useSharedWalletStore()

    if (!sharedWalletStore.isUserConnected) {
      return
    }

    const latestBankBalances = await this.fetchData()

    if (latestBankBalances.length === 0) {
      return
    }

    const existingBankBalances = [...accountStore.bankBalances]
    const isDataValid = this.verifyData(
      existingBankBalances,
      latestBankBalances
    )

    if (!isDataValid) {
      accountStore.cancelBankBalanceStream()
      accountStore.$patch({ bankBalances: await this.fetchData() })
      accountStore.streamBankBalance()
    }
  }

  verifyData(
    existingBankBalances: Coin[],
    latestBankBalances: Coin[]
  ): boolean {
    if (existingBankBalances.length !== latestBankBalances.length) {
      return false
    }

    return latestBankBalances.every((latestBalance) => {
      const existingBalance = existingBankBalances.find(
        (b) => b.denom === latestBalance.denom
      )
      return existingBalance && existingBalance.amount === latestBalance.amount
    })
  }

  async fetchData(): Promise<Coin[]> {
    const sharedWalletStore = useSharedWalletStore()

    const { bankBalancesList } =
      await indexerAccountPortfolioApi.fetchAccountPortfolioBalances(
        sharedWalletStore.authZOrInjectiveAddress
      )

    return bankBalancesList || []
  }
}
