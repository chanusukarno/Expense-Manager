var emApp = angular.module('emApp.controllers', []);
emApp.controller('welcomeCtrl', function ($scope, $state, $ionicModal, $cookieStore) {

    // Login Modal
    $ionicModal.fromTemplateUrl('partials/modal/login.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function (loginModal) {
        $scope.loginModal = loginModal;
    });
    // Registration Modal
    $ionicModal.fromTemplateUrl('partials/modal/registration.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function (regModal) {
        $scope.regModal = regModal;
    });
    //
    $scope.maskLabel = "Show password";
    $scope.unmask = function (id) {
        if ($(id).attr('type') === 'password') {
            changeType($(id), 'text');
            // $scope.maskLabel = "Mask password";
        } else {
            changeType($(id), 'password');
            // $scope.maskLabel = "Unmask password";
        }
    };
    //
    $scope.loginUser = function (user) {
        console.log(angular.toJson(user));
        $state.go('dashboard.expensesMonthly');
        $scope.loginModal.hide();
    };
    $scope.registerUser = function (newUser) {
        console.log(angular.toJson(newUser));
        $state.go('dashboard.expensesMonthly');
        $scope.regModal.hide();
    };

    // SOCIAL LOGIN
    // FB Login
    $scope.fbLogin = function () {
        FB.login(function (response) {
            if (response.authResponse) {
                getUserInfo();
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, {scope: 'email,user_photos,user_videos'});

        function getUserInfo() {
            // get basic info
            FB.api('/me', function (response) {
                console.log('Facebook Login RESPONSE: ' + angular.toJson(response));
                var userEmail = response.email;
                // get profile picture
                FB.api('/me/picture?type=normal', function (response) {
                    console.log('Facebook Login RESPONSE: ' + response.data.url);
                    // store data to DB and redirect to dashboard
                    // store user email in cookie
                    $cookieStore.put('userEmail', userEmail);
                    $scope.$apply(function () {
                        $state.go('dashboard.expensesMonthly');
                    });
                });
            });
        }
    };
    // END FB Login

    // Google Plus Login
    $scope.gplusLogin = function () {
        var myParams = {
            'clientid': '673925917245-6lmqmafbiiufbm069mbqvq2tidr5ts3i.apps.googleusercontent.com',
            'cookiepolicy': 'single_host_origin',
            'callback': loginCallback,
            'approvalprompt': 'force',
            'scope': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read'
        };
        gapi.auth.signIn(myParams);

        function loginCallback(result) {
            if (result['status']['signed_in']) {
                var request = gapi.client.plus.people.get({'userId': 'me'});
                request.execute(function (resp) {
                    console.log('Google+ Login RESPONSE: ' + angular.toJson(resp));
                    var userEmail;
                    if (resp['emails']) {
                        for (var i = 0; i < resp['emails'].length; i++) {
                            if (resp['emails'][i]['type'] == 'account') {
                                userEmail = resp['emails'][i]['value'];
                            }
                        }
                    }
                    // store data to DB and redirect to dashboard
                    // store user email in cookie
                    $cookieStore.put('userEmail', userEmail);
                    $scope.$apply(function () {
                        $state.go('dashboard.expensesMonthly');
                    });
                });
            }
        }
    };
    // END Google Plus Login
});
emApp.controller('ExpensesMonthlyCtrl', function ($scope, emAPI, $ionicModal, $filter, $ionicPopover) {

    try {
        $('#picker_date').pickadate({
            onClose: function () {
                console.log('Closed now: ' + $('#picker_date').val());
                $scope.$apply(function () {
                    $scope.showCal = false;
                    // set header month
                    $scope.selectedDate = new Date($('#picker_date').val());
                });
            }
        });
    } catch (e) {
        console.log(e);
    }

    // Add expense Modal
    $ionicModal.fromTemplateUrl('partials/modal/addExpense.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function (modal) {
        $scope.addExpenseModal = modal;
    });
    $ionicPopover.fromTemplateUrl('partials/modal/monthlyPopover.html', {
        scope: $scope
    }).then(function (popover) {
        $scope.popover = popover;
    });
    //
    $scope.addExpense = function (expense) {
        console.log(angular.toJson(expense));
        emAPI.addExpense(expense);
        loadExpenses();
        $scope.addExpenseModal.hide();
    };
    // init new expense with current date
    $scope.initNewExpense = function () {
        $scope.expense = {};
        $scope.expense.date = new Date();
        $scope.expense.date.setMilliseconds(0);
    };
    // Load expenses:
    function loadExpenses() {
        emAPI.expensesMonthly().then(function (response) {
            console.log("emAPI expenses SUCCESS: " + angular.toJson(response));
            $scope.expenses = $filter('orderBy')(response, function (value) {
                return new Date(value.date);
            }, true);
        }, function (error) {
            console.log("emAPI expenses ERROR: " + error);
            $scope.error = true;
        });
    }

    $scope.selectedDate = new Date();
    loadExpenses();
});


emApp.controller('ExpensesAllCtrl', function ($scope, emAPI, $ionicModal, $filter) {

    // Add expense Modal
    $ionicModal.fromTemplateUrl('partials/modal/addExpense.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function (modal) {
        $scope.addExpenseModal = modal;
    });
    //
    $scope.addExpense = function (expense) {
        console.log(angular.toJson(expense));
        emAPI.addExpense(expense);
        loadExpenses();
        $scope.addExpenseModal.hide();
    };
    // init new expense with current date
    $scope.initNewExpense = function () {
        $scope.expense = {};
        $scope.expense.date = new Date();
        $scope.expense.date.setMilliseconds(0);
    };
    // Load expenses:
    function loadExpenses() {
        emAPI.expenses().then(function (response) {
            console.log("emAPI expenses SUCCESS: " + angular.toJson(response));
            $scope.expenses = $filter('orderBy')(response, function (value) {
                return new Date(value.date);
            }, true);
        }, function (error) {
            console.log("emAPI expenses ERROR: " + error);
            $scope.error = true;
        });
    }

    loadExpenses();
});

// Borrows/Lends
emApp.controller('borrowsLendsCtrl', function ($scope, emAPI, $ionicModal, $filter) {

    $scope.showLends = true;
    $scope.showBorrows = true;

    $scope.toggleBorrows = function (showLends) {
        if (!showLends) {
            return;
        } else {
            $scope.showBorrows = !$scope.showBorrows;
        }
    };

    $scope.toggleLends = function (showBorrows) {
        if (!showBorrows) {
            return;
        } else {
            $scope.showLends = !$scope.showLends;
        }
    };

    // Add borrow/lend Modal
    $ionicModal.fromTemplateUrl('partials/modal/addBorrowLend.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function (modal) {
        $scope.addBorrowLendModal = modal;
    });

    $scope.initNewBorrowLend = function () {

    };

});

// Recurring Expenses
emApp.controller('expensesRecurringCtrl', function ($scope, emAPI, $ionicModal, $filter) {


});

// Settings
emApp.controller('settingsCtrl', function ($scope, emAPI, $ionicPopup, $ionicModal, $ionicListDelegate, $state) {

// Logout confirmation dialog
    $scope.showConfirm = function () {
        var confirmLogout = $ionicPopup.confirm({
            title: 'Log Out of ExpenseManager?',
            template: 'You can always access your content by signing back in.'
        });
        confirmLogout.then(function (res) {
            if (res) {
                console.log('You are sure');
                $state.go('welcome');
            } else {
                console.log('You are not sure');
            }
        });
    };

    $scope.showLogoutPopup = function () {
        $scope.data = {};
        var myPopup = $ionicPopup.show({
            template: 'You can always access your content by signing back in.',
            title: 'Log Out of ExpenseManager?',
            scope: $scope,
            buttons: [
                {text: 'Cancel'},
                {
                    text: '<b>Log Out</b>',
                    type: 'button-positive',
                    onTap: function (e) {
                        $state.go('welcome');
                        return;
                    }
                }
            ]
        });

        myPopup.then(function (res) {
            console.log('Tapped!', res);
        });
//        $timeout(function () {
//            myPopup.close(); //close the popup after 3 seconds for some reason
//        }, 3000);
    };


    // Manage Categories Modal
    $ionicModal.fromTemplateUrl('partials/modal/categories.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function (modal) {
        $scope.categoriesModal = modal;
    });

    // categories controller
    $scope.data = {
        showDelete: false
    };

    $scope.moveItem = function (item, fromIndex, toIndex) {
        $scope.items.splice(fromIndex, 1);
        $scope.items.splice(toIndex, 0, item);
    };

    $scope.items = [
        {id: 0, title: "Food"},
        {id: 1, title: "Snacks"},
        {id: 2, title: "Grocery"},
        {id: 3, title: "Entertainment"},
        {id: 4, title: "Shopping"},
        {id: 5, title: "Vehicle"},
        {id: 6, title: "Cigarettes"},
        {id: 7, title: "Alchohol"},
        {id: 8, title: "Donation"},
        {id: 9, title: "Shopping"},
        {id: 10, title: "Cosmetics"},
        {id: 11, title: "Parties"},
        {id: 12, title: "Rental"}
    ];

    // category edit or add
    $scope.showCategoryEditPopup = function (type, item) {

        var title, btnText;

        if (type === 'add') {
            title = "Add Category";
            btnText = "Add";
            $scope.data = {};
        } else {
            title = "Edit Category";
            btnText = "Save";
            $scope.data = angular.copy(item);
        }

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
            template: '<input type="text" ng-model="data.title">',
            title: title,
            //subTitle: 'Please use normal things',
            scope: $scope,
            buttons: [
                {text: 'Cancel'},
                {
                    text: '<b>' + btnText + '</b>',
                    type: 'button-positive',
                    onTap: function (e) {
                        if (!$scope.data.title) {
                            e.preventDefault();
                        } else {
                            if (type === 'add') {
                                $scope.items.push({id: 0, title: $scope.data.title});
                            } else {
                                $scope.items[$scope.items.indexOf(item)].title = $scope.data.title;
                            }
                            return;
                        }
                    }
                }
            ]
        });
        myPopup.then(function (res) {
            console.log('Tapped!', res);
            $ionicListDelegate.closeOptionButtons();
        });
    };

    // Delete Category
    $scope.showCategoryDeletePopup = function (item) {

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
            template: item.title,
            title: 'Delete Category?',
            //subTitle: 'Please use normal things',
            buttons: [
                {text: 'Cancel'},
                {
                    text: '<b>Delete</b>',
                    type: 'button-assertive',
                    onTap: function () {
                        return $scope.items.splice($scope.items.indexOf(item), 1);
                    }
                }
            ]
        });
        myPopup.then(function (res) {
            console.log('Tapped!', res);
            $ionicListDelegate.closeOptionButtons();
        });
    };

});

// Reports
emApp.controller('reportsCtrl', function ($scope, emAPI, $ionicModal, $filter) {

    var chart = c3.generate({
        bindto: '#chartLine',
        data: {
            columns: [
                ['data1', 30, 200, 100, 400, 150, 250],
                ['data2', 50, 20, 10, 40, 15, 25]
            ]
        }
    });

    var chart = c3.generate({
        bindto: '#chartDonut',
        data: {
            type: 'donut',
            columns: [
                ['data1', 30, 200, 100, 400, 150, 250],
                ['data2', 50, 20, 10, 40, 15, 25]
            ]
        }
    });

});