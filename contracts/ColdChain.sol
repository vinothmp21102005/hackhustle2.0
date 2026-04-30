/**
 * @title ColdChain
 * @dev Tamper-proof cold chain system using blockchain and IPFS.
 */
contract ColdChain {
    
    // --- Enums & Structs ---
    
    enum Status { Created, InTransit, Delivered, Tampered }

    struct Document {
        string docType;   // e.g., "COA", "Invoice"
        string cid;       // IPFS Content Identifier
        string sha256Hash; // File Hash for double verification
        uint256 timestamp;
        address uploader;
    }

    struct TemperatureLog {
        int256 temperature; // using int256 in case of negative temps
        string location;
        uint256 timestamp;
        address logger;
    }

    struct Shipment {
        string shipmentId;
        string productName;
        address manufacturer;
        address carrier;
        address dealer;
        Status status;
        uint256 creationTime;
        uint256 deliveryTime;
        int256 minTemp;
        int256 maxTemp;
    }

    // --- State Variables ---
    
    // shipmentId => Shipment
    mapping(string => Shipment) public shipments;
    
    // shipmentId => Array of Documents
    mapping(string => Document[]) private shipmentDocuments;
    
    // shipmentId => Array of Temperature Logs
    mapping(string => TemperatureLog[]) private shipmentTempLogs;

    // --- Events ---
    
    event ShipmentCreated(string indexed shipmentId, address indexed manufacturer, address indexed carrier);
    event DocumentUploaded(string indexed shipmentId, string docType, string cid, address uploader);
    event TemperatureLogged(string indexed shipmentId, int256 temperature, string location, address logger);
    event ShipmentDelivered(string indexed shipmentId, address indexed dealer, uint256 timestamp);
    event TamperingDetected(string indexed shipmentId, string reason);

    // --- Constructor ---

    constructor() {}

    // --- Modifiers ---
    


    modifier onlyManufacturer(string memory _shipmentId) {
        require(msg.sender == shipments[_shipmentId].manufacturer, "Not the Manufacturer");
        _;
    }

    modifier onlyCarrier(string memory _shipmentId) {
        require(msg.sender == shipments[_shipmentId].carrier, "Not the Carrier");
        _;
    }

    modifier onlyDealer(string memory _shipmentId) {
        require(msg.sender == shipments[_shipmentId].dealer, "Not the Dealer");
        _;
    }

    modifier shipmentExists(string memory _shipmentId) {
        require(shipments[_shipmentId].manufacturer != address(0), "Shipment does not exist");
        _;
    }

    modifier shipmentActive(string memory _shipmentId) {
        require(shipments[_shipmentId].status != Status.Delivered, "Shipment already delivered");
        require(shipments[_shipmentId].status != Status.Tampered, "Shipment marked as tampered");
        _;
    }

    // --- Core Functions ---

    /**
     * @dev Manufacturer creates a new shipment batch
     */
    function createShipment(
        string memory _shipmentId,
        string memory _productName,
        address _carrier,
        address _dealer,
        int256 _minTemp,
        int256 _maxTemp
    ) public {
        require(shipments[_shipmentId].manufacturer == address(0), "Shipment ID already exists");


        shipments[_shipmentId] = Shipment({
            shipmentId: _shipmentId,
            productName: _productName,
            manufacturer: msg.sender,
            carrier: _carrier,
            dealer: _dealer,
            status: Status.Created,
            creationTime: block.timestamp,
            deliveryTime: 0,
            minTemp: _minTemp,
            maxTemp: _maxTemp
        });

        emit ShipmentCreated(_shipmentId, msg.sender, _carrier);
    }

    /**
     * @dev Upload a document's IPFS CID and Hash to the blockchain. 
     */
    function uploadDocument(
        string memory _shipmentId,
        string memory _docType,
        string memory _cid,
        string memory _sha256Hash
    ) public shipmentExists(_shipmentId) shipmentActive(_shipmentId) {
        // Ensure uploader is an active participant in this specific shipment
        require(
            msg.sender == shipments[_shipmentId].manufacturer || 
            msg.sender == shipments[_shipmentId].carrier || 
            msg.sender == shipments[_shipmentId].dealer,
            "Unauthorized to upload documents for this shipment"
        );

        shipmentDocuments[_shipmentId].push(Document({
            docType: _docType,
            cid: _cid,
            sha256Hash: _sha256Hash,
            timestamp: block.timestamp,
            uploader: msg.sender
        }));

        emit DocumentUploaded(_shipmentId, _docType, _cid, msg.sender);
    }

    /**
     * @dev Carrier logs the temperature at a specific location
     */
    function logTemperature(
        string memory _shipmentId,
        int256 _temperature,
        string memory _location
    ) public shipmentExists(_shipmentId) shipmentActive(_shipmentId) onlyCarrier(_shipmentId) {
        
        // Change status to InTransit on first log
        if (shipments[_shipmentId].status == Status.Created) {
            shipments[_shipmentId].status = Status.InTransit;
        }

        shipmentTempLogs[_shipmentId].push(TemperatureLog({
            temperature: _temperature,
            location: _location,
            timestamp: block.timestamp,
            logger: msg.sender
        }));

        emit TemperatureLogged(_shipmentId, _temperature, _location, msg.sender);

        // Check for breach immediately
        if (_temperature < shipments[_shipmentId].minTemp || _temperature > shipments[_shipmentId].maxTemp) {
            shipments[_shipmentId].status = Status.Tampered;
            emit TamperingDetected(_shipmentId, "Temperature Threshold Breached");
        }
    }

    /**
     * @dev Dealer confirms delivery, verifying the entire chain
     */
    function confirmDelivery(string memory _shipmentId) 
        public 
        shipmentExists(_shipmentId) 
        shipmentActive(_shipmentId) 
        onlyDealer(_shipmentId) 
    {
        shipments[_shipmentId].status = Status.Delivered;
        shipments[_shipmentId].deliveryTime = block.timestamp;

        emit ShipmentDelivered(_shipmentId, msg.sender, block.timestamp);
    }

    // --- View Functions ---

    function getDocuments(string memory _shipmentId) public view returns (Document[] memory) {
        return shipmentDocuments[_shipmentId];
    }

    function getTemperatureLogs(string memory _shipmentId) public view returns (TemperatureLog[] memory) {
        return shipmentTempLogs[_shipmentId];
    }
}
