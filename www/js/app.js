// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var emApp = angular.module('emApp', ['emApp.controllers', 'emApp.services', 'emApp.filters', 'angularMoment', 'ionic'])
        .run(function ($ionicPlatform) {
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
        });

emApp.config(function ($stateProvider, $urlRouterProvider) {

    $stateProvider
            .state('welcome', {
                url: "/welcome",
                templateUrl: "partials/welcome.html",
                controller: 'welcomeCtrl'
            })
            .state('dashboard', {
                url: "/dashboard",
                abstract: true,
                templateUrl: "partials/dashboard.html"
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
            .state('dashboard.profile', {
                url: "/profile",
                views: {
                    'menuContent': {
                        templateUrl: "partials/profile.html"
                    }
                }
            })
            .state('dashboard.settings', {
                url: "/settings",
                views: {
                    'menuContent': {
                        templateUrl: "partials/settings.html"
                    }
                }
            })
            .state('dashboard.reports', {
                url: "/reports",
                views: {
                    'menuContent': {
                        templateUrl: "partials/reports.html"
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