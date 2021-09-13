
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