import Web3 from "web3";
import starNotaryArtifact from "../../build/contracts/StarNotary.json";

const App = {
  web3: null,
  account: null,
  meta: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = starNotaryArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        starNotaryArtifact.abi,
        deployedNetwork.address,
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      this.init();
    
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  init: async function() {
    const { getTokenName } = this.meta.methods;
    let token = await getTokenName().call();
     const myToken = document.getElementById("myToken");
     myToken.innerHTML =  token.nameToken_ + " - " + token.symbolToken_;
     const myAddress = document.getElementById("myAddress");
     myAddress.innerHTML = this.account;
     this.showTokens();
  },

  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },

  createStar: async function() {
    const { createStar, exist } = this.meta.methods;
    const name = document.getElementById("starName").value;
    const id = document.getElementById("starId").value;
    if (!this.checkInput(name, id)) {return; } 
      let idExist = await exist( id ).call();
      if (!idExist) {
        let aa = await createStar(name, id).send({from: this.account});
        App.setStatus("New Star Owner is " + this.account + ".");
        this.showTokens();
      } else {
        App.setStatus("This  Star is already exist.");
      }
  },

// Implement Task 4 Modify the front end of the DAPP
lookUp: async function (){
  const { lookUptokenIdToStarInfo, exist} = this.meta.methods;
  const id = document.getElementById("lookid").value;
  if (!this.checkInput(id, true)) { return; } 
  let idExist = await exist( id ).call();
  if (!idExist) {
    App.setStatus("This Star id: "+ id + " is not exist.");
    return;
  } else {
    let star = await lookUptokenIdToStarInfo(id).call();
    console.log(star)
    App.setStatus("The  Star Id:" + star.id + " Name is: " + star.name);
  }
  document.getElementById(id).style.background = "black";
  document.getElementById("transferStarInput").value = id;
  setTimeout(() => {
    document.getElementById(id).style.background = "red";
  }, 6000);
},

  putForSale: async function() {
    const { putStarUpForSale, lookUptokenIdToStarInfo, exist } = this.meta.methods;
    const id = document.getElementById("forsaleId").value;
    const preis = document.getElementById("salePreis").value;
    if (!this.checkInput(id, preis)) { return; } 
    let idExist = await exist( id ).call();
    if (!idExist) { App.setStatus("This Star is not exist."); return;} 
    let star = await lookUptokenIdToStarInfo( id ).call();
    if (star.owner == this.account) {
      let bb = await putStarUpForSale(id, preis).send({from: this.account});
      this.showTokens();
    } else {
      App.setStatus("You do not own the star!");
    }
  },

  buyStar: async function(idArg=false) {
    App.setStatus("");
    const {  buyStar, lookUptokenIdToStarInfo } = this.meta.methods;
    const id = document.getElementById("buyStarId").value;
    if (!idArg) {
      if (!this.checkInput(id, true)) { return; } 
    }
    let star = await lookUptokenIdToStarInfo(id).call();
    if (star.owner == this.account || star.owner == 0 || !star.forsale) { 
      App.setStatus("Token not for sale or available, or own Token");  return;   }
    try{
      await buyStar(id).send({from: this.account, value: 55});
      this.showTokens();
    } catch(e) {
      App.setStatus(e.message);
    } 
  },

  transferStar: async function() {
    const { transferStar, exist, lookUptokenIdToStarInfo } = this.meta.methods;
    const id = document.getElementById("transferStarInput").value;
    const address = document.getElementById("transferStarAddr").value;
    if (!this.checkInput(address, id)) {return; } 
    let idExist = await exist( id ).call();
    if (!idExist) {
      App.setStatus("This Star is not exist " + this.account + ".");
      return;
    } else {
      let star = await lookUptokenIdToStarInfo(id).call();
      if (star.owner == this.account) { 
        let bb = await transferStar(address, id).send({from: this.account});
        this.showTokens();
      } else {
        App.setStatus("This Star is not owned.");
      }
    }
  },

  exchangeStar: async function (id) {
    const { exist, exchangeStars } = this.meta.methods;
    const id1 = document.getElementById("starIdExchangeFrom").value;
    const id2 = document.getElementById("starIdExchangeTo").value;
    if (!this.checkInput(id1, id2) || id1 == id2) {return; } 
    let id1Exist = await exist( id1 ).call();
    let id2Exist = await exist( id2 ).call();

    if (!id1Exist || !id2Exist) {
      App.setStatus("The Star is not exist.");
      return;
    } else {
      await exchangeStars(id1, id2).send({from: this.account});
     this.showTokens();
    }
  },

  showTokens: async function() {
    App.setStatus("");
    const forsaleDiv2 = document.getElementById("forsaleDiv2");
    forsaleDiv2.replaceChildren();
    const { getAllTokens, lookUptokenIdToStarInfo } = this.meta.methods;
    let allTokensId = await getAllTokens().call();
    document.getElementById("main").replaceChildren();
    for (let index = 0; index < allTokensId.length; index++) {
      let details = await lookUptokenIdToStarInfo(allTokensId[index]).call();
      let div = document.createElement("div");
      div.style.background = "red";
      div.style.color = "white";
      div.innerHTML = "<br>Star id: "+details.id+ "<br>Star Name: "+details.name+ "<br> Star Owner: <br>"+ details.owner;
      div.setAttribute('class', 'item');
      div.setAttribute('id', details.id);
      document.getElementById("main").appendChild(div);
      if (details.forsale) {
        let btn = document.createElement("button");
        btn.innerHTML = "Buy a #"+details.id+ "Star for wei" + details.price;
        btn.onclick = function () {
              App.buyStar(details.id);
            };
            forsaleDiv2.appendChild(btn);
      }
    }
  },

  checkInput: (value1, value2) => {
    if (value1 && value2 &&  !(value1 == 0 || value2 == 0)) {
      return true;
    } else {
      App.setStatus("Empty input field or 0 is not allowed");
      return false;
    }
  }
};

window.App = App;

window.addEventListener("load", async function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    await window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live",);
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"),);
  }

  App.start();
});