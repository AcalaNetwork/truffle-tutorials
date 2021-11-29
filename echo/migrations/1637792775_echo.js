const Echo = artifacts.require("Echo");

module.exports = async function (deployer) {
  console.log("Deploying Echo");

  await deployer.deploy(Echo);

  console.log("Echo deployed at:", Echo.address);
};
