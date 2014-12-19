var emApp = angular.module('emApp.controllers', []);

emApp.controller('welcomeCtrl', function($scope, $state, $ionicModal) {

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
        $state.go('dashboard.expenses');
        $scope.loginModal.hide();
    };

    $scope.registerUser = function(newUser) {
        console.log(angular.toJson(newUser));
        $state.go('dashboard.expenses');
        $scope.regModal.hide();
    };


});

emApp.controller('ExpensesCtrl', function($scope, emAPI, $ionicModal, $filter) {

    // Add expense Modal
    $ionicModal.fromTemplateUrl('partials/modal/addExpense.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function(modal) {
        $scope.addExpenseModal = modal;
    });

    //
    $scope.addExpense = function(expense) {
        console.log(angular.toJson(expense));
        emAPI.addExpense(expense);
        loadExpenses();
        $scope.addExpenseModal.hide();
        initNewExpense();
    };

    // init new expense with current date
    function initNewExpense() {
        $scope.expense = {};
        $scope.expense.date = new Date();
        $scope.expense.date.setMilliseconds(0);
    }

    // Load expenses:
    function loadExpenses() {
        emAPI.expenses().then(function(response) {
            console.log("emAPI expenses SUCCESS: " + angular.toJson(response));
            $scope.expenses = $filter('orderBy')(response, function(value) {
                return new Date(value.date);
            }, true);
        }, function(error) {
            console.log("emAPI expenses ERROR: " + error);
            $scope.error = true;
        });
    }

    loadExpenses();
    initNewExpense();

});