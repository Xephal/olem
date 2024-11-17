$(document).ready(function () {
  $('#registerForm').on('submit', function (event) {
    event.preventDefault();

    const username = $('#username').val();
    const email = $('#email').val();
    const password = $('#password').val();

    // Check if the email is already registered
    $.ajax({
      url: `http://127.0.0.1:8000/users`, // FastAPI doesn't support querying by email directly in this example
      type: 'GET',
      success: function (users) {
        const userExists = users.some(user => user.email === email); // Check if the email exists in the list
        if (userExists) {
          showFlashcard('An account with this email already exists.', 'error');
        } else {
          // Register the new user
          $.ajax({
            url: 'http://127.0.0.1:8000/users',
            type: 'POST',
            data: JSON.stringify({ id: generateUUID(), username, email, password }),
            contentType: 'application/json',
            success: function (user) {
              localStorage.setItem('userId', user.id);
              showFlashcard('Account created successfully!', 'success', 3000, false); // Notification without delay

              // Redirect immediately to the dashboard
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

  // Utility function to generate a UUID for user IDs
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
});
