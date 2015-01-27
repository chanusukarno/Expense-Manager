var emApp = angular.module('emApp.services', []);

// define the API in just one place so it's easy to update
var apiURL = '';
// var config = {timeout: 10000};
var config = {};
var ALL_EXPENSES, CURRENCIES, CATEGORIES, expensesMonthly, BORROWS_LENDS, EXPENSES_RECUR;

emApp.factory('emAPI', function ($http, $q, emConstants, $cookieStore) {

    function validateResponse(result) {
        return !(typeof result.data !== 'array' && typeof result.data !== 'object');
    }

    return {
        /* ----------------- Authentication Services ---------------- */

        // oauth login
        oauth: function (request) {
            return $http.post(emConstants.BASE_URL + emConstants.OAUTH, request, config);
        },

        //login
        login: function (request) {
            return $http.post(emConstants.BASE_URL + emConstants.LOGIN, request, config);
        },

        // register
        register: function (request) {
            return $http.post(emConstants.BASE_URL + emConstants.REGISTER, request, config);
        },

        /* ----------------- Profile Services ---------------- */

        // profile retrieve
        getProfile: function (profileId) {
            return $http.get(emConstants.BASE_URL + emConstants.PROFILE + "/" + profileId, config);
        },

        // update profile
        updateProfile: function (request) {
            return $http.put(emConstants.BASE_URL + emConstants.PROFILE + "/" + request.id, request, config);
        },

        /* ----------------- Config Services ---------------- */

        // Get all Currencies
        getCurrencies: function () {
            var q = $q.defer();
            if (!CURRENCIES) {
                $http.get(emConstants.BASE_URL + emConstants.CURRENCIES, config)
                    .then(function (result) {
                        console.log("SERVICES getCurrencies RESULT: " + angular.toJson(result));
                        if (!validateResponse(result) && result.data.error) {
                            q.reject(new Error('Invalid Response'));
                        } else {
                            CURRENCIES = result.data.currencies;
                            q.resolve(result.data.currencies);
                        }
                    }, function (e) {
                        console.log('getCurrencies/ Failed: ' + e);
                        q.reject(e);
                    });
            } else {
                q.resolve(CURRENCIES);
            }
            return q.promise;
        },

        // Get all user Categories
        getUserCategories: function () {
            var q = $q.defer();
            if (!CATEGORIES) {
                $http.get(emConstants.BASE_URL + emConstants.CATEGORIES, config)
                    .then(function (result) {
                        console.log("SERVICES getUserCategories RESULT: " + angular.toJson(result));
                        if (!validateResponse(result) && result.data.error) {
                            q.reject(new Error('Invalid Response'));
                        } else {
                            CATEGORIES = result.data.categories;
                            q.resolve(result.data.categories);
                        }
                    }, function (e) {
                        console.log('getUserCategories/ Failed: ' + e);
                        q.reject(e);
                    });
            } else {
                q.resolve(CATEGORIES);
            }
            return q.promise;
        },



        /* ----------------- Expenses Services ---------------- */

        // Get all expenses
        getAllExpenses: function () {
            var q = $q.defer();
            if (!ALL_EXPENSES) {
                $http.get(emConstants.BASE_URL + emConstants.API_EXPENSES, config)
                    .then(function (result) {
                        console.log("SERVICES getAllExpenses RESULT: " + angular.toJson(result));
                        if (!validateResponse(result) && result.data.error) {
                            q.reject(new Error('Invalid Response'));
                        } else {
                            ALL_EXPENSES = result.data.expenses;
                            q.resolve(result.data.expenses);
                        }
                    }, function (e) {
                        console.log('getAllExpenses/ Failed: ' + e);
                        q.reject(e);
                    });
            } else {
                q.resolve(ALL_EXPENSES);
            }
            return q.promise;
        },

        // Get all borrows and lends
        getAllBorrowsAndLends: function () {
            var q = $q.defer();
            if (!BORROWS_LENDS) {
                $http.get(emConstants.BASE_URL + emConstants.API_EXPENSES_BORROWS_LENDS, config)
                    .then(function (result) {
                        console.log("SERVICES getAllBorrowsAndLends RESULT: " + angular.toJson(result));
                        if (!validateResponse(result) && result.data.error) {
                            q.reject(new Error('Invalid Response'));
                        } else {
                            BORROWS_LENDS = result.data.expenses;
                            q.resolve(result.data.expenses);
                        }
                    }, function (e) {
                        console.log('getAllBorrowsAndLends/ Failed: ' + e);
                        q.reject(e);
                    });
            } else {
                q.resolve(BORROWS_LENDS);
            }
            return q.promise;
        },

        // Get all borrows and lends
        getAllRecurExpenses: function () {
            var q = $q.defer();
            if (!EXPENSES_RECUR) {
                $http.get(emConstants.BASE_URL + emConstants.API_EXPENSES_RECUR, config)
                    .then(function (result) {
                        console.log("SERVICES getAllBorrowsAndLends RESULT: " + angular.toJson(result));
                        if (!validateResponse(result) && result.data.error) {
                            q.reject(new Error('Invalid Response'));
                        } else {
                            EXPENSES_RECUR = result.data.expenses;
                            q.resolve(result.data.expenses);
                        }
                    }, function (e) {
                        console.log('getAllBorrowsAndLends/ Failed: ' + e);
                        q.reject(e);
                    });
            } else {
                q.resolve(EXPENSES_RECUR);
            }
            return q.promise;
        },

        // Add new Expense
        addExpense: function (request) {
            var q = $q.defer();
            // Transform request:
            var newExp = angular.copy(request);
            newExp.currencyName = "Rupee"; // TODO Defaulting to Rupee for now
            newExp.currencyCode = "&#x20B9;"; // TODO Defaulting to Rupee for now
            newExp.currency_id = 2; // TODO Defaulting to Rupee for now

            if(newExp.category) {
                newExp.category_id = newExp.category.id;
                newExp.category = newExp.category.name;
            }

            newExp.date = new Date(newExp.date).toMysqlFormat();

            console.log("addExpense REQUEST: " + angular.toJson(newExp));
            $http.post(emConstants.BASE_URL + emConstants.API_EXPENSES, newExp, config)
                .then(function(result) {
                    if (!validateResponse(result) && result.data.error) {
                        q.reject(new Error('Invalid Response'));
                    } else {
                        // update expense id
                        newExp.id = result.data.expenseId;
                        newExp.status = 0;
                        // Also update in local
                        var localExp = [];
                        if(!newExp.category) {
                            // Borrows/lends
                            localExp = BORROWS_LENDS;
                        } else if(newExp.type === emConstants.EXPENSE_RECUR) {
                            // Recur
                            localExp = EXPENSES_RECUR;
                        } else {
                            localExp = ALL_EXPENSES;
                        }

                        localExp.push(newExp);
                        q.resolve(result.data);
                    }
                }, function(err) {
                    console.log('expenses/ Failed: ' + err);
                    q.reject(err);

                });
            return q.promise;
        },

        // Add new Expense
        updateExpense: function (updatedExp) {
            var q = $q.defer();
            // Transform request:
            var upExp = angular.copy(updatedExp);
            upExp.currencyName = "Rupee"; // TODO Defaulting to Rupee for now
            upExp.currencyCode = "&#x20B9;"; // TODO Defaulting to Rupee for now
            upExp.currency_id = 2; // TODO Defaulting to Rupee for now

            upExp.date = new Date(upExp.date).toMysqlFormat();

            if(upExp.category) {
                upExp.category_id = upExp.category.id;
                upExp.category = upExp.category.name;
            }

            upExp.status ? upExp.status = 1 : upExp.status = 0;

            console.log("updateExpense REQUEST: " + angular.toJson(upExp));
            $http.put(emConstants.BASE_URL + emConstants.API_EXPENSES + "/" + upExp.id, upExp, config)
                .then(function(result) {
                    if (!validateResponse(result) && result.data.error) {
                        q.reject(new Error('Invalid Response'));
                    } else {
                        // Also update in local
                        var localExp = [];
                        if(!upExp.category) {
                            // Borrows/lends
                            localExp = BORROWS_LENDS;
                        } else if(upExp.type === emConstants.EXPENSE_RECUR) {
                            // Recur
                            localExp = EXPENSES_RECUR;
                        } else {
                            localExp = ALL_EXPENSES;
                        }

                        localExp.splice(indexById(localExp, upExp.id), 1, upExp);
                        q.resolve(result.data);
                    }
                }, function(err) {
                    console.log('expenses/ Failed: ' + err);
                    q.reject(err);

                });
            return q.promise;
        },

        // profile retrieve
        deleteExpense: function (expId) {
            var q = $q.defer();
            console.log("deleteExpense REQUEST: " + angular.toJson(expId));
            $http.delete(emConstants.BASE_URL + emConstants.API_EXPENSES + "/" + expId, config)
                .then(function(result) {
                    if (!validateResponse(result) && result.data.error) {
                        q.reject(new Error('Invalid Response'));
                    } else {
                        console.log("Expense DELETED successfully!");
                        // Delete expense from the local Data
                        if(ALL_EXPENSES && ALL_EXPENSES.length > 0) {
                            ALL_EXPENSES.splice(indexById(ALL_EXPENSES, expId), 1);
                        }
                        if(BORROWS_LENDS && BORROWS_LENDS.length > 0) {
                            BORROWS_LENDS.splice(indexById(BORROWS_LENDS, expId), 1);
                        }
                        if(EXPENSES_RECUR && EXPENSES_RECUR.length > 0) {
                            EXPENSES_RECUR.splice(indexById(EXPENSES_RECUR, expId), 1);
                        }
                        q.resolve(result.data);
                    }
                }, function(err) {
                    console.log('expenses/ Failed: ' + err);
                    q.reject(err);

                });
            return q.promise;
        },

        expensesMonthly: function () {
            var q = $q.defer();
            if (!expensesMonthly) {
                $http.get(apiURL + 'data/expensesMonthly.json', config)
                    .then(function (result) {
                        if (!validateResponse(result) && result.data.error) {
                            q.reject(new Error('Invalid Response'));
                        } else {
                            expensesMonthly = result.data;
                            q.resolve(result.data);
                        }
                    }, function (err) {
                        console.log('expenses/ Failed: ' + err);
                        q.reject(err);
                    });
            } else {
                q.resolve(expensesMonthly);
            }
            return q.promise;
        }

    };
});

// Utility
emApp.factory('Toast', function ($ionicLoading) {
    return {
        showToast: function(message) {
            if(typeof message == 'array' || typeof message == 'object') {
                message = angular.toJson(message);
            }
            $ionicLoading.show({template: message, noBackdrop: true, duration: 2000});
        }
    }
});

// get item index in array by 'id'
function indexById(array, id) {
    var index = -1;
    for(var i = 0; i < array.length; i++ ){
        if(array[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
}

