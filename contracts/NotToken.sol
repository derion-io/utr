// SPDX-License-Identifier: MIT
pragma solidity >= 0.6.0;

/**
 * This contract will conflict with the ERC20, ERC721, and ERC1155 standards,
 * preventing token contracts from accidentally implementing it.
 */
abstract contract NotToken  {
    function allowance(address, address) external pure {
        revert("THIS IS NOT A TOKEN");
    }
    function isApprovedForAll(address, address) external pure {
        revert("THIS IS NOT A TOKEN");
    }
}
