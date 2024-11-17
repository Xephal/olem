$(document).ready(function () {
  $('#registerForm').on('submit', function (event) {
    event.preventDefault();

    const username = $('#username').val();
    const email = $('#email').val();
    const password = $('#password').val();

    // Vérifier si l'email est déjà enregistré
    $.ajax({
      url: `http://localhost:3000/users?email=${email}`,
      type: 'GET',
      success: function (users) {
        if (users.length > 0) {
          showFlashcard('An account with this email already exists.', 'error');
        } else {
          // Enregistrer le nouvel utilisateur
          $.ajax({
            url: 'http://localhost:3000/users',
            type: 'POST',
            data: JSON.stringify({ username, email, password }),
            contentType: 'application/json',
            success: function (user) {
              localStorage.setItem('userId', user.id);
              showFlashcard('Account created successfully!', 'success', 3000, false); // notification sans delay

              // Redirige immédiatement vers le tableau de bord
              window.location.href = 'dashboard.html';
            },
            error: function () {
              showFlashcard('Registration failed.', 'error');
            }
          });
        }
      },
      error: function () {
        showFlashcard('Error checking email availability.', 'error');
      }
    });
  });
});