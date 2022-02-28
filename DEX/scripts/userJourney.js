const DEXContract = artifacts.require("@acala-network/contracts/build/contracts/DEX");
const TokenContract = artifacts.require("@acala-network/contracts/build/contracts/Token");

const { ACA, AUSD, DEX, DOT } = require("@acala-network/contracts/utils/Address");
const { formatUnits, parseUnits } = require("ethers/lib/utils");


module.exports = async function(callback) {
  try {
    console.log("");
    console.log("");

    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    
    console.log("Interacting with DEX using account:", deployer);

    console.log(`Initial account balance: ${formatUnits((await web3.eth.getBalance(deployer)).toString(), 12)} ACA`);

    console.log("");
    console.log("");

    console.log("Instantiating DEX and token smart contracts");

    const instance = await DEXContract.at(DEX);
    const ACAinstance = await TokenContract.at(ACA);
    const AUSDinstance = await TokenContract.at(AUSD);
    const DOTinstance = await TokenContract.at(DOT);

    console.log("DEX instantiated with address", instance.address);
    console.log("ACA token instantiated with address", ACAinstance.address);
    console.log("AUSD token instantiated with address", AUSDinstance.address);
    console.log("DOT token instantiated with address", DOTinstance.address);

    console.log("");
    console.log("");

    console.log("Getting inital token balances");

    const initialAcaBalance = await ACAinstance.balanceOf(deployer);
    const initialAusdBalance = await AUSDinstance.balanceOf(deployer);
    const initialDotBalance = await DOTinstance.balanceOf(deployer);

    const acaDecimals = (await ACAinstance.decimals()).toNumber();
    const ausdDecimals = (await AUSDinstance.decimals()).toNumber();
    const dotDecimals = (await DOTinstance.decimals()).toNumber();

    console.log("Inital %s ACA balance: %s ACA", deployer, formatUnits(initialAcaBalance.toString(), acaDecimals));
    console.log("Inital %s AUSD balance: %s AUSD", deployer, formatUnits(initialAusdBalance.toString(), ausdDecimals));
    console.log("Inital %s DOT balance: %s DOT", deployer, formatUnits(initialDotBalance.toString(), dotDecimals));

    console.log("");
    console.log("");

    console.log("Getting liquidity pools");

    const initialAcaAusdLP = await instance.getLiquidityPool(ACA, AUSD);
    const initialAcaDotLP = await instance.getLiquidityPool(ACA, DOT);
    const initialDotAusdLP = await instance.getLiquidityPool(DOT, AUSD);

    console.log("Initial ACA - AUSD liquidity pool: %s ACA - %s AUSD", formatUnits(initialAcaAusdLP[0].toString(), 12), formatUnits(initialAcaAusdLP[1].toString(), acaDecimals));
    console.log("Initial ACA - DOT liquidity pool: %s ACA - %s DOT", formatUnits(initialAcaDotLP[0].toString(), 12), formatUnits(initialAcaDotLP[1].toString(), ausdDecimals));
    console.log("Initial DOT - AUSD liquidity pool: %s DOT - %s AUSD", formatUnits(initialDotAusdLP[0].toString(), 12), formatUnits(initialDotAusdLP[1].toString(), dotDecimals));

    console.log("");
    console.log("");

    console.log("Getting liquidity pool token addresses");

    const acaAusdLPTokenAddress = await instance.getLiquidityTokenAddress(ACA, AUSD);
    const acaDotLPTokenAddress = await instance.getLiquidityTokenAddress(ACA, DOT);
    const dotAusdLPTokenAddress = await instance.getLiquidityTokenAddress(DOT, AUSD);

    console.log("Liquidity pool token address for ACA - AUSD:", acaAusdLPTokenAddress);
    console.log("Liquidity pool token address for ACA - DOT:", acaDotLPTokenAddress);
    console.log("Liquidity pool token address for DOT - AUSD:", dotAusdLPTokenAddress);

    console.log("");
    console.log("");

    console.log("Getting expected swap target amounts");

    const path1 = [ACA, AUSD];
    const path2 = [ACA, AUSD, DOT];
    const supply = initialAcaBalance.div(web3.utils.toBN(1000));

    const expectedTarget1 = await instance.getSwapTargetAmount(path1, supply);
    const expectedTarget2 = await instance.getSwapTargetAmount(path2, supply);

    console.log("Expected target when using path ACA -> AUSD: %s AUSD", formatUnits(expectedTarget1.toString(), ausdDecimals));
    console.log("Expected target when using path ACA -> AUSD -> DOT: %s DOT", formatUnits(expectedTarget2.toString(), dotDecimals));

    console.log("");
    console.log("");

    console.log("Swapping with exact supply");

    await instance.swapWithExactSupply(path1, supply, 1);
    await instance.swapWithExactSupply(path2, supply, 1);

    const halfwayAcaBalance = await ACAinstance.balanceOf(deployer);
    const halfwayAusdBalance = await AUSDinstance.balanceOf(deployer);
    const halfwayDotBalance = await DOTinstance.balanceOf(deployer);

    console.log("Halfway %s ACA balance: %s ACA", deployer, formatUnits(halfwayAcaBalance.toString(), acaDecimals));
    console.log("Halfway %s AUSD balance: %s AUSD", deployer, formatUnits(halfwayAusdBalance.toString(), ausdDecimals));
    console.log("Halfway %s DOT balance: %s DOT", deployer, formatUnits(halfwayDotBalance.toString(), dotDecimals));

    console.log("%s AUSD balance increase was %s AUSD, while the expected increase was %s AUSD.", deployer, formatUnits(halfwayAusdBalance.sub(initialAusdBalance).toString(), 12), formatUnits(expectedTarget1.toString(), ausdDecimals));
    console.log("%s DOT balance increase was %s DOT, while the expected increase was %s DOT.", deployer, formatUnits(halfwayDotBalance.sub(initialDotBalance).toString(), 12), formatUnits(expectedTarget2.toString(), dotDecimals));

    console.log("");
    console.log("");

    console.log("Getting expected supply amount");

    const targetAusd = web3.utils.toBN(parseUnits("10", ausdDecimals));
    const targetDot = web3.utils.toBN(parseUnits("10", dotDecimals));

    const expectedSupply1 = await instance.getSwapSupplyAmount(path1, targetAusd);
    const expectedSupply2 = await instance.getSwapSupplyAmount(path2, targetDot);

    console.log("Expected supply for getting %s AUSD in order to reach a total of %s AUSD is %s ACA.", formatUnits(targetAusd.toString(), ausdDecimals), formatUnits(targetAusd.add(halfwayAusdBalance).toString(), ausdDecimals), formatUnits(expectedSupply1.toString(), acaDecimals));
    console.log("Expected supply for getting %s DOT in order to reach a total of %s DOT is %s ACA.", formatUnits(targetDot.toString(), dotDecimals), formatUnits(targetDot.add(halfwayDotBalance).toString(), dotDecimals), formatUnits(expectedSupply2.toString(), acaDecimals));

    console.log("");
    console.log("");

    console.log("Swapping with exact target");

    await instance.swapWithExactTarget(path1, targetAusd, expectedSupply1.add(web3.utils.toBN(parseUnits("1", ausdDecimals))));
    await instance.swapWithExactTarget(path2, targetDot, expectedSupply2.add(web3.utils.toBN(parseUnits("1", dotDecimals))));

    const finalAcaBalance = await ACAinstance.balanceOf(deployer);
    const finalAusdBalance = await AUSDinstance.balanceOf(deployer);
    const finalDotBalance = await DOTinstance.balanceOf(deployer);

    console.log("Final %s ACA balance: %s ACA", deployer, formatUnits(finalAcaBalance.toString(), acaDecimals));
    console.log("Final %s AUSD balance: %s AUSD", deployer, formatUnits(finalAusdBalance.toString(), ausdDecimals));
    console.log("Final %s DOT balance: %s DOT", deployer, formatUnits(finalDotBalance.toString(), dotDecimals));

    console.log("AUSD balance has increased by %s AUSD, while the expected increase was %s AUSD.", formatUnits(finalAusdBalance.sub(halfwayAusdBalance).toString(), ausdDecimals), formatUnits(targetAusd.toString(), ausdDecimals));
    console.log("DOT balance has increased by %s DOT, while the expected increase was %s DOT.", formatUnits(finalDotBalance.sub(halfwayDotBalance).toString(), dotDecimals), formatUnits(targetDot.toString(), dotDecimals));

    console.log("Expected decrease of ACA balance was %s ACA, while the actual decrease was %s ACA.", formatUnits(expectedSupply1.add(expectedSupply2).toString(), acaDecimals), formatUnits(halfwayAcaBalance.sub(finalAcaBalance).toString(), acaDecimals));

    console.log("");
    console.log("");

    console.log("User journey completed!");
  }
  catch(error) {
    console.log(error)
  }

  callback()
}