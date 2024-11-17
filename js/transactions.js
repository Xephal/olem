$(document).ready(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const accountId = urlParams.get("accountId");
  let allTransactions = [];
  let currentBalance = 0;
  let lowBalanceThreshold = 0;

  // Charger les détails du compte actuel et calculer le solde basé sur les transactions
  function loadAccountDetails() {
    $.ajax({
      url: `http://127.0.0.1:8000/bankAccounts/${accountId}`, // Updated to FastAPI endpoint
      type: "GET",
      success: function (account) {
        lowBalanceThreshold = account.low_balance_threshold || 0; // Match backend field names
        currentBalance = account.balance || 0; // Current balance from backend
        $("#accountBalance").text(currentBalance.toFixed(2));

        // Charger les transactions pour calculer le solde total
        $.ajax({
          url: `http://127.0.0.1:8000/transactions?account_id=${accountId}`, // FastAPI query param
          type: "GET",
          success: function (transactions) {
            let calculatedBalance = 0;

            // Calculer le solde en fonction de toutes les transactions
            transactions.forEach((transaction) => {
              if (transaction.type === "deposit" || transaction.type === "transfer-in") {
                calculatedBalance += transaction.amount;
              } else if (transaction.type === "withdrawal" || transaction.type === "transfer-out") {
                calculatedBalance -= transaction.amount;
              }
            });

            currentBalance = calculatedBalance;
            $("#accountBalance").text(currentBalance.toFixed(2));

            // Notification si le solde est sous le seuil
            const isDashboardPage = window.location.pathname.includes("dashboard.html");
            if (currentBalance < lowBalanceThreshold && !isDashboardPage) {
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
    const userId = localStorage.getItem("userId");
    $.ajax({
      url: `http://127.0.0.1:8000/bankAccounts?user_id=${userId}`, // FastAPI query parameter
      type: "GET",
      success: function (accounts) {
        $("#transferAccountId").html(
          accounts
            .filter((acc) => acc.id !== accountId) // Match account ID correctly
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
      url: `http://127.0.0.1:8000/users`, // FastAPI endpoint for fetching users
      type: "GET",
      success: function (users) {
        $("#transferEmail").html(
          users
            .map((user) => `<option value="${user.email}">${user.email}</option>`)
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
      $("#transferTypeGroup, #transferEmailGroup, #transferAccountGroup").hide();
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
        url: `http://127.0.0.1:8000/users?email=${encodeURIComponent(selectedEmail)}`, // Updated endpoint
        type: "GET",
        success: function (users) {
          const userId = users[0]?.id; // Extract user ID from response
          if (userId) {
            findRecipientCurrentAccount(userId); // Call the next function
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
      url: `http://127.0.0.1:8000/bankAccounts?user_id=${userId}&type=Courant`, // Updated parameters
      type: "GET",
      success: function (accounts) {
        if (accounts.length === 0) {
          showFlashcard(
            "Erreur : L'utilisateur sélectionné ne possède pas de compte courant pour recevoir le virement.",
            "error"
          );
          $("#transferAccountId").html("");
        } else {
          const primaryCurrentAccount = accounts[0]; // Select the first account
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
      url: `http://127.0.0.1:8000/bankAccounts/${accountId}`, // Updated endpoint
      type: "GET",
      success: function (account) {
        currentBalance = account.balance || 0; // Use 0 if balance is undefined
        lowBalanceThreshold = account.low_balance_threshold || 0; // Match FastAPI field
        $("#accountBalance").text(currentBalance.toFixed(2));

        // Optional: Notify if balance is below threshold
        // if (currentBalance < lowBalanceThreshold) {
        //   showFlashcard(
        //     "Alerte : Le solde est en dessous du seuil défini !",
        //     "error"
        //   );
        // }
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
      url: `http://127.0.0.1:8000/transactions?account_id=${accountId}`, // Updated endpoint and query parameter
      type: "GET",
      success: function (transactions) {
        allTransactions = transactions;
        applyFilters({ type: "all", sort: "desc", period: "all" }); // Default filters
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
              : `<p>Virement vers un autre compte interne</p>` // Virement interne
            : transaction.type === "transfer-in"
              ? `<p>Virement reçu depuis un autre compte</p>` // Affiche `sourceEmail` ou `userEmail` dans le futur
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

  //
  function processRegularTransaction(type, amount, date) {
    const newBalance = type === "deposit" ? currentBalance + amount : currentBalance - amount;

    $.ajax({
      url: `http://127.0.0.1:8000/transactions`, // Updated endpoint
      type: "POST",
      data: JSON.stringify({
        account_id: accountId, // Updated field name for FastAPI
        date,
        type,
        amount,
      }),
      contentType: "application/json",
      success: function () {
        updateAccountBalance(newBalance);

        // Show alert if balance drops below the threshold after a withdrawal
        if (type === "withdrawal" && newBalance < lowBalanceThreshold) {
          showFlashcard("Alerte : Le solde est en dessous du seuil défini !", "error");
        }
      },
      error: function () {
        showFlashcard("Impossible d'ajouter la transaction.", "error");
      },
    });
  }

  //
  function processTransferTransaction(amount, transferAccountId, transferEmail, date, transferType) {
    if (transferAccountId === accountId) {
      showFlashcard("Erreur : Vous ne pouvez pas faire un virement vers le même compte.", "error");
      return;
    }

    const newBalance = currentBalance - amount;

    $.ajax({
      url: `http://127.0.0.1:8000/transactions`, // Updated endpoint
      type: "POST",
      data: JSON.stringify({
        account_id: accountId, // Updated field name for FastAPI
        date,
        type: "transfer-out",
        amount: -amount,
        target_account_id: transferAccountId, // Updated for FastAPI
        target_email: transferEmail,
      }),
      contentType: "application/json",
      success: function () {
        updateAccountBalance(newBalance);

        // Show alert if balance drops below the threshold after an outgoing transfer
        if (newBalance < lowBalanceThreshold) {
          showFlashcard("Alerte : Le solde est en dessous du seuil défini !", "error");
        }

        // Handle internal transfer logic
        if (transferType === "internal") {
          $.ajax({
            url: `http://127.0.0.1:8000/transactions`, // Updated endpoint
            type: "POST",
            data: JSON.stringify({
              account_id: transferAccountId, // Destination account ID
              date,
              type: "transfer-in",
              amount,
              source_account_id: accountId, // Updated for FastAPI
            }),
            contentType: "application/json",
            success: function () {
              updateTransferAccountBalance(transferAccountId, amount);
            },
          });
        } else {
          // External transfer logic
          findRecipientCurrentAccountForTransfer(amount, accountId, date, newBalance);
        }
      },
      error: function () {
        showFlashcard("Impossible d'effectuer le virement.", "error");
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
      url: `http://127.0.0.1:8000/users?email=${encodeURIComponent(selectedEmail)}`, // Updated endpoint
      type: "GET",
      success: function (users) {
        const userId = users[0]?.id;
        if (userId) {
          $.ajax({
            url: `http://127.0.0.1:8000/bankAccounts?user_id=${userId}&type=Courant`, // Updated parameters
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
                url: `http://127.0.0.1:8000/transactions`, // Updated endpoint
                type: "POST",
                data: JSON.stringify({
                  account_id: destinationAccountId,
                  date,
                  type: "transfer-in",
                  amount,
                  source_account_id: sourceAccountId, // Updated parameter
                }),
                contentType: "application/json",
                success: function () {
                  updateAccountBalance(newBalance);
                  updateTransferAccountBalance(destinationAccountId, amount);
                },
                error: function () {
                  showFlashcard(
                    "Erreur lors de l'ajout de la transaction pour le destinataire.",
                    "error"
                  );
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
      error: function () {
        showFlashcard(
          "Erreur lors de la recherche des informations du destinataire.",
          "error"
        );
      },
    });
  }


  function updateAccountBalance(newBalance) {
    $.ajax({
      url: `http://127.0.0.1:8000/bankAccounts/${accountId}`, // Updated endpoint
      type: "PATCH",
      data: JSON.stringify({ balance: newBalance }),
      contentType: "application/json",
      success: function () {
        showFlashcard("Transaction ajoutée avec succès!", "success");
        loadTransactions();
        loadAccountDetails();
      },
      error: function () {
        showFlashcard(
          "Erreur lors de la mise à jour du solde du compte.",
          "error"
        );
      },
    });
  }


  function updateTransferAccountBalance(transferAccountId, amount) {
    $.ajax({
      url: `http://127.0.0.1:8000/bankAccounts/${transferAccountId}`, // Updated endpoint
      type: "GET",
      success: function (account) {
        const newBalance = account.balance + amount;
        $.ajax({
          url: `http://127.0.0.1:8000/bankAccounts/${transferAccountId}`, // Updated endpoint
          type: "PATCH",
          data: JSON.stringify({ balance: newBalance }),
          contentType: "application/json",
          success: function () {
            // You can add a flashcard or log success if needed
          },
          error: function () {
            showFlashcard(
              "Erreur lors de la mise à jour du solde du compte destinataire.",
              "error"
            );
          },
        });
      },
      error: function () {
        showFlashcard(
          "Erreur lors de la récupération des informations du compte destinataire.",
          "error"
        );
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
    const $easterEggText = $(`
    <div class="easter-egg" style="display: none;">
      <p>Petite pause babyfoot ?</p>
      <img src="/images/ea.jpg" alt="Olem" width="100" height="100" class="mx-auto"/>
    </div>
  `);
    $leftColumn.append($easterEggText);

    // Variable pour suivre si "virement" a déjà été sélectionné
    let transferSelected = false;

    $('#transactionType').on('change', function () {
      if ($(this).val() === 'transfer') {
        $('#transferTypeGroup').show();
        $('#transferType').val('internal'); // Par défaut sur "virement interne"
        $('#transferEmailGroup').hide();
        $('#transferAccountGroup').show();
        loadUserAccounts();

        // Cache l'easter egg et marque "virement" comme sélectionné
        $easterEggText.hide();
        transferSelected = true;
      } else {
        $('#transferTypeGroup, #transferEmailGroup, #transferAccountGroup').hide();

        // Affiche l'easter egg uniquement si "virement" a été sélectionné auparavant
        if (transferSelected) {
          $easterEggText.show();
        }
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
    const headers = ['Date', 'Type', 'Montant', 'Solde apres transaction'];
    csvRows.push(headers.join(',')); // En-tête avec la nouvelle colonne

    let cumulativeBalance = 0;

    transactions.forEach(transaction => {
      // Calcul du solde après la transaction
      if (transaction.type === "deposit" || transaction.type === "transfer-in") {
        cumulativeBalance += transaction.amount;
      } else if (transaction.type === "withdrawal" || transaction.type === "transfer-out") {
        cumulativeBalance -= transaction.amount;
      }

      const row = [
        `"${new Date(transaction.date).toLocaleString()}"`, // Date entre guillemets pour Excel
        `"${transaction.type}"`,                             // Type entre guillemets pour Excel
        transaction.amount.toFixed(2),                       // Montant sans guillemets
        cumulativeBalance.toFixed(2)                         // Solde après transaction
      ];
      csvRows.push(row.join(';')); // Joindre les colonnes avec des virgules
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
  $("#downloadCsvButton").on("click", function () {
    $.ajax({
      url: `http://127.0.0.1:8000/transactions?account_id=${accountId}`, // Updated endpoint
      type: "GET",
      success: function (transactions) {
        downloadCSV(transactions); // Call the function to download transactions as CSV
      },
      error: function () {
        showFlashcard(
          "Erreur lors du chargement des transactions pour le téléchargement.",
          "error"
        );
      },
    });
  });


  // Init
  loadAccountDetails();
  loadTransactions();
});
