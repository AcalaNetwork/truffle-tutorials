const PrecompiledEVM = artifacts.require('@acala-network/contracts/build/contracts/EVM');
const PrecompiledToken = artifacts.require('@acala-network/contracts/build/contracts/Token');

const truffleAssert = require('truffle-assertions');

const { EVM } = require('@acala-network/contracts/utils/Address');
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract('PrecompiledEVM', function (accounts) {
  let instance;
  let contract;
  let deployer;
  let user;

  beforeEach('setup development environment', async function () {
    [deployer, user] = accounts;
    instance = await PrecompiledEVM.at(EVM);
    contract = await PrecompiledToken.new();
  });

  describe('Operation', function () {
    describe('newContractExtraBytes()', function () {
      it('should return the new contract extra bytes', async function () {
        const response = await instance.newContractExtraBytes();

        expect(response.gt(web3.utils.toBN('0'))).to.be.true;
      });
    });

    describe('storageDepositPerByte()', function () {
      it('should return the storage deposit', async function () {
        const response = await instance.storageDepositPerByte();

        expect(response.gt(web3.utils.toBN('0'))).to.be.true;
      });
    });

    describe('maintainerOf()', function () {
      it('should return the developer deposit', async function () {
        const response = await instance.developerDeposit();

        expect(response.gt(web3.utils.toBN('0'))).to.be.true;
      });
    });

    describe('developerDeposit()', function () {
      it('should return the developer deposit', async function () {
        const response = await instance.developerDeposit();

        expect(response.gt(web3.utils.toBN('0'))).to.be.true;
      });
    });

    describe('publicationFee()', function () {
      it('should return the publication fee', async function () {
        const response = await instance.publicationFee();

        expect(response.gt(web3.utils.toBN('0'))).to.be.true;
      });
    });

    describe('transferMaintainter()', function () {
      it('should transfer the maintainer of the contract', async function () {
        const initialOwner = await instance.maintainerOf(contract.address);

        await instance.transferMaintainer(contract.address, user, { from: deployer });

        const finalOwner = await instance.maintainerOf(contract.address);

        expect(initialOwner).to.equal(deployer);
        expect(finalOwner).to.equal(user);
      });

      it('should emit TransferredMaintainer when maintainer role of the contract is transferred', async function () {
        const maintainer = await instance.maintainerOf(contract.address);

        // Maintainer needs to be set to deployer in case any settings from the previous examples
        // remain. This is because Truffle only executes the beforeEach action before each of the
        // first-level nested describe blocks, but not the second ones.
        if (maintainer == user) {
          await instance.transferMaintainer(contract.address, deployer, { from: user });
        }

        truffleAssert.eventEmitted(
          await instance.transferMaintainer(contract.address, user, { from: deployer }),
          'TransferredMaintainer',
          { contract_address: contract.address, new_maintainer: user }
        );
      });

      it('should revert if the caller is not the maintainer of the contract', async function () {
        const maintainer = await instance.maintainerOf(contract.address);

        // Maintainer needs to be set to deployer in case any settings from the previous examples
        // remain. This is because Truffle only executes the beforeEach action before each of the
        // first-level nested describe blocks, but not the second ones.
        if (maintainer == user) {
          await instance.transferMaintainer(contract.address, deployer, { from: user });
        }

        await truffleAssert.reverts(instance.transferMaintainer(contract.address, deployer, { from: user }));
      });

      it('should revert if trying to transfer maintainer of 0x0', async function () {
        await truffleAssert.reverts(
          instance.transferMaintainer(NULL_ADDRESS, user, { from: deployer }),
          'EVM: the contract_address is the zero address'
        );
      });

      it('should revert when trying to transfer maintainer to 0x0 address', async function () {
        await truffleAssert.reverts(
          instance.transferMaintainer(contract.address, NULL_ADDRESS, { from: deployer }),
          'EVM: the new_maintainer is the zero address'
        );
      });
    });

    describe('publishContract()', function () {
      it('should fail when caller is not the maintainer of the contract', async function () {
        await truffleAssert.fails(instance.publishContract(contract, { from: user }));
      });

      it('should revert when trying to publish 0x0 contract', async function () {
        await truffleAssert.reverts(
          instance.publishContract(NULL_ADDRESS, { from: deployer }),
          'EVM: the contract_address is the zero address'
        );
      });

      it('should emit ContractPublished event', async function () {
        truffleAssert.eventEmitted(
          await instance.publishContract(contract.address, { from: deployer }),
          'ContractPublished',
          { contract_address: contract.address }
        );
      });
    });

    describe('developerStatus()', function () {
      it('should return the status of the development account', async function () {
        const randomAddress = '0xabcabcabcabcabcabcabcabcabcabcabcabcabca';

        const responseTrue = await instance.developerStatus(deployer);
        const responseFalse = await instance.developerStatus(randomAddress);

        expect(responseTrue).to.be.true;
        expect(responseFalse).to.be.false;
      });
    });

    describe('developerDisable()', function () {
      it('should disable development mode', async function () {
        const setupStatus = await instance.developerStatus(user);

        if (!setupStatus) {
          await instance.developerEnable({ from: user });
        }

        const initalStatus = await instance.developerStatus(user);

        await instance.developerDisable({ from: user });

        const finalStatus = await instance.developerStatus(user);

        expect(initalStatus).to.be.true;
        expect(finalStatus).to.be.false;
      });

      it('should emit DeveloperDisabled', async function () {
        const setupStatus = await instance.developerStatus(user);

        if (!setupStatus) {
          await instance.developerEnable({ from: user });
        }

        truffleAssert.eventEmitted(await instance.developerDisable({ from: user }), 'DeveloperDisabled', {
          account_address: user
        });
      });

      it('should fail if the development account is not enabled', async function () {
        const setupStatus = await instance.developerStatus(user);

        if (setupStatus) {
          await instance.developerDisable({ from: user });
        }

        await truffleAssert.fails(instance.developerDisable({ from: user }));
      });
    });

    describe('developerEnable()', function () {
      it('should enable development mode', async function () {
        const setupStatus = await instance.developerStatus(user);

        if (setupStatus) {
          await instance.developerDisable({ from: user });
        }

        const initalStatus = await instance.developerStatus(user);

        await instance.developerEnable({ from: user });

        const finalStatus = await instance.developerStatus(user);

        expect(initalStatus).to.be.false;
        expect(finalStatus).to.be.true;
      });

      it('should emit DeveloperEnabled event', async function () {
        const setupStatus = await instance.developerStatus(user);

        if (setupStatus) {
          await instance.developerDisable({ from: user });
        }

        truffleAssert.eventEmitted(await instance.developerEnable({ from: user }), 'DeveloperEnabled', {
          account_address: user
        });
      });

      it('should revert if the development mode is already enabled', async function () {
        const setupStatus = await instance.developerStatus(user);

        if (!setupStatus) {
          await instance.developerEnable({ from: user });
        }

        await truffleAssert.fails(instance.developerEnable({ from: user }));
      });
    });
  });
});
