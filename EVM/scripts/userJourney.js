const EVMContract = artifacts.require('@acala-network/contracts/build/contracts/EVM');
const TokenContract = artifacts.require('@acala-network/contracts/build/contracts/Token');

const { EVM } = require('@acala-network/contracts/utils/MandalaTokens');

module.exports = async function (callback) {
  try {
    console.log('');
    console.log('');

    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    const user = accounts[1];

    console.log(`Interacting with EVM using accounts ${deployer} and ${user}`);

    console.log('');
    console.log('');

    console.log('Instantiating DEX and token smart contracts');

    const instance = await EVMContract.at(EVM);

    console.log('EVM instantiated with address', instance.address);

    console.log('');
    console.log('');

    console.log('Preparing addresses for the journey');

    const initalDeployerStatus = await instance.developerStatus(deployer);
    const initialUserStatus = await instance.developerStatus(user);

    if (initalDeployerStatus) {
      await instance.developerDisable({ from: deployer });
    }

    if (initialUserStatus) {
      await instance.developerDisable({ from: user });
    }

    console.log('');
    console.log('');

    console.log('Enabling development mode on deployer address');

    await instance.developerEnable({ from: deployer });

    const midwayDeployerStatus = await instance.developerStatus(deployer);
    const midwayUserStatus = await instance.developerStatus(user);

    console.log(`The developer status of ${deployer} in ${midwayDeployerStatus}.`);
    console.log(`The developer status of ${user} in ${midwayUserStatus}.`);

    console.log('');
    console.log('');

    console.log('Deploying a smart contract');

    const contract = await TokenContract.new();

    const deployMaintainer = await instance.maintainerOf(contract.address);

    console.log(`Contract deployed at ${contract.address} has a maintainer ${deployMaintainer}`);

    console.log('');
    console.log('');

    console.log('Publishing the contract');

    const fee = await instance.publicationFee();

    await instance.publishContract(contract.address, { from: deployer });

    console.log(`Publication fee is ${fee}`);
    console.log('Contract is sucessfuly published!');

    console.log('');
    console.log('');

    console.log('Enabling developer mode on the user address');

    await instance.developerEnable({ from: user });

    const finalDeployerStatus = await instance.developerStatus(deployer);
    const finalUserStatus = await instance.developerStatus(user);

    console.log(`The developer status of ${deployer} in ${finalDeployerStatus}.`);
    console.log(`The developer status of ${user} in ${finalUserStatus}.`);

    console.log('');
    console.log('');

    console.log('Transferring maintainer of the contract to the user address');

    const initialMaintainer = await instance.maintainerOf(contract.address);

    await instance.transferMaintainer(contract.address, user, { from: deployer });

    const finalMaintainer = await instance.maintainerOf(contract.address);

    console.log(
      `Maintainer of the contract at ${contract.address} was transferred from ${initialMaintainer} to ${finalMaintainer}.`
    );

    console.log('');
    console.log('');

    console.log('User journey completed!');
  } catch (error) {
    console.log(error);
  }

  callback();
};
