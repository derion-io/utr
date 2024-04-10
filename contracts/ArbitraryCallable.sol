// SPDX-License-Identifier: MIT
pragma solidity >= 0.6.0;

interface INotToken {
    function isNotToken() external returns (bytes32);
}

library ArbitraryCallable {
    /**
     * @notice Query if a contract implements isNotToken to be arbitrarily called.
     * @param target The address of the contract to query for support of isNotToken
     * @return true if the contract at account indicates support of isNotToken with
     * the correct bytes32 returned, false otherwise
     *
     * Interface identification is specified in ERC-TBD.
     */
    function isNotToken(address target) internal view returns (bool) {
        // prepare call
        bytes memory encodedParams = abi.encodeWithSelector(INotToken.isNotToken.selector);

        // perform static call
        bool success;
        uint256 returnSize;
        bytes32 returnValue;
        assembly {
            success := staticcall(30000, target, add(encodedParams, 0x20), mload(encodedParams), 0x00, 0x20)
            returnSize := returndatasize()
            returnValue := mload(0x00)
        }

        return success && returnSize == 0x20 && returnValue == "THIS CONTRACT IS NOT A TOKEN";
    }
}
