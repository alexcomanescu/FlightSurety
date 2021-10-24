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
    this.initialize(callback);
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

  async buyInsurance(passenger, airline, flight, flightDate, value) {
    let response = await this.flightSuretyApp.methods
      .buyInsurance(flight, airline, flightDate)
      .send({ from: passenger, value: value });

    return response;
  }

  async initTestData() {
    let airlineCount = await this.flightSuretyApp.methods
      .getAirlineCount()
      .call();

    console.log("first airline", this.airlines[0]);
    let a = await this.flightSuretyApp.methods
      .getAirline(this.airlines[0])
      .call();

    console.log(a);

    if (airlineCount >= 4) {
      console.log("already initialized");
      return false;
    }

    console.log("register second airline");

    try {
      let firstAirline = this.airlines[0];

      let airlineRegistrationFee = Web3.utils.toWei("1", "ether");

      await this.flightSuretyApp.methods.fundAirline(firstAirline).send({
        from: firstAirline,
        value: airlineRegistrationFee,
      });

      for (let i = 1; i < this.airlines.length - 1; i++) {
        let airline = this.airlines[i],
          name = "Airline " + (i + 1).toString();

        await this.flightSuretyApp.methods
          .registerAirline(name, airline)
          .send({ from: firstAirline, gas: "2000000" });

        await this.flightSuretyApp.methods.fundAirline(airline).send({
          from: airline,
          value: airlineRegistrationFee,
        });

        for (let j = 1; j <= 5; j++) {
          let flight = `Flight ${i} ${j}`;
          await this.flightSuretyApp.methods.registerFlight(flight, airline, j);
        }
      }
    } catch (error) {
      console.log("Error initializing test data", error);
    }

    return true;
  }
}
