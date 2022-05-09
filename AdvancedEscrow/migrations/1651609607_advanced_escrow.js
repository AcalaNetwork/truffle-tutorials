const AdvancedEscrow = artifacts.require('AdvancedEscrow');

module.exports = async function(deployer) {
  console.log('Deploy AdvancedEscrow');

  await deployer.deploy(AdvancedEscrow);

  console.log(`Advanced escrow deployed at: ${AdvancedEscrow.address}`);
};
