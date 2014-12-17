/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var emApp = angular.module('emApp.controllers', []);

emApp.controller('welcomeCtrl', function($scope, $state, $ionicModal) {

    $scope.signIn = function(user) {
        console.log('Sign-In', user);
        $state.go('tabs.home');
    };

    // Login Modal
    $ionicModal.fromTemplateUrl('partials/modal/login.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function(loginModal) {
        $scope.loginModal = loginModal;
    });

    // Registration Modal
    $ionicModal.fromTemplateUrl('partials/modal/registration.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function(regModal) {
        $scope.regModal = regModal;
    });

    //
    $scope.maskLabel = "Unmask password";
    $scope.unmask = function(id) {
        if ($(id).attr('type') === 'password') {
            changeType($(id), 'text');
            $scope.maskLabel = "Mask password";
        } else {
            changeType($(id), 'password');
            $scope.maskLabel = "Unmask password";
        }
    };

    //
    $scope.loginUser = function(user) {
        console.log(angular.toJson(user));
    };

    $scope.registerUser = function(newUser) {
        console.log(angular.toJson(newUser));
    };


});

emApp.controller('HomeTabCtrl', function($scope, $ionicModal) {

});