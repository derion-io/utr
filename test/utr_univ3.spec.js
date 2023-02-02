const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const expect = chai.expect;
const { ethers } = require("hardhat");
const { bn } = require("./shared/utilities");
const { AddressZero, MaxUint256 } = ethers.constants;
const { scenario02 } = require("./shared/fixtures");

const fe = (x) => Number(ethers.utils.formatEther(x))
const pe = (x) => ethers.utils.parseEther(String(x))

const scenarios = [
    { fixture: scenario02, fixtureName: "(ETH = 1500 BUSD)" },
];

const TRANSFER_FROM_SENDER  = 0;
const TRANSFER_FROM_ROUTER  = 1;
const TRANSFER_CALL_VALUE   = 2;
const ALLOWANCE_CALLBACK    = 0x100;
const ALLOWANCE_BRIDGE      = 0x200;
const AMOUNT_EXACT          = 0;
const AMOUNT_ALL            = 1;
const EIP_ETH               = 0;
const ID_721_ALL = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("UniversalTokenRouter.ID_721_ALL"))
const ACTION_IGNORE_ERROR       = 1;
const ACTION_RECORD_CALL_RESULT = 2;
const ACTION_INJECT_CALL_RESULT = 4;

scenarios.forEach(function (scenario) {
    describe("Pool Info: " + scenario.fixtureName, function () {
        describe("Usage Samples", function () {
            it("UniswapRouter.swapExactTokensForTokens", async function () {
                await loadFixture(scenario.fixture);
            });
        });
    });
});