const HDWalletProvider = require('@truffle/hdwallet-provider');

// pre-funded accounts for local mandala
const mnemonic = 'fox sight canyon orphan hotel grow hedgehog build bless august weather swarm';

module.exports = {
  networks: {
    mandala: {
      provider: () => new HDWalletProvider(mnemonic, 'http://localhost:8545'),
      network_id: 595,
    },
    mandalaPub: {
      provider: () => new HDWalletProvider('your private key or mnemonic', 'https://eth-rpc-tc9.aca-staging.network'),
      network_id: 595,
    },
    mandalaCI: {
      provider: () => new HDWalletProvider(mnemonic, 'http://eth-rpc-adapter-server:8545'),
      network_id: 595,
    },
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    }
  },
  mocha: {
    timeout: 100000
  },
  compilers: {
    solc: {
      version: '0.8.9'
    }
  },
};
