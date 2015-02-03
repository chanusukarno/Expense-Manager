var emApp = angular.module('emApp.config', []);

emApp.constant('emConstants', {
    "APP_NAME": "EXPENSE MANAGER",
    "APP_VERSION": "0.0.1",
    // "BASE_URL": "http://em.techiedreams.com/services/v1/", // Remote
    "BASE_URL": "http://localhost:8899/EM-Services/v1/", // Local
    "OAUTH": "oauth",
    "LOGIN": "login",
    "PROFILE": "profile",
    "REGISTER": "register",
    "API_EXPENSES": "expenses",
    "API_EXPENSES_RECUR": "expenses/recur",
    "API_EXPENSES_BORROWS_LENDS": "expenses/borrowslends",
    "CURRENCIES": "currencies",
    "CATEGORIES": "categories",
    "PROVIDER_GOOGLE": "google",
    "PROVIDER_FACEBOOK": "facebook",
    "EXPENSE_GENERAL": "general",
    "EXPENSE_RECUR": "recur",
    "EXPENSE_BORROW": "borrow",
    "EXPENSE_LENT": "lend"
});