var emApp = angular.module('emApp.services', []);

// define the API in just one place so it's easy to update
var apiURL = '';
// var config = {timeout: 10000};
var config = {};
var ALL_EXPENSES, CURRENCIES, CATEGORIES, expensesMonthly;

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
                $http.get(emConstants.BASE_URL + emConstants.EXPENSES, config)
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

        // Add new Expense
        addExpense: function (request) {
            // Transform request:
            var newExp = angular.copy(request);
            newExp.currencyName = "Rupee"; // TODO Defaulting to Rupee for now
            newExp.currencyCode = "&#x20B9;"; // TODO Defaulting to Rupee for now
            newExp.currency_id = 2; // TODO Defaulting to Rupee for now
            newExp.category_id = newExp.category.id;
            newExp.date = new Date(newExp.date).toMysqlFormat();
            newExp.category = newExp.category.name;
            // Also push to Expenses array for local use
            ALL_EXPENSES.push(newExp);
            return $http.post(emConstants.BASE_URL + emConstants.EXPENSES, newExp, config);
        },

        expensesMonthly: function () {
            var q = $q.defer();
            if (!expensesMonthly) {
                $http.get(apiURL + 'data/expensesMonthly.json', config)
                    .then(function (result) {
                        if (!validateResponse(result) && !result.data.error) {
                            q.reject(new Error('Invalid Response'));
                        } else {
                            expensesMonthly = result.data;
                            q.resolve(result.data);
                        }
                    }, function (err) {
                        console.log('expenses/ Failed');
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
function getCategoryByName(catName) {
    angular.forEach(CATEGORIES, function(d) {
        if(d.name === catName)
        return d.id;

    })
}

