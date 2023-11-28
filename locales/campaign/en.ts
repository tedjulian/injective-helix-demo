import { I18nMessageFunction } from '@/types'

export default {
  campaign: {
    apy: 'APY',
    rank: 'Rank',
    error: 'Error',
    claim: 'Claim',
    volume: 'Volume',
    market: 'Market',
    details: 'Details',
    success: 'Success',
    overall: 'Overall',
    address: 'Address',
    rewards: 'Rewards',
    ongoing: 'Ongoing',
    claimed: 'Claimed',
    endTime: 'End Time',
    title: 'LP Rewards',
    liquidity: 'Liquidity',
    dashboard: 'Dashboard',
    round: 'Round {round}',
    allRewards: 'All Rewards',
    estRewards: 'Est. Rewards',
    rewardYield: 'Reward Yield',
    totalVolume: 'Total Volume',
    rewardStats: 'Reward Stats',
    rewardsRound: 'Rewards/Round',
    myRewards: 'My Rewards',
    myRewardsCount: 'My Rewards ({rewards})',
    totalRewards: 'Total Rewards',
    campaignRules: 'Campaign Rules',
    readyIn: 'Ready in {hours} Hrs',
    totalLiquidity: 'Total Liquidity',
    rewardsToClaim: 'Rewards To Claim',
    volumeThisRound: 'Volume This Round',
    totalEstRewards: 'Total Est. Rewards',
    dashboardTitle: 'LP Rewards Dashboard',
    endTimeForRound: 'End Time for Round {round}',
    totalRewardsAllTime: 'Total Rewards (All Time)',
    totalRewardsThisRound: 'Total Rewards This Round',
    successfullyClaimedRewards: 'Succesfuly Claimed Rewards',
    errorAlreadyClaimed: 'This reward has already been claimed.',
    readyInLessThan: 'Ready in less than {time} {interval}',
    campaignNotFound: 'Campaign not found, please try again later.',
    description: 'Earn rewards by trading different spot markets',
    eligibleMarkets: 'Eligible Market for Rewards ',
    lastUpdatedAt: 'Last updated at {date}',
    lastUpdated: ({ named }: I18nMessageFunction) =>
      `Last updated at ${named('date')}`
  }
}
