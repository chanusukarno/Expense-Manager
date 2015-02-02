// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var emApp = angular.module('emApp', ['ngCookies', 'emApp.controllers', 'emApp.services', 'emApp.filters', 'emApp.config', 'angularMoment', 'ionic']);

emApp.run(function ($ionicPlatform, $rootScope, $cookieStore, $state) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });

    // Check login session
    $rootScope.$on('$stateChangeStart', function (event, next, current) {
        var userInfo = $cookieStore.get('userInfo');
        if (!userInfo) {
            // user not logged in | redirect to login
            if (next.name !== "welcome") {
                // not going to #login, we should redirect now
                event.preventDefault();
                $state.go('welcome');
            }
        } else if (next.name === "welcome") {
            event.preventDefault();
            $state.go('dashboard.expensesMonthly');
        }
    });
});

emApp.config(function ($httpProvider) {
    $httpProvider.interceptors.push(function ($rootScope) {
        return {
            request: function (config) {
                $rootScope.$broadcast('loading:show');
                return config;
            },
            response: function (response) {
                $rootScope.$broadcast('loading:hide');
                return response;
            }
        };
    });
});

emApp.run(function ($rootScope, $ionicLoading) {
    $rootScope.$on('loading:show', function () {
        $ionicLoading.show({template: 'Loading...'});
    });

    $rootScope.$on('loading:hide', function () {
        $ionicLoading.hide();
    });
});

// Routes
emApp.config(function ($stateProvider, $urlRouterProvider, $httpProvider) {

//    $httpProvider.defaults.useXDomain = true;
//    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $stateProvider
        .state('welcome', {
            url: "/welcome",
            templateUrl: "partials/welcome.html",
            controller: 'welcomeCtrl'
        })
        .state('dashboard', {
            url: "/dashboard",
            templateUrl: "partials/dashboard.html",
            controller: "dashboardCtrl"
        })
//            .state('forgotpassword', {
//                url: "/forgot-password",
//                templateUrl: "forgot-password.html"
//            })
        .state('dashboard.expensesMonthly', {
            url: "/expensesMonthly",
            views: {
                'menuContent': {
                    templateUrl: "partials/expensesMonthly.html",
                    controller: "ExpensesMonthlyCtrl"
                }
            }
        })
        .state('dashboard.expensesAll', {
            url: "/expensesAll",
            views: {
                'menuContent': {
                    templateUrl: "partials/expensesAll.html",
                    controller: "ExpensesAllCtrl"
                }
            }
        })
        .state('dashboard.expensesRecurring', {
            url: "/expensesRecurring",
            views: {
                'menuContent': {
                    templateUrl: "partials/expensesRecurring.html",
                    controller: "expensesRecurringCtrl"
                }
            }
        })
        .state('dashboard.borrowsLends', {
            url: "/borrowsLends",
            views: {
                'menuContent': {
                    templateUrl: "partials/borrowsLends.html",
                    controller: "borrowsLendsCtrl"
                }
            }
        })
        .state('dashboard.finance', {
            url: "/finance",
            views: {
                'menuContent': {
                    templateUrl: "partials/finance.html",
                    controller: "financeCtrl"
                }
            }
        })
        .state('dashboard.profile', {
            url: "/profile",
            views: {
                'menuContent': {
                    templateUrl: "partials/profile.html",
                    "controller": "profileCtrl"
                }
            }
        })
        .state('dashboard.settings', {
            url: "/settings",
            views: {
                'menuContent': {
                    templateUrl: "partials/settings.html",
                    controller: "settingsCtrl"
                }
            }
        })
        .state('dashboard.reports', {
            url: "/reports",
            views: {
                'menuContent': {
                    templateUrl: "partials/reports.html",
                    controller: "reportsCtrl"
                }
            }
        })
        .state('dashboard.help', {
            url: "/help",
            views: {
                'menuContent': {
                    templateUrl: "partials/help.html"
                }
            }
        });

    $urlRouterProvider.otherwise("/welcome");

});