const AdvancedEscrow = artifacts.require('AdvancedEscrow');
const PrecompiledDEX = artifacts.require('@acala-network/contracts/build/contracts/DEX');
const PrecompiledToken = artifacts.require('@acala-network/contracts/build/contracts/Token');

const { ApiPromise, WsProvider } = require('@polkadot/api');
const truffleAssert = require('truffle-assertions');
require('console.mute');

const { ACA, AUSD, DOT, DEX } = require('@acala-network/contracts/utils/Address');
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const ENDPOINT_URL = process.env.ENDPOINT_URL || 'ws://127.0.0.1:9944';
const provider = new WsProvider(ENDPOINT_URL);

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract('AdvancedEscrow', function (accounts) {
  let instance;
  let ACAinstance;
  let AUSDinstance;
  let DOTinstance;
  let DEXinstance;
  let deployer;
  let user;
  let api;

  beforeEach('setup development environment', async function () {
    [deployer, user] = accounts;
    instance = await AdvancedEscrow.new();
    ACAinstance = await PrecompiledToken.at(ACA);
    AUSDinstance = await PrecompiledToken.at(AUSD);
    DOTinstance = await PrecompiledToken.at(DOT);
    DEXinstance = await PrecompiledDEX.at(DEX);
    console.mute();
    api = await ApiPromise.create({ provider });
    console.resume();
  });

  describe('Deployment', function () {
    it('should set the initial number of escrows to 0', async function () {
      const numberOfEscrows = await instance.numberOfEscrows();

      expect(numberOfEscrows.isZero()).to.be.true;
    });
  });

  describe('Operation', function () {
    it('should revert when beneficiary is 0x0', async function () {
      await truffleAssert.reverts(
        instance.initiateEscrow(NULL_ADDRESS, ACA, 10_000, 10, { from: deployer }),
        'Escrow: beneficiary_ is 0x0'
      );
    });

    it('should revert when ingress token is 0x0', async function () {
      await truffleAssert.reverts(
        instance.initiateEscrow(user, NULL_ADDRESS, 10_000, 10, { from: deployer }),
        'Escrow: ingressToken_ is 0x0'
      );
    });

    it('should revert when period is 0', async function () {
      await truffleAssert.reverts(
        instance.initiateEscrow(user, ACA, 10_000, 0, { from: deployer }),
        'Escrow: period is 0'
      );
    });

    it('should revert when balance of the contract is lower than ingressValue', async function () {
      const balance = await ACAinstance.balanceOf(instance.address);

      expect(balance.lt(web3.utils.toBN('10000'))).to.be.true;

      await truffleAssert.reverts(
        instance.initiateEscrow(user, ACA, 10_000, 10, { from: deployer }),
        'Escrow: contract balance is less than ingress value'
      );
    });

    it('should initiate escrow and emit EscrowUpdate when initializing escrow', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);

      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });

      const expectedValue = await DEXinstance.getSwapTargetAmount([ACA, AUSD], Math.floor(startingBalance/1000000));

      truffleAssert.eventEmitted(
        await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 1, { from: deployer }),
        'EscrowUpdate',
        {
          initiator: deployer,
          beneficiary: user,
          AusdValue: expectedValue,
          fulfilled: false
        }
      );
    });

    it('should set the values of current escrow when initiating the escrow', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);

      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });

      const expectedValue = await DEXinstance.getSwapTargetAmount([ACA, AUSD], Math.floor(startingBalance/1000000));

      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 1, { from: deployer });

      const blockNumber = await web3.eth.getBlock('latest');
      const currentId = await instance.numberOfEscrows();
      const escrow = await instance.escrows(currentId - 1);

      expect(escrow.initiator).to.equal(deployer);
      expect(escrow.beneficiary).to.equal(user);
      expect(escrow.ingressToken).to.equal(ACA);
      expect(escrow.egressToken).to.equal(NULL_ADDRESS);
      expect(escrow.AusdValue.eq(expectedValue)).to.be.true;
      expect(escrow.deadline == (blockNumber.number + 1)).to.be.true;
      expect(escrow.completed).to.be.false;
    });

    it('should revert when initiating a new escrow when there is a preexisting active escrow', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);

      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });

      const expectedValue = await DEXinstance.getSwapTargetAmount([ACA, AUSD], Math.floor(startingBalance/1000000));

      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 10, { from: deployer });

      await truffleAssert.reverts(
        instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 1, { from: deployer }),
        'Escrow: current escrow not yet completed'
      );
    });

    it('should revert when trying to set the egress token after the escrow has already been completed', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);

      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });

      const expectedValue = await DEXinstance.getSwapTargetAmount([ACA, AUSD], Math.floor(startingBalance/1000000));

      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 1, { from: deployer });
      await api.rpc.engine.createBlock(true /* create empty */, true /* finalize it*/);
      await api.rpc.engine.createBlock(true /* create empty */, true /* finalize it*/);

      await truffleAssert.reverts(
        instance.setEgressToken(DOT, { from: user }),
        'Escrow: already completed'
      );
    });

    it('should revert when trying to set the egress token while not being the beneficiary', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);

      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });

      const expectedValue = await DEXinstance.getSwapTargetAmount([ACA, AUSD], Math.floor(startingBalance/1000000));

      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 1, { from: deployer });
      await api.rpc.engine.createBlock(true /* create empty */, true /* finalize it*/);
      await api.rpc.engine.createBlock(true /* create empty */, true /* finalize it*/);

      await truffleAssert.reverts(
        instance.setEgressToken(DOT, { from: deployer }),
        'Escrow: already completed'
      );
    });

    it('should revert when trying to set the egress token while not being the beneficiary', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);

      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });

      const expectedValue = await DEXinstance.getSwapTargetAmount([ACA, AUSD], Math.floor(startingBalance/1000000));

      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 1, { from: deployer });

      await truffleAssert.reverts(
        instance.setEgressToken(DOT, { from: deployer }),
        'Escrow: sender is not beneficiary'
      );
    });

    it('should update the egress token', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);

      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });

      const expectedValue = await DEXinstance.getSwapTargetAmount([ACA, AUSD], Math.floor(startingBalance/1000000));

      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 10, { from: deployer });

      const blockNumber = await web3.eth.getBlock('latest');

      await instance.setEgressToken(DOT, { from: user });

      const currentId = await instance.numberOfEscrows();
      const escrow = await instance.escrows(currentId - 1);

      expect(escrow.initiator).to.equal(deployer);
      expect(escrow.beneficiary).to.equal(user);
      expect(escrow.ingressToken).to.equal(ACA);
      expect(escrow.egressToken).to.equal(DOT);
      expect(escrow.AusdValue.eq(expectedValue)).to.be.true;
      expect(escrow.deadline == (blockNumber.number + 10)).to.be.true;
      expect(escrow.completed).to.be.false;
    });

    it('should revert when trying to complete an already completed escrow', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);
  
      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });
  
      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 1, { from: deployer });
      await api.rpc.engine.createBlock(true /* create empty */, true /* finalize it*/);
      await api.rpc.engine.createBlock(true /* create empty */, true /* finalize it*/);
  
      await truffleAssert.reverts(
        instance.completeEscrow({ from: deployer }),
        'Escrow: escrow already completed'
      );
    });
  
    it('should revert when trying to complete an escrow when not being the initiator', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);
  
      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });
  
      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 1, { from: deployer });
  
      await truffleAssert.reverts(
        instance.completeEscrow({ from: user }),
        'Escrow: caller is not initiator or this contract'
      );
    });

    it('should pay out the escrow in AUSD if no egress token is set', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);
      const initalBalance = await AUSDinstance.balanceOf(user);
  
      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });
  
      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 10, { from: deployer });

      await instance.completeEscrow({ from: deployer });
      const finalBalance = await AUSDinstance.balanceOf(user);

      expect(finalBalance.gt(initalBalance)).to.be.true;
    });

    it('should pay out the escrow in set token when egress token is set', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);
      const initalBalance = await DOTinstance.balanceOf(user);
  
      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });
  
      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 10, { from: deployer });
      await instance.setEgressToken(DOT, { from: user });

      await instance.completeEscrow({ from: deployer });
      const finalBalance = await DOTinstance.balanceOf(user);

      expect(finalBalance.gt(initalBalance)).to.be.true;
    });

    it('should not pay out the escrow in set AUSD when egress token is set', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);
      const initalBalance = await AUSDinstance.balanceOf(user);
  
      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });
  
      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 10, { from: deployer });
      await instance.setEgressToken(DOT, { from: user });

      await instance.completeEscrow({ from: deployer });
      const finalBalance = await AUSDinstance.balanceOf(user);

      expect(finalBalance.eq(initalBalance)).to.be.true;
    });

    it('should emit EscrowUpdate when escrow is completed', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);

      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });

      const expectedValue = await DEXinstance.getSwapTargetAmount([ACA, AUSD], Math.floor(startingBalance/1000000));

      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 10, { from: deployer });

      truffleAssert.eventEmitted(
        await instance.completeEscrow({ from: deployer }),
        'EscrowUpdate',
        {
          initiator: deployer,
          beneficiary: user,
          AusdValue: expectedValue,
          fulfilled: true
        }
      );
    });

    it('should automatically complete the escrow when given number of blocks has passed', async function () {
      const startingBalance = await ACAinstance.balanceOf(deployer);

      await ACAinstance.transfer(instance.address, Math.floor(startingBalance/100000), { from: deployer });
      await instance.initiateEscrow(user, ACA, Math.floor(startingBalance/1000000), 1, { from: deployer });

      const currentEscrow = await instance.numberOfEscrows();
      const initalState = await instance.escrows(currentEscrow - 1);
      await api.rpc.engine.createBlock(true /* create empty */, true /* finalize it*/);
      await api.rpc.engine.createBlock(true /* create empty */, true /* finalize it*/);
      await api.rpc.engine.createBlock(true /* create empty */, true /* finalize it*/);
      const finalState = await instance.escrows(currentEscrow - 1);

      expect(initalState.completed).to.be.false;
      expect(finalState.completed).to.be.true;
    });
  });
});
