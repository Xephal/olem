$(document).ready(function () {
  // Function to load the graph showing account balance variations
  function loadGraph() {
    // Show the popover
    $('#popover4').show();

    // Destroy existing CanvasJS chart to avoid duplication
    if ($("#chartContainer").CanvasJSChart) {
      $("#chartContainer").CanvasJSChart().destroy();
    }

    // Get the accountId from the URL
    const accountId = new URLSearchParams(window.location.search).get('accountId');
    $.ajax({
      url: `http://127.0.0.1:8000/transactions?accountId=${accountId}`, // Updated to match FastAPI URL
      type: 'GET',
      success: function (transactions) {
        const dataPoints = calculateBalanceHistory(transactions);

        // Create the CanvasJS chart with transaction data
        const chart = new CanvasJS.Chart("chartContainer", {
          title: {
            text: "Historique des Variations de Solde"
          },
          axisX: {
            title: "Date",
            valueFormatString: "DD MMM YYYY"
          },
          axisY: {
            title: "Solde (€)",
            prefix: "€"
          },
          data: [{
            type: "line",
            dataPoints: dataPoints
          }]
        });

        // Render the chart
        chart.render();
      },
      error: function () {
        toastr.error("Erreur lors du chargement des transactions pour le graphique.");
      }
    });
  }

  // Function to calculate the balance history for the graph
  function calculateBalanceHistory(transactions) {
    let balance = 0;
    let dataPoints = [];

    // Add a starting point at 0 at the beginning of the graph
    const firstTransactionDate = transactions.length ? new Date(transactions[0].date) : new Date();
    dataPoints.push({ x: firstTransactionDate, y: 0 });

    // Sort transactions by ascending date
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Iterate through transactions and calculate balance variations
    transactions.forEach(transaction => {
      const amount = transaction.amount;
      const type = transaction.type;
      const date = new Date(transaction.date);

      // Update balance based on transaction type
      if (type === 'deposit' || type === 'transfer-in') {
        balance += amount; // Increase balance for deposit or incoming transfer
      } else if (type === 'withdrawal' || type === 'transfer-out') {
        balance -= amount; // Decrease balance for withdrawal or outgoing transfer
      }

      // Add the updated balance to the graph
      dataPoints.push({ x: date, y: balance });
    });

    return dataPoints;
  }

  // On click of the graph icon, load and display the graph in the popover
  $('#graphIcon').on('click', function () {
    loadGraph(); // Load the graph in the popover
  });

  // Close the popover when clicking outside of it
  $(document).on('click', function (e) {
    if (!$(e.target).closest('#popover4, #graphIcon').length) {
      $('#popover4').hide(); // Hide the popover if clicking elsewhere
    }
  });
});
