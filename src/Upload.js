// import React from 'react';

// function Upload(){
//     return(
//         <h1>Upload</h1>
//     );
// }

// export default Upload;
import React, { Component } from "react";
import IPFSInboxContract from "./IPFSInbox.json";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "truffle-contract";
import ipfs from './ipfs';
import { writeFile } from "fs";

class Upload extends Component {
  constructor(props) {
    super(props)
    this.state = {
      storageValue: 0,
      web3: null,
      accounts: null,
      contract: null,
      ipfsHash: null,
      formIPFS: "",
      formAddress: "",
      receivedIPFS: ""
    };

    this.handleChangeAddress = this.handleChangeAddress.bind(this);
    this.handleChangeIPFS = this.handleChangeIPFS.bind(this);
    this.handleSend = this.handleSend.bind(this);
    this.handleReceiveIPFS = this.handleReceiveIPFS.bind(this);
  }


  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const Contract = truffleContract(IPFSInboxContract);
      Contract.setProvider(web3.currentProvider);
      const instance = await Contract.deployed();

      instance.inboxResponse()
        .on('data', result => {
          this.setState({ receivedIPFS: result.args[0] })
        });

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

  // BELOW ADDED
  handleChangeAddress(event) {
    this.setState({ formAddress: event.target.value });
  }

  handleChangeIPFS(event) {
    this.setState({ formIPFS: event.target.value });
  }

  handleSend(event) {
    event.preventDefault();
    const contract = this.state.contract
    const account = this.state.accounts[0]

    document.getElementById('new-notification-form').reset()
    this.setState({ showNotification: true });
    contract.sendIPFS(this.state.formAddress, this.state.formIPFS, { from: account })
      .then(result => {
        this.setState({ formAddress: "" });
        this.setState({ formIPFS: "" });
      })
  }

  handleReceiveIPFS(event) {
    event.preventDefault();
    const contract = this.state.contract
    const account = this.state.accounts[0]
    contract.checkInbox({ from: account })
  }

  convertToBuffer = async (reader) => {
    //file is converted to a buffer for upload to IPFS
    const buffer = await Buffer.from(reader.result);
    //set this buffer -using es6 syntax
    this.setState({ buffer });
  };

  captureFile = (event) => {
    event.stopPropagation()
    event.preventDefault()
    const file = event.target.files[0]
    let reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => this.convertToBuffer(reader)
  };

  onIPFSSubmit = async (event) => {
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    event.preventDefault();

    //bring in user's metamask account address
    const accounts = this.state.accounts;

    console.log('Sending from Metamask account: ' + accounts[0]);
    //save document to IPFS,return its hash#, and set hash# to state
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add 

    await ipfs.add(this.state.buffer, (err, ipfsHash) => {
      console.log(err, ipfsHash);
      // console.log(web3.eth.getTransactionReceipt(ipfsHash));
      //setState by setting ipfsHash to ipfsHash[0].hash 
      this.setState({ ipfsHash: ipfsHash[0].hash });
    })

  };


  onClick = async (event) => {
    //
    if (this.state.ipfsHash == null) {
      alert('Error!! ,Please upload file first.');
    }
    else {
      var url = "https://ipfs.io/ipfs/";
      //var url = "https://gateway.ipfs.io/ipfs/";
      var hash = this.state.ipfsHash;
      window.open(url + hash);
    }
  };



  // ABOVE ADDED 

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (

      <div className="App">

        <h2>Upload a file to IPFS</h2>
        <form id="ipfs-hash-form" className="scep-form" onSubmit={this.onIPFSSubmit}>
          <input
            type="file"
            onChange={this.captureFile}
          />
          <button
            type="submit">
            Upload
              </button>
        </form>

        <p> The IPFS hash is: {this.state.ipfsHash}</p>
        <form>
          <p>Go to File</p><input type="button" value="Click" onClick={this.onClick} />
        </form>


        {/* <h2> 2. Send notifications here </h2>
            <form id="new-notification-form" className="scep-form" onSubmit={this.handleSend}>
              <label>
                Receiver Address:
                <input type="text" value={this.state.value} onChange={this.handleChangeAddress} />
              </label>
              <label>
                IPFS Address:
                <input type="text" value={this.state.value} onChange={this.handleChangeIPFS} />
              </label>
              <input type="submit" value="Submit" />
            </form>
          <h2> 3. Receive Notifications </h2>
            <button onClick={this.handleReceiveIPFS}>Receive IPFS</button>
            <p>{this.state.receivedIPFS}</p> */}
      </div>
    );
  }
}

export default Upload;