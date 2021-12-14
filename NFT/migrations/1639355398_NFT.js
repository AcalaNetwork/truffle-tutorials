const NFT = artifacts.require("NFT");

module.exports = async function (deployer) {
  console.log("Deploying NFT");
  
  await deployer.deploy(NFT);

  console.log("NFT deployed at:", NFT.address);
};