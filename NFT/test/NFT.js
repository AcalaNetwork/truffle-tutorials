const NFT = artifacts.require("NFT");
const truffleAssert = require('truffle-assertions');
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("NFT", function (accounts) {
  let instance;
  let deployer;
  let user;

  beforeEach("setup development environment", async function () {
    instance = await NFT.deployed();
    deployer = accounts[0];
    user = accounts[1];
  });

  describe("Deployment", function () {
    it("should assert true", async function () {
      return assert.isTrue(true);
    });

    it("should set the correct NFT name", async function () {
      const name = await instance.name();

      expect(name).to.equal("Example non-fungible token");
    });

    it("should set the correct NFT symbol", async function () {
      const symbol = await instance.symbol();

      expect(symbol).to.equal("eNFT");
    });

    it("should assign the initial balance of the deployer", async function () {
      const balance = await instance.balanceOf(deployer);

      expect(balance.toNumber()).to.equal(0);
    });

    it("should revert when trying to get the balance of the 0x0 address", async function () {
      await truffleAssert.reverts(
        instance.balanceOf(NULL_ADDRESS),
        "ERC721: balance query for the zero address"
      );
    });
  });

  describe("Operation", function () {
    describe("minting", function () {
      it("should emit Transfer event", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });

        const event = response.logs[0].event;
        const from = response.logs[0].args.from;
        const to = response.logs[0].args.to;
        const tokenId = response.logs[0].args.tokenId;
        
        expect(event).to.equal("Transfer");
        expect(from).to.equal(NULL_ADDRESS);
        expect(to).to.equal(user);
        expect(tokenId.toNumber()).to.equal(1);
      });

      it("should mint token to an address", async function () {
        const initialBalance = await instance.balanceOf(user);

        await instance.mintNFT(user, "", { from: deployer });

        const finalBalance = await instance.balanceOf(user);

        expect(finalBalance.toNumber() - initialBalance.toNumber()).to.equal(1);
      });

      it("should set the expected base URI", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });

        const tokenId = response.logs[0].args.tokenId.toNumber();

        const URI = await instance.tokenURI(tokenId);

        expect(URI).to.equal("acala-evm+-tutorial-nft/" + tokenId);
      });

      it("should set the expected URI", async function () {
        const response = await instance.mintNFT(user, "testToken", { from: deployer });

        const tokenId = response.logs[0].args.tokenId.toNumber();

        const URI = await instance.tokenURI(tokenId);

        expect(URI).to.equal("acala-evm+-tutorial-nft/testToken");
      });

      it("should allow user to own multiple tokens", async function () {
        const initialBalance = await instance.balanceOf(user);

        await instance.mintNFT(user, "", { from: deployer });
        await instance.mintNFT(user, "", { from: deployer });

        const finalBalance = await instance.balanceOf(user);

        expect(finalBalance.toNumber() - initialBalance.toNumber()).to.equal(2);
      });

      it("should revert when trying to get an URI of an nonexistent token", async function () {
        await truffleAssert.reverts(
          instance.tokenURI(42),
          "ERC721URIStorage: URI query for nonexistent token"
        );
      });
    });

    describe("balances and ownerships", function () {
      it("should revert when trying to get balance of 0x0 address", async function () {
        await truffleAssert.reverts(
          instance.balanceOf(NULL_ADDRESS),
          "ERC721: balance query for the zero address"
        );
      });

      it("should revert when trying to get the owner of a nonexistent token", async function () {
        await truffleAssert.reverts(
          instance.ownerOf(42),
          "ERC721: owner query for nonexistent token"
        );
      });

      it("should return the token owner", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });

        const tokenId = response.logs[0].args.tokenId.toNumber();

        const owner = await instance.ownerOf(tokenId);

        expect(owner).to.equal(user);
      });
    });

    describe("approvals", function () {
      it("should grant an approval", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });

        const tokenId = response.logs[0].args.tokenId.toNumber();

        await instance.approve(deployer, tokenId, { from: user });

        const approved = await instance.getApproved(tokenId);

        expect(approved).to.equal(deployer);
      });

      it("should emit Approval event when granting approval", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });

        const tokenId = response.logs[0].args.tokenId.toNumber();

        const approval = await instance.approve(deployer, tokenId, { from: user });

        const event = approval.logs[0].event;
        const owner = approval.logs[0].args.owner;
        const approved = approval.logs[0].args.approved;
        const eventTokenId = approval.logs[0].args.tokenId;

        expect(event).to.equal("Approval");
        expect(owner).to.equal(user);
        expect(approved).to.equal(deployer);
        expect(eventTokenId.toNumber()).to.equal(tokenId);
      });

      it("should revert when trying to set token approval to self", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });

        const tokenId = response.logs[0].args.tokenId;

        await truffleAssert.reverts(
          instance.approve(user, tokenId, { from: user }),
          "ERC721: approval to current owner"
        );
      });

      it("should revert when trying to grant approval for a token that is someone else's", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });

        const tokenId = response.logs[0].args.tokenId;

        await truffleAssert.reverts(
          instance.approve(deployer, tokenId, { from: deployer }),
          "ERC721: approve caller is not owner nor approved for all"
        );
      });

      it("should revert when trying to get an approval of a nonexistent token", async function () {
        await truffleAssert.reverts(
          instance.getApproved(42),
          "ERC721: approved query for nonexistent token"
          );
      });

      it("should return 0x0 address as approved for a token for which no approval is given", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });

        const tokenId = response.logs[0].args.tokenId;

        const approved = await instance.getApproved(tokenId.toNumber());

        expect(approved).to.equal(NULL_ADDRESS);
      });

      it("sets approval for all", async function () {
        await instance.setApprovalForAll(deployer, true, { from: user });

        const approved = await instance.isApprovedForAll(user, deployer);

        expect(approved).to.be.true;
      });

      it("revokes approval for all", async function () {
        await instance.setApprovalForAll(deployer, true, { from: user });

        const initiallyApproved = await instance.isApprovedForAll(user, deployer);

        expect(initiallyApproved).to.be.true;

        await instance.setApprovalForAll(deployer, false, { from: user });

        const finallyApproved = await instance.isApprovedForAll(user, deployer);

        expect(finallyApproved).to.be.false;
      });

      it("doesn't reflect operator approval in single token approval", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });
        const tokenId = response.logs[0].args.tokenId.toNumber();
        await instance.setApprovalForAll(deployer, true, { from: user });

        const approved = await instance.getApproved(tokenId);

        expect(approved).to.equal(NULL_ADDRESS);
      });

      it("should allow operator to grant allowance for a apecific token", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });
        const tokenId = response.logs[0].args.tokenId.toNumber();
        await instance.setApprovalForAll(deployer, true, { from: user });

        const initiallyApproved = await instance.getApproved(tokenId);

        await instance.approve(deployer, tokenId, { from: deployer });

        const finallyApproved = await instance.getApproved(tokenId);

        expect(initiallyApproved).to.equal(NULL_ADDRESS);
        expect(finallyApproved).to.equal(deployer);
      });

      it("should emit Approval event when operator grants approval", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });
        const tokenId = response.logs[0].args.tokenId.toNumber();
        await instance.setApprovalForAll(deployer, true, { from: user });

        const initiallyApproved = await instance.getApproved(tokenId);

        const approval = await instance.approve(deployer, tokenId, { from: deployer });

        const event = approval.logs[0].event;
        const owner = approval.logs[0].args.owner;
        const approved = approval.logs[0].args.approved;
        const eventTokenId = approval.logs[0].args.tokenId;

        expect(event).to.equal("Approval");
        expect(owner).to.equal(user);
        expect(approved).to.equal(deployer);
        expect(eventTokenId.toNumber()).to.equal(tokenId);
      });

      it("should emit ApprovalForAll event when approving for all", async function () {
        const response = await instance.setApprovalForAll(deployer, true, { from: user });

        const event = response.logs[0].event;
        const owner = response.logs[0].args.owner;
        const operator = response.logs[0].args.operator;
        const approved = response.logs[0].args.approved;

        expect(event).to.equal("ApprovalForAll");
        expect(owner).to.equal(user);
        expect(operator).to.equal(deployer);
        expect(approved).to.be.true;
      });

      it("should emit ApprovalForAll event when revoking approval for all", async function () {
        await instance.setApprovalForAll(deployer, true, { from: user });
        const response = await instance.setApprovalForAll(deployer, false, { from: user });

        const event = response.logs[0].event;
        const owner = response.logs[0].args.owner;
        const operator = response.logs[0].args.operator;
        const approved = response.logs[0].args.approved;

        expect(event).to.equal("ApprovalForAll");
        expect(owner).to.equal(user);
        expect(operator).to.equal(deployer);
        expect(approved).to.be.false;
      });
    });

    describe("transfers", function () {
      it("should transfer the token", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });
        const tokenId = response.logs[0].args.tokenId.toNumber();

        const initialBalance = await instance.balanceOf(deployer);

        await instance.transferFrom(user, deployer, tokenId, { from: user });

        const finalBalance = await instance.balanceOf(deployer);

        expect(finalBalance.toNumber() - initialBalance.toNumber()).to.equal(1);
      });
      
      it("should emit Transfer event", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });
        const tokenId = response.logs[0].args.tokenId.toNumber();

        const transfer = await instance.transferFrom(user, deployer, tokenId, { from: user });

        const event = transfer.logs[1].event;
        const from = transfer.logs[1].args.from;
        const to = transfer.logs[1].args.to;
        const responseTokenId = transfer.logs[1].args.tokenId.toNumber();

        expect(event).to.equal("Transfer");
        expect(from).to.equal(user);
        expect(to).to.equal(deployer);
        expect(responseTokenId).to.equal(tokenId);
      });
      
      it("should allow transfer of the tokens if the allowance is given", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });
        const tokenId = response.logs[0].args.tokenId.toNumber();
        await instance.approve(deployer, tokenId, { from: user });

        const initalBalance = await instance.balanceOf(deployer);

        await instance.transferFrom(user, deployer, tokenId, { from: deployer });

        const finalBalance = await instance.balanceOf(deployer);

        expect(finalBalance.toNumber() - initalBalance.toNumber()).to.equal(1);
      });
      
      it("should reset the allowance after the token is transferred", async function () {
        const response = await instance.mintNFT(user, "", { from: deployer });
        const tokenId = response.logs[0].args.tokenId.toNumber();
        await instance.approve(deployer, tokenId, { from: user });

        const initiallyApproved = await instance.getApproved(tokenId);

        await instance.transferFrom(user, deployer, tokenId, { from: user });

        const finallyApproved = await instance.getApproved(tokenId);

        expect(initiallyApproved).to.equal(deployer);
        expect(finallyApproved).to.equal(NULL_ADDRESS);
      });
    });
  });
});
