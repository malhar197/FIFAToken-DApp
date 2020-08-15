import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import FifaToken from '../abis/FifaToken.json';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table } from 'react-bootstrap';
import TableScrollbar from 'react-table-scrollbar';
var unirest = require("unirest");

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadbBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying Metamask!')
    }
  }

  async loadbBlockchainData() {
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({account: accounts[0]})
    const networkId = await web3.eth.net.getId()
    const networkData = FifaToken.networks[networkId]
    
    if(networkData) {
    const abi = FifaToken.abi
    const address = networkData.address
    const myContract = new web3.eth.Contract(abi,address)
    this.setState({contract: myContract})
    const totalSupply = await myContract.methods.totalSupply().call()
    this.setState({totalSupply})
    for (var i = 1; i <= totalSupply; i++) {
      let player = await myContract.methods.players(i-1).call()
      this.setState({
        players: [...this.state.players, player]
      })
    }
    console.log(this.state.players)
    } else {
      window.alert('Smart Contract not deployed to network')
    }
  }

  changeKeyword = event => {
    this.setState({keyword: event.target.value})
  };

  mint = (newplayer) => {
    console.log(newplayer.name)
    console.log(newplayer.club)
    console.log(newplayer.position)
    console.log(newplayer.country)
    this.state.contract.methods.mint(newplayer).send({from: this.state.account})
    .once('receipt',(receipt) => {
      this.setState({
        keywordEntered: false,
        keyword:'',
        response: null,
        selectedPlayer: 10000,
        totalSupply: this.state.totalSupply + 1,
        players: [...this.state.players,newplayer],

      })
    })
  }

  lookUpPlayer = async () => {
  if(this.state.keywordEntered && this.state.keyword !== ''){
  var url = `https://api-football-v1.p.rapidapi.com/v2/players/search/${this.state.keyword}`;

  await unirest.get(url)
  .header({
    "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
    "x-rapidapi-key": "708bb2bafemshfc041c1a7915bc2p1aefb4jsn95c4af41a692",
    "useQueryString": true
  })
  .end(async (res) => {
    this.state.response = res.body;
    console.log(this.state.response);
    let rows = [];
    for(let i = 0; i < this.state.response.api.results; i++){
    rows.push(this.state.response.api.players[i].player_name + ', ' + this.state.response.api.players[i].position + ', ' + this.state.response.api.players[i].nationality);
  }
    this.setState({matches: rows});
    console.log(this.state.matches);
  });
  }
  else {
    console.log('No keyword entered yet or blank keyword entered');
  } 
  }

  constructor(props) {
    super(props)
    this.state = {
      name:'',
      position:'',
      club:'',
      country:'',
      account:'',
      contract: null,
      totalSupply: 0,
      players: [],
      matches: [],
      keywordEntered: false,
      keyword:'',
      response: null,
      selectedPlayer: 10000
    }
  }
  render() {
    
      return (
        <div>
          <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
            <a className="navbar-brand col-sm-3 col-md-2 mr-0">FifaToken</a>
            <ul className="navbar-nav px-3">
             <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
                <small className="text-white"><span id="account">{this.state.account}</span></small>
              </li>
            </ul>
          </nav>
          <div className="container-fluid mt-5">
          <div className="row">
          <main role="main" className="col-lg-12 d-flex text-center">
          <div className="content mr-auto ml-auto">
          <h1> Look Up Player </h1>
          <form onSubmit={(event) => {
            event.preventDefault()
            this.state.keywordEntered = true
            this.lookUpPlayer()
          }}>
          <input type = 'text'
                  className='form-control mb-2'
                  placeholder='Enter name (e.g. messi)'
                  onChange = {this.changeKeyword}
                  />
          <input type='submit' className='btn btn-block btn-primary' value='SEARCH'/>
          </form>
                <div className="row text-center">
            <form onSubmit={(event) => {
            event.preventDefault()
            this.state.keywordEntered = false
                  let player = {
                    name:this.state.response.api.players[this.state.selectedPlayer].player_name,
                    position:this.state.response.api.players[this.state.selectedPlayer].position,
                    club:'',
                    country:this.state.response.api.players[this.state.selectedPlayer].nationality}
            this.mint(player)
          }}>
          <br/>
          <br/>
          {/*
          <div className="row text-center">
           {
            this.state.matches.map((newplayer,key) => {
            return ( 
              <div className="col-md-3 mb-3"><input onClick={(event) => {
              	let integer = parseInt(event.target.value)
                this.state.selectedPlayer = integer
              }} type='submit' className='btn btn-block btn-secondary' value={key}/>{newplayer}</div>
            )
          })}
          </div>
        */}
        <div id ="searching">
        <TableScrollbar rows={5}>
        <Table id="stable" hover variant="dark" responsive>
        <tr>
        <th> # </th>
        <th> Player Info </th>
        </tr>
        <tbody>
        {
            this.state.matches.map((newplayer,key) => {
            return ( 
              <tr className="roundedRows">
              <td className="roundedRows"><input onClick={(event) => {
                let integer = parseInt(event.target.value)
                this.state.selectedPlayer = integer
              }} type='submit' className='btn btn-block btn-secondary' value={key}/></td>
              <td className="roundedRows">{newplayer}</td>
              </tr>
            )
          })}
        </tbody>
        </Table>
        </TableScrollbar>
        </div>
          </form>
          </div>
          </div>
          <div>
          <h1>Minted tokens</h1>
          <div className="row text-center" id="minted">
          <TableScrollbar>
          <Table id = "mtable" hover variant="dark" responsive>
        <tr>
        <th> Name </th>
        <th> Position </th>
        <th> Country </th>
        </tr>
        <tbody>
          {this.state.players.map((mintedplayer,key) => {
            return(
              <tr key = {key}>
              <td>
               {mintedplayer.name}
              </td>
              <td>
              {mintedplayer.position}
              </td> 
              <td>
              {mintedplayer.country}
              </td>
              </tr>)
          })}
          </tbody>
          </Table>
          </TableScrollbar>
          </div>
          </div>
          </main>
          </div>
          </div>
        </div>
        );

  }
}

export default App;
