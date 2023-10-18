import {BitGo} from "bitgo";

const sdk = new BitGo({ env: 'test' });
// const encryptedText = sdk.encrypt({
//     input: '91pBUgVvwjYWEzFb4nXsNDBwWDYtW9ZSTBkygwFJHWqP7r43yS8',
//     password: 'place_holder'
// });
//
// console.log(`encrypted: ${encryptedText}`);


const decryptedText = sdk.decrypt({
    input: "{\"iv\":\"JhCyyIPQrd3nSqgRwyJLTw==\",\"v\":1,\"iter\":10000,\"ks\":256,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"Jt8PeeC2uRU=\",\"ct\":\"7GsPgRYQKqV1sJyFnMvC1/wjOsv4CUhgPrbosP6+KS391LhTk6V1OKuMgeIU/gQYFowbmKSJov4HYFc=\"}",
    password: 'place_holder'
});
console.log(`plain-text: ${decryptedText}`);
