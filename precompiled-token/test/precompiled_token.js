const PrecompiledToken = artifacts.require('@acala-network/contracts/build/contracts/Token');

const { ACA } = require('@acala-network/contracts/utils/AcalaAddress');

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract('PrecompiledToken', function (accounts) {
  let instance;
  let deployer;

  beforeEach('setup development environment', async function () {
    deployer = accounts[0];
    instance = await PrecompiledToken.at(ACA);
  });

  describe('Precompiled token', function () {
    it('should have the correct token name', async function () {
      const name = await instance.name();

      expect(name).to.equal('Acala');
    });

    it('should have the correct token symbol', async function () {
      const symbol = await instance.symbol();

      expect(symbol).to.equal('ACA');
    });

    it('should have the total supply greater than 0', async function () {
      const totalSupply = await instance.totalSupply();

      expect(totalSupply).to.not.equal(0);
    });

    it('should show balance of the deployer address higher than 0', async function () {
      const balance = await instance.balanceOf(deployer);

      expect(balance).to.not.equal(0);
    });
  });
});
