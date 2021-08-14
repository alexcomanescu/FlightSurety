var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic =
  "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

module.exports = {
  networks: {
    development: {
      /*
      provider: function() {
        return new HDWalletProvider({
          mnemonic: {
            phrase: mnemonic
          },
          providerOrUrl: "http://localhost:8545",
          chainId: 5777
        });
      
      },
      network_id: '*',
      gas: 9999999
    } */
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
    },
  },
  compilers: {
    solc: {
      version: "^0.8.6",
    },
  },
};
