import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";

export default class Contract {
  constructor(network, callback) {
    let config = Config[network];
    this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );
    this.this.initialize(callback);
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

      callback();
    });
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  async fetchFlightStatus(flight) {
    let payload = {
      airline: this.airlines[0],
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000),
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

  async initTestData() {
    let airlineCount = await this.flightSuretyApp.getAirlineCount();

    if (airlineCount >= 5) {
      console.log("already initialized");
      return;
    }

    let airlineRegistrationFee = Web3.utils.toWei("1", "ether");

    for (let i = 1; i < airlines.length; i++) {
      await this.flightSuretyApp.registerAirline(
        "Airline " + (i + 1).toString(),
        airlines[i],
        { from: owner }
      );
      await this.flightSuretyApp.fundAirline(airlines[i], {
        from: airlines[i],
        value: airlineRegistrationFee,
      });
    }
  }
}
