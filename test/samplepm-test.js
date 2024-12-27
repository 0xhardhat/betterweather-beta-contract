import { expect } from "chai";
// const { expect } = require("chai");
// import { ethers } from "hardhat";
const { ethers } = require("hardhat");

describe("samplepm", function () {
  let MyContract;
  let myContract;
  let owner;
  let addr1;
  let addr2;
  let bettingToken;

  beforeEach(async function () {
    // Deploy a mock ERC20 Token
    const MockToken = await ethers.getContractFactory("MockToken");
    bettingToken = await MockToken.deploy();
    await bettingToken.waitForDeployment();

    MyContract = await ethers.getContractFactory("samplepm");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the contract
    myContract = await MyContract.deploy(bettingToken.getAddress());
    await myContract.waitForDeployment();

    // Transfer some tokens to addr1 and addr2 for testing
    await bettingToken.transfer(
      addr1.address,
      ethers.utils.parseUnits("1000", 18)
    );
    await bettingToken.transfer(
      addr2.address,
      ethers.utils.parseUnits("1000", 18)
    );
  });

  describe("Market Creation", function () {
    it("Should create market successfully", async function () {
      await myContract.createMarket(
        "Will Death Valley reach a temperature higher than 130°F in 2025?",
        "YES",
        "NO",
        3600
      );
      const market = await myContract.markets(0);
      expect(market.question).to.equal("Who will win?");
      expect(market.optionA).to.equal("Team A");
      expect(market.optionB).to.equal("Team B");
      expect(market.endTime).to.be.greaterThan(0);
    });
  });
  describe("Buying Shares", function () {
    beforeEach(async function () {
      await myContract.createMarket("Who will win?", "Team A", "Team B", 3600);
    });

    it("Should allow users to buy shares", async function () {
      await bettingToken
        .connect(addr1)
        .approve(myContract.address, ethers.utils.parseUnits("100", 18));
      await myContract
        .connect(addr1)
        .buyShares(0, true, ethers.utils.parseUnits("100", 18));

      const market = await myContract.markets(0);
      expect(market.totalOptionAShares).to.equal(
        ethers.utils.parseUnits("100", 18)
      );
      expect(await myContract.getSharesBalance(0, addr1.address)).to.deep.equal(
        [ethers.utils.parseUnits("100", 18), ethers.utils.parseUnits("0", 18)]
      );
    });

    it("Should fail if market is resolved", async function () {
      await bettingToken
        .connect(addr1)
        .approve(myContract.address, ethers.utils.parseUnits("100", 18));
      await myContract
        .connect(addr1)
        .buyShares(0, true, ethers.utils.parseUnits("100", 18));

      await myContract.resolveMarket(0, 1); // Resolve the market

      await expect(
        myContract
          .connect(addr2)
          .buyShares(0, false, ethers.utils.parseUnits("50", 18))
      ).to.be.revertedWith("Market already resolved");
    });
  });

  describe("Resolving Markets", function () {
    beforeEach(async function () {
      await myContract.createMarket("Who will win?", "Team A", "Team B", 3600);
    });

    it("Should allow the owner to resolve a market", async function () {
      await myContract.resolveMarket(0, 1); // Resolve to OPTION_A
      const market = await myContract.markets(0);
      expect(market.resolved).to.be.true;
      expect(market.outcome).to.equal(1); // OPTION_A
    });

    it("Should fail if a non-owner tries to resolve a market", async function () {
      await expect(
        myContract.connect(addr1).resolveMarket(0, 1)
      ).to.be.revertedWith("Only owner can resolve markets");
    });
  });

  describe("Claiming Winnings", function () {
    beforeEach(async function () {
      await myContract.createMarket("Who will win?", "Team A", "Team B", 3600);
      await bettingToken
        .connect(addr1)
        .approve(myContract.address, ethers.utils.parseUnits("100", 18));
      await myContract
        .connect(addr1)
        .buyShares(0, true, ethers.utils.parseUnits("100", 18));
      await bettingToken
        .connect(addr2)
        .approve(myContract.address, ethers.utils.parseUnits("50", 18));
      await myContract
        .connect(addr2)
        .buyShares(0, false, ethers.utils.parseUnits("50", 18));
      await myContract.resolveMarket(0, 1); // Resolve to OPTION_A
    });

    it("Should allow users to claim winnings", async function () {
      const initialBalance = await bettingToken.balanceOf(addr1.address);
      await myContract.connect(addr1).claimingWinnings(0);
      const finalBalance = await bettingToken.balanceOf(addr1.address);
      expect(finalBalance).to.be.greaterThan(initialBalance); // Check that balance increased
    });

    it("Should fail if user tries to claim winnings from an unresolved market", async function () {
      await expect(
        myContract.connect(addr2).claimingWinnings(0)
      ).to.be.revertedWith("Market must be resolved to claim winnings");
    });
  });
});
