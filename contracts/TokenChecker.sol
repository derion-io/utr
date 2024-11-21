// SPDX-License-Identifier: MIT
pragma solidity >= 0.6.0;

library TokenChecker {
    bytes32 constant ERROR_NOT_A_TOKEN = keccak256(abi.encodeWithSignature("Error(string)", "THIS IS NOT A TOKEN"));

    /**
     * @notice Query if a contract implements NotToken to be arbitrarily called.
     * @param target The address of the contract to query for support NotToken
     * @return true if the contract at account indicates support NotToken with
     * the correct bytes32 returned, false otherwise
     *
     * Interface identification is specified in ERC-TBD.
     */
    function isNotToken(address target) internal view returns (bool) {
        bytes memory data = abi.encodeWithSignature("allowance(address,address)", address(0), address(0));
        (bool success, bytes memory result) = target.staticcall(data);
        return !success && keccak256(result) == ERROR_NOT_A_TOKEN;
    }
}
