import { indexerDerivativesApi, indexerSpotApi } from '@shared/Service'
import { Status, StatusType } from '@injectivelabs/utils'
import {
  WorkerMessageType,
  OrderbookWorkerResult,
  OrderbookWorkerMessage,
  WorkerMessageResponseType
} from '@/types/worker'
import { spotMarketStream } from '@/app/client/streams/spot'
// eslint-disable-next-line
import OrderbookWorker from '@/assets/worker/orderbookWorker?worker'
import { derivativesMarketStream } from '@/app/client/streams/derivatives'

import {
  UiMarketWithToken,
  AggregationKey,
  OrderbookWorkerKey,
  OrderbookStatusKey
} from '@/types'

interface OrderbookWorker extends Omit<Worker, 'postMessage'> {
  postMessage(message: OrderbookWorkerMessage): void
}

export function useDerivativeOrderbook(
  market: ComputedRef<UiMarketWithToken | undefined>
) {
  const isSpot = false

  return useOrderbook(market, isSpot)
}

export function useSpotOrderbook(
  market: ComputedRef<UiMarketWithToken | undefined>
) {
  const isSpot = true

  return useOrderbook(market, isSpot)
}

export function useOrderbook(
  market: ComputedRef<UiMarketWithToken | undefined>,
  isSpot: boolean
) {
  const orderbookStore = useOrderbookStore()

  const orderbookStatus = reactive(new Status(StatusType.Loading))
  const aggregation = ref(market.value?.priceDecimals || 0)

  const worker = shallowRef<OrderbookWorker | null>(null)

  onMounted(() => {
    if (typeof Worker !== 'undefined') {
      worker.value = new OrderbookWorker()

      worker.value.onmessage = (event) => {
        const data = event.data as OrderbookWorkerResult

        if (data.messageType === WorkerMessageResponseType.ReplaceOrderbook) {
          orderbookStore.$patch({
            buys: data.data.buys,
            sells: data.data.sells
          })
        }

        if (data.messageType === WorkerMessageResponseType.WorstPrice) {
          orderbookStore.worstPrice = data.data.worstPrice
        }
      }
    } else {
      // console.error('Web worker is not supported')
    }
  })

  let spotStream:
    | ReturnType<typeof spotMarketStream.streamSpotOrderbookUpdate>
    | undefined
  let derivativesStream:
    | ReturnType<typeof derivativesMarketStream.streamDerivativeOrderbookUpdate>
    | undefined

  function fetchSpotOrderbook() {
    if (!market.value) {
      return
    }

    indexerSpotApi.fetchOrderbookV2(market.value.marketId).then((data) => {
      if (!market.value) {
        return
      }

      orderbookStatus.setIdle()

      worker.value?.postMessage({
        type: WorkerMessageType.Fetch,
        data: {
          isSpot: true,
          baseDecimals: market.value.baseToken.decimals,
          quoteDecimals: market.value.quoteToken.decimals,
          orderbook: data,
          aggregation: aggregation.value,
          sequence: data.sequence
        }
      })
    })
  }

  function fetchDerivativeOrderbook() {
    if (!market.value) {
      return
    }

    indexerDerivativesApi
      .fetchOrderbookV2(market.value.marketId)
      .then((data) => {
        if (!market.value) {
          return
        }

        orderbookStatus.setIdle()

        worker.value?.postMessage({
          type: WorkerMessageType.Fetch,
          data: {
            isSpot: false,
            baseDecimals: market.value.baseToken.decimals,
            quoteDecimals: market.value.quoteToken.decimals,
            orderbook: data,
            aggregation: aggregation.value,
            sequence: data.sequence
          }
        })
      })
  }

  function fetchAndStreamSpot(market: UiMarketWithToken) {
    if (spotStream) {
      spotStream.unsubscribe()
    }

    spotStream = spotMarketStream.streamSpotOrderbookUpdate({
      marketIds: [market.marketId],
      callback: (data) => {
        worker.value?.postMessage({
          type: WorkerMessageType.Stream,
          data: {
            isSpot: true,
            baseDecimals: market.baseToken.decimals,
            quoteDecimals: market.quoteToken.decimals,
            orderbook: data.orderbook!,
            aggregation: aggregation.value,
            sequence: data.orderbook!.sequence
          }
        })
      }
    })

    fetchSpotOrderbook()
  }

  function fetchAndStreamDerivative(market: UiMarketWithToken) {
    if (derivativesStream) {
      derivativesStream.unsubscribe()
    }

    derivativesStream = derivativesMarketStream.streamDerivativeOrderbookUpdate(
      {
        marketIds: [market.marketId],
        callback: (data) => {
          worker.value?.postMessage({
            type: WorkerMessageType.Stream,
            data: {
              isSpot: false,
              baseDecimals: market.baseToken.decimals,
              quoteDecimals: market.quoteToken.decimals,
              orderbook: data.orderbook!,
              aggregation: aggregation.value,
              sequence: data.orderbook!.sequence
            }
          })
        }
      }
    )

    fetchDerivativeOrderbook()
  }

  provide(OrderbookStatusKey, orderbookStatus)
  provide(OrderbookWorkerKey, worker)
  provide(AggregationKey, aggregation)

  watch(aggregation, () => {
    worker.value?.postMessage({
      type: WorkerMessageType.Aggregation,
      data: {
        isSpot,
        baseDecimals: market.value?.baseToken.decimals || 0,
        quoteDecimals: market.value?.quoteToken.decimals || 0,
        aggregation: aggregation.value
      }
    })
  })

  watch(
    [market, worker],
    ([market, worker]) => {
      if (!worker || !market) {
        return
      }

      spotStream?.unsubscribe()
      derivativesStream?.unsubscribe()

      if (isSpot) {
        fetchAndStreamSpot(market)
      } else {
        fetchAndStreamDerivative(market)
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (worker.value) {
      worker.value.terminate()
    }

    spotStream?.unsubscribe()
    derivativesStream?.unsubscribe()

    orderbookStore.$reset()
  })
}
