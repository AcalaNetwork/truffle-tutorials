const PrecompiledToken = artifacts.require('@acala-network/contracts/build/contracts/Token');

const { ACA } = require('@acala-network/contracts/utils/Address');
const { formatUnits } = require('ethers/lib/utils');

module.exports = async function (callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];

    console.log('Getting contract info with the account:', deployer);

    console.log('Account balance:', formatUnits((await web3.eth.getBalance(deployer)).toString(), 12));

    const instance = await PrecompiledToken.at(ACA);

    console.log('PrecompiledToken address:', instance.address);

    const name = await instance.name();
    const symbol = await instance.symbol();
    const decimals = await instance.decimals();
    const value = await instance.totalSupply();
    const balance = await instance.balanceOf(deployer);

    console.log('Token name:', name);
    console.log('Token symbol:', symbol);
    console.log('Token decimal spaces:', decimals.toString());
    console.log('Total supply:', value.toString());
    console.log('Our account token balance:', balance.toString());

    console.log(`Total formatted supply: ${formatUnits(value.toString(), decimals.toNumber())} ${symbol}`);
    console.log(
      `Total formatted account token balance: ${formatUnits(balance.toString(), decimals.toNumber())} ${symbol}`
    );
  } catch (error) {
    console.log(error);
  }

  callback();
};
