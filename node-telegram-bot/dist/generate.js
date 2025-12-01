import TonWeb from 'tonweb';
import nacl from 'tweetnacl';
// Generate a new seed (32 bytes)
const seed = nacl.randomBytes(32);
console.log('TON_SEED:', TonWeb.utils.bytesToHex(seed));
// Generate key pair from seed
const keyPair = nacl.sign.keyPair.fromSeed(seed);
console.log('PUBLIC_KEY_HEX:', TonWeb.utils.bytesToHex(keyPair.publicKey));
console.log('SECRET_KEY_HEX:', TonWeb.utils.bytesToHex(keyPair.secretKey));
