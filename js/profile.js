$(document).ready(function () {
  const userId = localStorage.getItem('userId');
  let currentEmail = ""; // Store the current user's email

  // Load user information
  function loadUserProfile() {
    $.ajax({
      url: `http://127.0.0.1:8000/users/${userId}`, // Updated to FastAPI URL
      type: 'GET',
      success: function (user) {
        $('#userName').val(user.username);
        $('#userEmail').val(user.email);
        currentEmail = user.email; // Store the current email for comparison
      },
      error: function () {
        showFlashcard("Erreur lors du chargement des informations de l'utilisateur.", 'error');
      }
    });
  }

  // Profile update with email and password verification
  $('#profileForm').on('submit', function (event) {
    event.preventDefault();
    const updatedEmail = $('#userEmail').val();
    const updatedUser = {
      username: $('#userName').val(),
      email: updatedEmail,
    };

    const newPassword = $('#newPassword').val();
    const confirmPassword = $('#confirmPassword').val();

    // Check if the passwords match
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        showFlashcard('Les mots de passe ne correspondent pas.', 'error');
        return;
      }
      updatedUser.password = newPassword; // Add password only if it’s provided and confirmed
    }

    // Proceed with email verification or update directly if email is unchanged
    if (updatedEmail === currentEmail) {
      updateUserProfile(updatedUser);
    } else {
      // Check if the new email is already in use
      $.ajax({
        url: `http://127.0.0.1:8000/users`, // Fetch all users and verify in the frontend
        type: 'GET',
        success: function (users) {
          const emailTaken = users.some(user => user.email === updatedEmail && user.id !== userId);

          if (emailTaken) {
            showFlashcard('Cet email est déjà utilisé par un autre compte.', 'error');
          } else {
            // Proceed to update the profile if email is unique
            updateUserProfile(updatedUser);
          }
        },
        error: function () {
          showFlashcard("Erreur lors de la vérification de l'email.", 'error');
        }
      });
    }
  });

  // Function to update user profile
  function updateUserProfile(updatedUser) {
    $.ajax({
      url: `http://127.0.0.1:8000/users/${userId}`, // Updated to FastAPI URL
      type: 'PATCH', // Using PATCH to update specific fields
      data: JSON.stringify(updatedUser),
      contentType: 'application/json',
      success: function () {
        showFlashcard('Les informations du profil ont été mises à jour avec succès!', 'success');
        currentEmail = updatedUser.email; // Update the stored email to prevent re-validation
        // Clear password fields after successful update
        $('#newPassword').val('');
        $('#confirmPassword').val('');
      },
      error: function () {
        showFlashcard("Erreur lors de la mise à jour du profil.", 'error');
      }
    });
  }

  loadUserProfile(); // Load profile on page load
});
