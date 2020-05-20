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

`okxApi.getMarket(ccy, depth)` - get orde