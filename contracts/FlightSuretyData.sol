// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "../node_modules/openzeppelin-solidity/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => uint256) private authorizedAppContracts;         // Authorized app contracts
    
    struct Airline {
        string name;        
        bool isActive;
        bool isRegistered;
        address airlineAddress;
        uint256 funds;
        uint256 index;
        address[] voters;
    }
    
    mapping(address => Airline) private airlines;    
    uint256 public airlinesCount;

    struct Flight {
        string name;
        address airlineAddress;
        uint256 timestamp;
        uint8 status;
    }

    mapping(bytes32 => Flight) flights;
    
    struct Insurance {
        address passengerAddress;
        uint256 value;
        uint256 toPay;
        uint valueMultiplier;
        bool isCredited;
    }

    mapping(bytes32 => Insurance[]) insuranceList;

    mapping(address => uint256) pendingPayments;
    

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineRegistered(address airline);
    event AirlineActiveStateChanged(address airline, bool isActive);
    event AirlineRegisteredStateChanged(address airline, bool isRegistered);
    event FlightStatusChanged(string flightName, address airlineAddress, uint256 timestamp, uint8 status);
    

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor()                                                                 
    {
        contractOwner = msg.sender;
        airlinesCount = 0;        
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires that call to functions are coming from the authorized app contracts only
    */
    modifier requireApp(){
        require(authorizedAppContracts[msg.sender] == 1, 'Caller is not an authorized app' );
        _;
    }

    modifier requireActiveAirline() {
        require(airlines[msg.sender].isActive, 'Requires active airline');
        _;
    }
    
    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner
    {
        operational = mode;
    }


    function addAppAuthorization(address appContract) external requireContractOwner {
        authorizedAppContracts[appContract] = 1;
    }

    function removeAppAuthorization(address appContract) external requireContractOwner {
        authorizedAppContracts[appContract] = 0;
    }

    function test() public view returns (address, address) {
        return (msg.sender, tx.origin);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(string memory airlineName, address airlineAddress) 
        public requireIsOperational requireApp 
    {        
        require(airlines[airlineAddress].airlineAddress != airlineAddress, 'Airline is already registered');
        require(airlineAddress != address(0),'Invalid airline address');
        
        if(airlines[airlineAddress].airlineAddress != airlineAddress){
            Airline storage a = airlines[airlineAddress];
            a.name = airlineName;
            a.isActive = false;
            a.airlineAddress = airlineAddress;   
            a.isRegistered = false;                     
            a.index = airlinesCount;
            a.voters.push(msg.sender);
            airlinesCount++;            

            emit AirlineRegistered(airlineAddress);
        }
        

        emit AirlineRegistered(airlineAddress);
    }    

    function getAirline(address airlineAddress) external view requireIsOperational requireApp
        returns(string memory _name, bool _isActive, bool _isRegistered, address _airlineAddress, uint256 _funds, uint256 _index, address[] memory voters)
    {
        Airline memory a = airlines[airlineAddress];
        return (a.name, a.isActive, a.isRegistered, a.airlineAddress, a.funds, a.index, a.voters);
    }

    function getAirlineFunds(address airlineAddress) external view returns(uint256) 
    {
        return airlines[airlineAddress].funds;
    }

    function getAirlineVoters(address airlineAddress) external view returns(address[] memory) 
    {
        return airlines[airlineAddress].voters;
    }

    function getAirlineIsActive(address airlineAddress) external view returns(bool) 
    {
        return airlines[airlineAddress].isActive;
    }

    function getAirlineIsRegistered(address airlineAddress) external view returns(bool) 
    {
        return airlines[airlineAddress].isRegistered;
    }

    function setAirlineActiveState(address airlineAddress, bool isActive) 
        external requireIsOperational requireApp
    {
        require(airlines[airlineAddress].airlineAddress == airlineAddress, 'Airline is not registered');
        airlines[airlineAddress].isActive = isActive;                    
        emit AirlineActiveStateChanged(airlineAddress, isActive);         
    }

    function setAirlineRegisteredState(address airlineAddress, bool isRegistered) 
        external requireIsOperational requireApp
    {
        require(airlines[airlineAddress].airlineAddress == airlineAddress, 'Airline is not registered');
        airlines[airlineAddress].isRegistered = isRegistered;                    
        emit AirlineRegisteredStateChanged(airlineAddress, isRegistered);
    }

    function voteAirline(address airlineAddress) external requireActiveAirline returns(uint){
        Airline storage a = airlines[airlineAddress];
        bool alreadyVoted = false;

        for(uint i=0;i<a.voters.length;i++){
            if(a.voters[i] == msg.sender) {
                alreadyVoted = true;
                break;
            }
        }
        require(!alreadyVoted, 'Already voted for this airline');
        a.voters.push(msg.sender);

        return a.voters.length;
    }

     /**
    * @dev Fund the airline. The initial funding is enforced in the app contacts. 
    *
    */   
    function fundAirline(address airlineAddress, uint funds) public payable requireIsOperational {        
        require(airlines[airlineAddress].isRegistered, 'Airline is not registered');
        Airline storage a = airlines[airlineAddress];               
        a.funds = a.funds.add(funds);
    }

    function compareStrings(string memory a, string memory b) public pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }


    function registerFlight(string calldata flight, address airlineAddress, uint256 timestamp)
     external requireIsOperational requireApp {
        bytes32 flightKey = getFlightKey(airlineAddress, flight, timestamp);
        require(flights[flightKey].airlineAddress != airlineAddress, 'Flight already registered');
        flights[flightKey] = Flight({
            airlineAddress: airlineAddress,
            name: flight,
            timestamp: timestamp,
            status: 0
        });
    }

    function setFlightStatus(string calldata flightName, address airlineAddress, uint256 timestamp, uint8 status) external requireIsOperational requireApp{
        bytes32 flightKey = getFlightKey(airlineAddress, flightName, timestamp);
        require(flights[flightKey].airlineAddress == airlineAddress, 'Could not find flight');
        flights[flightKey].status = status;
        emit FlightStatusChanged(flightName, airlineAddress, timestamp, status);
    }

   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buyInsurance(string calldata flightName, address airlineAddress, uint256 timestamp, uint multiplier) external payable requireIsOperational requireApp
    {
        bytes32 flightKey = getFlightKey(airlineAddress, flightName, timestamp);
        require(flights[flightKey].airlineAddress == airlineAddress, 'Could not find flight');
        Flight memory flight = flights[flightKey];
        require(flight.timestamp > block.timestamp, 'The flight has to be in the future');        
        insuranceList[flightKey].push(Insurance({
            passengerAddress: msg.sender,
            value: msg.value,            
            valueMultiplier: multiplier,
            toPay: msg.value.mul(multiplier),
            isCredited: false
        }));
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(string calldata flightName, address airlineAddress, uint256 timestamp) external requireIsOperational requireApp
    {        
        bytes32 flightKey = getFlightKey(airlineAddress, flightName, timestamp);        
        require(flights[flightKey].airlineAddress == airlineAddress, 'Could not find flight');
        require(flights[flightKey].timestamp < block.timestamp, 'The flight has to be in the past');        
        for(uint i = 0; i < insuranceList[flightKey].length; i++){
            if(!insuranceList[flightKey][i].isCredited) {
                insuranceList[flightKey][i].isCredited = true;
                pendingPayments[insuranceList[flightKey][i].passengerAddress].add(insuranceList[flightKey][i].toPay);
            }
        }
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay()  external requireIsOperational requireApp
    {
        require(pendingPayments[msg.sender] > 0, 'No funds to withdraw');
        pendingPayments[msg.sender] = 0;
        payable(msg.sender).transfer(pendingPayments[msg.sender]);
    }



    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }



    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    fallback() 
                            external 
                            payable 
    {
        //fundAirline(msg.sender, msg.value);
    }


    receive() external payable {
        //fundAirline(msg.sender, msg.value);
    }

}

