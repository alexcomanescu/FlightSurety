const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require("fs");

module.exports = async function (deployer, network, accounts) {
  let owner = accounts[0],
    firstAirline = accounts[1];

  await deployer.deploy(FlightSuretyData);
  await deployer.deploy(FlightSuretyApp, FlightSuretyData.address);

  let dataContract = await FlightSuretyData.deployed();
  await dataContract.addAppAuthorization(FlightSuretyApp.address, {
    from: owner,
  });

  let app = await FlightSuretyApp.deployed();

  await app.registerAirline("Airline 1", firstAirline, {
    from: owner,
  });

  let config = {
    localhost: {
      url: "http://localhost:8545",
      dataAddress: FlightSuretyData.address,
      appAddress: FlightSuretyApp.address,
    },
  };
  fs.writeFileSync(
    __dirname + "/../src/dapp/config.json",
    JSON.stringify(config, null, "\t"),
    "utf-8"
  );
  fs.writeFileSync(
    __dirname + "/../src/server/config.json",
    JSON.stringify(config, null, "\t"),
    "utf-8"
  );

  /*
  deployer.deploy(FlightSuretyData).then(() => {
    return deployer
      .deploy(FlightSuretyApp, FlightSuretyData.address)
      .then((aa) => {
        console.log("aa", aa);
      })
      .then(() => {
        let config = {
          localhost: {
            url: "http://localhost:8545",
            dataAddress: FlightSuretyData.address,
            appAddress: FlightSuretyApp.address,
          },
        };
        fs.writeFileSync(
          __dirname + "/../src/dapp/config.json",
          JSON.stringify(config, null, "\t"),
          "utf-8"
        );
        fs.writeFileSync(
          __dirname + "/../src/server/config.json",
          JSON.stringify(config, null, "\t"),
          "utf-8"
        );
      });
  });

  */
};
