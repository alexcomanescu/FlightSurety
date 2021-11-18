# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), the dApp (using HTML, CSS and JS) and server app.

These are the version of the components used:

Truffle v5.4.19 (core: 5.4.19)
Solidity - ^0.8.6 (solc-js)
Node v16.13.0
Web3.js v1.5.3

Besides truffle, please install also ganache-cli:

`npm install -g ganache-cli`

To install, download or clone the repo, then:

`npm install`
`truffle compile`
`truffle migrate --reset`

## Run the project

In order to run the project, please open several terminal windows, then run in each:

`npm run ganache`

`npm run dapp`

`npm run server`

In order to access the dapp, please go to http://localhost:8000

To run the tests, please run

`npm run test`

## Resources

- [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
- [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
- [Truffle Framework](http://truffleframework.com/)
- [Ganache Local Blockchain](http://truffleframework.com/ganache/)
- [Remix Solidity IDE](https://remix.ethereum.org/)
- [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
- [Ethereum Blockchain Explorer](https://etherscan.io/)
- [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
