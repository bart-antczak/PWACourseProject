var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
      .register('/sw.js')
      .then(function () {
        console.log('Service worker registered!');
      })
      .catch(function(err) {
        console.log(err);
      });
}

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
    if ('serviceWorker' in navigator) {
        var options = {
            body: 'You successfully subscribed to our Notification Service!',
            icon: '/src/images/icons/app-icon-96x96.png',
            image: '/src/image/sf-boat.jpg',
            dir: 'ltr',
            lang: 'en-US', // BCP 47
            vibrate: [100, 50, 200], // Vibration
            badge: '/src/images/icons/app-icon-96x96.png', // On Android
            // ADVANCE OPTIONS
            tag: 'confirm-notification',
            renotify: true, // Inform many times
            actions: [
                {
                    action: 'confirm',
                    title: 'Okay',
                    icon: '/src/images/icons/app-icon-96x96.png'
                },
                {
                    action: 'cancel',
                    title: 'Cancel',
                    icon: '/src/images/icons/app-icon-96x96.png'
                }
            ]
        };
        navigator.serviceWorker.ready
            .then(function (swreg) {
                swreg.showNotification('Successfully subscribed! (from SW)', options);
            })
    }
}

function askForNotificationPermission() {
    Notification.requestPermission(function (result) {
        console.log('User Choice', result);
        if (result !== 'granted') {
            console.log('No notification premission granted!');
        } else {
            displayConfirmNotification();
        }
    })
}

/* Sprawdzenie czy wyszukiwarka wspiera notification */
if ('Notification' in window) {
    for (var i=0; i < enableNotificationsButtons.length; i++) {
        enableNotificationsButtons[i].style.display = 'inline-block';
        enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission);
    }
}