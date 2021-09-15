
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