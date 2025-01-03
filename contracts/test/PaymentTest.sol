// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IUniversalTokenRouter.sol";

contract PaymentTest {
    address immutable UTR;

    constructor(address _utr) {
        UTR = _utr;
    }

    function CallUTRPay(
        address sender,
        address recipient,
        uint256 eip,
        address token,
        uint256 id,
        uint256 amount
    ) external {
        bytes memory payment = abi.encode(sender, recipient, eip, token, id);
        IUniversalTokenRouter(UTR).pay(payment, amount);
    }
}
