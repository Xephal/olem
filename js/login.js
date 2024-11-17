$(document).ready(function () {
  // Login form submission handler
  $('#loginForm').on('submit', function (event) {
    event.preventDefault();

    const email = $('#loginEmail').val();
    const password = $('#loginPassword').val();

    // Fetch the user by email
    $.ajax({
      url: `http://127.0.0.1:8000/users`, // FastAPI doesn't support direct query by email
      type: 'GET',
      success: function (users) {
        // Filter the user based on email
        const user = users.find(u => u.email === email);

        if (user && user.password === password) {
          // Save userId to local storage
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
      id: generateUUID(), // Generate unique ID for the login record
      userId: userId,
      date: new Date().toISOString() // Record date and time in ISO format
    };

    $.ajax({
      url: `http://127.0.0.1:8000/loginHistory`,
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

  // Utility function to generate a UUID
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
});
