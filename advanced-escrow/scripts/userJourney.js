const AdvancedEscrow = artifacts.require('AdvancedEscrow');
const TokenContract = artifacts.require('@acala-network/contracts/build/contracts/Token');

const { ACA, AUSD, DOT } = require('@acala-network/contracts/utils/MandalaTokens');
const { formatUnits } = require('ethers/lib/utils');
const { ApiPromise, WsProvider } = require('@polkadot/api');

const ENDPOINT_URL = process.env.ENDPOINT_URL || 'ws://127.0.0.1:9944';
const provider = new WsProvider(ENDPOINT_URL);

module.exports = async function (callback) {
  try {
    const api = await ApiPromise.create({ provider });

    console.log('');
    console.log('');

    console.log('Starting user journey');

    console.log('');
    console.log('');

    const accounts = await web3.eth.getAccounts();
    const initiator = accounts[0];
    const beneficiary = accounts[1];

    console.log(`Address of the initiator is ${initiator}`);
    console.log(`Address of the beneficiary is ${beneficiary}`);

    console.log('');
    console.log('');

    console.log('Deploying AdvancedEscrow smart contract');
    const instance = await AdvancedEscrow.new();

    console.log(`AdvancedEscrow is deployed at address ${instance.address}`);

    console.log('');
    console.log('');

    console.log('Instantiating ACA predeployed smart contract');
    const primaryTokenInstance = await TokenContract.at(ACA);

    const initialPrimaryTokenBalance = await primaryTokenInstance.balanceOf(initiator);
    const primaryTokenName = await primaryTokenInstance.name();
    const primaryTokenSymbol = await primaryTokenInstance.symbol();
    const primaryTokenDecimals = await primaryTokenInstance.decimals();
    console.log(
      `Initial initator ${primaryTokenName} token balance: ${formatUnits(initialPrimaryTokenBalance.toString(), primaryTokenDecimals.toString())} ${primaryTokenSymbol}`
    );

    console.log('');
    console.log('');

    console.log('Scenario #1: Escrow funds are released by Schedule');

    console.log('');
    console.log('');
  
    console.log('Transferring primary token to Escrow instance');

    await primaryTokenInstance.transfer(instance.address, Math.floor(initialPrimaryTokenBalance/10000), { from: initiator });

    console.log('Initiating escrow');

    await instance.initiateEscrow(beneficiary, ACA, Math.floor(initialPrimaryTokenBalance/1000000), 10, { from: initiator });

    const escrowBlockNumber = await web3.eth.getBlock('latest');

    console.log(`Escrow initiation successful in block ${escrowBlockNumber.number}. Expected automatic completion in block ${escrowBlockNumber.number + 10}`);

    const escrow = await instance.escrows(0);

    console.log('Escrow initiator:', escrow.initiator);
    console.log('Escrow beneficiary:', escrow.beneficiary);
    console.log('Escrow ingress token:', escrow.ingressToken);
    console.log('Escrow egress token:', escrow.egressToken);
    console.log('Escrow AUSD value:', escrow.AusdValue.toString());
    console.log('Escrow deadline:', escrow.deadline.toString());
    console.log('Escrow completed:', escrow.completed);

    console.log('');
    console.log('');

    console.log('Instantiating AUSD instance');

    const AusdInstance = await TokenContract.at(AUSD);

    const initialBeneficiaryAusdBalance = await AusdInstance.balanceOf(beneficiary);


    console.log(`Initial AUSD balance of beneficiary: ${formatUnits(initialBeneficiaryAusdBalance.toString(), 12)} AUSD`);

    console.log('Waiting for automatic release of funds');

    let currentBlockNumber = await web3.eth.getBlock('latest');

    while(currentBlockNumber.number <= escrowBlockNumber.number + 10) {
      console.log(`Still waiting. Current block number is ${currentBlockNumber.number}. Target block number is ${escrowBlockNumber.number + 10}`);
      currentBlockNumber = await web3.eth.getBlock('latest');
      await api.rpc.engine.createBlock(true /* create empty */, true /* finalize it*/);
    }

    const finalBeneficiaryAusdBalance = await AusdInstance.balanceOf(beneficiary);

    console.log(`Final AUSD balance of beneficiary: ${formatUnits(finalBeneficiaryAusdBalance.toString(), 12)} AUSD`);
    console.log(`Beneficiary AUSD balance has increased for ${formatUnits((finalBeneficiaryAusdBalance-initialBeneficiaryAusdBalance).toString(), 12)} AUSD`);

    console.log('');
    console.log('');
  
    console.log('Scenario #2: Escrow initiator releases the funds before the deadline');

    console.log('');
    console.log('');
  
    console.log('Initiating escrow');

    await instance.initiateEscrow(beneficiary, ACA, Math.floor(initialPrimaryTokenBalance/100000), 10, { from: initiator });

    const escrowBlockNumber2 = await web3.eth.getBlock('latest');

    console.log(`Escrow initiation successfull in block ${escrowBlockNumber2.number}. Expected automatic completion in block ${escrowBlockNumber2.number + 10}.`);

    const escrow2 = await instance.escrows(1);

    console.log('Escrow initiator:', escrow2.initiator);
    console.log('Escrow beneficiary:', escrow2.beneficiary);
    console.log('Escrow ingress token:', escrow2.ingressToken);
    console.log('Escrow egress token:', escrow2.egressToken);
    console.log('Escrow AUSD value:', escrow2.AusdValue.toString());
    console.log('Escrow deadline:', escrow2.deadline.toString());
    console.log('Escrow completed:', escrow2.completed);

    const initialBeneficiaryAusdBalance2 = await AusdInstance.balanceOf(beneficiary);

    console.log(`Initial AUSD balance of beneficiary: ${formatUnits(initialBeneficiaryAusdBalance2.toString(), 12)} AUSD`);

    console.log('Manually releasing the funds');

    await instance.completeEscrow({ from: initiator });

    let currentBlockNumber2 = await web3.eth.getBlock('latest');

    const finalBeneficiaryAusdBalance2 = await AusdInstance.balanceOf(beneficiary);

    console.log(`Escrow funds released at block ${currentBlockNumber2.number}, while deadline was ${escrow2.deadline}`);
    console.log(`Final AUSD balance of beneficiary: ${formatUnits(finalBeneficiaryAusdBalance2.toString(), 12)} AUSD`);
    console.log(`Beneficiary AUSD balance has increased for ${formatUnits((finalBeneficiaryAusdBalance2-initialBeneficiaryAusdBalance2).toString(), 12)} AUSD`);

    console.log('');
    console.log('');
  
    console.log('Scenario #3: Beneficiary decided to be paid out in DOT');

    console.log('');
    console.log('');
  
    console.log('Initiating escrow');
  
    await instance.initiateEscrow(beneficiary, ACA, Math.floor(initialPrimaryTokenBalance/100000), 10, { from: initiator });
  
    const escrowBlockNumber3 = await web3.eth.getBlock('latest');

    console.log(`Escrow initiation successful in block ${escrowBlockNumber3.number}. Expected automatic completion in block ${escrowBlockNumber3.number + 10}`);

    const escrow3 = await instance.escrows(2);

    console.log('Escrow initiator:', escrow3.initiator);
    console.log('Escrow beneficiary:', escrow3.beneficiary);
    console.log('Escrow ingress token:', escrow3.ingressToken);
    console.log('Escrow egress token:', escrow3.egressToken);
    console.log('Escrow AUSD value:', escrow3.AusdValue.toString());
    console.log('Escrow deadline:', escrow3.deadline.toString());
    console.log('Escrow completed:', escrow3.completed);

    console.log('Beneficiary setting the desired escrow egress token');

    await instance.setEgressToken(DOT, { from: beneficiary });

    console.log('Instantiating DOT instance');
    const DotInstance = await TokenContract.at(DOT);

    const initialBeneficiaryDotBalance = await DotInstance.balanceOf(beneficiary);

    console.log(`Initial DOT balance of beneficiary: ${formatUnits(initialBeneficiaryDotBalance.toString(), 12)} DOT`);

    console.log('Waiting for automatic release of funds');

    let currentBlockNumber3 = await web3.eth.getBlock('latest');

    while(currentBlockNumber3.number <= escrowBlockNumber3.number + 10){
      console.log(`Still waiting. Current block number is ${currentBlockNumber3.number}. Target block number is ${escrowBlockNumber3.number + 10}.`);
      currentBlockNumber3 = await web3.eth.getBlock('latest');
      await api.rpc.engine.createBlock(true /* create empty */, true /* finalize it*/);
    }

    const finalBeneficiaryDotBalance = await DotInstance.balanceOf(beneficiary);

    console.log(`Final DOT balance of beneficiary: ${finalBeneficiaryDotBalance.toString(), 12}`);
    console.log(`Beneficiary DOT balance has increased by ${formatUnits((finalBeneficiaryDotBalance-initialBeneficiaryDotBalance).toString(), 12)} DOT`);

    console.log('');
    console.log('');

    console.log('User journey completed!');
  } catch (error) {
    console.log(error);
  }

  callback();
};
