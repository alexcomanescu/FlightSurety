import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import FlightSuretyData from "../../build/contracts/FlightSuretyData.json";
import Config from "./config.json";
import Web3 from "web3";

const EXPENSIVE_CALL_GAS = "2000000";
const AIRLINE_REGISTRATION_FEE = Web3.utils.toWei("1", "ether");

export default class Contract {
  constructor(network, callback, showEventCallback) {
    let config = Config[network];
    this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );

    this.flightSuretyData = new this.web3.eth.Contract(
      FlightSuretyData.abi,
      config.dataAddress
    );
    this.initialize(callback);
    this.showEventCallback = showEventCallback;
    this.owner = null;
    this.airlines = [];
    this.passengers = [];
  }

  initialize(callback) {
    this.web3.eth.getAccounts((error, accts) => {
      this.owner = accts[0];

      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }

      this.flightSuretyData.events.allEvents(null, (error, eventData) =>
        this.seeEvents(error, eventData, "Data contract")
      );
      this.flightSuretyApp.events.allEvents(null, (error, eventData) =>
        this.seeEvents(error, eventData, "App contract")
      );

      callback();
    });
  }

  seeEvents(error, eventLog, source) {
    console.log(
      "Data event",
      eventLog ? eventLog.event : "no event log!",
      eventLog
    );
    if (error) {
      console.log(error);
    }
    if (this.showEventCallback) {
      this.showEventCallback(error, eventLog, source);
    }
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  async fetchFlightStatus(flight) {
    let payload = {
      airline: this.airlines[1],
      flight: flight,
      timestamp: 1, // Math.floor(Date.now() / 1000),
    };
    let response = await this.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: this.owner });
    return response;
  }

  async registerAirline(name, address) {
    let response = await this.flightSuretyApp.methods
      .registerAirline(name, address)
      .call({ from: self.owner });

    return response;
  }

  async buyInsurance(passenger, airline, flight, flightDate, value) {
    let weiValue = Web3.utils.toWei(value.toString(), "ether");

    let response = await this.flightSuretyApp.methods
      .buyInsurance(flight, airline, parseInt(flightDate))
      .send({ from: passenger, value: weiValue, gas: EXPENSIVE_CALL_GAS });

    return response;
  }

  async checkPassengerBalance(passenger) {
    let value = await this.web3.eth.getBalance(passenger);
    return Web3.utils.fromWei(value, "ether") + " ETH";
  }

  async checkPassengerPendingPayments(passenger) {
    let value = await this.flightSuretyApp.methods
      .getPassengerPendingPayments(passenger)
      .call({ from: passenger });
    return Web3.utils.fromWei(value, "ether") + " ETH";
  }

  async payPassenger(passenger) {
    await this.flightSuretyApp.methods.payPassenger().send({ from: passenger });
  }

  async initTestData() {
    console.log("start init test data");

    let airlineCount = await this.flightSuretyApp.methods
      .getAirlineCount()
      .call();

    console.log("first airline", this.airlines[0]);
    let a = await this.flightSuretyApp.methods
      .getAirline(this.airlines[0])
      .call();

    console.log(a);

    if (airlineCount >= 2) {
      console.log("already initialized");
      return false;
    }

    try {
      let firstAirline = this.airlines[0];

      await this.flightSuretyApp.methods.fundAirline(firstAirline).send({
        from: firstAirline,
        value: AIRLINE_REGISTRATION_FEE,
      });

      for (let i = 1; i < this.airlines.length - 1; i++) {
        let airline = this.airlines[i],
          name = "Airline " + (i + 1).toString();

        await this.flightSuretyApp.methods
          .registerAirline(name, airline)
          .send({ from: firstAirline, gas: EXPENSIVE_CALL_GAS });

        await this.flightSuretyApp.methods.fundAirline(airline).send({
          from: airline,
          value: AIRLINE_REGISTRATION_FEE,
        });

        for (let j = 1; j <= 1; j++) {
          let flight = `Flight ${i} ${j}`;
          await this.flightSuretyApp.methods
            .registerFlight(flight, airline, j)
            .send({
              from: airline,
              gas: EXPENSIVE_CALL_GAS,
            });
        }
      }
    } catch (error) {
      console.log("Error initializing test data", error);
    }

    return true;
  }
}
