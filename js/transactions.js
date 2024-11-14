$(document).ready(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const accountId = urlParams.get("accountId");
  let allTransactions = [];
  let currentBalance = 0;
  let lowBalanceThreshold = 0;

  // Charger les détails du compte actuel et calculer le solde basé sur les transactions
  function loadAccountDetails() {
    $.ajax({
      url: `http://localhost:3000/bankAccounts/${accountId}`,
      type: "GET",
      success: function (account) {
        lowBalanceThreshold = account.lowBalanceThreshold || 0;

        // Charger les transactions pour calculer le solde total
        $.ajax({
          url: `http://localhost:3000/transactions?accountId=${accountId}`,
          type: "GET",
          success: function (transactions) {
            let calculatedBalance = 0;

            // Calculer le solde en fonction de toutes les transactions
            transactions.forEach((transaction) => {
              if (
                transaction.type === "deposit" ||
                transaction.type === "transfer-in"
              ) {
                calculatedBalance += transaction.amount;
              } else if (
                transaction.type === "withdrawal" ||
                transaction.type === "transfer-out"
              ) {
                calculatedBalance -= transaction.amount;
              }
            });

            currentBalance = calculatedBalance;
            $("#accountBalance").text(currentBalance.toFixed(2));

            if (currentBalance < lowBalanceThreshold) {
              showFlashcard(
                "Alerte : Le solde est en dessous du seuil défini !",
                "error"
              );
            }
          },
          error: function () {
            showFlashcard(
              "Erreur lors du chargement des transactions pour le calcul du solde.",
              "error"
            );
          },
        });
      },
      error: function () {
        showFlashcard(
          "Erreur lors du chargement des détails du compte.",
          "error"
        );
      },
    });
  }

  // Charger les comptes de l'utilisateur actuel pour les virements internes
  function loadUserAccounts() {
    $.ajax({
      url: `http://localhost:3000/bankAccounts?userId=${localStorage.getItem(
        "userId"
      )}`,
      type: "GET",
      success: function (accounts) {
        $("#transferAccountId").html(
          accounts
            .filter((acc) => acc.id !== parseInt(accountId))
            .map((acc) => `<option value="${acc.id}">${acc.name}</option>`)
            .join("")
        );
      },
      error: function () {
        showFlashcard(
          "Erreur lors du chargement des comptes de l'utilisateur.",
          "error"
        );
      },
    });
  }

  // Charger tous les utilisateurs pour le virement externe
  function loadUsers() {
    $.ajax({
      url: `http://localhost:3000/users`,
      type: "GET",
      success: function (users) {
        $("#transferEmail").html(
          users
            .map(
              (user) => `<option value="${user.email}">${user.email}</option>`
            )
            .join("")
        );
      },
      error: function () {
        showFlashcard("Erreur lors du chargement des utilisateurs.", "error");
      },
    });
  }

  // Affichage conditionnel pour les virements internes ou externes

  $("#transactionType").on("change", function () {
    if ($(this).val() === "transfer") {
      // Show the transfer type dropdown and set default to 'internal'
      $("#transferTypeGroup").show();
      $("#transferType").val("internal"); // Automatically set to internal transfer
      $("#transferEmailGroup").hide();
      $("#transferAccountGroup").show(); // Show internal transfer accounts

      loadUserAccounts(); // Load accounts for internal transfers
    } else {
      // Hide transfer-specific fields if not a transfer
      $(
        "#transferTypeGroup, #transferEmailGroup, #transferAccountGroup"
      ).hide();
    }
  });

  // Show/hide email or account selection based on transfer type
  $("#transferType").on("change", function () {
    if ($(this).val() === "internal") {
      $("#transferEmailGroup").hide();
      $("#transferAccountGroup").show();
      loadUserAccounts(); // Load internal accounts
    } else if ($(this).val() === "external") {
      $("#transferEmailGroup").show();
      $("#transferAccountGroup").hide();
      loadUsers(); // Load external user emails
    }
  });

  // Impossible de faire un virement ou un withdraw d'un montant supérieur au solde

  function validateTransactionAmount(amount, transactionType) {
    // For withdrawals and transfers, ensure the balance remains positive
    if (
      (transactionType === "withdrawal" || transactionType === "transfer") &&
      amount > currentBalance
    ) {
      showFlashcard(
        "Erreur : Le montant de la transaction dépasse le solde actuel.",
        "error"
      );
      return false; // Invalid transaction
    }
    return true; // Valid transaction
  }

  // Charger le compte courant du destinataire pour un virement externe
  $("#transferEmail").on("change", function () {
    const selectedEmail = $(this).val();
    if (selectedEmail) {
      $.ajax({
        url: `http://localhost:3000/users?email=${selectedEmail}`,
        type: "GET",
        success: function (users) {
          const userId = users[0]?.id;
          if (userId) {
            findRecipientCurrentAccount(userId);
          }
        },
        error: function () {
          showFlashcard(
            "Erreur lors du chargement des comptes du destinataire.",
            "error"
          );
        },
      });
    }
  });

  // Trouver automatiquement le premier compte courant du destinataire
  function findRecipientCurrentAccount(userId) {
    $.ajax({
      url: `http://localhost:3000/bankAccounts?userId=${userId}&type=Courant`,
      type: "GET",
      success: function (accounts) {
        if (accounts.length === 0) {
          showFlashcard(
            "Erreur : L'utilisateur sélectionné ne possède pas de compte courant pour recevoir le virement.",
            "error"
          );
          $("#transferAccountId").html("");
        } else {
          const primaryCurrentAccount = accounts[0];
          $("#transferAccountId").html(
            `<option value="${primaryCurrentAccount.id}" selected>${primaryCurrentAccount.name}</option>`
          );
        }
      },
      error: function () {
        showFlashcard(
          "Erreur lors du chargement des comptes courants externes.",
          "error"
        );
      },
    });
  }

  // Charger les détails du compte actuel
  function loadAccountDetails() {
    $.ajax({
      url: `http://localhost:3000/bankAccounts/${accountId}`,
      type: "GET",
      success: function (account) {
        currentBalance = account.balance;
        lowBalanceThreshold = account.lowBalanceThreshold || 0;
        $("#accountBalance").text(currentBalance.toFixed(2));

        if (currentBalance < lowBalanceThreshold) {
          showFlashcard(
            "Alerte : Le solde est en dessous du seuil défini !",
            "error"
          );
        }
      },
      error: function () {
        showFlashcard(
          "Erreur lors du chargement des détails du compte.",
          "error"
        );
      },
    });
  }

  // Charger et afficher les transactions
  function loadTransactions() {
    $.ajax({
      url: `http://localhost:3000/transactions?accountId=${accountId}`,
      type: "GET",
      success: function (transactions) {
        allTransactions = transactions;
        applyFilters({ type: "all", sort: "desc", period: "all" }); // Filtres par défaut
      },
      error: function () {
        showFlashcard("Impossible de charger les transactions.", "error");
      },
    });
  }

  // Application des filtres sur les transactions
  function applyFilters(filters) {
    let filteredTransactions = [...allTransactions];

    // Filtrage par type de transaction
    if (filters.type && filters.type !== "all") {
      filteredTransactions = filteredTransactions.filter((transaction) => {
        if (filters.type === "transfer") {
          return (
            transaction.type === "transfer-in" ||
            transaction.type === "transfer-out"
          );
        }
        return transaction.type === filters.type;
      });
    }

    // Filtrage par période
    if (filters.period && filters.period !== "all") {
      const today = new Date();
      const startDate = new Date(
        today.setDate(today.getDate() - filters.period)
      );
      filteredTransactions = filteredTransactions.filter(
        (transaction) => new Date(transaction.date) >= startDate
      );
    }

    // Tri des transactions par date
    const sortOrder = filters.sort || "desc";
    filteredTransactions.sort((a, b) =>
      sortOrder === "asc"
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date)
    );

    displayTransactions(filteredTransactions);
  }

  // Affichage des transaction
  function displayTransactions(transactions) {
    $("#transactionList").html("");
    const userEmail = localStorage.getItem("userEmail"); // Récupère l'email de l'utilisateur actuel

    if (transactions.length === 0) {
      $("#transactionList").append(
        "<p>Aucune transaction trouvée selon les filtres.</p>"
      );
    } else {
      transactions.forEach((transaction) => {
        // Définissez un nom par défaut en cas d'absence de `sourceAccountName` ou `sourceEmail`
        const sourceName = transaction.sourceAccountName || "Compte inconnu";
        const sourceEmail =
          transaction.sourceEmail || userEmail || "Email inconnu";

        const transferInfo =
          transaction.type === "transfer-out"
            ? transaction.targetEmail
              ? `<p>Virement vers : ${transaction.targetEmail}</p>` // Virement externe
              : `<p>Virement vers le compte: ${
                  transaction.targetAccountName || "Compte inconnu"
                }</p>` // Virement interne
            : transaction.type === "transfer-in"
            ? `<p>Virement depuis le compte: ${sourceName} (${sourceEmail})</p>` // Affiche `sourceEmail` ou `userEmail`
            : "";

        $("#transactionList").append(`
          <div class="transaction-item card mt-2">
            <div class="card-body">
              <p>Date: ${new Date(transaction.date).toLocaleString()}</p>
              <p>Type: ${transaction.type}</p>
              <p>Montant: $${transaction.amount.toFixed(2)}</p>
              ${transferInfo}
            </div>
          </div>
        `);
      });
    }
  }

  // Écouter les modifications de filtres
  $("#transactionFilters").on("change", "select, input", function () {
    const type = $("#filterType").val();
    const sort = $("#filterSort").val();
    const period = parseInt($("#filterPeriod").val());

    const filters = {
      type: type !== "all" ? type : "all",
      sort: sort !== "default" ? sort : "desc",
      period: !isNaN(period) ? period : "all",
    };

    applyFilters(filters);
  });

  // Gestion de la soumission du formulaire de transaction

  $("#addTransactionForm").on("submit", function (event) {
    event.preventDefault();
    const type = $("#transactionType").val();
    const amount = parseFloat($("#transactionAmount").val());
    const date = new Date().toISOString();

    // Validate transaction amount before proceeding
    if (!validateTransactionAmount(amount, type)) {
      return; // Stop the transaction if validation fails
    }

    if (type === "transfer") {
      const transferType = $("#transferType").val();
      const transferAccountId = $("#transferAccountId").val();
      const transferEmail = $("#transferEmail").val();

      if (transferType === "internal" && !transferAccountId) {
        showFlashcard(
          "Veuillez sélectionner un compte de destination interne.",
          "error"
        );
        return;
      }
      if (transferType === "external" && !transferEmail) {
        showFlashcard(
          "Veuillez sélectionner un destinataire externe.",
          "error"
        );
        return;
      }
      processTransferTransaction(
        amount,
        transferAccountId,
        transferEmail,
        date,
        transferType
      );
    } else {
      processRegularTransaction(type, amount, date);
    }
  });

  function processRegularTransaction(type, amount, date) {
    const newBalance =
      type === "deposit" ? currentBalance + amount : currentBalance - amount;

    $.ajax({
      url: `http://localhost:3000/transactions`,
      type: "POST",
      data: JSON.stringify({ accountId, date, type, amount }),
      contentType: "application/json",
      success: function () {
        updateAccountBalance(newBalance);
      },
      error: function () {
        showFlashcard("Impossible d'ajouter la transaction.", "error");
      },
    });
  }

  function processTransferTransaction(
    amount,
    transferAccountId,
    transferEmail,
    date,
    transferType
  ) {
    if (transferAccountId === accountId) {
      showFlashcard(
        "Erreur : Vous ne pouvez pas faire un virement vers le même compte.",
        "error"
      );
      return;
    }

    const newBalance = currentBalance - amount;

    $.ajax({
      url: `http://localhost:3000/transactions`,
      type: "POST",
      data: JSON.stringify({
        accountId,
        date,
        type: "transfer-out",
        amount: -amount,
        targetAccountId: transferAccountId,
        targetEmail: transferEmail,
      }),
      contentType: "application/json",
      success: function () {
        updateAccountBalance(newBalance);

        if (transferType === "internal") {
          $.ajax({
            url: `http://localhost:3000/transactions`,
            type: "POST",
            data: JSON.stringify({
              accountId: transferAccountId,
              date,
              type: "transfer-in",
              amount,
              sourceAccountId: accountId,
            }),
            contentType: "application/json",
            success: function () {
              updateTransferAccountBalance(transferAccountId, amount);
            },
          });
        } else {
          findRecipientCurrentAccountForTransfer(
            amount,
            accountId,
            date,
            newBalance
          );
        }
      },
    });
  }

  function findRecipientCurrentAccountForTransfer(
    amount,
    sourceAccountId,
    date,
    newBalance
  ) {
    const selectedEmail = $("#transferEmail").val();
    $.ajax({
      url: `http://localhost:3000/users?email=${selectedEmail}`,
      type: "GET",
      success: function (users) {
        const userId = users[0]?.id;
        if (userId) {
          $.ajax({
            url: `http://localhost:3000/bankAccounts?userId=${userId}&type=Courant`,
            type: "GET",
            success: function (accounts) {
              if (accounts.length === 0) {
                showFlashcard(
                  "Erreur : Le destinataire ne possède pas de compte courant.",
                  "error"
                );
                return;
              }
              const destinationAccountId = accounts[0].id;
              $.ajax({
                url: `http://localhost:3000/transactions`,
                type: "POST",
                data: JSON.stringify({
                  accountId: destinationAccountId,
                  date,
                  type: "transfer-in",
                  amount,
                  sourceAccountId,
                }),
                contentType: "application/json",
                success: function () {
                  updateAccountBalance(newBalance);
                  updateTransferAccountBalance(destinationAccountId, amount);
                },
              });
            },
            error: function () {
              showFlashcard(
                "Erreur lors de la recherche du compte courant du destinataire.",
                "error"
              );
            },
          });
        }
      },
    });
  }

  function updateAccountBalance(newBalance) {
    $.ajax({
      url: `http://localhost:3000/bankAccounts/${accountId}`,
      type: "PATCH",
      data: JSON.stringify({ balance: newBalance }),
      contentType: "application/json",
      success: function () {
        showFlashcard("Transaction ajoutée avec succès!", "success");
        loadTransactions();
        loadAccountDetails();
      },
    });
  }

  function updateTransferAccountBalance(transferAccountId, amount) {
    $.ajax({
      url: `http://localhost:3000/bankAccounts/${transferAccountId}`,
      type: "GET",
      success: function (account) {
        const newBalance = account.balance + amount;
        $.ajax({
          url: `http://localhost:3000/bankAccounts/${transferAccountId}`,
          type: "PATCH",
          data: JSON.stringify({ balance: newBalance }),
          contentType: "application/json",
          success: function () {
            showFlashcard("Virement complété avec succès!", "success");
          },
        });
      },
    });
  }

  function updateTransferAccountBalance(transferAccountId, amount) {
    $.ajax({
      url: `http://localhost:3000/bankAccounts/${transferAccountId}`,
      type: "GET",
      success: function (account) {
        const newBalance = account.balance + amount;
        $.ajax({
          url: `http://localhost:3000/bankAccounts/${transferAccountId}`,
          type: "PATCH",
          data: JSON.stringify({ balance: newBalance }),
          contentType: "application/json",
          success: function () {
            showFlashcard("Virement complété avec succès!", "success");
          },
        });
      },
    });
  }
  
  $(document).ready(function () {
    function syncRightColumnHeight() {
      const leftColumnHeight = $('.left-column').outerHeight();
      $('.right-column').css('max-height', leftColumnHeight);
    }
  
    // Appeler la fonction au chargement de la page et lors des modifications de contenu
    syncRightColumnHeight();
  
    // Ajuster la hauteur lorsque la fenêtre est redimensionnée
    $(window).resize(syncRightColumnHeight);
  
    // Ajuster également en fonction de l’interaction utilisateur
    $('#transactionType, #transferType').on('change', syncRightColumnHeight);
  });
  

  $(document).ready(function () {
    const $leftColumn = $('.left-column');
    const $easterEggText = $('<p class="easter-egg">Merci d’avoir trouvé cet Easter egg ! 😊</p>');
    $leftColumn.append($easterEggText);
  
    $('#transactionType').on('change', function () {
      if ($(this).val() === 'transfer') {
        $('#transferTypeGroup').show();
        $('#transferType').val('internal'); // Par défaut sur "virement interne"
        $('#transferEmailGroup').hide();
        $('#transferAccountGroup').show();
        loadUserAccounts();
        $easterEggText.hide(); // Cache l'Easter egg
      } else {
        $('#transferTypeGroup, #transferEmailGroup, #transferAccountGroup').hide();
        $easterEggText.show(); // Affiche l'Easter egg dans l’espace vide
      }
    });
  
    // Afficher/masquer les groupes en fonction du type de transfert
    $('#transferType').on('change', function () {
      const transferType = $(this).val();
      if (transferType === 'internal') {
        $('#transferEmailGroup').hide();
        $('#transferAccountGroup').show();
        loadUserAccounts();
        $easterEggText.hide();
      } else if (transferType === 'external') {
        $('#transferEmailGroup').show();
        $('#transferAccountGroup').hide();
        loadUsers();
        $easterEggText.hide();
      }
    });
  });
  
  // Télécharger le CSV
  function downloadCSV(transactions) {
    const csvRows = [];
    const headers = ['Date', 'Type', 'Montant', 'Description'];
    csvRows.push(headers.join(','));
  
    transactions.forEach(transaction => {
      const row = [
        new Date(transaction.date).toLocaleString(),
        transaction.type,
        transaction.amount.toFixed(2),
      ];
      csvRows.push(row.join(','));
    });
  
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Attacher la fonction au bouton CSV
  $('#downloadCsvButton').on('click', function() {
    $.ajax({
      url: `http://localhost:3000/transactions?accountId=${accountId}`, // Assurez-vous que `accountId` est défini
      type: 'GET',
      success: function(transactions) {
        downloadCSV(transactions); // Appel de la fonction pour télécharger les transactions sous forme de CSV
      },
      error: function() {
        showFlashcard("Erreur lors du chargement des transactions pour le téléchargement.", 'error');
      }
    });
  });
  
  

  // Init
  loadAccountDetails();
  loadTransactions();
});
