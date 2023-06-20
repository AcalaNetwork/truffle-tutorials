# Acala EVM+ Truffle Example: DEX
This example introduces the use of Acala EVM+ predeployed EVM that is present on every network at a
fixed address (the address of a predeployed contract is the same on a local development network,
public test network as well as the production network). As this example focuses on showcasing the
interactions with the [predeployed EVM](https://github.com/AcalaNetwork/predeploy-contracts/blob/master/contracts/docs/evm/EVM.md), it doesn't have its own smart conract. We will get all of
the required imports from the [`@acala-network/contracts`](https://github.com/AcalaNetwork/predeploy-contracts)
dependency. The precompiles and predeploys are a specific feature of the Acala EVM+, so this
tutorial is no longer compatible with traditional EVM development networks (like Ganache) or with
the Hardhat's built in network emulator.

## Start a Local Development Stack
clean up docker containers
```
docker compose down -v
```

start the local development stack
```
docker compose up
```

once you see logs like this, the local development stack is ready. It's ok if there are some warnings/errors in the logs, since there is no transaction in the node yet.
```
 --------------------------------------------
              🚀 SERVER STARTED 🚀
 --------------------------------------------
 version         : bodhi.js/eth-rpc-adapter/2.7.3
 endpoint url    : ws://mandala-node:9944
 subquery url    : http://graphql-engine:3001
 listening to    : 8545
 max blockCache  : 200
 max batchSize   : 50
 max storageSize : 5000
 safe mode       : false
 local mode      : false
 rich mode       : false
 http only       : false
 verbose         : true
 --------------------------------------------
```

For more information about the local development stack, please refer to the [doc](https://evmdocs.acala.network/network/network-setup/local-development-network).

## Run
install deps
```
yarn
```

compile contracts and build types
```
yarn build
```

run through user journey `scripts/userJourney.js`
```
yarn journey:mandala
```

run tests with `test/*.js`
```
yarn test:mandala
```

### run with public mandala
you can also run these scripts with public mandala by inserting your own account key to [truffle-config.js](./truffle-config.js), and then
```
yarn deploy:mandalaPub
yarn test:mandalaPub
```

## More References
- [Acala EVM+ Development Doc](https://evmdocs.acala.network/)