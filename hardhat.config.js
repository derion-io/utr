/** @type import('hardhat/config').HardhatUserConfig */
const dotenv = require("dotenv");
dotenv.config({ path: __dirname + "/.env" });

require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-solhint");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("solidity-coverage");
require("@nomicfoundation/hardhat-verify");

const DEFAULT_COMPILER_SETTINGS = {
    version: '0.7.6',
    settings: {
        evmVersion: 'istanbul',
        optimizer: {
            enabled: true,
            runs: 1000000,
        },
        metadata: {
            bytecodeHash: 'none',
        },
    },
}

module.exports = {
    defaultNetwork: 'hardhat',
    solidity: {
        compilers: [
            {
                version: "0.8.28",
                settings: {
                    evmVersion: 'cancun',
                    optimizer: {
                        enabled: true,
                        runs: 1000000,
                    },
                    metadata: {
                        bytecodeHash: 'none',
                    },
                },
            },
            {
                version: "0.6.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1000000,
                    },
                    metadata: {
                        bytecodeHash: 'none',
                    },
                },
            },
            {
                version: '0.7.6',
                settings: {
                    evmVersion: 'istanbul',
                    optimizer: {
                        enabled: true,
                        runs: 1000000,
                    },
                    metadata: {
                        bytecodeHash: 'none',
                    },
                },
            }
        ],
        overrides: {
            '@uniswap/v3-periphery/contracts/base/Multicall.sol': DEFAULT_COMPILER_SETTINGS,
            '@uniswap/v3-periphery/contracts/base/PeripheryImmutableState.sol': DEFAULT_COMPILER_SETTINGS,
            '@uniswap/v3-core/contracts/libraries/TickMath.sol': DEFAULT_COMPILER_SETTINGS,
            '@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol': DEFAULT_COMPILER_SETTINGS
        }
    },
    networks: {
        hardhat: {
            accounts: [
                {
                    privateKey: "0x0000000000000000000000000000000000000000000000000000000000000001",
                    balance: "900000000000000000000000000000000000000",
                },
                {
                    privateKey: '0x0000000000000000000000000000000000000000000000000000000000000002',
                    balance: "900000000000000000000000000000000000000",
                },
                {
                    privateKey: '0x0000000000000000000000000000000000000000000000000000000000000003',
                    balance: "900000000000000000000000000000000000000",
                },
            ]
        },
        arbitrum: {
            url: process.env.ARB_MAINNET_PROVIDER ?? 'https://arb1.arbitrum.io/rpc',
            accounts: [
                process.env.MAINNET_DEPLOYER ?? '0x0000000000000000000000000000000000000000000000000000000000000001',
            ],
            timeout: 900000,
            chainId: 42161,
            gasLimit: 12000000
        },
        arbitrumtest: {
            url: process.env.ARB_TESTNET_PROVIDER ?? 'https://endpoints.omniatech.io/v1/arbitrum/goerli/public',
            accounts: [
                process.env.TESTNET_DEPLOYER ?? '0x0000000000000000000000000000000000000000000000000000000000000001',
            ],
            timeout: 20000,
            chainId: 421613
        },
        bsc: {
            url: process.env.BSC_MAINNET_PROVIDER ?? 'https://bsc-dataseed3.binance.org/',
            accounts: [
                process.env.MAINNET_DEPLOYER ?? '0x0000000000000000000000000000000000000000000000000000000000000001',
            ],
            timeout: 900000,
            chainId: 56,
            gasLimit: 12000000,
            gasPrice: 3e9
        },
        opbnb: {
            url: process.env.OPBNB_MAINNET_PROVIDER ?? 'https://1rpc.io/opbnb',
            accounts: [
                process.env.MAINNET_DEPLOYER ?? '0x0000000000000000000000000000000000000000000000000000000000000001',
            ],
            timeout: 900000,
            chainId: 204,
            gasPrice: 100,
            gasLimit: 8000000,
        },
        basetestnet: {
            url: process.env.BASE_TESTNET_PROVIDER ?? 'https://goerli.base.org',
            accounts: [
                process.env.TESTNET_DEPLOYER ?? '0x0000000000000000000000000000000000000000000000000000000000000001',
            ],
            timeout: 20000,
            chainId: 84531
        },
        basemainnet: {
            url: process.env.BASE_MAINNET_PROVIDER ?? 'https://mainnet.base.org',
            accounts: [
                process.env.MAINNET_DEPLOYER ?? '0x0000000000000000000000000000000000000000000000000000000000000001',
            ],
            timeout: 20000,
            chainId: 8453
        },
        polygon: {
            url: process.env.POL_MAINNET_PROVIDER ?? 'https://polygon.llamarpc.com',
            accounts: [
                process.env.MAINNET_DEPLOYER ?? '0x0000000000000000000000000000000000000000000000000000000000000001',
            ],
            gasPrice: 87000000000,
            gasLimit: 10000000,
        },
        poltestnet: {
            url: process.env.POL_TESTNET_PROVIDER ?? 'https://rpc-amoy.polygon.technology',
            accounts: [
                process.env.TESTNET_DEPLOYER ?? '0x0000000000000000000000000000000000000000000000000000000000000001',
            ],
            gasPrice: 35000000000,
            gasLimit: 10000000,
        },
    },
    etherscan: {
        customChains: [
            {
                network: "opbnb",
                chainId: 204,
                urls: {
                    apiURL: "https://api-opbnb.bscscan.com/api",
                    browserURL: "https://opbnb.bscscan.com/"
                }
            },
            {
                network: "polygonAmoy",
                chainId: 80002,
                urls: {
                    apiURL: "https://api-amoy.polygonscan.com/api",
                    browserURL: "https://amoy.polygonscan.com"
                },
            },
        ],
        apiKey: {
            ethereum: process.env.SCAN_API_KEY_1,
            arbitrumOne: process.env.SCAN_API_KEY_42161,
            bsc: process.env.SCAN_API_KEY_56,
            opbnb: process.env.SCAN_API_KEY_204,
            polygonAmoy: process.env.SCAN_API_KEY_POLTESTNET,
            polygon: process.env.SCAN_API_KEY_POLTESTNET,
        },
    },
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: false,
        runOnCompile: true,
        strict: true,
        only: [],
    }
};
