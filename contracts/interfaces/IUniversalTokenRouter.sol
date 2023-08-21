// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

struct Output {
  address recipient;
  uint256 eip; // token standard: 0 for ETH or EIP number
  address token; // token contract address
  uint256 id; // token id for EIP721 and EIP1155
  uint256 amountOutMin;
}

struct Input {
  uint256 mode;
  address recipient;
  uint256 eip; // token standard: 0 for ETH or EIP number
  address token; // token contract address
  uint256 id; // token id for EIP721 and EIP1155
  uint256 amountIn;
}

struct Action {
  Input[] inputs;
  address code; // contract code address
  bytes data; // contract input data
}

interface IUniversalTokenRouter is IERC165 {
  function exec(
    Output[] memory outputs,
    Action[] memory actions
  ) external payable;

  function pay(
    address sender,
    address recipient,
    uint256 eip,
    address token,
    uint256 id,
    uint256 amount
  ) external;

  function discard(
    address sender,
    uint256 eip,
    address token,
    uint256 id,
    uint256 amount
  ) external;
}
