"use strict";
const TonWeb = require('tonweb');
// Generate a new seed (32 bytes)
const seed = TonWeb.utils.newSeed();
console.log('TON_SEED:', TonWeb.utils.bytesToHex(seed));
// Generate key pair from seed
const keyPair = TonWeb.utils.keyPairFromSeed(seed);
console.log('PUBLIC_KEY_HEX:', TonWeb.utils.bytesToHex(keyPair.publicKey));
console.log('SECRET_KEY_HEX:', TonWeb.utils.bytesToHex(keyPair.secretKey));
