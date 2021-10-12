var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");
const assert = require("assert");
//const { default: Web3 } = require("web3");
const Web3 = require("web3");
const Eth = require("web3-eth");

contract("Flight Surety Tests", async (accounts) => {
  var config;
  before("setup contract", async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.addAppAuthorization(
      config.flightSuretyApp.address,
      { from: config.owner }
    );
  });

  it("test", async function () {
    let status = await config.flightSuretyApp.test.call();
    //console.log("test status", status);
    assert.equal(
      status.caller1,
      config.flightSuretyApp.address,
      "status not ok"
    );
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {
    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it("(airline) register first airline by contract owner", async function () {
    let status = await config.flightSuretyApp.registerAirline(
      "Airline 1",
      config.firstAirline,
      { from: config.owner }
    );
    //console.log("status", status);
    let airline = await config.flightSuretyApp.getAirline(config.firstAirline);
    console.log(
      "first airline",
      airline._airlineAddress,
      "config first airline",
      config.firstAirline
    );
    assert.equal(
      airline._airlineAddress,
      config.firstAirline,
      "Airline not recorded"
    );
    assert.equal(airline._isRegistered, true, "Airline not registered");
  });

  it("(airline) fund the first airline", async function () {
    let airline = await config.flightSuretyData.getAirlineIsRegistered(
      config.firstAirline
    );
    console.log("first airline registered", airline);

    let funds = Web3.utils.toWei("11", "ether");

    let cnt = await config.flightSuretyData.airlinesCount();

    console.log("cnt", cnt);

    let status = await config.flightSuretyApp.fundAirline(config.firstAirline, {
      from: config.owner,
      value: funds,
    });
    console.log("fund status", status);
    airline = await config.flightSuretyApp.getAirline(config.firstAirline);
    console.log("funded airline", airline, "funds sent", funds);

    let xy = await web3.eth.getBalance(config.flightSuretyApp.address);
    console.log("app balance", xy);
    xy = await web3.eth.getBalance(config.flightSuretyData.address);
    console.log("data balance", xy);

    assert.equal(
      airline._airlineAddress,
      config.firstAirline,
      "Airline not recorded"
    );

    assert.equal(airline._isActive, true, "Airline not active after funding");
  });

  /*
  it("(airline) register next airline by the first airline", async function () {
    let nextAirline = config.testAddresses[2];

    let status = await config.flightSuretyApp.registerAirline(
      "Airline 2",
      nextAirline,
      { from: config.firstAirline }
    );
    //console.log("status", status);
    let airline = await config.flightSuretyApp.getAirline(nextAirline);
    assert.equal(airline._airlineAddress, nextAirline, "Airline not recorded");
  });


  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false, {
        from: config.testAddresses[2],
      });
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false);
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(
      accessDenied,
      false,
      "Access not restricted to Contract Owner"
    );
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
    await config.flightSuretyData.setOperatingStatus(false);

    let reverted = false;
    try {
      await config.flightSurety.setTestingMode(true);
    } catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);
  });

  /*
  it("(airline) cannot register an Airline using registerAirline() if it is not funded", async () => {
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline, {
        from: config.firstAirline,
      });
    } catch (e) {}
    let result = await config.flightSuretyData.isAirline.call(newAirline);

    // ASSERT
    assert.equal(
      result,
      false,
      "Airline should not be able to register another airline if it hasn't provided funding"
    );
  });

  */
});
