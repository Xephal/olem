$(document).ready(function () {

  // Fonction pour charger le graphique avec les variations du solde du compte
  function loadGraph() {
    // Affiche le popover
    $('#popover4').show();

    // Si le graphique CanvasJS existe déjà, on le détruit pour éviter un doublon
    if ($("#chartContainer").CanvasJSChart) {
      $("#chartContainer").CanvasJSChart().destroy();
    }

    // Récupérer les transactions et calculer les variations
    const accountId = new URLSearchParams(window.location.search).get('accountId');
    $.ajax({
      url: `http://localhost:3000/transactions?accountId=${accountId}`, // Correction de l'URL
      type: 'GET',
      success: function (transactions) {
        const dataPoints = calculateBalanceHistory(transactions);

        // Création du graphique CanvasJS avec les données des transactions
        var chart = new CanvasJS.Chart("chartContainer", {
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

        // Rendre le graphique
        chart.render();
      },
      error: function () {
        toastr.error("Erreur lors du chargement des transactions pour le graphique.");
      }
    });
  }

  // Fonction pour calculer l'historique des variations de solde
  function calculateBalanceHistory(transactions) {
    let balance = 0;
    let dataPoints = [];

    // Ajout d'un point de départ à 0 au début du graphique
    const firstTransactionDate = transactions.length ? new Date(transactions[0].date) : new Date();
    dataPoints.push({ x: firstTransactionDate, y: 0 });

    // Tri des transactions par date croissante
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Parcours des transactions et calcul des variations
    transactions.forEach(transaction => {
      const amount = transaction.amount;
      const type = transaction.type;
      const date = new Date(transaction.date);

      // Mise à jour du solde en fonction du type de transaction
      if (type === 'deposit') {
        balance += amount; // Augmenter le solde pour un dépôt
      } else if (type === 'withdrawal') {
        balance -= amount; // Diminuer le solde pour un retrait
      }

      // Ajouter le solde au graphique après chaque transaction
      dataPoints.push({ x: date, y: balance });
    });

    return dataPoints;
  }

  // Au clic sur l'icône du graphique, charge et affiche le graphique dans le popover
  $('#graphIcon').on('click', function () {
    loadGraph(); // Charge le graphique dans le popover
  });

  // Fermer le popover lorsqu'on clique en dehors de celui-ci
  $(document).on('click', function (e) {
    if (!$(e.target).closest('#popover4, #graphIcon').length) {
      $('#popover4').hide();  // Cache le popover si on clique ailleurs
    }
  });
});
