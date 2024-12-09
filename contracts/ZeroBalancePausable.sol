// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/StorageSlot.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";

contract ZeroBalancePausable is Context {
    bytes32 constant public PAUSED_SLOT = keccak256("ZeroBalancePausable.PAUSED");

    address immutable public PAUSER;

    event Pause();
    event Unpause();

    modifier whenNotPaused {
        require(!_paused(), "ZBP: PAUSED");
        _;
        if (address(this).balance > 0) {
            TransferHelper.safeTransferETH(PAUSER, address(this).balance);
        }
    }

    constructor(address pauser) {
        PAUSER = pauser;
    }

    function pause() public payable {
        require(_msgSender() == PAUSER, "ZBP: UNAUTHORIZED");
        require(address(this).balance > 0, "ZBP: NEED_VALUE");
        StorageSlot.getBooleanSlot(PAUSED_SLOT).value = true;
        emit Pause();
    }

    function unpause() public payable {
        require(_msgSender() == PAUSER, "ZBP: UNAUTHORIZED");
        if (address(this).balance > 0) {
            TransferHelper.safeTransferETH(PAUSER, address(this).balance);
        }
        StorageSlot.getBooleanSlot(PAUSED_SLOT).value = false;
        emit Unpause();
    }

    function paused() public view returns (bool) {
        return _paused();
    }

    function _paused() internal view returns (bool) {
        return address(this).balance > msg.value && StorageSlot.getBooleanSlot(PAUSED_SLOT).value; 
    }
}
