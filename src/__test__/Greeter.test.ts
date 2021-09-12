
import OKXclient from "../index";
import path from 'path';
import dotenv from 'dotenv';

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            api_key: string;
            passphrase: string;
            secret_key: string;
            ENV: 'test' | 'dev' | 'prod';
        }
    }
}

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Init secret api OKX
const secretDictOKX = {
    'api_key': process.env.api_key,
    'passphrase': process.env.passphrase,
    'secret_key': process.env.secret_key,
};

function check (ex: any) {
    return ex.getName(); 
} 

test('Check connect API to OKEX', async () => {