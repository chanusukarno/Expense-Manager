// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var emApp = angular.module('emApp', ['emApp.controllers', 'ionic'])
        .run(function($ionicPlatform) {
            $ionicPlatform.ready(function() {
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

emApp.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
            .state('welcome', {
                url: "/welcome",
                templateUrl: "partials/welcome.html",
                controller: 'welcomeCtrl'
            });
//            .state('forgotpassword', {
//                url: "/forgot-password",
//                templateUrl: "forgot-password.html"
//            })
//            .state('tabs', {
//                url: "/tab",
//                abstract: true,
//                templateUrl: "tabs.html"
//            })
//            .state('tabs.home', {
//                url: "/home",
//                views: {
//                    'home-tab': {
//                        templateUrl: "home.html",
//                        controller: 'HomeTabCtrl'
//                    }
//                }
//            })
//            .state('tabs.facts', {
//                url: "/facts",
//                views: {
//                    'home-tab': {
//                        templateUrl: "facts.html"
//                    }
//                }
//            })
//            .state('tabs.facts2', {
//                url: "/facts2",
//                views: {
//                    'home-tab': {
//                        templateUrl: "facts2.html"
//                    }
//                }
//            })
//            .state('tabs.about', {
//                url: "/about",
//                views: {
//                    'about-tab': {
//                        templateUrl: "about.html"
//                    }
//                }
//            })
//            .state('tabs.navstack', {
//                url: "/navstack",
//                views: {
//                    'about-tab': {
//                        templateUrl: "nav-stack.html"
//                    }
//                }
//            })
//            .state('tabs.contact', {
//                url: "/contact",
//                views: {
//                    'contact-tab': {
//                        templateUrl: "contact.html"
//                    }
//                }
//            });


    $urlRouterProvider.otherwise("/welcome");

});