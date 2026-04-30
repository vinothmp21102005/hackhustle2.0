// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ChainRegistry
 * @dev Manages global identities and roles for the Cold Chain network.
 * This provides the "people behind the details" by linking addresses to real-world entities.
 */
contract ChainRegistry {
    address public admin;
    mapping(address => bool) public managers;

    enum Role { None, Producer, Carrier, Dealer, Inspector, Regulator }

    struct Entity {
        string name;
        Role role;
        string licenseNumber;
        string location;
        bool isActive;
        uint256 joinedAt;
    }

    mapping(address => Entity) public entities;
    mapping(string => address) public iotDevices; // sensorId => owner address

    event EntityRegistered(address indexed account, string name, Role role);
    event EntityDeactivated(address indexed account);
    event IoTDeviceRegistered(string sensorId, address indexed owner);
    event ManagerAdded(address indexed manager);
    event ManagerRemoved(address indexed manager);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only primary admin can perform this action");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == admin || managers[msg.sender], "Not authorized: Manager role required");
        _;
    }

    constructor() {
        admin = msg.sender;
        managers[msg.sender] = true;
    }

    /**
     * @dev Decentralize admin power by adding/removing managers
     */
    function addManager(address _manager) public onlyAdmin {
        require(_manager != address(0), "Invalid address");
        managers[_manager] = true;
        emit ManagerAdded(_manager);
    }

    function removeManager(address _manager) public onlyAdmin {
        require(_manager != admin, "Cannot remove primary admin");
        managers[_manager] = false;
        emit ManagerRemoved(_manager);
    }

    function transferAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        admin = _newAdmin;
        managers[_newAdmin] = true;
    }

    /**
     * @dev Register a new organization or individual in the supply chain
     */
    function registerEntity(
        address _account, 
        string memory _name, 
        Role _role, 
        string memory _license,
        string memory _location
    ) public onlyManager {
        require(_account != address(0), "Invalid account address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_license).length > 0, "License cannot be empty");
        require(_role != Role.None, "Must assign a valid role");

        entities[_account] = Entity({
            name: _name,
            role: _role,
            licenseNumber: _license,
            location: _location,
            isActive: true,
            joinedAt: block.timestamp
        });
        emit EntityRegistered(_account, _name, _role);
    }

    /**
     * @dev Deactivate an entity (e.g. license expired or fraud detected)
     */
    function deactivateEntity(address _account) public onlyManager {
        entities[_account].isActive = false;
        emit EntityDeactivated(_account);
    }

    /**
     * @dev Register a specific IoT hardware sensor. 
     * Restricted to the owner or a manager to prevent unauthorized registrations.
     */
    function registerIoTDevice(string memory _sensorId, address _owner) public {
        require(bytes(_sensorId).length > 0, "Sensor ID cannot be empty");
        require(entities[_owner].isActive, "Owner must be an active registered entity");
        require(
            msg.sender == _owner || managers[msg.sender], 
            "Unauthorized: Only owner or manager can register device"
        );
        require(
            entities[_owner].role == Role.Carrier || 
            entities[_owner].role == Role.Producer ||
            entities[_owner].role == Role.Inspector, 
            "Owner role unauthorized for IoT devices"
        );
        
        iotDevices[_sensorId] = _owner;
        emit IoTDeviceRegistered(_sensorId, _owner);
    }

    /**
     * @dev Verify if an address is authorized for a specific role
     */
    function isAuthorized(address _account, Role _requiredRole) public view returns (bool) {
        return entities[_account].isActive && entities[_account].role == _requiredRole;
    }

    /**
     * @dev Get entity details for forensic reporting
     */
    function getEntity(address _account) public view returns (Entity memory) {
        return entities[_account];
    }
}

