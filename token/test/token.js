const Token = artifacts.require('Token');
const truffleAssert = require('truffle-assertions');
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('Token', function (accounts) {
  let instance;
  let deployer;
  let user;

  beforeEach('setup development environment', async function () {
    instance = await Token.deployed();
    deployer = accounts[0];
    user = accounts[1];
  });

  describe('Deployment', function () {
    it('should assert true', async function () {
      return assert.isTrue(true);
    });

    it('should set the correct token name', async function () {
      const name = await instance.name();

      expect(name).to.equal('Token');
    });

    it('should set the correct token symbol', async function () {
      const symbol = await instance.symbol();

      expect(symbol).to.equal('TKN');
    });

    it('should set the correct total supply', async function () {
      const totalSupply = await instance.totalSupply();

      expect(totalSupply.toNumber()).to.equal(1234567890);
    });

    it('should set the correct deployer balance', async function () {
      const balance = await instance.balanceOf(deployer);

      expect(balance.toNumber()).to.equal(1234567890);
    });

    it('should not assign value to a random addresss', async function () {
      const balance = await instance.balanceOf(user);

      expect(balance.toNumber()).to.equal(0);
    });

    it('should not assign allowance upon deployment', async function () {
      const allowance = await instance.allowance(deployer, user);

      expect(allowance.toNumber()).to.equal(0);
    });
  });

  describe('Operation', function () {
    describe('Transfer', function () {
      describe('transfer()', function () {
        it('should update balances when transferring tokens', async function () {
          const initialDeployerBalance = await instance.balanceOf(deployer);
          const initialUserBalance = await instance.balanceOf(user);

          await instance.transfer(user, 100, { from: deployer });

          const finalDeployerBalance = await instance.balanceOf(deployer);
          const finalUserBalance = await instance.balanceOf(user);

          expect(initialDeployerBalance.toNumber() - finalDeployerBalance.toNumber()).to.equal(100);
          expect(finalUserBalance.toNumber() - initialUserBalance.toNumber()).to.equal(100);
        });

        it('should emit Transfer event', async function () {
          const response = await instance.transfer(user, 100, { from: deployer });

          const event = response.logs[0].event;
          const sender = response.logs[0].args.from;
          const receiver = response.logs[0].args.to;
          const value = response.logs[0].args.value;

          expect(event).to.equal('Transfer');
          expect(sender).to.equal(deployer);
          expect(receiver).to.equal(user);
          expect(value.toNumber()).to.equal(100);
        });

        it('should revet when trying to transfer to 0x0 address', async function () {
          await truffleAssert.reverts(
            instance.transfer(NULL_ADDRESS, 100, { from: deployer }),
            'ERC20: transfer to the zero address'
          );
        });

        it('should revert when trying to transfer more than own balance', async function () {
          await truffleAssert.reverts(
            instance.transfer(user, 12345678900, { from: deployer }),
            'ERC20: transfer amount exceeds balance'
          );
        });
      });
    });

    describe('Allowances', function () {
      describe('approve()', function () {
        it('should grant allowance for an amount smaller than own balance', async function () {
          await instance.approve(user, 100, { from: deployer });

          const allowance = await instance.allowance(deployer, user);

          expect(allowance.toNumber()).to.equal(100);
        });

        it('should grant allowance for an amount higher than own balance', async function () {
          await instance.approve(user, 12345678900, { from: deployer });

          const allowance = await instance.allowance(deployer, user);

          expect(allowance.toNumber()).to.equal(12345678900);
        });

        it('should emit Approval event', async function () {
          const response = await instance.approve(user, 100, { from: deployer });

          const event = response.logs[0].event;
          const owner = response.logs[0].args.owner;
          const spender = response.logs[0].args.spender;
          const value = response.logs[0].args.value;

          expect(event).to.equal('Approval');
          expect(owner).to.equal(deployer);
          expect(spender).to.equal(user);
          expect(value.toNumber()).to.equal(100);
        });

        it('should revert when trying to grant allowance to 0x0', async function () {
          await truffleAssert.reverts(
            instance.approve(NULL_ADDRESS, 100, { from: deployer }),
            'ERC20: approve to the zero address'
          );
        });
      });

      describe('increaseAllowance()', function () {
        it('should allow to increase the allowance to a total of less than the balance', async function () {
          await instance.approve(user, 100, { from: deployer });
          await instance.increaseAllowance(user, 50, { from: deployer });

          const allowance = await instance.allowance(deployer, user);

          expect(allowance.toNumber()).to.equal(150);
        });

        it('should allow to increase allowance to a gihger amount than own balance', async function () {
          await instance.approve(user, 100, { from: deployer });
          await instance.increaseAllowance(user, 1234567890, { from: deployer });

          const allowance = await instance.allowance(deployer, user);

          expect(allowance.toNumber()).to.equal(1234567990);
        });

        it('should emit Approval event', async function () {
          await instance.approve(user, 100, { from: deployer });

          const response = await instance.increaseAllowance(user, 50, { from: deployer });

          const event = response.logs[0].event;
          const owner = response.logs[0].args.owner;
          const spender = response.logs[0].args.spender;
          const value = response.logs[0].args.value;

          expect(event).to.equal('Approval');
          expect(owner).to.equal(deployer);
          expect(spender).to.equal(user);
          expect(value.toNumber()).to.equal(150);
        });

        it('should be allowed to be called without preexisting allowance', async function () {
          await instance.increaseAllowance(deployer, 50, { from: user });

          const allowance = await instance.allowance(user, deployer);

          expect(allowance.toNumber()).to.equal(50);
        });
      });

      describe('decreaseAllowance()', function () {
        it('should allow owner to decrease allowance', async function () {
          await instance.approve(user, 100, { from: deployer });

          const initialAllowance = await instance.allowance(deployer, user);

          await instance.decreaseAllowance(user, 40, { from: deployer });

          const finalAllowance = await instance.allowance(deployer, user);

          expect(initialAllowance.toNumber() - finalAllowance.toNumber()).to.equal(40);
        });

        it('should emit Approval event', async function () {
          await instance.approve(user, 100, { from: deployer });

          const response = await instance.decreaseAllowance(user, 40, { from: deployer });

          const event = response.logs[0].event;
          const owner = response.logs[0].args.owner;
          const spender = response.logs[0].args.spender;
          const value = response.logs[0].args.value;

          expect(event).to.equal('Approval');
          expect(owner).to.equal(deployer);
          expect(spender).to.equal(user);
          expect(value.toNumber()).to.equal(60);
        });

        it('should revert when trying to decrease allowance to below 0', async function () {
          await truffleAssert.reverts(
            instance.decreaseAllowance(user, 1000, { from: deployer }),
            'ERC20: decreased allowance below zero'
          );
        });
      });

      describe('transferFrom()', function () {
        it('should allow transfer when allowance is given', async function () {
          await instance.approve(user, 1500, { from: deployer });

          const initalBalance = await instance.balanceOf(user);

          await instance.transferFrom(deployer, user, 1000, { from: user });

          const finalBalance = await instance.balanceOf(user);

          expect(finalBalance.toNumber() - initalBalance.toNumber()).to.equal(1000);
        });

        it('should emit Transfer event', async function () {
          await instance.approve(user, 1500, { from: deployer });

          const response = await instance.transferFrom(deployer, user, 1000, { from: user });

          const event = response.logs[0].event;
          const sender = response.logs[0].args.from;
          const receiver = response.logs[0].args.to;
          const value = response.logs[0].args.value;

          expect(event).to.equal('Transfer');
          expect(sender).to.equal(deployer);
          expect(receiver).to.equal(user);
          expect(value.toNumber()).to.equal(1000);
        });

        it('should emit Approval event', async function () {
          await instance.approve(user, 1500, { from: deployer });

          const response = await instance.transferFrom(deployer, user, 1000, { from: user });

          const event = response.logs[1].event;
          const owner = response.logs[1].args.owner;
          const spender = response.logs[1].args.spender;
          const value = response.logs[1].args.value;

          expect(event).to.equal('Approval');
          expect(owner).to.equal(deployer);
          expect(spender).to.equal(user);
          expect(value.toNumber()).to.equal(500);
        });

        it('should update the allowance', async function () {
          await instance.approve(user, 1500, { from: deployer });

          const initialAllowance = await instance.allowance(deployer, user);

          await instance.transferFrom(deployer, user, 1000, { from: user });

          const finalAllowance = await instance.allowance(deployer, user);

          expect(initialAllowance.toNumber() - finalAllowance.toNumber()).to.equal(1000);
        });

        it('should revert when trying to transfer more than allowance', async function () {
          await instance.approve(user, 1500, { from: deployer });

          await truffleAssert.reverts(
            instance.transferFrom(deployer, user, 10000, { from: user }),
            'transfer amount exceeds allowance'
          );
        });

        it('should revert when trying to transfer to 0x0 address', async function () {
          await instance.approve(user, 1500, { from: deployer });

          await truffleAssert.reverts(
            instance.transferFrom(deployer, NULL_ADDRESS, 1000, { from: user }),
            'ERC20: transfer to the zero address'
          );
        });

        it("should revert when owner doesn't have enough funds", async function () {
          await instance.approve(user, 12345678900, { from: deployer });

          await truffleAssert.reverts(
            instance.transferFrom(deployer, user, 12345678900, { from: user }),
            'ERC20: transfer amount exceeds balance'
          );
        });

        it('should revert when no allowance was given', async function () {
          await truffleAssert.reverts(
            instance.transferFrom(user, deployer, 100, { from: deployer }),
            'transfer amount exceeds allowance'
          );
        });
      });
    });
  });
});
