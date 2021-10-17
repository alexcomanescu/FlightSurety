var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");
const assert = require("assert");
//const { default: Web3 } = require("web3");
const Web3 = require("web3");
const Eth = require("web3-eth");

let airlineFunds = Web3.utils.toWei("1", "ether"),
  insurancePrice = Web3.utils.toWei("1", "ether");

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
    await config.flightSuretyApp.registerAirline(
      "Airline 1",
      config.firstAirline,
      { from: config.owner }
    );
    let airline = await config.flightSuretyApp.getAirline(config.firstAirline);
    assert.equal(
      airline._airlineAddress,
      config.firstAirline,
      "Airline not recorded"
    );
    assert.equal(airline._isRegistered, true, "Airline not registered");
  });

  it("(airline) fund the first airline", async function () {
    await config.flightSuretyApp.fundAirline(config.firstAirline, {
      from: config.owner,
      value: airlineFunds,
    });

    let airline = await config.flightSuretyApp.getAirline(config.firstAirline);

    assert.equal(
      airline._airlineAddress,
      config.firstAirline,
      "Airline not recorded"
    );

    assert.equal(airline._isActive, true, "Airline not active after funding");
  });

  it("(airline) register next airline by the first airline", async function () {
    let nextAirline = accounts[2];

    let status = await config.flightSuretyApp.registerAirline(
      "Airline 2",
      nextAirline,
      { from: config.firstAirline }
    );
    let airline = await config.flightSuretyApp.getAirline(nextAirline);
    assert.equal(airline._airlineAddress, nextAirline, "Airline not recorded");
  });

  it("register the next 3 airlines", async function () {
    for (let i = 3; i <= 5; i++) {
      await config.flightSuretyApp.registerAirline(
        "Airline " + i.toString(),
        accounts[i],
        { from: config.firstAirline }
      );
    }

    let airlineCount = await config.flightSuretyData.airlineCount();
    assert.equal(airlineCount, 5, "There are not 5 rlines");
  });

  it("fund all first 4 airlines to become active", async function () {
    for (let i = 1; i <= 4; i++) {
      await config.flightSuretyApp.fundAirline(accounts[i], {
        from: config.owner,
        value: airlineFunds,
      });
      let status = await config.flightSuretyData.getAirlineIsActive(
        accounts[i]
      );

      assert.equal(status, true, "Airline " + i.toString() + " is not active");
    }
  });

  it("vote for the 5th airline", async function () {
    for (let i = 1; i <= 4; i++) {
      console.log("vote airline", i);
      await config.flightSuretyApp.voteAirline(accounts[5], {
        from: accounts[i],
      });
      console.log("end voting airline", i);
    }

    let status = await config.flightSuretyData.getAirlineIsRegistered(
      accounts[5]
    );
    console.log(status);

    assert.equal(status, true, "5th airline is not registered after voting");
  });

  it("fund the 5th airline and make it active", async function () {
    await config.flightSuretyApp.fundAirline(accounts[5], {
      from: accounts[5],
      value: airlineFunds,
    });

    let status = await config.flightSuretyData.getAirlineIsActive(accounts[5]);

    assert.equal(status, true, "Airliine 5 not active");
  });

  it("register 5 flights for each of 5 airlines", async function () {
    for (let i = 1; i <= 5; i++) {
      for (let j = 1; j <= 5; j++) {
        await config.flightSuretyApp.registerFlight(
          `Flight ${i} ${j}`,
          accounts[i],
          j
        );
        let status = await config.flightSuretyData.getFlightStatus(
          `Flight ${i} ${j}`,
          accounts[i],
          j
        );
        assert.equal(
          status,
          0,
          "Flight status must be 0 after just registering"
        );
      }
    }
  });

  it("buy insurance", async function () {
    await config.flightSuretyApp.buyInsurance("Flight 1 1", accounts[1], 1, {
      from: accounts[6],
      value: insurancePrice,
    });

    let status = await config.flightSuretyData.checkPassengerInsurance(
      "Flight 1 1",
      accounts[1],
      1,
      accounts[6]
    );

    console.log("insurance status", status);
    assert.equal(
      status.value,
      insurancePrice,
      "Value is not the insurance price"
    );
    assert.equal(
      status.isCredited,
      false,
      "The insurance must be not credited"
    );
  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false, {
        from: accounts[2],
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
