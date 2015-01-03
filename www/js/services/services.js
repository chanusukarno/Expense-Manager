var emApp = angular.module('emApp.services', []);

emApp.factory('emAPI', function ($http, $q, emConstants, transformRequestAsFormPost) {
    // define the API in just one place so it's easy to update
    var apiURL = '', config = {timeout: 10000};

    var expenses, expensesMonthly;

    function validateResponse(result) {
        return !(typeof result.data !== 'array' && typeof result.data !== 'object');
    }

    return {
        //login
        login: function (request) {
//            var request = $http({
//                    method: "post",
//                    url: emConstants.BASE_URL + emConstants.LOGIN,
//                    transformRequest: transformRequestAsFormPost,
//                    data: request
//                });
            return $http.post(emConstants.BASE_URL + emConstants.LOGIN, request, config);
        },
        register: function (request) {
            return $http.post(emConstants.BASE_URL + emConstants.REGISTER, request, config);
        },
        // get all recent posts
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

emApp.factory("transformRequestAsFormPost", function () {

    // I prepare the request data for the form post.
    function transformRequest(data, getHeaders) {

        var headers = getHeaders();

        headers[ "Content-type" ] = "application/x-www-form-urlencoded; charset=utf-8";

        return(serializeData(data));

    }


    // Return the factory value.
    return(transformRequest);


    // ---
    // PRVIATE METHODS.
    // ---


    // I serialize the given Object into a key-value pair string. This
    // method expects an object and will default to the toString() method.
    // --
    // NOTE: This is an atered version of the jQuery.param() method which
    // will serialize a data collection for Form posting.
    // --
    // https://github.com/jquery/jquery/blob/master/src/serialize.js#L45
    function serializeData(data) {

        // If this is not an object, defer to native stringification.
        if (!angular.isObject(data)) {

            return((data == null) ? "" : data.toString());

        }

        var buffer = [];

        // Serialize each key in the object.
        for (var name in data) {

            if (!data.hasOwnProperty(name)) {
                continue;
            }

            var value = data[name];

            buffer.push(
                    encodeURIComponent(name) +
                    "=" +
                    encodeURIComponent((value == null) ? "" : value)
                    );

        }

        // Serialize the buffer and clean it up for transportation.
        var source = buffer
                .join("&")
                .replace(/%20/g, "+")
                ;

        return(source);
    }
}
);
