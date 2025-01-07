// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IUniversalTokenRouter.sol";
import "../NotToken.sol";

contract PaymentTest is NotToken {
    address immutable UTR;

    constructor(address _utr) {
        UTR = _utr;
    }

    function utrPay(
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

    function utrDiscard(
        address sender,
        uint256 amount
    ) external {
        bytes memory payment = abi.encode(
            sender,
            address(this),
            0,
            address(0),
            0
        );
        IUniversalTokenRouter(UTR).discard(payment, amount);
    }
}
