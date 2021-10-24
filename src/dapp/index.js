import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let airlineFlights = {};

  let contract = new Contract("localhost", () => {
    contract.initTestData().then((result) => {
      if (result) {
        console.log("test data initialized");
      } else {
        console.log("test data initialization skipped - already initialized");
      }
    });

    let insuranceFlightCmb = DOM.elid("insurance-flight");
    for (let i = 1; i <= 4; i++) {
      for (let j = 1; j <= 5; j++) {
        let flight = `Flight ${i} ${j}`,
          option = DOM.makeElement("option", flight);

        airlineFlights[flight] = contract.airlines[i - 1];

        insuranceFlightCmb.options.add(option);
      }
    }

    let insurancePassengerCmb = DOM.elid("insurance-passenger");
    for (let i = 1; i <= 5; i++) {
      let option = DOM.makeElement("option", {
        textContent: `Passenger ${i} (${contract.passengers[i - 1]})`,
        value: contract.passengers[i - 1],
      });
      insurancePassengerCmb.options.add(option);
    }

    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error, result);
      display("Operational Status", "Check if contract is operational", [
        { label: "Operational Status", error: error, value: result },
      ]);
    });

    // User-submitted transaction
    DOM.elid("submit-oracle").addEventListener("click", async () => {
      let flight = DOM.elid("flight-number").value;
      // Write transaction

      try {
        let receipt = await contract.fetchFlightStatusA(flight);
        let result = receipt.events["OracleRequest"].returnValues;
        display("Oracles", "Trigger oracles", [
          {
            label: "Fetch Flight Status",
            value: result.flight + " " + result.timestamp,
          },
        ]);
      } catch (error) {
        display("Oracles", "Trigger oracles", [
          {
            label: "Fetch Flight Status Error",
            error: error,
          },
        ]);
      }
    });

    DOM.elid("buy-insurance").addEventListener("click", async () => {
      let passenger = DOM.elid("insurance-passenger").value;
      let flight = DOM.elid("insurance-flight").value;
      let flightDate = DOM.elid("insurance-flight-date").value;
      let insuranceValue = DOM.elid("insurance-value").value;
      let airline = airlineFlights[flight];

      try {
        let result = contract.buyInsurance(
          passenger,
          airline,
          flight,
          flightDate,
          insuranceValue
        );

        console.log("buy insurance", result);
      } catch (error) {
        display("Purchase insurance", "Purchase", [
          {
            label: "Insurance purchase error",
            error: error,
          },
        ]);
      }
    });
  });
})();

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-8 field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    section.appendChild(row);
  });
  displayDiv.append(section);
}

async function initializeTestData(contract) {}
