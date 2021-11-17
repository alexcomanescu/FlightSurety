import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let airlineFlights = {};

  let contract = new Contract(
    "localhost",
    () => {
      contract.initTestData().then((result) => {
        if (result) {
          console.log("test data initialized");
        } else {
          console.log("test data initialization skipped - already initialized");
        }
      });

      let insuranceFlightCmb = DOM.elid("insurance-flight");
      for (let i = 1; i <= 1; i++) {
        for (let j = 1; j <= 4; j++) {
          let flight = `Flight ${i} ${j}`,
            option = DOM.makeElement("option", flight);

          airlineFlights[flight] = contract.airlines[i];

          insuranceFlightCmb.options.add(option);
        }
      }

      insuranceFlightCmb.addEventListener("change", () => {
        let flightDateCmb = DOM.elid("insurance-flight-date");
        flightDateCmb.value =
          insuranceFlightCmb.value[insuranceFlightCmb.value.length - 1];
        DOM.elid("airline-info").textContent =
          "Airline: " + airlineFlights[insuranceFlightCmb.value];
      });

      DOM.elid("insurance-flight-oracles").innerHTML =
        insuranceFlightCmb.innerHTML;

      let insurancePassengerCmb = DOM.elid("insurance-passenger");
      for (let i = 1; i <= 5; i++) {
        let option = DOM.makeElement("option", {
          textContent: `Passenger ${i} (${contract.passengers[i - 1]})`,
          value: contract.passengers[i - 1],
        });
        insurancePassengerCmb.options.add(option);
      }

      DOM.elid("insurance-passenger-payment").innerHTML =
        insurancePassengerCmb.innerHTML;

      // Read transaction
      contract.isOperational((error, result) => {
        console.log(error, result);
        display("Operational Status", "Check if contract is operational", [
          { label: "Operational Status", error: error, value: result },
        ]);
      });

      // User-submitted transaction
      DOM.elid("submit-oracle").addEventListener("click", async () => {
        let flight = DOM.elid("insurance-flight-oracles").value;
        // Write transaction

        try {
          let receipt = await contract.fetchFlightStatus(flight);
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

      DOM.elid("check-pending-payments").addEventListener("click", async () => {
        let passengerAddress = DOM.elid("insurance-passenger-payment").value;
        try {
          let result = await contract.checkPassengerPendingPayments(
            passengerAddress
          );
          display("Pending payments", passengerAddress, [
            { label: "Value", value: result },
          ]);
        } catch (error) {
          console.log(error);
          display("Check pending payments error", "Error", [
            {
              label: "error",
              error: error,
            },
          ]);
        }
      });

      DOM.elid("check-passenger-balance").addEventListener(
        "click",
        async () => {
          let passengerAddress = DOM.elid("insurance-passenger-payment").value;
          try {
            let result = await contract.checkPassengerBalance(passengerAddress);
            display("Balance", passengerAddress, [
              { label: "Value", value: result },
            ]);
          } catch (error) {
            console.log(error);
            display("Check balance error", "Error", [
              {
                label: "error",
                error: error,
              },
            ]);
          }
        }
      );

      DOM.elid("pay-passenger").addEventListener("click", async () => {
        let passengerAddress = DOM.elid("insurance-passenger-payment").value;
        try {
          await contract
            .payPassenger(passengerAddress)
            .send({ from: passengerAddress });
        } catch (error) {
          console.log(error);
          display("Pay passenger error", "Error", [
            {
              label: "error",
              error: error,
            },
          ]);
        }
      });
    },
    displayEvent
  );
})();

function displayEvent(error, eventData, source) {
  if (error) {
    display("Event error", "Error", [
      {
        label: "Event error",
        error: error,
      },
    ]);
    return;
  }

  let eventInfo = "";

  switch (eventData.event) {
    case "FlightStatusInfo":
      eventInfo = `${eventData.returnValues.flight}: ${getStatusDescription(
        eventData.returnValues.status
      )}`;
      break;
    default:
      Object.keys(eventData.returnValues).forEach((key) => {
        let pattern = /(?<!\S)\d(?!\S)/i;
        if (!pattern.test(key)) {
          eventInfo += `${key}: ${eventData.returnValues[key]}, `;
        }
      });
  }

  display(source + " event: ", eventData.event, [
    { label: "Event data", value: eventInfo },
  ]);
}

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(
    DOM.span({ className: "mr-2 font-weight-bold text-primary" }, title)
  );
  section.appendChild(DOM.span(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-2 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-8 field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    section.appendChild(row);
  });
  displayDiv.append(section);
  section.scrollIntoView();
}

function getStatusDescription(statusCode) {
  switch (parseInt(statusCode)) {
    case 0:
      return "Unknown (0)";
    case 10:
      return "On time (10)";
    case 20:
      return "Late airline (20)";
    case 30:
      return "Late weather (30)";
    case 40:
      return "Late technical (40)";
    case 50:
      return "Late other (50)";
    default:
      return "Unknown code " + statusCode;
  }
}
