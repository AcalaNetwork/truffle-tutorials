const Token = artifacts.require('Token');

module.exports = async function (deployer) {
  console.log('Deploying Token');

  await deployer.deploy(Token, 1234567890);

  console.log('Token deployed at:', Token.address);
};
