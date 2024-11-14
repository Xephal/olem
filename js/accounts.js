$(document).ready(function() {
  const userId = localStorage.getItem('userId');

  // Charger et afficher les comptes de l'utilisateur
  function loadAccounts() {
    $.ajax({
      url: `http://localhost:3000/bankAccounts?userId=${userId}`,
      type: 'GET',
      success: function(accounts) {
        if (accounts.length === 0) {
          $('#accountList').html('<p>Aucun compte trouvé. Veuillez ajouter un compte.</p>');
          $('#totalBalance').text('0.00');
          return;
        }

        // Calculer le solde total de tous les comptes
        let totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
        $('#totalBalance').text(totalBalance.toFixed(2));

        // Afficher chaque compte dans la liste
        displayAccounts(accounts);
      },
      error: function() {
        showFlashcard("Erreur lors du chargement des comptes.", "error");
      }
    });
  }

  // Afficher les informations de chaque compte
  function displayAccounts(accounts) {
    $('#accountList').html('');
    accounts.forEach(account => {
      const accountElement = $(`
        <div class="account-item mt-3 card">
          <div class="card-body">
            <h5>${account.name} - $${account.balance.toFixed(2)}</h5>
            <p>Seuil bas actuel : $${account.lowBalanceThreshold.toFixed(2)}</p>
            <form class="update-threshold-form mt-2" data-account-id="${account.id}">
              <div class="form-group">
                <label for="newLowBalanceThreshold-${account.id}">Nouveau seuil bas</label>
                <input type="number" class="form-control" id="newLowBalanceThreshold-${account.id}" value="${account.lowBalanceThreshold}" step="0.01" min="0">
              </div>
              <button type="submit" class="btn btn-sm btn-primary">Mettre à jour le seuil bas</button>
            </form>
            <button class="btn btn-secondary mt-2 view-transactions">Voir les Transactions</button>
            <button class="btn btn-danger mt-2 delete-account" data-account-id="${account.id}">Supprimer le Compte</button>
          </div>
        </div>
      `);

      // Bouton "Voir les Transactions"
      accountElement.find('.view-transactions').on('click', () => {
        window.location.href = `transactions.html?accountId=${account.id}`;
      });

      // Bouton "Supprimer le Compte" avec confirmation
      accountElement.find('.delete-account').on('click', function() {
        const accountId = $(this).data('account-id');
        confirmDeleteAccount(accountId);
      });

      // Soumission du formulaire de mise à jour du seuil bas
      accountElement.find('.update-threshold-form').on('submit', function(event) {
        event.preventDefault();
        const accountId = $(this).data('account-id');
        const newLowBalanceThreshold = parseFloat($(this).find(`#newLowBalanceThreshold-${accountId}`).val());

        if (isNaN(newLowBalanceThreshold) || newLowBalanceThreshold < 0) {
          showFlashcard("Veuillez entrer un seuil bas valide.", "error");
          return;
        }

        updateLowBalanceThreshold(accountId, newLowBalanceThreshold);
      });

      $('#accountList').append(accountElement);
    });
  }

  // Mettre à jour le seuil bas d'un compte
  function updateLowBalanceThreshold(accountId, newLowBalanceThreshold) {
    $.ajax({
      url: `http://localhost:3000/bankAccounts/${accountId}`,
      type: 'PATCH',
      data: JSON.stringify({ lowBalanceThreshold: newLowBalanceThreshold }),
      contentType: 'application/json',
      success: function() {
        showFlashcard("Seuil bas mis à jour avec succès!", "success");
        loadAccounts();
      },
      error: function() {
        showFlashcard("Erreur lors de la mise à jour du seuil bas.", "error");
      }
    });
  }

  // Fonction de confirmation de suppression de compte
  function confirmDeleteAccount(accountId) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.")) {
      $.ajax({
        url: `http://localhost:3000/bankAccounts/${accountId}`,
        type: 'DELETE',
        success: function() {
          showFlashcard("Compte supprimé avec succès.", "success");
          loadAccounts();
        },
        error: function() {
          showFlashcard("Erreur lors de la suppression du compte.", "error");
        }
      });
    }
  }

  // Soumission du formulaire pour ajouter un nouveau compte
  $('#addAccountForm').on('submit', function(event) {
    event.preventDefault();
    const name = $('#accountName').val();
    const type = $('#accountType').val();

    $.ajax({
      url: 'http://localhost:3000/bankAccounts',
      type: 'POST',
      data: JSON.stringify({ name, type, balance: 0, userId, lowBalanceThreshold: 0 }),
      contentType: 'application/json',
      success: function() {
        showFlashcard("Compte ajouté avec succès !", "success");
        loadAccounts();
      },
      error: function() {
        showFlashcard("Erreur lors de l'ajout du compte.", "error");
      }
    });
  });

  // Initialisation : Charger les comptes
  loadAccounts();
});
