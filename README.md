# API for OKEX exchange

`npm install okx-public-api`

Create file **.env** in main dir and fill out with OKEX API key

```
api_key=1234aasddfds
secret_key=sds321231a3
passphrase=Password
```

Start used lib

```
import OKXclient from 'okx-public-api';
const okxApi = new OKXclient(apiKey, apiSecret, apiPass);
```

### Methods:
`okxApi.getBalance()` - return as

```
{
    ccy: BTC,
    avail: 1,
    eqUsd: 23000,
}
```

`okxApi.getMarket(ccy, depth)` - get orderbook with depth, parametrs:  
**ccy** - 'BTC-USDT'  
**depth** - 4

```
{
    'ask': [[priceAsk1, amountAsk1], [priceAsk2, amountAsk2], ...],
    'bid': [[priceBid1, amountBid1], [priceBid2, amountBid2], ...]
}
```

`okxApi.putOrders(market, spot, countOrd, orderList)` - put orders buy/sell  
**market** - 'BTC-USDT'  
**spot** - 'buy'/'sell'  
**countOrd** - amount orders  
**orderList** - array orders [[priceOrder1, amountOrder1], [priceOrder2, amountOrder2] , ...]

```
    return true/false/Error
```

`okxApi.transferCurrAcc(currency, amount, from, to)` - Transfer within account  
**curryncy** - 'BTC'  
**amount** - amount (+fee if to main + withdrawal)  
**fro