<?php

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

require_once '../include/DbHandler.php';
require_once '../include/PassHash.php';
require '.././libs/Slim/Slim.php';

\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();
$app->add(new \Slim\Middleware\ContentTypes());

// User id from db - Global Variable
$userId = NULL;

define('PROVIDER_GOOGLE', 'google');
define('PROVIDER_FACEBOOK', 'facebook');

/**
 * Adding Middle Layer to authenticate every request
 * Checking if the request has valid api key in the 'Authorization' header
 */
function authenticate(\Slim\Route $route) {
    // Getting request headers

    $response = array();
    $app = \Slim\Slim::getInstance();
    $headers = $app->request->headers();

    // Verifying Authorization Header
    if (isset($headers['Authorization'])) {
        $db = new DbHandler();

        // get the api key
        $api_key = $headers['Authorization'];
        // validating api key
        if (!$db->isValidApiKey($api_key)) {
            // api key is not present in users table
            $response["error"] = true;
            $response["message"] = "Access Denied. Invalid Api key";
            echoResponse(401, $response);
            $app->stop();
        } else {
            global $userId;
            // get user primary key id
            $userId = $db->getUserId($api_key);
        }
    } else {
        // api key is missing in header
        $response["error"] = true;
        $response["message"] = "Api key is misssing";
        echoResponse(400, $response);
        $app->stop();
    }
}

/**
 * ----------- METHODS WITHOUT AUTHENTICATION ---------------------------------
 */

/**
 * Social login
 * url - /oauth
 * method - POST
 * params - provider_key, provider_name, name, email, profile_pic
 */
$app->post('/oauth', function () use ($app) {
    // check for required params
    $request_params = $app->request->getBody();
    verifyRequiredParams(array('provider_key', 'provider_name', 'name', 'email'), $request_params);

    $response = array();

    // reading post params
    $providerKey = $request_params['provider_key'];
    $providerName = $request_params['provider_name'];
    $email = $request_params['email'];

    // validating email address
    validateEmail($email);
    // validating provider name
    validateProviderName($providerName);

    $db = new DbHandler();

    if ($db->checkEmail($email)) {
        // returning user 
        $userId = $db->getUserIdByEmail($email);
        // check for different provider
        if (!$db->checkAuthProvider($userId, $providerName)) {
            // insert the different provider into auth_provider table
            $isAuthProviderCreated = $db->createAuthProvider($providerKey, $providerName, $userId);
            if (!$isAuthProviderCreated) {
                $response["error"] = true;
                $response["message"] = "Failed to create Auth Provider";
                echoResponse(200, $response);
                $app->stop();
            }
        }
        // successful login, update profile
        $profileId = $db->getProfileIdByUserId($userId);
        // $db->updateProfile($userId, $profileId, $request_params); // TODO
        // successful login, echoing user details
        $response = getUserDetails($db, $email);
        $response["profileId"] = $profileId;
        $response["error"] = false;

    } else {
        // new user, insert into 'users' and 'auth_provider' tables and create 'profile'
        $res = $db->createUser($email, "");

        if ($res == USER_CREATED_SUCCESSFULLY) {
            // inert into auth_provider table
            $userId = $db->getUserIdByEmail($email);
            $isAuthProviderCreated = $db->createAuthProvider($providerKey, $providerName, $userId);

            // create profile
            $profileId = $db->createProfile($userId, $request_params);

            if ($profileId != NULL && $isAuthProviderCreated) {
                // successful login, echoing user details
                $response = getUserDetails($db, $email);
                $response["profileId"] = $profileId;
                $response["error"] = false;
            } else {
                $response["error"] = true;
                $response["message"] = "Failed to create Profile";
            }

        } else if ($res == USER_CREATE_FAILED) {
            $response["error"] = true;
            $response["message"] = "Oops! An error occurred while registering. Try again!";
        }
    }

    // echo json response
    echoResponse(200, $response);
});

/**
 * User Registration
 * url - /register
 * method - POST
 * params - name, email, password
 */
$app->post('/register', function () use ($app) {
    // check for required params
    $request_params = $app->request->getBody();
    verifyRequiredParams(array('name', 'email', 'password'), $request_params);

    $response = array();

    // reading post params
    $email = $request_params['email'];
    $password = $request_params['password'];

    // validating email address
    validateEmail($email);

    $db = new DbHandler();
    $res = $db->createUser($email, $password);

    if ($res == USER_CREATED_SUCCESSFULLY) {
        // Add name to profile
        $userId = $db->getUserIdByEmail($email);
        $profileId = $db->createProfile($userId, $request_params);

        if ($profileId != NULL) {
            $response = getUserDetails($db, $email);
            $response["profileId"] = $profileId;
            $response["error"] = false;
        } else {
            $response["error"] = true;
            $response["message"] = "Failed to create Profile";
        }
    } else if ($res == USER_CREATE_FAILED) {
        $response["error"] = true;
        $response["message"] = "Oops! An error occurred while registering. Try again!";
    } else if ($res == USER_ALREADY_EXISTED) {
        $response["error"] = true;
        $response["message"] = "Sorry, this email already exists";
    }
    // echo json response
    echoResponse(201, $response);
});

/**
 * User Login
 * url - /login
 * method - POST
 * params - email, password
 */
$app->post('/login', function () use ($app) {
    // check for required params
    $request_params = $app->request->getBody();
    verifyRequiredParams(array('email', 'password'), $request_params);

    // reading post params
    $email = $request_params['email'];
    $password = $request_params['password'];

    $response = array();

    $db = new DbHandler();
    // check for correct email and password
    if ($db->checkLogin($email, $password)) {
        $userId = $db->getUserIdByEmail($email);
        $profileId = $db->getProfileIdByUserId($userId);
        // echo user details with profileId
        if ($profileId != NULL) {
            $response = getUserDetails($db, $email);
            $response["profileId"] = $profileId;
            $response["error"] = false;
        } else {
            $response["error"] = true;
            $response["message"] = "Failed to fetch Profile";
        }

    } else {
        // user credentials are wrong
        $response['error'] = true;
        $response['message'] = 'Login failed. Incorrect credentials';
    }

    echoResponse(200, $response);
});

/*
 * ------------------------ METHODS WITH AUTHENTICATION ------------------------
 */

/* ----------------------- 'Profile' Methods -------------------------------------

/**
 * Creating new profile
 * method POST
 */
$app->post('/profile', 'authenticate', function () use ($app) {
    // check for required params
    $request_params = $app->request->getBody();
    // verifyRequiredParams(array('name', 'profilePic', 'country', 'phone', 'dob', 'gender'), $request_params);

    $response = array();

    global $userId;
    $db = new DbHandler();

    // creating new task
    $profile_id = $db->createProfile($userId, $request_params);

    if ($profile_id != NULL) {
        $response["error"] = false;
        $response["message"] = "Profile created successfully";
        $response["profile_id"] = $profile_id;
        echoResponse(201, $response);
    } else {
        $response["error"] = true;
        $response["message"] = "Failed to create Profile. Please try again";
        echoResponse(200, $response);
    }
});

/**
 * Get user profile for id
 * method GET
 * url /profile/:id
 */
$app->get('/profile/:id', 'authenticate', function ($profileId) {
    global $userId;
    $response = array();
    $db = new DbHandler();

    // fetch task
    $result = $db->getProfile($userId, $profileId);

    if ($result != NULL) {
        $response = $result;
        $response["error"] = false;

//        // change date format
//        if(isset($response["dob"]) && strlen(trim($response["dob"])) > 0) {
//            $sqlDate = $response["dob"];
//            if($sqlDate !== "0000-00-00") {
//                $sqlDate = str_replace('/', '-', $sqlDate);
//                $response["dob"] = strtotime($sqlDate) * 1000;
//            } else {
//                $response["dob"] = "";
//            }
//
//        }

        echoResponse(200, $response);
    } else {
        $response["error"] = true;
        $response["message"] = "The requested resource doesn't exists";
        echoResponse(404, $response);
    }
});

/**
 * Updating existing profile
 * method PUT
 */
$app->put('/profile/:id', 'authenticate', function ($profileId) use ($app) {
    // check for required params
    $request_params = $app->request->getBody();
    verifyRequiredParams(array('name'), $request_params);

    global $userId;

    $db = new DbHandler();
    $response = array();

    // change date to sql format
    if(isset($request_params["dob"]) && strlen(trim($request_params["dob"])) > 0) {
        $oldDate = $request_params["dob"];
        $oldDate = str_replace('/', '-', $oldDate);
        $request_params["dob"] = date('Y-m-d', strtotime($oldDate));
    }

    // updating profile
    $result = $db->updateProfile($userId, $profileId, $request_params);
    if ($result) {
        // task updated successfully
        $response["error"] = false;
        $response["message"] = "Profile updated successfully";
    } else {
        // task failed to update
        $response["error"] = true;
        $response["message"] = "Failed to update Profile. Please try again!";
    }
    echoResponse(200, $response);
});

/* ----------------------- 'categories' Methods -------------------------------------

/**
 * Creating new category
 * method POST
 */
$app->post('/categories', 'authenticate', function () use ($app) {
    // check for required params
    $request_params = $app->request->getBody();
    verifyRequiredParams(array('name'), $request_params);

    $response = array();

    global $userId;
    $db = new DbHandler();

    // creating new task
    $categoryId = $db->createCategory($userId, $request_params);

    if ($categoryId != NULL) {
        $response["error"] = false;
        $response["message"] = "Category created successfully";
        $response["categoryId"] = $categoryId;
        echoResponse(201, $response);
    } else {
        $response["error"] = true;
        $response["message"] = "Failed to create Category. Please try again";
        echoResponse(200, $response);
    }
});

/**
 * Listing all categories
 * method GET
 * url /categories
 */
$app->get('/categories', 'authenticate', function () {
    global $userId;
    $response = array();
    $db = new DbHandler();

    // fetching all user tasks
    $result = $db->getAllUserCategories($userId);

    $response["error"] = false;
    $response["categories"] = $result;

    echoResponse(200, $response);
});

/**
 * Updating category
 * method PUT
 */
$app->put('/category/:id', 'authenticate', function ($categoryId) use ($app) {
    // check for required params
    $request_params = $app->request->getBody();
    verifyRequiredParams(array('name'), $request_params);

    global $userId;

    $db = new DbHandler();
    $response = array();

    // updating task
    $result = $db->updateCategory($userId, $categoryId, $request_params);
    if ($result) {
        // task updated successfully
        $response["error"] = false;
        $response["message"] = "Category updated successfully";
    } else {
        // task failed to update
        $response["error"] = true;
        $response["message"] = "Failed to update category. Please try again!";
    }
    echoResponse(200, $response);
});

/**
 * Delete category
 * method DELETE
 * url /categories
 */
$app->delete('/categories/:id', 'authenticate', function ($categoryId) use ($app) {
    global $userId;

    $db = new DbHandler();
    $response = array();
    $result = $db->deleteTask($userId, $categoryId);
    if ($result) {
        // category deleted successfully
        $response["error"] = false;
        $response["message"] = "Category deleted succesfully";
    } else {
        // category failed to delete
        $response["error"] = true;
        $response["message"] = "Task failed to category. Please try again!";
    }
    echoResponse(200, $response);
});

/* ----------------------- 'expenses' Methods -------------------------------------

/**
 * Creating new expense
 * method POST
 */
$app->post('/expenses', 'authenticate', function () use ($app) {
    // check for required params
    $request_params = $app->request->getBody();
    verifyRequiredParams(array('title', 'amount', 'date'), $request_params);

    $response = array();

    global $userId;
    $db = new DbHandler();

    // creating new task
    $expenseId = $db->createExpense($userId, $request_params);

    if ($expenseId != NULL) {
        $response["error"] = false;
        $response["message"] = "Expense created successfully";
        $response["expenseId"] = $expenseId;
        echoResponse(201, $response);
    } else {
        $response["error"] = true;
        $response["message"] = "Failed to create Expense. Please try again";
        echoResponse(200, $response);
    }
});

///**
// * Get user expense for id
// * method GET
// * url /expenses/:id
// */
//$app->get('/expenses/:id', 'authenticate', function ($expenseId) {
//    global $userId;
//    $response = array();
//    $db = new DbHandler();
//
//    // fetch task
//    $result = $db->getExpense($userId, $expenseId);
//
//    if ($result != NULL) {
//        $response = $result;
//        $response["error"] = false;
//
//        // change date format
//        if(isset($response["date"]) && strlen(trim($response["date"])) > 0) {
//            $sqlDate = $response["date"];
//            if($sqlDate !== "0000-00-00") {
//                $sqlDate = str_replace('/', '-', $sqlDate);
//                $response["date"] = strtotime($sqlDate) * 1000;
//            } else {
//                $response["date"] = "";
//            }
//
//        }
//
//        echoResponse(200, $response);
//    } else {
//        $response["error"] = true;
//        $response["message"] = "The requested resource doesn't exist";
//        echoResponse(404, $response);
//    }
//});

/**
 * Get all expenses
 * method GET
 * url /categories
 */
$app->get('/expenses', 'authenticate', function () {
    global $userId;
    $response = array();
    $db = new DbHandler();

    // fetching all user tasks
    $result = $db->getAllUserExpenses($userId);

    $response["error"] = false;
    $response["expenses"] = $result;

    echoResponse(200, $response);
});

/**
 * Get all borrows and lends
 * method GET
 * url /categories
 */
$app->get('/expenses/:type', 'authenticate', function ($type) {
    global $userId;
    $response = array();
    $db = new DbHandler();

    // fetching all user tasks
    if($type === 'recur') {
        $result = $db->getAllUserRecurExpenses($userId);
    } else if($type === 'borrowslends') {
        $result = $db->getAllUserBorrowsAndLends($userId);
    }

    $response["error"] = false;
    $response["expenses"] = $result;

    echoResponse(200, $response);
});

/**
 * Updating expense
 * method PUT
 */
$app->put('/expenses/:id', 'authenticate', function ($expenseId) use ($app) {
    // check for required params
    $request_params = $app->request->getBody();
    verifyRequiredParams(array('title', 'amount', 'date'), $request_params);

    global $userId;

    $db = new DbHandler();
    $response = array();

//    // change date format
//    if(isset($request_params["date"]) && strlen(trim($request_params["date"])) > 0) {
//        $oldDate = $request_params["date"];
//        $oldDate = str_replace('/', '-', $oldDate);
//        $request_params["date"] = date('Y-m-d', strtotime($oldDate));
//    }

    // updating profile
    $result = $db->updateExpense($userId, $expenseId, $request_params);
    if ($result) {
        // task updated successfully
        $response["error"] = false;
        $response["message"] = "Profile updated successfully";
    } else {
        // task failed to update
        $response["error"] = true;
        $response["message"] = "Failed to update Profile. Please try again!";
    }
    echoResponse(200, $response);
});

/**
 * Delete expense
 * method DELETE
 * url /expenses
 */
$app->delete('/expenses/:id', 'authenticate', function ($expense_id) use ($app) {
    global $userId;

    $db = new DbHandler();
    $response = array();
    $result = $db->deleteExpense($userId, $expense_id);
    if ($result) {
        // expense deleted successfully
        $response["error"] = false;
        $response["message"] = "Expense deleted successfully";
    } else {
        // expense failed to delete
        $response["error"] = true;
        $response["message"] = "Failed to delete expense. Please try again!";
    }
    echoResponse(200, $response);
});

/* ----------------------- 'Currencies' Methods -------------------------------------

/**
 * Get all currencies
 * method GET
 * url /currencies
 */
$app->get('/currencies', 'authenticate', function () {
    global $userId;
    $response = array();
    $db = new DbHandler();

    // fetching all user tasks
    $result = $db->getAllCurrencies($userId);

    $response["error"] = false;
    $response["currencies"] = $result;

    echoResponse(200, $response);
});

/* ----------------------- 'Util' Methods -------------------------------------

/**
 * Verifying required params posted or not
 */
function verifyRequiredParams($required_fields, $request_params) {
    $error = false;
    $error_fields = "";

    foreach ($required_fields as $field) {
        if (!isset($request_params[$field]) || strlen(trim($request_params[$field])) <= 0) {
            $error = true;
            $error_fields .= $field . ', ';
        }
    }

    if ($error) {
        // Required field(s) are missing or empty
        // echo error json and stop the app
        $response = array();
        $app = \Slim\Slim::getInstance();
        $response["error"] = true;
        $response["message"] = 'Required field(s) ' . substr($error_fields, 0, -2) . ' is missing or empty';
        echoResponse(400, $response);
        $app->stop();
    }
}

/**
 * Validating email address
 */
function validateEmail($email) {
    $app = \Slim\Slim::getInstance();
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response["error"] = true;
        $response["message"] = 'Email address is not valid';
        echoResponse(400, $response);
        $app->stop();
    }
}

/**
 * Validate provider name
 */
function validateProviderName($providerName) {
    $app = \Slim\Slim::getInstance();
    if ($providerName !== PROVIDER_FACEBOOK && $providerName !== PROVIDER_GOOGLE) {
        $response["error"] = true;
        $response["message"] = "Invalid provider name, values: "
            . PROVIDER_FACEBOOK . " and "
            . PROVIDER_GOOGLE . " are only allowed";
        echoResponse(400, $response);
        $app->stop();
    }
}

/**
 * echoing user details
 */
function getUserDetails($db, $email) {
    $response = array();
    $user = $db->getUserByEmail($email);

    if ($user != NULL) {
        $response["error"] = false;
        $response['email'] = $user['email'];
        $response['apiKey'] = $user['api_key'];
        $response['createdAt'] = $user['created_at'];
    } else {
        // unknown error occurred
        $response['error'] = true;
        $response['message'] = "An error occurred. Please try again";
    }

    return $response;
}

/**
 * Echoing json response to client
 * @param String $status_code Http response code
 * @param String $response Json response
 */
function echoResponse($status_code, $response) {
    $app = \Slim\Slim::getInstance();
    // Http response code
    $app->status($status_code);

    // setting response content type to json
    $app->contentType('application/json');

    echo json_encode($response);
    $app->stop();
}

$app->run();
?>