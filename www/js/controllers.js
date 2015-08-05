angular.module('ionicParseApp.controllers', [])

.controller('AppController', function($scope, $state, $rootScope, $ionicHistory, $stateParams) {
    if ($stateParams.clear) {
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
    }

    $scope.logout = function() {
        Parse.User.logOut();
        $rootScope.user = null;
        $rootScope.isLoggedIn = false;
        $state.go('welcome', {
            clear: true
        });
    };
})

.controller('WelcomeController', function($scope, $state, $rootScope, $ionicHistory, $stateParams) {
    if ($stateParams.clear) {
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
    }

    $scope.login = function() {
        $state.go('app.login');
    };

    $scope.signUp = function() {
        $state.go('app.register');
    };

    if ($rootScope.isLoggedIn) {
        $state.go('app.home');
    }
})

.controller('HomeController', function($scope, $state, $rootScope, $cordovaGeolocation, mapboxService) {
    mapboxService.init({ accessToken: 'pk.eyJ1IjoibWF0Y2htaWtlMTMxMyIsImEiOiJlNWIzMWZkMWMzMTVhMTU4ZTU5Njk1YzllNmZlZjIzYiJ9.o7ugJ1UbmcfDmDrl8i7l4Q' });
    if (!$rootScope.isLoggedIn) {
        $state.go('welcome');
    }

    $scope.updateUser = function () {
        var user = $scope.user;
        user.set("username", user.attributes.username);
        user.set("email", user.attributes.username);
        user.set("password", user.attributes.password);
        user.save()
        .then(
          function(user) {
            return user.fetch();
            Parse.User.logIn(user.email, user.password);
          }
        )
        .then(
          function(user) {
            console.log('User Updated', user);
          },
          function(error) {
            console.log('Something went wrong', error);
          }
        );
    };

    $scope.allowLocation = function () {
        var posOptions = {timeout: 10000, enableHighAccuracy: false};
        $cordovaGeolocation
          .getCurrentPosition(posOptions)
          .then(function (position) {
            var lat  = position.coords.latitude
            var long = position.coords.longitude
          }, function(err) {
            // error
          });
    };

})

.controller('HelpController', function($scope, $cordovaGeolocation) {
    $scope.showMap = false;
    L.mapbox.accessToken = 'pk.eyJ1IjoibWF0Y2htaWtlMTMxMyIsImEiOiJlNWIzMWZkMWMzMTVhMTU4ZTU5Njk1YzllNmZlZjIzYiJ9.o7ugJ1UbmcfDmDrl8i7l4Q';
    $scope.currentLocation = function () {
        $scope.showMap = !$scope.showMap;
        var posOptions = {timeout: 10000, enableHighAccuracy: true};
        $cordovaGeolocation
          .getCurrentPosition(posOptions)
          .then(function (position) {
            var lat  = position.coords.latitude
            var long = position.coords.longitude

            var map = L.mapbox.map('map-one', 'mapbox.streets', {
              zoomControl: false
            }).setView([lat,long], 16);

            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();

            var geojson = {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Point",
                    "coordinates": [
                      long,
                      lat
                    ]
                  },
                  "properties": {
                    "title": "HELP",
                    "marker-color": "#C50502",
                    "marker-size": "medium",
                  }
                }
              ]
            }

            var myLayer = L.mapbox.featureLayer().addTo(map);
            myLayer.setGeoJSON(geojson);
          }, function(err) {
            // error
          });
    };


})

.controller('ContactsController', function($scope, $state, $rootScope, $cordovaContacts, $ionicPlatform) {
    $scope.getContacts = function() {
      $scope.phoneContacts = [];

      function onSuccess(contacts) {
        for (var i = 0; i < contacts.length; i++) {
          var contact = contacts[i];
          $scope.phoneContacts.push(contact);
        }
      };

      function onError(contactError) {
        alert(contactError);
      };

      var options = {};
      options.multiple = true;

      $cordovaContacts.find(options).then(onSuccess, onError);
    };
})

.controller('LoginController', function($scope, $state, $rootScope, $ionicLoading) {
    $scope.user = {
        username: null,
        password: null
    };

    $scope.error = {};

    $scope.login = function() {
        $scope.loading = $ionicLoading.show({
            content: 'Logging in',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
        });

        var user = $scope.user;
        Parse.User.logIn(('' + user.username).toLowerCase(), user.password, {
            success: function(user) {
                $ionicLoading.hide();
                $rootScope.user = user;
                $rootScope.isLoggedIn = true;
                $state.go('app.home', {
                    clear: true
                });
            },
            error: function(user, err) {
                $ionicLoading.hide();
                // The login failed. Check error to see why.
                if (err.code === 101) {
                    $scope.error.message = 'Invalid login credentials';
                } else {
                    $scope.error.message = 'An unexpected error has ' +
                        'occurred, please try again.';
                }
                $scope.$apply();
            }
        });
    };

    $scope.forgot = function() {
        $state.go('app.forgot');
    };
})

.controller('ForgotPasswordController', function($scope, $state, $ionicLoading) {
    $scope.user = {};
    $scope.error = {};
    $scope.state = {
        success: false
    };

    $scope.reset = function() {
        $scope.loading = $ionicLoading.show({
            content: 'Sending',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
        });

        Parse.User.requestPasswordReset($scope.user.email, {
            success: function() {
                // TODO: show success
                $ionicLoading.hide();
                $scope.state.success = true;
                $scope.$apply();
            },
            error: function(err) {
                $ionicLoading.hide();
                if (err.code === 125) {
                    $scope.error.message = 'Email address does not exist';
                } else {
                    $scope.error.message = 'An unknown error has occurred, ' +
                        'please try again';
                }
                $scope.$apply();
            }
        });
    };

    $scope.login = function() {
        $state.go('app.login');
    };
})

.controller('RegisterController', function($scope, $state, $ionicLoading, $rootScope) {
    $scope.user = {};
    $scope.error = {};

    $scope.register = function() {

        // TODO: add age verification step

        $scope.loading = $ionicLoading.show({
            content: 'Sending',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
        });

        var user = new Parse.User();
        user.set("username", $scope.user.email);
        user.set("password", $scope.user.password);
        user.set("email", $scope.user.email);

        user.signUp(null, {
            success: function(user) {
                $ionicLoading.hide();
                $rootScope.user = user;
                $rootScope.isLoggedIn = true;
                $state.go('app.home', {
                    clear: true
                });
            },
            error: function(user, error) {
                $ionicLoading.hide();
                if (error.code === 125) {
                    $scope.error.message = 'Please specify a valid email ' +
                        'address';
                } else if (error.code === 202) {
                    $scope.error.message = 'The email address is already ' +
                        'registered';
                } else {
                    $scope.error.message = error.message;
                }
                $scope.$apply();
            }
        });
    };
})

.controller('MainController', function($scope, $state, $rootScope, $stateParams, $ionicHistory) {
    if ($stateParams.clear) {
        $ionicHistory.clearHistory();
    }

    $scope.rightButtons = [{
        type: 'button-positive',
        content: '<i class="icon ion-navicon"></i>',
        tap: function(e) {
            $scope.sideMenuController.toggleRight();
        }
    }];

    $scope.logout = function() {
        Parse.User.logOut();
        $rootScope.user = null;
        $rootScope.isLoggedIn = false;
        $state.go('welcome', {
            clear: true
        });
    };

    $scope.toggleMenu = function() {
        $scope.sideMenuController.toggleRight();
    };
});
