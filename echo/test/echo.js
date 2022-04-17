const Echo = artifacts.require('Echo');

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract('Echo', function (/* accounts */) {
  let instance;

  beforeEach('setup development environment', async function () {
    instance = await Echo.deployed();
  });

  describe('Deployment', function () {
    it('should assert true', async function () {
      return assert.isTrue(true);
    });

    it('returns the right value after the contract is deployed', async function () {
      const echo = await instance.echo();

      expect(echo).to.equal('Deployed successfully!');
    });
  });

  describe('Operation', function () {
    it('should update the echo variable', async function () {
      await instance.scream('Hello World!');

      expect(await instance.echo()).to.equal('Hello World!');
    });

    it('shold emit NewEcho event', async function () {
      const response = await instance.scream('Hello World!');

      expect(response.logs[0].event).to.equal('NewEcho');
    });

    it('should increment echo counter in the NewEcho event', async function () {
      const initialResponse = await instance.scream('Hello World!');

      const finalResponse = await instance.scream('Goodbye World!');

      expect(finalResponse.logs[0].args.message).to.equal('Goodbye World!');
      expect(finalResponse.logs[0].args.count.toNumber()).to.equal(initialResponse.logs[0].args.count.toNumber() + 1);
    });
  });
});
