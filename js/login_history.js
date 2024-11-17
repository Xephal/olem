$(document).ready(function () {
  const userId = localStorage.getItem('userId');
  const loginHistoryUrl = `http://127.0.0.1:8000/loginHistory`;

  if (!userId) {
    showFlashcard("Erreur : utilisateur non connecté.", 'error');
    return;
  }

  // Function to load and display login history
  function loadLoginHistory() {
    $.ajax({
      url: `${loginHistoryUrl}`, // Fetch all login history
      type: 'GET',
      success: function (logins) {
        $('#loginHistoryList').html('');

        // Filter logins for the current user
        const userLogins = logins.filter(login => login.userId === userId);

        if (userLogins.length === 0) {
          $('#loginHistoryList').append('<p>Aucun historique de connexion trouvé.</p>');
          return;
        }

        // Sort logins by date in descending order (most recent first)
        userLogins.sort((a, b) => new Date(b.date) - new Date(a.date));

        userLogins.forEach(login => {
          const loginDate = new Date(login.date).toLocaleString();

          // Display each login entry
          $('#loginHistoryList').append(`
            <div class="login-item card mt-2">
              <div class="card-body">
                <p>Date et Heure : ${loginDate}</p>
              </div>
            </div>
          `);
        });
      },
      error: function (xhr, status, error) {
        console.error("Erreur chargement historique:", error);
        showFlashcard("Erreur lors du chargement de l'historique de connexion.", 'error');
      }
    });
  }

  // Load the login history when the page loads
  loadLoginHistory();
});
