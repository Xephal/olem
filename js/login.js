$(document).ready(function () {
  // Login form submission handler
  $('#loginForm').on('submit', function (event) {
    event.preventDefault();

    const email = $('#loginEmail').val();
    const password = $('#loginPassword').val();
  
    $.ajax({
      url: `http://localhost:3000/users?email=${email}`,
      type: 'GET',
      success: function (users) {
        const user = users[0];
        if (user && user.password === password) {
          localStorage.setItem('userId', user.id);
          showFlashcard('Logged in successfully!', 'success', 3000);

          // Log the login time, then redirect after logging completes
          logLoginTime(user.id, function () {
            window.location.href = 'dashboard.html';
          });

        } else {
          showFlashcard('Invalid email or password.', 'error', 3000);
        }
      },
      error: function () {
        showFlashcard("Error during login attempt.", 'error', 3000);
      }
    });
  });

  // Logout Button
  $('#logoutButton').on('click', function () {
    localStorage.removeItem('userId');
    showFlashcard('Logged out successfully!', 'success', 3000);
    setTimeout(() => window.location.href = 'index.html', 1500);
  });

  // Log the current login time with a callback for redirection
  function logLoginTime(userId, callback) {
    const currentLogin = {
      userId: userId,
      date: new Date().toISOString() // Record date and time in ISO format
    };

    $.ajax({
      url: `http://localhost:3000/loginHistory`,
      type: 'POST',
      data: JSON.stringify(currentLogin),
      contentType: 'application/json',
      success: function () {
        console.log("Login time logged successfully.");
        if (callback) callback(); // Execute callback if provided
      },
      error: function () {
        console.error("Error logging login time.");
        if (callback) callback(); // Proceed even if there was an error
      }
    });
  }
});
