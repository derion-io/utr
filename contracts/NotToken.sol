// SPDX-License-Identifier: MIT
pragma solidity >= 0.6.0;

abstract contract NotToken  {
    function isNotToken() external pure returns (bytes32) {
        return "THIS CONTRACT IS NOT A TOKEN";
    }
}
