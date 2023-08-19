// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "./interfaces/IUniversalTokenRouter.sol";

contract UniversalTokenRouter is ERC165, IUniversalTokenRouter {
    uint constant PAYMENT       = 0;
    uint constant TRANSFER      = 1;
    uint constant CALL_VALUE    = 2;

    uint constant EIP_ETH       = 0;

    uint constant ERC_721_BALANCE = uint(keccak256('UniversalTokenRouter.ERC_721_BALANCE'));

    // non-persistent in-transaction pending payments
    mapping(bytes32 => uint) t_payments;

    // IERC165-supportsInterface
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IUniversalTokenRouter).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    // accepting ETH for WETH.withdraw
    receive() external payable {}

    function exec(
        Output[] memory outputs,
        Action[] memory actions
    ) override external payable {
    unchecked {
        // track the expected balances before any action is executed
        for (uint i = 0; i < outputs.length; ++i) {
            Output memory output = outputs[i];
            uint balance = _balanceOf(output);
            uint expected = output.amountOutMin + balance;
            require(expected >= balance, 'UniversalTokenRouter: OUTPUT_BALANCE_OVERFLOW');
            output.amountOutMin = expected;
        }

        address sender = msg.sender;

        for (uint i = 0; i < actions.length; ++i) {
            Action memory action = actions[i];
            uint value;
            for (uint j = 0; j < action.inputs.length; ++j) {
                Input memory input = action.inputs[j];
                uint mode = input.mode;
                if (mode == PAYMENT) {
                    bytes32 key = keccak256(abi.encodePacked(sender, input.recipient, input.eip, input.token, input.id));
                    t_payments[key] = input.amountIn;
                } else if (mode == TRANSFER) {
                    _transferToken(sender, input.recipient, input.eip, input.token, input.id, input.amountIn);
                } else if (mode == CALL_VALUE) {
                    // require(input.eip == EIP_ETH && input.id == 0, "UniversalTokenRouter: ETH_ONLY");
                    value = input.amountIn;
                }
            }
            if (action.data.length > 0) {
                (bool success, bytes memory result) = action.code.call{value: value}(action.data);
                if (!success) {
                    assembly {
                        revert(add(result,32),mload(result))
                    }
                }
            }
            // clear all in-transaction storages, allowances and left-overs
            for (uint j = 0; j < action.inputs.length; ++j) {
                Input memory input = action.inputs[j];
                if (input.mode == PAYMENT) {
                    // in-transaction storages
                    bytes32 key = keccak256(abi.encodePacked(sender, input.recipient, input.eip, input.token, input.id));
                    delete t_payments[key];
                }
            }
        }

        // refund any left-over ETH
        uint leftOver = address(this).balance;
        if (leftOver > 0) {
            TransferHelper.safeTransferETH(sender, leftOver);
        }

        // verify balance changes
        for (uint i = 0; i < outputs.length; ++i) {
            Output memory output = outputs[i];
            uint balance = _balanceOf(output);
            // NOTE: output.amountOutMin is reused as `expected`
            require(balance >= output.amountOutMin, 'UniversalTokenRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        }
    } }

    function _reducePayment(
        address sender,
        address recipient,
        uint eip,
        address token,
        uint id,
        uint amount
    ) internal {
    unchecked {
        bytes32 key = keccak256(abi.encodePacked(sender, recipient, eip, token, id));
        require(t_payments[key] >= amount, 'UniversalTokenRouter: INSUFFICIENT_PAYMENT');
        t_payments[key] -= amount;
    } }

    function pay(
        address sender,
        address recipient,
        uint eip,
        address token,
        uint id,
        uint amount
    ) override external {
        _reducePayment(sender, recipient, eip, token, id, amount);
        _transferToken(sender, recipient, eip, token, id, amount);
    }

    function discard(
        address sender,
        uint eip,
        address token,
        uint id,
        uint amount
    ) public override {
        _reducePayment(sender, msg.sender, eip, token, id, amount);
    }

    function _transferToken(
        address sender,
        address recipient,
        uint eip,
        address token,
        uint id,
        uint amount
    ) internal {
        if (eip == 20) {
            if (sender == address(this)) {
                TransferHelper.safeTransfer(token, recipient, amount);
            } else {
                TransferHelper.safeTransferFrom(token, sender, recipient, amount);
            }
        } else if (eip == 1155) {
            IERC1155(token).safeTransferFrom(sender, recipient, id, amount, "");
        } else if (eip == 721) {
            IERC721(token).safeTransferFrom(sender, recipient, id);
        } else {
            revert("UniversalTokenRouter: INVALID_EIP");
        }
    }

    function _balanceOf(
        Output memory output
    ) internal view returns (uint balance) {
        uint eip = output.eip;
        if (eip == 20) {
            return IERC20(output.token).balanceOf(output.recipient);
        }
        if (eip == 1155) {
            return IERC1155(output.token).balanceOf(output.recipient, output.id);
        }
        if (eip == 721) {
            if (output.id == ERC_721_BALANCE) {
                return IERC721(output.token).balanceOf(output.recipient);
            }
            try IERC721(output.token).ownerOf(output.id) returns (address currentOwner) {
                return currentOwner == output.recipient ? 1 : 0;
            } catch {
                return 0;
            }
        }
        if (eip == EIP_ETH) {
            return output.recipient.balance;
        }
        revert("UniversalTokenRouter: INVALID_EIP");
    }
}
