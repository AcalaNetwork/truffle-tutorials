const PrecompiledDEX = artifacts.require('@acala-network/contracts/build/contracts/DEX');
const PrecompiledToken = artifacts.require('@acala-network/contracts/build/contracts/Token');

const truffleAssert = require('truffle-assertions');
const { parseUnits } = require('ethers/lib/utils');

const { ACA, AUSD, LP_ACA_AUSD, DOT, RENBTC, DEX } = require('@acala-network/contracts/utils/Address');
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract('PrecompiledDEX', function (accounts) {
  let instance;
  let ACAinstance;
  let AUSDinstance;
  let deployer;

  beforeEach('setup development environment', async function () {
    deployer = accounts[0];
    instance = await PrecompiledDEX.at(DEX);
    ACAinstance = await PrecompiledToken.at(ACA);
    AUSDinstance = await PrecompiledToken.at(AUSD);
  });

  describe('Operation', function () {
    describe('getLiquidityPool', function () {
      it('should not allow tokenA to be a 0x0 address', async function () {
        await truffleAssert.reverts(instance.getLiquidityPool(NULL_ADDRESS, ACA), 'DEX: tokenA is zero address');
      });

      it('should not allow tokenB to be a 0x0 address', async function () {
        await truffleAssert.reverts(instance.getLiquidityPool(ACA, NULL_ADDRESS), 'DEX: tokenB is zero address');
      });

      it('should return 0 liquidity for nonexistent pair', async function () {
        const response = await instance.getLiquidityPool(ACA, DOT);

        const liquidityA = response[0];
        const liquidityB = response[1];

        expect(liquidityA.isZero()).to.be.true;
        expect(liquidityB.isZero()).to.be.true;
      });

      it('should return liquidity for existing pairs', async function () {
        const response = await instance.getLiquidityPool(ACA, AUSD);

        const liquidityA = response[0];
        const liquidityB = response[1];

        expect(liquidityA.gt(web3.utils.toBN('0'))).to.be.true;
        expect(liquidityB.gt(web3.utils.toBN('0'))).to.be.true;
      });
    });

    describe('getLiquidityTokenAddress', function () {
      it('should not allow tokenA to be a 0x0 address', async function () {
        await truffleAssert.reverts(
          instance.getLiquidityTokenAddress(NULL_ADDRESS, ACA),
          'DEX: tokenA is zero address'
        );
      });

      it('should not allow tokenB to be a 0x0 address', async function () {
        await truffleAssert.reverts(
          instance.getLiquidityTokenAddress(ACA, NULL_ADDRESS),
          'DEX: tokenB is zero address'
        );
      });

      it('should return liquidity token address for an existing pair', async function () {
        const response = await instance.getLiquidityTokenAddress(ACA, AUSD);

        expect(response).to.equal(LP_ACA_AUSD);
      });
    });

    describe('getSwapTargetAddress', function () {
      it('should not allow for the path to include a 0x0 address', async function () {
        await truffleAssert.reverts(
          instance.getSwapTargetAmount([NULL_ADDRESS, ACA, DOT, RENBTC], 12345678990),
          'DEX: token is zero address'
        );

        await truffleAssert.reverts(
          instance.getSwapTargetAmount([ACA, NULL_ADDRESS, DOT, RENBTC], 12345678990),
          'DEX: token is zero address'
        );

        await truffleAssert.reverts(
          instance.getSwapTargetAmount([ACA, DOT, NULL_ADDRESS, RENBTC], 12345678990),
          'DEX: token is zero address'
        );

        await truffleAssert.reverts(
          instance.getSwapTargetAmount([ACA, DOT, RENBTC, NULL_ADDRESS], 12345678990),
          'DEX: token is zero address'
        );
      });

      it('should not allow supplyAmount to be 0', async function () {
        await truffleAssert.reverts(instance.getSwapTargetAmount([ACA, AUSD], 0), 'DEX: supplyAmount is zero');
      });

      it('should revert for an incompatible path', async function () {
        await truffleAssert.reverts(instance.getSwapTargetAmount([ACA, DOT], 100));
      });

      it('should return a swap target amount', async function () {
        const response = await instance.getSwapTargetAmount([ACA, AUSD], 100);

        expect(response.gt(web3.utils.toBN('0'))).to.be.true;
      });
    });

    describe('getSwapSupplyAmount', function () {
      it('should not allow an address in the path to be a 0x0 address', async function () {
        await truffleAssert.reverts(
          instance.getSwapSupplyAmount([NULL_ADDRESS, ACA, DOT, RENBTC], 12345678990),
          'DEX: token is zero address'
        );

        await truffleAssert.reverts(
          instance.getSwapSupplyAmount([ACA, NULL_ADDRESS, DOT, RENBTC], 12345678990),
          'DEX: token is zero address'
        );

        await truffleAssert.reverts(
          instance.getSwapSupplyAmount([ACA, DOT, NULL_ADDRESS, RENBTC], 12345678990),
          'DEX: token is zero address'
        );

        await truffleAssert.reverts(
          instance.getSwapSupplyAmount([ACA, DOT, RENBTC, NULL_ADDRESS], 12345678990),
          'DEX: token is zero address'
        );
      });

      it('should not allow targetAmount to be 0', async function () {
        await truffleAssert.reverts(instance.getSwapSupplyAmount([ACA, AUSD], 0), 'DEX: targetAmount is zero');
      });

      it('should revert for an incompatible path', async function () {
        await truffleAssert.reverts(instance.getSwapSupplyAmount([ACA, DOT], 100));
      });

      it('should return the supply amount', async function () {
        const response = await instance.getSwapSupplyAmount([ACA, AUSD], 100);

        expect(response.gt(web3.utils.toBN('0'))).to.be.true;
      });
    });

    describe('swapWithExactSupply', function () {
      it('should not allow path to contain a 0x0 address', async function () {
        await truffleAssert.reverts(
          instance.swapWithExactSupply([NULL_ADDRESS, ACA, DOT, RENBTC], 12345678990, 1),
          'DEX: token is zero address'
        );

        await truffleAssert.reverts(
          instance.swapWithExactSupply([ACA, NULL_ADDRESS, DOT, RENBTC], 12345678990, 1),
          'DEX: token is zero address'
        );

        await truffleAssert.reverts(
          instance.swapWithExactSupply([ACA, DOT, NULL_ADDRESS, RENBTC], 12345678990, 1),
          'DEX: token is zero address'
        );

        await truffleAssert.reverts(
          instance.swapWithExactSupply([ACA, DOT, RENBTC, NULL_ADDRESS], 12345678990, 1),
          'DEX: token is zero address'
        );
      });

      it('should not allow supplyAmount to be 0', async function () {
        await truffleAssert.reverts(instance.swapWithExactSupply([ACA, AUSD], 0, 1), 'DEX: supplyAmount is zero');
      });

      it('should allocate the tokens to the caller', async function () {
        const initalBalance = await ACAinstance.balanceOf(deployer);
        const initBal = await AUSDinstance.balanceOf(deployer);
        const path = [ACA, AUSD];
        const expected_target = await instance.getSwapTargetAmount(path, 100);

        await instance.swapWithExactSupply(path, 100, 1, { from: deployer });

        const finalBalance = await ACAinstance.balanceOf(deployer);
        const finBal = await AUSDinstance.balanceOf(deployer);

        // The following assertion needs to check for the balance to be below the initialBalance - 100, because some of the ACA balance is used to pay for the transaction fee.
        expect(finalBalance.lt(initalBalance.sub(web3.utils.toBN(100)))).to.be.true;
        expect(finBal.eq(initBal.add(expected_target))).to.be.true;
      });

      it('should emit a Swaped event', async function () {
        const path = [ACA, AUSD];
        const expected_target = await instance.getSwapTargetAmount(path, 100);

        const tx = await instance.swapWithExactSupply(path, 100, 1, { from: deployer });

        const event = tx.logs[0].event;
        const sender = tx.logs[0].args.sender;
        const event_path = tx.logs[0].args.path;
        const supply_amount = tx.logs[0].args.supply_amount;
        const target_amount = tx.logs[0].args.target_amount;

        expect(event).to.equal('Swaped');
        expect(sender).to.equal(deployer);
        expect(event_path).to.deep.equal(path);
        expect(supply_amount).to.deep.equal(web3.utils.toBN(100));
        expect(target_amount).to.deep.equal(expected_target);
      });
    });

    describe('swapWithExactTarget', function () {
      it('should not allow a token in a path to be a 0x0 address', async function () {
        await truffleAssert.reverts(
          instance.swapWithExactTarget([NULL_ADDRESS, ACA, DOT, RENBTC], 1, 12345678990),
          'DEX: token is zero address'
        );

        await truffleAssert.reverts(
          instance.swapWithExactTarget([ACA, NULL_ADDRESS, DOT, RENBTC], 1, 12345678990),
          'DEX: token is zero address'
        );

        await truffleAssert.reverts(
          instance.swapWithExactTarget([ACA, DOT, NULL_ADDRESS, RENBTC], 1, 12345678990),
          'DEX: token is zero address'
        );

        await truffleAssert.reverts(
          instance.swapWithExactTarget([ACA, DOT, RENBTC, NULL_ADDRESS], 1, 12345678990),
          'DEX: token is zero address'
        );
      });

      it('should not allow targetAmount to be 0', async function () {
        await truffleAssert.reverts(
          instance.swapWithExactTarget([ACA, AUSD], 0, 1234567890),
          'DEX: targetAmount is zero'
        );
      });

      it('should allocate tokens to the caller', async function () {
        const initalBalance = await ACAinstance.balanceOf(deployer);
        const initBal = await AUSDinstance.balanceOf(deployer);
        const path = [ACA, AUSD];
        const expected_supply = await instance.getSwapSupplyAmount(path, 100);

        await instance.swapWithExactTarget(path, 100, 1234567890, { from: deployer });

        const finalBalance = await ACAinstance.balanceOf(deployer);
        const finBal = await AUSDinstance.balanceOf(deployer);

        // The following assertion needs to check for the balance to be below the initialBalance - 100, because some of the ACA balance is used to pay for the transaction fee.
        expect(finalBalance.lt(initalBalance.sub(expected_supply))).to.be.true;
        expect(finBal.eq(initBal.add(web3.utils.toBN(100)))).to.be.true;
      });

      it('should emit Swaped event', async function () {
        const path = [ACA, AUSD];
        const expected_supply = await instance.getSwapSupplyAmount(path, 100);

        const tx = await instance.swapWithExactTarget(path, 100, 1234567890, { from: deployer });

        const event = tx.logs[0].event;
        const sender = tx.logs[0].args.sender;
        const event_path = tx.logs[0].args.path;
        const supply_amount = tx.logs[0].args.supply_amount;
        const target_amount = tx.logs[0].args.target_amount;

        expect(event).to.equal('Swaped');
        expect(sender).to.equal(deployer);
        expect(event_path).to.deep.equal(path);
        expect(supply_amount).to.deep.equal(expected_supply);
        expect(target_amount).to.deep.equal(web3.utils.toBN(100));
      });
    });

    describe('addLiquidity', function () {
      it('should not allow tokenA to be 0x0 address', async function () {
        await truffleAssert.reverts(
          instance.addLiquidity(NULL_ADDRESS, AUSD, 1000, 1000, 1),
          'DEX: tokenA is zero address'
        );
      });

      it('should not allow tokenB to be 0x0 address', async function () {
        await truffleAssert.reverts(
          instance.addLiquidity(ACA, NULL_ADDRESS, 1000, 1000, 1),
          'DEX: tokenB is zero address'
        );
      });

      it('should not allow maxAmountA to be 0', async function () {
        await truffleAssert.reverts(instance.addLiquidity(ACA, AUSD, 0, 1000, 1), 'DEX: maxAmountA is zero');
      });

      it('should not allow maxAmountB to be 0', async function () {
        await truffleAssert.reverts(instance.addLiquidity(ACA, AUSD, 1000, 0, 1), 'DEX: maxAmountB is zero');
      });

      it('should increase liquidity', async function () {
        const intialLiquidity = await instance.getLiquidityPool(ACA, AUSD);

        await instance.addLiquidity(ACA, AUSD, parseUnits('2', 12), parseUnits('2', 12), 1);

        const finalLiquidity = await instance.getLiquidityPool(ACA, AUSD);

        expect(finalLiquidity[0].gt(intialLiquidity[0])).to.be.true;
        expect(finalLiquidity[1].gt(intialLiquidity[1])).to.be.true;
      });

      it('should emit AddedLiquidity event', async function () {
        const tx = await instance.addLiquidity(ACA, AUSD, 1000, 1000, 1, { from: deployer });

        const event = tx.logs[0].event;
        const sender = tx.logs[0].args.sender;
        const tokenA = tx.logs[0].args.tokenA;
        const tokenB = tx.logs[0].args.tokenB;
        const maxAmountA = tx.logs[0].args.maxAmountA;
        const maxAmountB = tx.logs[0].args.maxAmountB;

        expect(event).to.equal('AddedLiquidity');
        expect(sender).to.equal(deployer);
        expect(tokenA).to.deep.equal(ACA);
        expect(tokenB).to.deep.equal(AUSD);
        expect(maxAmountA).to.deep.equal(web3.utils.toBN(1000));
        expect(maxAmountB).to.deep.equal(web3.utils.toBN(1000));
      });
    });

    describe('removeLiquidity', function () {
      it('should not allow tokenA to be a 0x0 address', async function () {
        await truffleAssert.reverts(
          instance.removeLiquidity(NULL_ADDRESS, AUSD, 1, 0, 0),
          'DEX: tokenA is zero address'
        );
      });

      it('should not allow tokenB to be a 0x0 address', async function () {
        await truffleAssert.reverts(
          instance.removeLiquidity(ACA, NULL_ADDRESS, 1, 0, 0),
          'DEX: tokenB is zero address'
        );
      });

      it('should not allow removeShare to be 0', async function () {
        await truffleAssert.reverts(instance.removeLiquidity(ACA, AUSD, 0, 0, 0), 'DEX: removeShare is zero');
      });

      it('should reduce the liquidity', async function () {
        const intialLiquidity = await instance.getLiquidityPool(ACA, AUSD);

        await instance.removeLiquidity(ACA, AUSD, 10, 1, 1);

        const finalLiquidity = await instance.getLiquidityPool(ACA, AUSD);

        expect(intialLiquidity[0].gt(finalLiquidity[0])).to.be.true;
        expect(intialLiquidity[1].gt(finalLiquidity[1])).to.be.true;
      });

      it('should emit RemovedLiquidity event', async function () {
        const tx = await instance.removeLiquidity(ACA, AUSD, 1, 0, 0, { from: deployer });

        const event = tx.logs[0].event;
        const sender = tx.logs[0].args.sender;
        const tokenA = tx.logs[0].args.tokenA;
        const tokenB = tx.logs[0].args.tokenB;
        const remove_share = tx.logs[0].args.remove_share;

        expect(event).to.equal('RemovedLiquidity');
        expect(sender).to.equal(deployer);
        expect(tokenA).to.deep.equal(ACA);
        expect(tokenB).to.deep.equal(AUSD);
        expect(remove_share).to.deep.equal(web3.utils.toBN(1));
      });
    });
  });
});
