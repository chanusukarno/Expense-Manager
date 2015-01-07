var emApp = angular.module('emApp.services', []);

emApp.factory('emAPI', function ($http, $q, emConstants) {
    // define the API in just one place so it's easy to update
    var apiURL = '';
    // var config = {timeout: 10000};
    var config = {};

    var expenses, expensesMonthly;

    function validateResponse(result) {
        return !(typeof result.data !== 'array' && typeof result.data !== 'object');
    }

    return {
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

        // get all expenses
        expenses: function () {
            var q = $q.defer();
            if (!expenses) {
                $http.get(apiURL + 'data/expenses.json', config)
                        .then(function (result) {
                            if (!validateResponse(result)) {
                                q.reject(new Error('Invalid Response'));
                            } else {
                                expenses = result.data;
                                q.resolve(result.data);
                            }
                        }, function (err) {
                            console.log('expenses/ Failed');
                            q.reject(err);
                        });
            } else {
                q.resolve(expenses);
            }
            return q.promise;
        },
        expensesMonthly: function () {
            var q = $q.defer();
            if (!expensesMonthly) {
                $http.get(apiURL + 'data/expensesMonthly.json', config)
                        .then(function (result) {
                            if (!validateResponse(result)) {
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
        },
        addExpense: function (expense) {
            expense.id = expenses.length + 1;
            expense.currency = "&#8377;";
            expenses.push(expense);
        }


    };
});
