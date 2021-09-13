
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