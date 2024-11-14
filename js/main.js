// Fonction pour afficher ou stocker une notification Toastr
window.showFlashcard = function (message, type = 'success', duration = 3000, immediate = true) {
  const flashcards = JSON.parse(localStorage.getItem('flashcards')) || [];
  flashcards.push({ message, type, duration });
  localStorage.setItem('flashcards', JSON.stringify(flashcards));

  // Affiche la notification immédiatement si "immediate" est true
  if (immediate) {
    displayToastr(message, type, duration);
  }
};

// Fonction pour afficher une notification Toastr avec des options configurées
function displayToastr(message, type, duration) {
  toastr.options = {
    "closeButton": true,
    "newestOnTop": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": true,
    "timeOut": duration,
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
  };

  if (type === 'success') {
    toastr.success(message);
  } else if (type === 'error') {
    toastr.error(message);
  } else if (type === 'warning') {
    toastr.warning(message);
  } else {
    toastr.info(message);
  }
}

// Fonction pour afficher les notifications stockées
function displayStoredFlashcards() {
  const flashcards = JSON.parse(localStorage.getItem('flashcards')) || [];
  flashcards.forEach(flashcard => displayToastr(flashcard.message, flashcard.type, flashcard.duration));
  localStorage.removeItem('flashcards'); // Supprime les flashcards après l'affichage
}

// Vérifie si l'utilisateur est authentifié pour accéder aux pages sécurisées
function checkAuth() {
  const userId = localStorage.getItem('userId');
  const currentPage = window.location.pathname.split('/').pop();
  if (!userId && !['login.html', 'register.html', 'index.html'].includes(currentPage)) {
    window.location.href = 'login.html';
  }
}

// Common

function loadNavbar() {
  const currentPage = window.location.pathname.split('/').pop();

  $('#navbar-container').load('./partials/navbar.html', function () {
    const userId = localStorage.getItem('userId');

    // Cache les boutons de profil et déconnexion sur les pages publiques ou profil
    if (['login.html', 'register.html', 'index.html', 'profile.html'].includes(currentPage)) {
      $('#profileButton, #logoutButton').hide();
    } else if (userId) {
      // Si l'utilisateur est connecté, affiche le bouton de déconnexion et le bouton de profil
      $('#profileButton, #logoutButton').show();

      // Gestion de la déconnexion
      $('#logoutButton').on('click', function () {
        localStorage.removeItem('userId');
        showFlashcard('Déconnecté avec succès !', 'success', 3000, false);
        setTimeout(() => window.location.href = 'index.html', 1500);
      });
    } else {
      // Cache les boutons si aucun utilisateur n'est connecté
      $('#profileButton, #logoutButton').hide();
    }
  });
}

$(document).ready(function () {
  $("#footer-container").load("./partials/footer.html");
});

// Synchroniser la hauteur de la colonne de droite avec celle de la gauche
function syncColumnHeights() {
  const leftColumnHeight = $('.left-column').outerHeight();
  $('.right-column').css('max-height', leftColumnHeight);
}

$(document).ready(function () {
  syncColumnHeights();
  $(window).resize(syncColumnHeights);
});


// Initialiser les notifications, la navbar et l'authentification au chargement
$(document).ready(function () {
  displayStoredFlashcards(); // Affiche les notifications stockées
  loadNavbar(); // Charge la navbar
  checkAuth(); // Vérifie l'authentification
  syncColumnHeights();
  $(window).resize(syncColumnHeights);
});

