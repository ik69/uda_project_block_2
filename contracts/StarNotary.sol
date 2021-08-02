// SPDX-License-Identifier: MIT
pragma solidity >=0.4.24;

//Importing openzeppelin-solidity ERC-721 implemented Standard
import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";

// StarNotary Contract declaration inheritance the ERC721 openzeppelin implementation
contract StarNotary is ERC721 {

    // Star data
    struct Star {
        uint id; 
        string name;
        address owner;
        bool forsale;
        uint price;
    }

    // Implement Task 1 Add a name and symbol properties
    // name: Is a short name to your token
    // symbol: Is a short string like 'USD' -> 'American Dollar'
    string public tokenname = "MyStar Token";
    string public tokensymbol = "IST";

    // mapping the Star with the Owner Address
    mapping(uint256 => Star) public tokenIdToStarInfo;
    // mapping the TokenId and price
    mapping(uint256 => uint256) public starsForSale;
    uint tokenSum = 0;
    uint[] tokensIdArray;
    uint[] saleArray;

    constructor() ERC721(tokenname, tokensymbol) { } 

    function getAllTokens() public view returns(uint[] memory) {
    
        if (tokenSum == 0) { return new uint[](0); } else { return  tokensIdArray;  }
    }

    // Create Star using the Struct
    function createStar(string memory _name, uint256 _tokenId) public { // Passing the name and tokenId as a parameters
        if(!this.exist(_tokenId))  {
            Star memory newStar = Star(_tokenId, _name, msg.sender, false, 0); // Star is an struct so we are creating a new Star
            tokenIdToStarInfo[_tokenId] = newStar; // Creating in memory the Star -> tokenId mapping
            _mint(msg.sender, _tokenId); // _mint assign the the star with _tokenId to the sender address (ownership)
            tokensIdArray.push(_tokenId);
            tokenSum++;
        }
    }

    function getTokenName() public view returns(string memory nameToken_, string memory symbolToken_ ) {
     nameToken_ = name();
     symbolToken_ = symbol();
    }

    // Putting an Star for sale (Adding the star tokenid into the mapping starsForSale, first verify that the sender is the owner)
    function putStarUpForSale(uint256 _tokenId, uint256 _price) public {
        require(ownerOf(_tokenId) == msg.sender, "You can't sale the Star you don't owned");
        setApprovalForAll(address(this), true);
        tokenIdToStarInfo[_tokenId].price = _price;
        tokenIdToStarInfo[_tokenId].forsale = true;
        starsForSale[_tokenId] = _price;
    }


    // Function that allows you to convert an address into a payable address
    function _make_payable(address x) internal pure returns (address payable) {
        return payable(address(x));
    }

    function buyStar(uint256 _tokenId) public  payable {
        require(starsForSale[_tokenId] > 0, "The Star should be up for sale");
        uint256 starCost = starsForSale[_tokenId];
        address ownerAddress = ownerOf(_tokenId);
        require(msg.value > starCost, "You need to have enough Ether");
        this.buy1(_tokenId, msg.sender);
        address payable ownerAddressPayable = _make_payable(ownerAddress); // We need to make this conversion to be able to use transfer() function to transfer ethers
        ownerAddressPayable.transfer(starCost);
        if(msg.value > starCost) {
            payable(msg.sender).transfer(msg.value - starCost);
        }
        tokenIdToStarInfo[_tokenId].forsale = false;
        tokenIdToStarInfo[_tokenId].owner = msg.sender;
    }
    

    // Implement Task 1 lookUptokenIdToStarInfo
    function lookUptokenIdToStarInfo (uint _tokenId) public view returns (Star memory star) {
        //1. You should return the Star saved in tokenIdToStarInfo mapping
        if (this.exist( _tokenId)) {
            // return tokenIdToStarInfo[_tokenId].name;
           // Star memory star;
            star = tokenIdToStarInfo[_tokenId];
            // return tokenIdToStarInfo[_tokenId];
        } 
    }

    function exist(uint _id) public view returns(bool) {
                return _exists(_id);
    }

    // Implement Task 1 Exchange Stars function
    function exchangeStars(uint256 _tokenId1, uint256 _tokenId2) public {
        //1. Passing to star tokenId you will need to check if the owner of _tokenId1 or _tokenId2 is the sender
        //2. You don't have to check for the price of the token (star)
        //3. Get the owner of the two tokens (ownerOf(_tokenId1), ownerOf(_tokenId1)
        //4. Use _transferFrom function to exchange the tokens.
        address owner1 = ownerOf(_tokenId1);
        address owner2 = ownerOf(_tokenId2);
        require((owner1 == msg.sender || owner2 == msg.sender), "You cant't exchange Stars that you don't own");
        if (owner1 == msg.sender) {
            transferFrom(owner1, owner2, _tokenId1);
            this.buy1(_tokenId2, owner1);
        } else {
            transferFrom(owner2, owner1, _tokenId2);
            this.buy1(_tokenId1, owner2);
        }
        tokenIdToStarInfo[_tokenId1].owner = ownerOf(_tokenId1);
        tokenIdToStarInfo[_tokenId2].owner = ownerOf(_tokenId2);

    }
        //transfer to approved address(contract) and transfer from contract to new address
    function buy1(uint _id, address _adr) public returns(address) {
        transferFrom( ownerOf(_id), address(this), _id);
        transferFrom( ownerOf(_id), _adr, _id);
        return msg.sender;
    }

    // Implement Task 1 Transfer Stars
    function transferStar(address _to1, uint256 _tokenId) public returns(bool){
        //1. Check if the sender is the ownerOf(_tokenId)
        //2. Use the transferFrom(from, to, tokenId); function to transfer the Star
     //   string memory starName = lookUptokenIdToStarInfo(_tokenId);
     //   if(keccak256(bytes(starName)) == keccak256(bytes("Not ok"))) {    return false;  }
        address adr = ownerOf(_tokenId);
        if(msg.sender == adr || msg.sender == getApproved(_tokenId)) {
            _transfer(msg.sender, _to1, _tokenId);
            tokenIdToStarInfo[_tokenId].owner = _to1;
            return true;
        } else {
            return false;
        }
    }
}