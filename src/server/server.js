// import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
// import Config from "./config.json";
// import Web3 from "web3";
// import express from "express";

const FlightSuretyApp = require("../../build/contracts/FlightSuretyApp.json");
const Config = require("./config.json");
const Web3 = require("web3");
const express = require("express");

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const STATUSES = [
  STATUS_CODE_UNKNOWN,
  STATUS_CODE_ON_TIME,
  STATUS_CODE_LATE_AIRLINE,
  STATUS_CODE_LATE_WEATHER,
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER,
];

const ORACLES_COUNT = 30;
const ORACLE_REGISTRATION_FEE = Web3.utils.toWei("1", "ether");
const EXPENSIVE_CALL_GAS = "2000000";

let config = Config["localhost"];
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(
  FlightSuretyApp.abi,
  config.appAddress
);

let oracles = [];

initOracles();

flightSuretyApp.events.OracleRequest(
  {
    fromBlock: 0,
  },
  function (error, event) {
    if (error) {
      console.log(error);
      return;
    }
    let params = event.returnValues,
      index = params.index,
      flight = params.flight,
      timestamp = params.timestamp,
      airline = params.airline;

    console.log("OracleRequest", index, flight, timestamp, airline);

    sendOracleResponse(index, flight, timestamp, airline)
      .then(() => {
        console.log("sendOracleResponse success");
      })
      .catch((err) => {
        console.log("sendOracleResponse error", err);
      });
  }
);

async function sendOracleResponse(index, flight, timestamp, airline) {
  for (let i = 0; i < oracles.length; i++) {
    let oracle = oracles[i],
      indexes = oracle.indexes;
    if (indexes[0] == index || indexes[1] == index || indexes[2] == index) {
      console.log("Matching oracle found: ", oracle.address);

      let statusIndex = Math.floor(Math.random() * (STATUSES.length - 1));

      let statusCode = 20; // STATUSES[statusIndex];
      //console.log(statusIndex, statusCode);

      try {
        let receipt = await flightSuretyApp.methods
          .submitOracleResponse(index, airline, flight, timestamp, statusCode)
          .send({ from: oracle.address, gas: EXPENSIVE_CALL_GAS });
        console.log("Submit response success", receipt);
      } catch (error) {
        console.log("Submit response error", error);
      }
    }
  }
}

async function initOracles() {
  try {
    let accounts = await web3.eth.getAccounts();
    console.log("accounts", accounts);

    for (let i = 0; i < ORACLES_COUNT; i++) {
      try {
        await flightSuretyApp.methods.registerOracle().send({
          from: accounts[i],
          value: ORACLE_REGISTRATION_FEE,
          gas: EXPENSIVE_CALL_GAS,
        });
      } catch (error) {
        console.log("Error registering oracle", error);
      }

      let indexes = await flightSuretyApp.methods
        .getMyIndexes()
        .call({ from: accounts[i] });

      oracles.push({ address: accounts[i], indexes: indexes });
    }
    console.log(oracles);
  } catch (error) {
    console.log("Init oracles error", error);
  }
}

const app = express();
app.get("/api", (req, res) => {
  console.log("api request");
  res.send({
    message: "An API for use with your Dapp!",
  });
});

module.exports.app = app;
