// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {IMailbox} from "../interfaces/IMailbox.sol";
import {TypeCasts} from "../lib/TypeCasts.sol";

interface ITicketFactory {
    function createTicket(
        bytes32 _identifier,
        address _msgSender,
        bytes memory _message
    ) external;
}

interface IMessageRecipient {
    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _message
    ) external payable;
}

contract HyperlaneMRUBridge is IMessageRecipient, Ownable {
    using SafeERC20 for IERC20;
    using TypeCasts for address;
    using TypeCasts for bytes32;

    IMailbox public immutable mailbox;
    address public immutable appInbox;
    uint32 public immutable bridgeDomain;
    address public hyperlaneDestination;
    address public stokenOrigin;
    uint32 public constant MRU_DOMAIN = 11155111; // Sepolia domain (MRU)

    event SentTransferRemote(
        uint32 indexed destination,
        bytes32 indexed recipient,
        address token,
        uint256 amount,
        address to
    );
    event ReceivedTransferRemote(
        uint32 indexed origin,
        address indexed recipient,
        address token,
        uint256 amount,
        address receiver
    );

    modifier onlyMailbox() {
        require(
            msg.sender == address(mailbox),
            "Only mailbox can call this function"
        );
        _;
    }

    constructor(address _mailbox, address _appInbox, uint32 _localDomain) Ownable(msg.sender) {
        mailbox = IMailbox(_mailbox);
        appInbox = _appInbox;
        bridgeDomain = _localDomain;
    }

    receive() external payable {
        uint256 gasFees = this.estimateTransferRemoteFee(
            MRU_DOMAIN,
            hyperlaneDestination,
            stokenOrigin,
            msg.value,
            msg.sender
        );

        require(msg.value >= gasFees, "Insufficient Ether for gas fees");

        this.transferRemote{value: msg.value - gasFees}(
            MRU_DOMAIN,
            hyperlaneDestination,
            stokenOrigin,
            msg.value - gasFees,
            msg.sender
        );


    }

    function estimateTransferRemoteFee(
        uint32 _destination,
        address _recipient,
        address _token,
        uint256 _amount,
        address _to
    ) public view returns (uint256) {
        bytes memory message = abi.encode(_token, _amount, _to);
        return
            mailbox.quoteDispatch(
            _destination,
            TypeCasts.addressToBytes32(_recipient),
            message
        );
    }

    function transferRemote(
        uint32 _destination,
        address _recipient,
        address _token,
        uint256 _amount,
        address _to
    ) external payable {
        require(_amount > 0, "Amount must be greater than 0");

        uint256 fee = estimateTransferRemoteFee(
            _destination,
            _recipient,
            _token,
            _amount,
            _to
        );
        require(msg.value >= fee, "Insufficient fee");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        mailbox.dispatch{value: msg.value}(
            _destination,
            TypeCasts.addressToBytes32(_recipient),
            abi.encode(_token, _amount, _to)
        );

        emit SentTransferRemote(
            _destination,
            TypeCasts.addressToBytes32(_recipient),
            _token,
            _amount,
            _to
        );
    }

    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _message
    ) external payable virtual override onlyMailbox {
        (address token, uint256 amount, address to) = abi.decode(
            _message,
            (address, uint256, address)
        );
        address recipient = _sender.bytes32ToAddress();

        if (bridgeDomain == MRU_DOMAIN) {
            require(appInbox != address(0), "AppInbox not set");
            bytes memory mruMessage = abi.encode(token, to, amount);
            bytes32 identifier = keccak256("BRIDGE_TOKEN");
            ITicketFactory(appInbox).createTicket(
                identifier,
                to,
                mruMessage
            );
        }

        emit ReceivedTransferRemote(_origin, recipient, token, amount, to);
    }

    function setHyperlaneDestination(address _hyperlaneDestination) public onlyOwner {
        hyperlaneDestination = _hyperlaneDestination;
    }

    function setStoken(address _stokenOrigin) public onlyOwner {
        stokenOrigin = _stokenOrigin;
    }
}