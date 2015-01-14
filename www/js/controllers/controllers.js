var emApp = angular.module('emApp.controllers', []);
emApp.controller('welcomeCtrl', function ($scope, $state, $ionicModal, $cookieStore, emConstants, emAPI) {

    // Login Modal
    $ionicModal.fromTemplateUrl('partials/modal/login.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function (modal) {
        $scope.loginModal = modal;
    });
    // Registration Modal
    $ionicModal.fromTemplateUrl('partials/modal/registration.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function (modal) {
        $scope.regModal = modal;
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

    // LOGIN USER
    $scope.loginUser = function (user) {
        console.log("login INPUT: " + angular.toJson(user));
        emAPI.login(user).success(function (response) {
            console.log("LOGIN SUCCESS: " + angular.toJson(response));
            if (!response.error) {
                $cookieStore.put('userInfo', response);
                $state.go('dashboard');
                $scope.loginModal.hide();
            } else {

            }
        }).error(function (e) {
            console.log("LOGIN ERROR: " + e);
        });
    };

    // REGISTER USER
    $scope.registerUser = function (newUser) {
        console.log("register INPUT: " + angular.toJson(newUser));
        emAPI.register(newUser).success(function (response) {
            console.log("REGISTER SUCCESS: " + angular.toJson(response));
            if (!response.error) {
                $cookieStore.put('userInfo', response);
                $state.go('dashboard');
                $scope.regModal.hide();
            } else {

            }
        }).error(function (e) {
            console.log("LOGIN ERROR: " + e);
        });
    };

    /**
     * SOCIAL LOGIN
     * Facebook and Google
     */
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
                // get profile picture
                FB.api('/me/picture?type=normal', function (picResponse) {
                    console.log('Facebook Login RESPONSE: ' + picResponse.data.url);
                    // store data to DB
                    var user = {};
                    user.provider_key = response.id;
                    user.provider_name = emConstants.PROVIDER_FACEBOOK;
                    user.name = response.name;
                    user.email = response.email;
                    response.gender.toString().toLowerCase() === 'male' ? user.gender = 'M' : user.gender = 'F';
                    user.profilePic = picResponse.data.url;
                    // send user data to DB
                    emAPI.oauth(user).success(function (response) {
                        if (!response.error) {
                            console.log("OAUTH SUCCESS: " + angular.toJson(response));
                            $cookieStore.put('userInfo', response);
                            $state.go('dashboard');
                        } else {
                            console.log("OAUTH ERROR: " + angular.toJson(response));
                        }
                    }).error(function (e) {
                        console.log("OAUTH ERROR: " + e);
                    });
                });
            });
        }
    };
    // END FB Login

    // Google Plus Login
    $scope.gplusLogin = function () {
        var myParams = {
            // 'clientid': '673925917245-6lmqmafbiiufbm069mbqvq2tidr5ts3i.apps.googleusercontent.com', // Client ID EM
            'clientid': '509941695232-lp7p7l5ms37eu8fdkifbna8sb252evt7.apps.googleusercontent.com', // Client ID Local
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
                    // store data to DB
                    var user = {};
                    user.provider_key = resp.id;
                    user.provider_name = emConstants.PROVIDER_GOOGLE;
                    user.name = resp.displayName;
                    user.email = userEmail;
                    resp.gender.toString().toLowerCase() === 'male' ? user.gender = 'M' : user.gender = 'F';
                    user.profilePic = resp.image.url;
                    // send user data to DB
                    emAPI.oauth(user).success(function (response) {
                        if (!response.error) {
                            console.log("OAUTH SUCCESS: " + angular.toJson(response));
                            $cookieStore.put('userInfo', response);
                            $state.go('dashboard');
                        } else {
                            console.log("OAUTH ERROR: " + angular.toJson(response));
                        }
                    }).error(function (e) {
                        console.log("OAUTH ERROR: " + e);
                    });
                });
            }
        }
    };
    // END Google Plus Login

});

// Dashboard Controller
emApp.controller('dashboardCtrl', function ($scope, $http, $state, $cookieStore, emAPI) {

    // Add default header to all the API calls
    if ($cookieStore.get('userInfo')) {
        var API_KEY = $cookieStore.get('userInfo').apiKey;
        $http.defaults.headers.common.Authorization = API_KEY;
    }

    $scope.user = $cookieStore.get('userInfo');
    $scope.profile = $cookieStore.get('userProfile');

    if (!$scope.profile) {
        // get user profile and store
        emAPI.getProfile($scope.user.profileId).success(function (response) {
            console.log("GET PROFILE SUCCESS: " + angular.toJson(response));
            if (!response.error) {
                // store user profile data
                $cookieStore.put("userProfile", response);
                // set scope data
                $scope.profile = response;
            } else {
                console.log("GET PROFILE ERROR: " + angular.toJson(response));
            }
        }).error(function (e) {
            console.log("GET PROFILE ERROR: " + e);
        });
    }

    $state.go('dashboard.expensesMonthly');
});

// Profile Controller
emApp.controller('profileCtrl', function ($scope, $state, $cookieStore, Toast, emAPI) {

    $scope.user = $cookieStore.get('userInfo');
    $scope.profile = $cookieStore.get('userProfile');

    $scope.isProfileModified = false;

    $scope.$watch("profile", function (newData, oldData) {
        if (newData != oldData) {
            console.log("Profile updated!");
            $scope.isProfileModified = true;
        } else {
            $scope.isProfileModified = false;
        }
    }, true);

    $scope.profile.dobObj = isValidDate($scope.profile.dob) ? new Date($scope.profile.dob) : "";

    // Update profile
    $scope.updateProfile = function () {

        var request = angular.copy($scope.profile);
        request.dob = $scope.profile.dobObj;

        emAPI.updateProfile(request).success(function (response) {
            if (!response.error) {
                // profile update successfully
                console.log("UPDATE PROFILE SUCCESS: " + angular.toJson(response));
                $scope.isProfileModified = false;
                $cookieStore.put('userProfile', $scope.profile);
                Toast.showToast('Updated successfully!');
            } else {
                console.log("UPDATE PROFILE ERROR: " + angular.toJson(response));
            }
        }).error(function (e) {
            console.log("UPDATE PROFILE ERROR: " + e);
        });
    }

});

// Monthly Expenses Controller
emApp.controller('ExpensesMonthlyCtrl', function ($scope, emAPI, $ionicModal, $filter, $ionicPopover, $ionicListDelegate, Toast) {

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

    // Menu popover for group options
    $ionicPopover.fromTemplateUrl('partials/modal/monthlyPopover.html', {
        scope: $scope
    }).then(function (popover) {
        $scope.popover = popover;
    });

    // Add expense Modal
    $ionicModal.fromTemplateUrl('partials/modal/addExpense.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function (modal) {
        $scope.addExpenseModal = modal;
    });

    // Init categories
    emAPI.getUserCategories().then(function (cats) {
        $scope.categories = cats;
    });

    // Expense Actions
    $scope.expenseAction = function (expense) {
        if ($scope.isAdd) {
            // Add expense
            emAPI.addExpense(expense).then(function (res) {
                if (!res.error) {
                    $scope.addExpenseModal.hide();
                    loadExpenses(); // Reload expenses
                    Toast.showToast('Expense Added!');
                } else {
                    Toast.showToast('Error adding expense: ' + res);
                }
            }, function (e) {
                Toast.showToast('Error adding expense: ' + e);
            });
        } else if ($scope.isEdit) {
            // Update expense
            emAPI.updateExpense(expense).then(function (res) {
                if (!res.error) {
                    $scope.addExpenseModal.hide();
                    loadExpenses(); // Reload expenses
                    Toast.showToast('Expense Updated!');
                } else {
                    Toast.showToast('Error updating expense: ' + res);
                }
            }, function (e) {
                Toast.showToast('Error updating expense: ' + e);
            });
            $scope.addExpenseModal.hide();
        } else {
            // Enable Update
            $scope.isReadOnly = false;
            $scope.isEdit = true;
        }
    };
    // init new expense with current date
    $scope.initNewExpense = function () {
        $scope.isAdd = true;
        $scope.isEdit = false;
        $scope.isReadOnly = false;
        $scope.expense = {};
        $scope.expense.date = new Date();
        $scope.expense.date.setMilliseconds(0);
    };
    // init edit expense
    $scope.initEditExp = function (exp) {
        $scope.isAdd = false;
        $scope.isReadOnly = true;
        $scope.isEdit = false;

        var expense = angular.copy(exp);
        expense.date = new Date(expense.date);
        expense.date.setMilliseconds(0);

        expense.category = $scope.categories[indexById($scope.categories, expense.category_id)];
        // TODO issue with indexOf always returns -1
        // expense.category = {"id": expense.category_id, "name": expense.category};
        // expense.category = $scope.categories[$scope.categories.indexOf(expense.category)];
        $scope.expense = expense;

        $scope.isExpenseModified = false;

        var unbindWatch = $scope.$watch("expense", function (newData, oldData) {
            if (newData != oldData) {
                console.log("Expense updated!");
                $scope.isExpenseModified = true;
            } else {
                $scope.isExpenseModified = false;
            }
        }, true);
    };
    // Delete expense
    $scope.deleteExpense = function (expId) {
        $ionicListDelegate.closeOptionButtons();
        console.log(angular.toJson("DELETE Expense ID" + expId));
        emAPI.deleteExpense(expId).then(function (res) {
            if (!res.error) {
                Toast.showToast('Expense Deleted!');
                loadExpenses(); // Reload expenses
            } else {
                Toast.showToast('Error deleting expense: ' + res);
            }
        }, function (e) {
            Toast.showToast('Error deleting expense: ' + e);
        });
    };
    // Load expenses:
    function loadExpenses() {
        emAPI.getAllExpenses().then(function (response) {
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

// All Expenses Controller
emApp.controller('ExpensesAllCtrl', function ($scope, emAPI, $ionicModal, $filter, $ionicListDelegate, Toast) {

    // Add expense Modal
    $ionicModal.fromTemplateUrl('partials/modal/addExpense.html', {
        scope: $scope,
        focusFirstInput: true
    }).then(function (modal) {
        $scope.addExpenseModal = modal;
    });

    // Init categories
    emAPI.getUserCategories().then(function (cats) {
        $scope.categories = cats;
    });

    // Expense Actions
    $scope.expenseAction = function (expense) {
        if ($scope.isAdd) {
            // Add expense
            console.log(angular.toJson("ADD Expense REQUEST: " + expense));
            emAPI.addExpense(expense).then(function (res) {
                if (!res.error) {
                    $scope.addExpenseModal.hide();
                    loadExpenses(); // Reload expenses
                    Toast.showToast('Expense Added!');
                } else {
                    Toast.showToast('Error adding expense: ' + res);
                }
            }, function (e) {
                Toast.showToast('Error adding expense: ' + e);
            });
        } else if ($scope.isEdit) {
            // Update expense
            emAPI.updateExpense(expense).then(function (res) {
                if (!res.error) {
                    $scope.addExpenseModal.hide();
                    loadExpenses(); // Reload expenses
                    Toast.showToast('Expense Updated!');
                } else {
                    Toast.showToast('Error updating expense: ' + res);
                }
            }, function (e) {
                Toast.showToast('Error updating expense: ' + e);
            });
            $scope.addExpenseModal.hide();
        } else {
            // Enable Update
            $scope.isReadOnly = false;
            $scope.isEdit = true;
        }
    };
    // init new expense with current date
    $scope.initNewExpense = function () {
        $scope.isAdd = true;
        $scope.isEdit = false;
        $scope.isReadOnly = false;
        $scope.expense = {};
        $scope.expense.date = new Date();
        $scope.expense.date.setMilliseconds(0);
    };
    // init edit expense
    $scope.initEditExp = function (exp) {
        $scope.isAdd = false;
        $scope.isReadOnly = true;
        $scope.isEdit = false;

        var expense = angular.copy(exp);
        expense.date = new Date(expense.date);
        expense.date.setMilliseconds(0);

        expense.category = $scope.categories[indexById($scope.categories, expense.category_id)];
        // TODO issue with indexOf always returns -1
        // expense.category = {"id": expense.category_id, "name": expense.category};
        // expense.category = $scope.categories[$scope.categories.indexOf(expense.category)];
        $scope.expense = expense;

        $scope.isExpenseModified = false;

        var unbindWatch = $scope.$watch("expense", function (newData, oldData) {
            if (newData != oldData) {
                console.log("Expense updated!");
                $scope.isExpenseModified = true;
            } else {
                $scope.isExpenseModified = false;
            }
        }, true);
    };
    // Delete expense
    $scope.deleteExpense = function (expId) {
        $ionicListDelegate.closeOptionButtons();
        console.log(angular.toJson("DELETE Expense ID" + expId));
        emAPI.deleteExpense(expId).then(function (res) {
            if (!res.error) {
                Toast.showToast('Expense Deleted!');
                loadExpenses(); // Reload expenses
            } else {
                Toast.showToast('Error deleting expense: ' + res);
            }
        }, function (e) {
            Toast.showToast('Error deleting expense: ' + e);
        });
    };
    // Load expenses:
    function loadExpenses() {
        emAPI.getAllExpenses().then(function (response) {
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
        if (showLends) {
            $scope.showBorrows = !$scope.showBorrows;
        }
    };

    $scope.toggleLends = function (showBorrows) {
        if (showBorrows) {
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
emApp.controller('settingsCtrl', function ($scope, emAPI, $cookieStore, $ionicPopup, $ionicModal, $ionicListDelegate, $state, $window) {

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
                        // Logout user
                        $cookieStore.remove("userInfo");
                        $cookieStore.remove("userProfile");
                        $state.go('welcome');
                        $window.location.reload();
                        return;
                    }
                }
            ]
        });

//        myPopup.then(function (res) {
//            console.log('Tapped!', res);
//        });
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