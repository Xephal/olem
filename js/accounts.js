$(document).ready(function () {
  const userId = localStorage.getItem('userId');

  // Load and display user accounts
  function loadAccounts() {
    $.ajax({
      url: `http://127.0.0.1:8000/bankAccounts`, // Fetch all accounts and filter by userId in the frontend
      type: 'GET',
      success: function (accounts) {
        // Filter accounts for the current user
        const userAccounts = accounts.filter(account => account.userId === userId);

        if (userAccounts.length === 0) {
          $('#accountList').html('<p>Aucun compte trouvé. Veuillez ajouter un compte.</p>');
          $('#totalBalance').text('0.00');
          return;
        }

        // Calculate total balance for the user's accounts
        let totalBalance = userAccounts.reduce((sum, account) => sum + account.balance, 0);
        $('#totalBalance').text(totalBalance.toFixed(2));

        // Display each account
        displayAccounts(userAccounts);
      },
      error: function () {
        showFlashcard("Erreur lors du chargement des comptes.", "error");
      }
    });
  }

  // Display information for each account
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

      // "View Transactions" button
      accountElement.find('.view-transactions').on('click', () => {
        window.location.href = `transactions.html?accountId=${account.id}`;
      });

      // "Delete Account" button with confirmation
      accountElement.find('.delete-account').on('click', function () {
        const accountId = $(this).data('account-id');
        confirmDeleteAccount(accountId);
      });

      // Form submission to update the low balance threshold
      accountElement.find('.update-threshold-form').on('submit', function (event) {
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

  // Update the low balance threshold for an account
  function updateLowBalanceThreshold(accountId, newLowBalanceThreshold) {
    $.ajax({
      url: `http://127.0.0.1:8000/bankAccounts/${accountId}`,
      type: 'PATCH', // Assuming FastAPI supports PATCH for updates
      data: JSON.stringify({ low_balance_threshold: newLowBalanceThreshold }),
      contentType: 'application/json',
      success: function () {
        showFlashcard("Seuil bas mis à jour avec succès!", "success");
        loadAccounts();
      },
      error: function () {
        showFlashcard("Erreur lors de la mise à jour du seuil bas.", "error");
      }
    });
  }

  // Confirm and delete an account
  function confirmDeleteAccount(accountId) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.")) {
      $.ajax({
        url: `http://127.0.0.1:8000/bankAccounts/${accountId}`,
        type: 'DELETE',
        success: function () {
          showFlashcard("Compte supprimé avec succès.", "success");
          loadAccounts();
        },
        error: function () {
          showFlashcard("Erreur lors de la suppression du compte.", "error");
        }
      });
    }
  }

  // Submit the form to add a new account
  $('#addAccountForm').on('submit', function (event) {
    event.preventDefault();
    const name = $('#accountName').val();
    const type = $('#accountType').val();

    $.ajax({
      url: 'http://127.0.0.1:8000/bankAccounts',
      type: 'POST',
      data: JSON.stringify({ id: generateUUID(), name, type, balance: 0, userId, lowBalanceThreshold: 0 }),
      contentType: 'application/json',
      success: function () {
        showFlashcard("Compte ajouté avec succès !", "success");
        loadAccounts();
      },
      error: function () {
        showFlashcard("Erreur lors de l'ajout du compte.", "error");
      }
    });
  });

  // Utility function to generate UUIDs
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Initialize: Load accounts
  loadAccounts();
});
