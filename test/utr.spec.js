const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { makeInterfaceId } = require('@openzeppelin/test-helpers');
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const expect = chai.expect;
const { ethers } = require("hardhat");
const { AddressZero, MaxUint256 } = ethers.constants;
const { scenario01 } = require("./shared/fixtures");
const { encodePayment } = require("./shared/utilities");

const fe = (x) => Number(ethers.utils.formatEther(x))
const pe = (x) => ethers.utils.parseEther(String(x))

const scenarios = [
    { fixture: scenario01, fixtureName: "(ETH = 1500 BUSD)" },
];

const opts = {
    gasLimit: 30000000
}

const PAYMENT       = 0;
const TRANSFER      = 1;
const CALL_VALUE    = 2;

const EIP_ETH = 0;
const ERC_721_BALANCE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("UniversalTokenRouter.ERC_721_BALANCE"))

scenarios.forEach(function (scenario) {
    describe("Generic: " + scenario.fixtureName, function () {
        it("Contract revert", async function () {
            const { utr, wethAdapter } = await loadFixture(scenario.fixture);
            await expect(utr.exec([], [{
                inputs: [],
                code: wethAdapter.address,
                data: (await wethAdapter.populateTransaction.doRevert('some reason')).data,
            }], opts)).revertedWith('some reason');
        });
        it("Pausable", async function() {
            const { utr, otherAccount } = await loadFixture(scenario.fixture);
            await utr.unpause()
            await expect(utr.pause()).revertedWith('NEED_VALUE')
            await expect(utr.connect(otherAccount).pause()).revertedWith('UNAUTHORIZED')
            await utr.pause({ value: 1 })
            await expect(utr.exec([], [], opts)).revertedWith('PAUSED');
            await utr.unpause()
            await utr.exec([], [], opts)
        });
        it("Invalid EIP", async function () {
            const { utr, wethAdapter, weth, owner } = await loadFixture(scenario.fixture);
            const INVALID_EIP = 200;
            await expect(utr.exec([{
                eip: 20,
                token: weth.address,
                id: 0,
                amountOutMin: 1,
                recipient: owner.address,
            }], [{
                inputs: [{
                    mode: TRANSFER,
                    eip: INVALID_EIP,
                    token: AddressZero,
                    id: 0,
                    amountIn: 123,
                    recipient: AddressZero,
                }],
                flags: 0,
                code: wethAdapter.address,
                data: (await wethAdapter.populateTransaction.deposit(owner.address)).data,
            },
            ], { value: 123 })).revertedWith('UTR: INVALID_EIP');

            await expect(utr.exec([{
                eip: INVALID_EIP,
                token: weth.address,
                id: 0,
                amountOutMin: 1,
                recipient: owner.address,
            }], [{
                inputs: [{
                    mode: CALL_VALUE,
                    eip: 0,
                    token: AddressZero,
                    id: 0,
                    amountIn: 123,
                    recipient: AddressZero,
                }],
                flags: 0,
                code: wethAdapter.address,
                data: (await wethAdapter.populateTransaction.deposit(owner.address)).data,
            }
            ], { value: 123 })).revertedWith('UTR: INVALID_EIP');
        });
        it("discard", async function () {
            const { utr, owner, weth, poolAddress } = await loadFixture(scenario.fixture);
            await utr.discard(
                encodePayment(owner.address, poolAddress, 20, weth.address, 0),
                0,
            )
        })
        it("OUTPUT_BALANCE_OVERFLOW", async function () {
            const { utr, owner, weth, wethAdapter, erc20Factory } = await loadFixture(scenario.fixture);
            const maxSupplyToken = await erc20Factory.deploy(MaxUint256);
            await expect(utr.exec([{
                eip: 20,
                token: maxSupplyToken.address,
                id: 0,
                amountOutMin: 100,
                recipient: owner.address,
            }], [{
                inputs: [{
                    mode: CALL_VALUE,
                    eip: 0,
                    token: AddressZero,
                    id: 0,
                    amountIn: 123,
                    recipient: AddressZero,
                }],
                flags: 0,
                code: wethAdapter.address,
                data: (await wethAdapter.populateTransaction.deposit(owner.address)).data,
            }
            ], { value: 123, gasLimit: opts.gasLimit})).revertedWith('UTR: OUTPUT_BALANCE_OVERFLOW');
        })
        it("INVALID_MODE", async function () {
            const { utr, owner, weth, wethAdapter } = await loadFixture(scenario.fixture);
            await expect(utr.exec([{
                eip: 20,
                token: weth.address,
                id: 0,
                amountOutMin: 100,
                recipient: owner.address,
            }], [{
                inputs: [{
                    mode: 3,
                    eip: 0,
                    token: AddressZero,
                    id: 0,
                    amountIn: 123,
                    recipient: AddressZero,
                }],
                flags: 0,
                code: wethAdapter.address,
                data: []
            }
            ], { value: 123})).revertedWith('UTR: INVALID_MODE');
        })
        it("action.data.length == 0", async function () {
            const { utr, owner, weth, wethAdapter } = await loadFixture(scenario.fixture);
            await expect(utr.exec([{
                eip: 20,
                token: weth.address,
                id: 0,
                amountOutMin: 100,
                recipient: owner.address,
            }], [{
                inputs: [{
                    mode: CALL_VALUE,
                    eip: 0,
                    token: AddressZero,
                    id: 0,
                    amountIn: 123,
                    recipient: AddressZero,
                }],
                flags: 0,
                code: wethAdapter.address,
                data: []
            }
            ], { value: 123, gasLimit: opts.gasLimit})).reverted;
            await expect(utr.exec([{
                eip: 20,
                token: weth.address,
                id: 0,
                amountOutMin: 100,
                recipient: owner.address,
            }], [{
                inputs: [{
                    mode: TRANSFER,
                    eip: 0,
                    token: AddressZero,
                    id: 0,
                    amountIn: 123,
                    recipient: AddressZero,
                }],
                flags: 0,
                code: wethAdapter.address,
                data: []
            }
            ], { value: 123, gasLimit: opts.gasLimit})).reverted;
        })
        it("action = tokenERC20/ERC721.transferFrom", async function () {
            const { utr, owner, weth, wethAdapter, otherAccount } = await loadFixture(scenario.fixture);
            const value = pe(123)
            await weth.deposit({ value })
            await weth.approve(utr.address, MaxUint256)

            await expect(utr.exec([], [{
                inputs: [],
                code: weth.address,
                data: (await weth.populateTransaction.transferFrom(
                    owner.address,
                    otherAccount.address,
                    1,
                )).data,
            }])).revertedWith('NOT_CALLABLE')
            // action.code == address(0)
            await expect(utr.exec([], [{
                inputs: [],
                code: weth.address,
                data: (await weth.populateTransaction.transferFrom(
                    owner.address,
                    otherAccount.address,
                    1,
                )).data,
            }])).revertedWith('NOT_CALLABLE')
            // value > 0
            await utr.exec([], [{
                inputs: [{
                    mode: CALL_VALUE,
                    eip: 0,
                    token: AddressZero,
                    id: 0,
                    amountIn: 1000,
                    recipient: wethAdapter.address,
                }],
                code: wethAdapter.address,
                data: [],
            }], {
                value: 1000
            })
            await utr.exec([], [{
                inputs: [{
                    mode: CALL_VALUE,
                    eip: 0,
                    token: AddressZero,
                    id: 0,
                    amountIn: 1000,
                    recipient: wethAdapter.address,
                }],
                code: wethAdapter.address,
                data: '0x12345678',
            }], {
                value: 1000
            })
            await expect(utr.exec([], [{
                inputs: [{
                    mode: CALL_VALUE,
                    eip: 0,
                    token: AddressZero,
                    id: 0,
                    amountIn: 1000,
                    recipient: wethAdapter.address,
                }],
                code: AddressZero,
                data: [],
            }], {
                value: 1000
            })).revertedWith('NOT_CALLABLE')
            // action.data.length > 0
            await expect(utr.exec([], [{
                inputs: [],
                code: weth.address,
                data: (await weth.populateTransaction.transferFrom(
                    owner.address,
                    otherAccount.address,
                    1,
                )).data,
            }])).revertedWith('NOT_CALLABLE')
            await expect(utr.exec([], [{
                inputs: [],
                code: AddressZero,
                data: '0x123123123123',
            }])).revertedWith('NOT_CALLABLE')
            await utr.exec([], [{
                inputs: [],
                code: wethAdapter.address,
                data: '0x123123123123',
            }])
            // action.code == address(0), action.data.length = 0, value = 0
            await utr.exec([], [{
                inputs: [],
                code: AddressZero,
                data: [],
            }])
        })
        it("action = utr.pay", async function () {
            const { utr, owner, weth, otherAccount } = await loadFixture(scenario.fixture);
            const value = pe(123)
            await weth.deposit({ value })
            await weth.approve(utr.address, MaxUint256)
            await expect(utr.exec([], [{
                inputs: [],
                code: utr.address,
                data: (await utr.populateTransaction.pay(
                    encodePayment(owner.address, otherAccount.address, 20, weth.address, 0),
                    value,
                )).data,
            }])).revertedWith('NOT_CALLABLE')
            await expect(utr.exec([], [{
                inputs: [{
                    mode: PAYMENT,
                    eip: 20,
                    token: weth.address,
                    id: 0,
                    amountIn: value.sub(1),
                    recipient: otherAccount.address,
                }],
                code: utr.address,
                data: (await utr.populateTransaction.pay(
                    encodePayment(owner.address, otherAccount.address, 20, weth.address, 0),
                    value,
                )).data,
            }])).revertedWith('NOT_CALLABLE')
            // await utr.exec([], [{
            //     inputs: [{
            //         mode: PAYMENT,
            //         eip: 20,
            //         token: weth.address,
            //         id: 0,
            //         amountIn: value,
            //         recipient: otherAccount.address,
            //     }],
            //     code: utr.address,
            //     data: (await utr.populateTransaction.pay(
            //         encodePayment(owner.address, otherAccount.address, 20, weth.address, 0),
            //         value,
            //     )).data,
            // }])
        })
        it("action = tokenERC20/ERC721.transferFrom", async function () {
            const { utr, owner, weth, wethAdapter, otherAccount } = await loadFixture(scenario.fixture);
            const value = pe(123)
            await weth.deposit({ value })
            await weth.approve(utr.address, MaxUint256)

            await expect(utr.exec([], [{
                inputs: [],
                code: weth.address,
                data: (await weth.populateTransaction.transferFrom(
                    owner.address,
                    otherAccount.address,
                    1,
                )).data,
            }])).revertedWith('NOT_CALLABLE')
            // action.code == address(0)
            await expect(utr.exec([], [{
                inputs: [],
                code: weth.address,
                data: (await weth.populateTransaction.transferFrom(
                    owner.address,
                    otherAccount.address,
                    1,
                )).data,
            }])).revertedWith('NOT_CALLABLE')
            // value > 0
            await utr.exec([], [{
                inputs: [{
                    mode: CALL_VALUE,
                    eip: 0,
                    token: AddressZero,
                    id: 0,
                    amountIn: 1000,
                    recipient: AddressZero,
                }],
                code: wethAdapter.address,
                data: [],
            }], {
                value: 1000
            })
            // action.data.length > 0
            await expect(utr.exec([], [{
                inputs: [],
                code: weth.address,
                data: (await weth.populateTransaction.transferFrom(
                    owner.address,
                    otherAccount.address,
                    1,
                )).data,
            }])).revertedWith('NOT_CALLABLE')
            await expect(utr.exec([], [{
                inputs: [],
                code: AddressZero,
                data: '0x123123123123',
            }])).revertedWith('NOT_CALLABLE')
            await utr.exec([], [{
                inputs: [],
                code: wethAdapter.address,
                data: '0x123123123123',
            }])
            // action.code == address(0), action.data.length = 0, value = 0
            await utr.exec([], [{
                inputs: [],
                code: AddressZero,
                data: [],
            }])
        })
        it("action = tokenERC1155.safeTransferFrom/safeBatchTransferFrom", async function () {
            const { utr, owner, otherAccount, gameItems } = await loadFixture(scenario.fixture);
            await expect(utr.exec([], [{
                inputs: [],
                code: gameItems.address,
                data: (await gameItems.populateTransaction.safeTransferFrom(
                    owner.address,
                    otherAccount.address,
                    0,
                    1,
                    '0x00'
                )).data,
            }])).revertedWith('NOT_CALLABLE')
            await expect(utr.exec([], [{
                inputs: [],
                code: gameItems.address,
                data: (await gameItems.populateTransaction.safeBatchTransferFrom(
                    owner.address,
                    otherAccount.address,
                    [0],
                    [1],
                    '0x00'
                )).data,
            }])).revertedWith('NOT_CALLABLE')
        })
        it("action = tokenERC721.safeTransferFrom", async function () {
            const { utr, owner, otherAccount, gameItem } = await loadFixture(scenario.fixture);
            await expect(utr.exec([], [{
                inputs: [],
                code: gameItem.address,
                data: (await gameItem.populateTransaction["safeTransferFrom(address,address,uint256)"](
                    owner.address,
                    otherAccount.address,
                    0
                )).data,
            }])).revertedWith('NOT_CALLABLE')
            await expect(utr.exec([], [{
                inputs: [],
                code: gameItem.address,
                data: (await gameItem.populateTransaction["safeTransferFrom(address,address,uint256,bytes)"](
                    owner.address,
                    otherAccount.address,
                    0,
                    "0x00"
                )).data,
            }])).revertedWith('NOT_CALLABLE')
        })
        it("action = tokenERC777.operatorSend/operatorBurn", async function () {
            const { utr, owner, otherAccount, gldToken } = await loadFixture(scenario.fixture);
            await expect(utr.exec([], [{
                inputs: [],
                code: gldToken.address,
                data: (await gldToken.populateTransaction.operatorSend(
                    owner.address,
                    otherAccount.address,
                    10,
                    "0x00",
                    "0x00"
                )).data,
            }])).revertedWith('NOT_CALLABLE')
            await expect(utr.exec([], [{
                inputs: [],
                code: gldToken.address,
                data: (await gldToken.populateTransaction.operatorBurn(
                    otherAccount.address,
                    10,
                    "0x00",
                    "0x00"
                )).data,
            }])).revertedWith('NOT_CALLABLE')
        })
        it("action = tokenERC1363.transferFromAndCall", async function () {
            const { utr, owner, otherAccount } = await loadFixture(scenario.fixture);
            // deploy erc1363 mock
            const compiledERC1363Mock = require("./compiled/$ERC1363.json");
            const ERC1363Mock = await new ethers.ContractFactory(compiledERC1363Mock.abi, compiledERC1363Mock.bytecode, owner);
            const erc1363Mock = await ERC1363Mock.deploy("ERC 1363 Mock", "1363M");

            await expect(utr.exec([], [{
                inputs: [],
                code: erc1363Mock.address,
                data: (await erc1363Mock.populateTransaction["transferFromAndCall(address,address,uint256)"](
                    owner.address,
                    otherAccount.address,
                    10,
                )).data,
            }])).revertedWith('NOT_CALLABLE')
            await expect(utr.exec([], [{
                inputs: [],
                code: erc1363Mock.address,
                data: (await erc1363Mock.populateTransaction["transferFromAndCall(address,address,uint256,bytes)"](
                    owner.address,
                    otherAccount.address,
                    10,
                    "0x00"
                )).data,
            }])).revertedWith('NOT_CALLABLE')
        })
        // it("custom selectors", async function () {
        //     const { owner, gameItem } = await loadFixture(scenario.fixture);
        //     const customSelector0 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("awardItem(address,string)")).substring(2, 10)
        //     const customSelector1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("awardItems(uint256,address,string)")).substring(2, 10)
        //     const blockedSelectors = ('0x' + customSelector0 + customSelector1).padEnd(66, '0')
        //     // deploy UniversalRouter
        //     const UniversalRouter = await ethers.getContractFactory("UniversalTokenRouter");
        //     const utr = await UniversalRouter.deploy(blockedSelectors);
        //     await utr.deployed();
        //     await expect(utr.exec([], [{
        //         inputs: [],
        //         code: gameItem.address,
        //         data: (await gameItem.populateTransaction.awardItem(
        //             owner.address,
        //             "test",
        //         )).data,
        //     }])).revertedWith('NOT_CALLABLE')
        //     await expect(utr.exec([], [{
        //         inputs: [],
        //         code: gameItem.address,
        //         data: (await gameItem.populateTransaction.awardItems(
        //             1,
        //             owner.address,
        //             "test",
        //         )).data,
        //     }])).revertedWith('NOT_CALLABLE')
        // })
        it("UniswapRouter.swapExactTokensForTokens", async function () {
            const { utr, uniswapPool, busd, weth, uniswapV2Helper01, owner } = await loadFixture(scenario.fixture);
            await weth.approve(utr.address, MaxUint256);
            await weth.deposit({ value: pe(100) });

            const amountIn = pe(1);
            const amountOutMin = pe(1400);
            const path = [
                weth.address,
                busd.address
            ];
            const to = owner.address
            const deadline = MaxUint256

            await utr.exec([{
                recipient: to,
                eip: 20,
                token: path[path.length - 1],
                id: 0,
                amountOutMin,
            }], [{
                inputs: [{
                    mode: TRANSFER,
                    recipient: uniswapPool.address,
                    eip: 20,
                    token: path[0],
                    id: 0,
                    amountIn,
                }],
                code: uniswapV2Helper01.address,
                data: (await uniswapV2Helper01.populateTransaction.swapExactTokensForTokens(
                    amountIn,
                    amountOutMin,
                    path,
                    to,
                    deadline
                )).data,
            }]);
        });
        it("UniswapRouter.swapTokensForExactTokens", async function () {
            const { utr, uniswapPool, busd, weth, uniswapV2Helper01, owner } = await loadFixture(scenario.fixture);
            await weth.approve(utr.address, MaxUint256);
            await weth.deposit({ value: pe(100) });

            const amountOut = pe(1400);
            const path = [
                weth.address,
                busd.address
            ];
            const amountInMax = pe(1);
            const to = owner.address;
            const deadline = MaxUint256

            await utr.exec([{
                eip: 20,
                token: path[path.length - 1],
                id: 0,
                amountOutMin: amountOut,
                recipient: to,
            }], [{
                inputs: [{
                    mode: PAYMENT,
                    eip: 20,
                    token: path[0],
                    id: 0,
                    amountIn: amountInMax,
                    recipient: uniswapPool.address,
                }],
                code: uniswapV2Helper01.address,
                data: (await uniswapV2Helper01.populateTransaction.swapTokensForTokensExact(
                    amountInMax,
                    amountOut,
                    path,
                    to,
                    to,
                    deadline
                )).data,
            }]);
        });
        it("UniswapRouter.addLiquidity", async function () {
            const { utr, uniswapPool, busd, weth, uniswapV2Helper01, owner } = await loadFixture(scenario.fixture);
            await weth.approve(utr.address, MaxUint256);
            await weth.deposit({ value: pe(100) });
            await busd.approve(utr.address, MaxUint256);

            const tokenA = busd.address;
            const tokenB = weth.address;
            const amountADesired = pe(1500);
            const amountBDesired = pe(1);
            const to = owner.address;
            await utr.exec([{
                eip: 20,
                token: uniswapPool.address,
                id: 0,
                amountOutMin: 1,  // just enough to verify the correct recipient
                recipient: to,
            }], [{
                inputs: [{
                    mode: PAYMENT,
                    eip: 20,
                    token: tokenA,
                    id: 0,
                    amountIn: amountADesired,
                    recipient: uniswapPool.address,
                }, {
                    mode: PAYMENT,
                    eip: 20,
                    token: tokenB,
                    id: 0,
                    amountIn: amountBDesired,
                    recipient: uniswapPool.address,
                }],
                code: uniswapV2Helper01.address,
                data: (await uniswapV2Helper01.populateTransaction.addLiquidity(
                    tokenA,
                    tokenB,
                    amountADesired,
                    amountBDesired,
                    0,
                    0,
                    to,
                    to
                )).data,
            }]);
        });
        it("Adapter contract for WETH", async function () {
            const { utr, weth, wethAdapter, otherAccount } = await loadFixture(scenario.fixture);
            await weth.approve(utr.address, MaxUint256);
            const someRecipient = otherAccount.address;
            await utr.exec([{
                eip: 20,
                token: weth.address,
                id: 0,
                amountOutMin: 1,
                recipient: someRecipient,
            }], [{
                inputs: [{
                    mode: CALL_VALUE,
                    eip: 0,                 // ETH
                    token: AddressZero,
                    id: 0,
                    amountIn: 123,
                    recipient: AddressZero, // pass it as the value for the next output action
                }],
                code: wethAdapter.address,
                data: (await wethAdapter.populateTransaction.deposit(someRecipient)).data,    // WETH.deposit returns WETH token to the UTR contract
            },
                // ... continue to use WETH in SomeRecipient
            ], { value: 123 });
        });
        it("WETH withdraw", async function () {
            const { utr, weth, owner } = await loadFixture(scenario.fixture);
            await weth.approve(utr.address, MaxUint256);
            await weth.deposit({ value: pe(100) });
            // const balanceBefore = await owner.getBalance()
            await expect(utr.exec([], [{
                inputs: [{
                    mode: TRANSFER,
                    eip: 20,                 
                    token: weth.address,
                    id: 0,
                    amountIn: pe(1),
                    recipient: utr.address, // pass it as the value for the next output action
                }],
                code: weth.address,
                data: (await weth.populateTransaction.withdraw(pe(1))).data,    // WETH.deposit returns WETH token to the UTR contract
            }])).revertedWith('NOT_CALLABLE');
            // const balanceAfter = await owner.getBalance()
            // expect(fe(balanceAfter.sub(balanceBefore))).to.closeTo(1, 1e-4)
        });
        it("Output Token Verification - EIP-721", async function () {
            const { utr, gameItem, gameController, owner } = await loadFixture(scenario.fixture);
            await gameItem.setApprovalForAll(utr.address, true);
            const tokenURI = "https://game.example/item.json";
            const player = owner.address;
            const amount = 3;
            await utr.exec([{
                eip: 721,
                token: gameItem.address,
                id: 0,
                amountOutMin: 1,
                recipient: player,
            }], [{
                inputs: [],
                code: gameController.address,
                data: (await gameController.populateTransaction.awardItem(player, tokenURI)).data,
            }]);
            expect(await gameItem.ownerOf(0)).to.equal(player);
            await utr.exec([{
                eip: 721,
                token: gameItem.address,
                id: 1,
                amountOutMin: 1,
                recipient: player,
            }], [{
                inputs: [],
                code: gameController.address,
                data: (await gameController.populateTransaction.awardItem(player, tokenURI)).data,
            }]);
            expect(await gameItem.ownerOf(1)).to.equal(player);
            await expect(utr.exec([{
                eip: 721,
                token: gameItem.address,
                id: 2,
                amountOutMin: 2,
                recipient: player,
            }], [{
                inputs: [],
                code: gameController.address,
                data: (await gameController.populateTransaction.awardItem(player, tokenURI)).data,
            }])).to.revertedWith("UTR: INSUFFICIENT_OUTPUT_AMOUNT");
            await utr.exec([{
                eip: 721,
                token: gameItem.address,
                id: ERC_721_BALANCE,
                amountOutMin: 3,
                recipient: player,
            }], [{
                inputs: [],
                code: gameController.address,
                data: (await gameController.populateTransaction.awardItems(amount, player, tokenURI)).data,
            }]);
        });
    });
});
shouldSupportInterfaces(['UniversalTokenRouter', 'ERC165'])
function shouldSupportInterfaces(interfaces = []) {
    const INTERFACES = {
        ERC165: ['supportsInterface(bytes4)'],
        UniversalTokenRouter: [
            'exec((address,uint256,address,uint256,uint256)[],((uint256,address,uint256,address,uint256,uint256)[],address,bytes)[])',
            'pay(bytes,uint256)',
            'discard(bytes,uint256)'
        ],
    }
    const INTERFACE_IDS = {};
    for (const k of Object.getOwnPropertyNames(INTERFACES)) {
        INTERFACE_IDS[k] = makeInterfaceId.ERC165(INTERFACES[k]);
    }
    describe('ERC165', function () {
        beforeEach(async function () {
            const {utr} = await loadFixture(scenarios[0].fixture);;
            this.contractUnderTest = utr;
        });
        it('supportsInterface uses less than 30k gas', async function () {
            for (const k of interfaces) {
                const interfaceId = INTERFACE_IDS[k] ?? k;
                expect(await this.contractUnderTest.estimateGas.supportsInterface(interfaceId)).to.be.lte(30000);
            }
        });

        it('all interfaces are supported', async function () {
            for (const k of interfaces) {
                const interfaceId = INTERFACE_IDS[k] ?? k;
                expect(await this.contractUnderTest.supportsInterface(interfaceId)).to.equal(true, `does not support ${k}`);
            }
        });
    })
}