
import axios from 'axios';
import crypto from 'crypto';

type Order = [number, number]; // Order type: [price, vol]

type num = number | string; // number or string (convert to number)

type balanceInfo = {
  // balance info on exchange
  ccy: string;
  avail: num;
  eqUsd: num;
};

interface Orderbook {
  // Orderbook on exchange, with us balance on exchange
  asks: Order[];
  bids: Order[];
  balance: balanceInfo;
}

// in order to create new OKXclient(api_key, api_secret_key, passphrase)
export default class OKXclient {
  instance: any;

  constructor(apiKey: string, apiSecret: string, passphrase: string) {
    this.instance = axios.create({
      baseURL: 'https://www.okx.com',
      timeout: 5000,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json; utf-8',
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-PASSPHRASE': passphrase,
      },
    });

    this.instance.interceptors.request.use((config: any) => {
      const now = new Date().toISOString();
      const method = config.method.toUpperCase();
      let { data, params } = config;
      let sign: string;

      if (!data) {
        data = '';
      } else {
        data = JSON.stringify(data);
      }

      params = new URLSearchParams(params).toString();

      sign = crypto
        .createHmac('sha256', apiSecret)
        .update(
          now + method.toUpperCase() + `${config.url}` + (method === 'GET' ? (params ? `?${params}` : ``) : `${data}`),
        )
        .digest('base64');

      config.headers['OK-ACCESS-TIMESTAMP'] = now;

      config.headers['OK-ACCESS-SIGN'] = sign;

      return config;
    });
  }

  getName() {
    return Promise.resolve('OKX');
  }

  // GET request
  getRequest(endpoint: string, params: {} = {}) {
    return this.instance
      .get(endpoint, { params })
      .then(
        (result: any) => {
          return result?.data.data[0] ?? Promise.reject({ error: 'bad GET request first step', code: -1, ex: 'OKX' });
        },
        (e: any) => {
          return Promise.reject({ error: 'bad GET request first step', code: -1, ex: 'OKX' });
        },
      )
      .catch(() => {
        return Promise.reject({ error: 'bad GET request first step', code: -1, ex: 'OKX' });
      });
  }

  // POST request
  postRequest(endpoint: string, data: {} = {}) {
    return this.instance.post(endpoint, data).catch(() => {
      return Promise.reject({ error: 'bad POST request first step', code: -1, ex: 'OKX' });
    });
  }

  // Get balance account
  // return list of object [ {'ccy': ccy, 'avail': amountAvailble, 'eqUsd', equelUsd} ]
  getBalance() {
    interface Details {
      ccy: string;
      frozenBal: string | number;
      availEq: string | number;
      eqUsd: string | number;
    }
    interface Balance {
      details: Details[];
    }

    return this.getRequest('/api/v5/account/balance')
      .then(
        (balance: any | Balance): balanceInfo | any => {
          if (balance?.code === -1) {
            return Promise.reject({ error: 'bad GET request balance check', code: -1, ex: 'OKX' });
          }

          return (
            balance?.details.map((element: Details) => {
              return {
                ccy: element.ccy,
                avail: element.availEq,
                eqUsd: element.eqUsd,
              };
            }) ?? Promise.reject({ error: 'bad GET request balance check', code: -1, ex: 'OKX' })
          );
        },
        () => {
          return Promise.reject({ error: 'bad GET request balance check', code: -1, ex: 'OKX' });
        },
      )
      .catch(() => {
        return Promise.reject({ error: 'bad GET request balance check', code: -1, ex: 'OKX' });
      });
  }

  /*Get market price with any depth < 400
    instId='TON-USDT', depth=int
    return object 
    {
        'ask': [[priceAsk1, amountAsk1], [priceAsk2, amountAsk2], ...],
        'bid': [[priceBid1, amountBid1], [priceBid2, amountBid2], ...]
    }
    */
  getMarket(instId: string, sz: number | null = null) {
    return this.getRequest(`/api/v5/market/books`, { instId, sz })
      .then(
        (orderbook: Orderbook | any) => {
          if (orderbook?.code === -1) {
            return Promise.reject({ error: 'bad GET request balance check', code: -1, ex: 'OKX' });
          }

          if (!orderbook.asks || !orderbook.bids) {
            return Promise.reject({ error: 'bad GET request orderbook check', code: -1, ex: 'OKX' });
          }

          return {
            asks: orderbook.asks.map((item: []) => item.splice(0, 2)),
            bids: orderbook.bids.map((item: []) => item.splice(0, 2)),
          };
        },
        () => {
          return Promise.reject({ error: 'bad GET request orderbook check', code: -1, ex: 'OKX' });
        },
      )
      .catch(() => {
        return Promise.reject({ error: 'bad GET request orderbook check', code: -1, ex: 'OKX' });
      });
  }

  // put orders buy/sell
  // market - 'TON-USDT'
  // spot - 'buy/sell'
  // countOrd - amount orders
  // orderList - array orders [[priceOrder1, amountOrder1], [priceOrder2, amountOrder2] , ...]
  putOrders(market: string, spot: string, countOrd: number, orderList: [number, number][]) {
    const endpoint = '/api/v5/trade/batch-orders';

    const orders: {}[] = [];

    orderList.forEach((item: [number, number], i: number) => {
      if (i < countOrd) {
        orders.push({
          instId: market,
          tdMode: 'cash',
          side: spot,
          ordType: 'limit',
          px: item[0],
          sz: item[1],
        });
      }
    });

    return this.postRequest(endpoint, orders)
      .then(
        (r: any) => {
          if (r.code !== 0) {
            return false;
          }
          return true;
        },
        () => {
          return Promise.reject({ error: 'bad POST request order put', code: -1, ex: 'OKX' });
        },
      )
      .catch(() => {
        return Promise.reject({ error: 'bad POST request order put', code: -1, ex: 'OKX' });
      });
  }

  // Transfer within account
  // curryncy - 'TON' , amount - amount (+fee if to main + withdrawal)
  // TradeAcc = "18"
  // MainAcc = "6"
  transferCurrAcc(currency: string, amount: number | string, from: number | string, to: number | string) {
    // body for transfer within account
    const bodyTransfer = {
      ccy: currency,
      amt: amount,
      from,
      to,
    };
    return this.postRequest('/api/v5/asset/transfer', bodyTransfer).catch(() => {
      return Promise.reject({ error: 'bad POST request transfer', code: -1, ex: 'OKX' });
    });
  }
  // Withdrawal from FTX to address
  // currency - 'TON'
  // amount - 130
  // chain - 'TON-TON' (for each currency his own)
  // address - address for withdrawal (+:tag)
  // fee - (for each currency his own)