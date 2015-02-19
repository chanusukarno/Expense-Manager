<?php

/**
 * Class to handle all db operations
 * This class will have CRUD methods for database tables
 *
 * @author Chanakya V
 */
class DbHandler {

    private $conn;
    private $defaultCategories = array("Food", "Grocery", "Snacks", "Entertainment", "Shopping", "Vehicle", "Cigarettes", "Alcohol", "Donation", "Cosmetics", "Party");
    function __construct()
    {
        require_once dirname(__FILE__) . '/DbConnect.php';
        // opening db connection
        $db = new DbConnect();
        $this->conn = $db->connect();
    }

    /* ------------- `users` table method ------------------ */

    /**
     * Creating new user
     * @param String $name User full name
     * @param String $email User login email id
     * @param String $password User login password
     */
    public function createUser($email, $password) {
        require_once 'PassHash.php';

        // First check if user already existed in db
        if (!$this->isUserExists($email)) {
            // Generating password hash
            $password_hash = PassHash::hash($password);

            // Generating API key
            $api_key = $this->generateApiKey();

            // insert query
            $stmt = $this->conn->prepare("INSERT INTO users(email, password_hash, api_key, status) values(?, ?, ?, 1)");
            $stmt->bind_param("sss", $email, $password_hash, $api_key);

            $result = $stmt->execute();
            $userId = $this->conn->insert_id;
            $stmt->close();

            // Check for successful insertion
            if ($result) {
                // User successfully inserted
                // Set default user categories
                $this->addDefaultCategories($userId);
                return USER_CREATED_SUCCESSFULLY;
            } else {
                // Failed to create user
                return USER_CREATE_FAILED;
            }
        } else {
            // User with same email already existed in the db
            return USER_ALREADY_EXISTED;
        }

    }

    /**
     * Checking user login
     * @param String $email User login email id
     * @param String $password User login password
     * @return boolean User login status success/fail
     */
    public function checkLogin($email, $password) {
        // fetching user by email
        $stmt = $this->conn->prepare("SELECT password_hash FROM users WHERE email = ?");

        $stmt->bind_param("s", $email);

        $stmt->execute();

        $stmt->bind_result($password_hash);

        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            // Found user with the email
            // Now verify the password

            $stmt->fetch();

            $stmt->close();

            if (PassHash::check_password($password_hash, $password)) {
                // User password is correct
                return TRUE;
            } else {
                // user password is incorrect
                return FALSE;
            }
        } else {
            $stmt->close();

            // user not existed with the email
            return FALSE;
        }
    }

    /**
     * Checking user email
     * @param String $email User login email id
     * @param String $password User login password
     * @return boolean User login status success/fail
     */
    public function checkEmail($email) {
        // fetching user by email
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE email = ?");

        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            // user exists with email
            $stmt->close();
            return TRUE;
        } else {
            // user not exist with email
            $stmt->close();
            return FALSE;
        }
    }

    /*
     * createAuthProvider
     * @param
     */
    public function createAuthProvider($providerKey, $providerName, $userId)
    {
        require_once 'PassHash.php';
        // insert query
        $stmt = $this->conn->prepare("INSERT INTO auth_provider(provider_key, provider_name, user_id) values(?, ?, ?)");
        $stmt->bind_param("sss", $providerKey, $providerName, $userId);

        $result = $stmt->execute();

        $stmt->close();

        // Check for successful insertion
        return $result ? TRUE : FALSE;

        return NULL;
    }

    /**
     * Checking for duplicate user by email address
     * @param String $email email to check in db
     * @return boolean
     */
    private function isUserExists($email)
    {
        $stmt = $this->conn->prepare("SELECT id from users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();
        $num_rows = $stmt->num_rows;
        $stmt->close();
        return $num_rows > 0;
    }

    /**
     * Fetching user by email
     * @param String $email User email id
     */
    public function getUserByEmail($email)
    {
        $stmt = $this->conn->prepare("SELECT email, api_key, status, created_at FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        if ($stmt->execute()) {
            // $user = $stmt->get_result()->fetch_assoc();
            $stmt->bind_result($email, $api_key, $status, $created_at);
            $stmt->fetch();
            $user = array();
            $user["email"] = $email;
            $user["api_key"] = $api_key;
            $user["status"] = $status;
            $user["created_at"] = $created_at;
            $stmt->close();
            return $user;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching user api key
     * @param String $user_id user id primary key in user table
     */
    public function getApiKeyById($user_id)
    {
        $stmt = $this->conn->prepare("SELECT api_key FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        if ($stmt->execute()) {
            // $api_key = $stmt->get_result()->fetch_assoc();
            // TODO
            $stmt->bind_result($api_key);
            $stmt->close();
            return $api_key;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching user id by api key
     * @param String $api_key user api key
     */
    public function getUserId($api_key)
    {
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE api_key = ?");
        $stmt->bind_param("s", $api_key);
        if ($stmt->execute()) {
            $stmt->bind_result($user_id);
            $stmt->fetch();
            // TODO
            // $user_id = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $user_id;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching user id
     * @param String $email in user table
     */
    public function getUserIdByEmail($email)
    {
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        if ($stmt->execute()) {
            $stmt->bind_result($userId);
            $stmt->fetch();
            // $api_key = $stmt->get_result()->fetch_assoc();
            // TODO
            $stmt->close();
            return $userId;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching user api key
     * @param String $user_id user id primary key in user table
     */
    public function checkAuthProvider($user_id, $providerName)
    {
        $stmt = $this->conn->prepare("SELECT * FROM auth_provider WHERE user_id = ? AND provider_name = ?");
        $stmt->bind_param("is", $user_id, $providerName);
        $stmt->execute();
        $stmt->store_result();
        $num_rows = $stmt->num_rows;
        return $num_rows > 0 ? TRUE : FALSE;
    }

    /**
     * Validating user api key
     * If the api key is there in db, it is a valid key
     * @param String $api_key user api key
     * @return boolean
     */
    public function isValidApiKey($api_key)
    {
        $stmt = $this->conn->prepare("SELECT id from users WHERE api_key = ?");
        $stmt->bind_param("s", $api_key);
        $stmt->execute();
        $stmt->store_result();
        $num_rows = $stmt->num_rows;
        $stmt->close();
        return $num_rows > 0;
    }

    /**
     * Fetching profile id by user id
     */
    public function getProfileIdByUserId($userId) {
        $stmt = $this->conn->prepare("SELECT profile_id FROM user_profiles WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        if ($stmt->execute()) {
            $stmt->bind_result($profileId);
            $stmt->fetch();
            $stmt->close();
            return $profileId;
        } else {
            return NULL;
        }
    }

    /**
     * Generating random Unique MD5 String for user Api key
     */
    private function generateApiKey() {
        return md5(uniqid(rand(), true));
    }

    /* ------------- 'profile' table methods ---------------- */

    /**
     * Creating new profile
     * @param String $userId user id to whom profile belongs to
     * @param String $requestParams
     */
    public function createProfile($userId, $requestParams) {
        $stmt = $this->conn->prepare("INSERT INTO profiles(name, profile_pic, country, phone, dob, gender) VALUES(?, ?, ?, ?, ?, ?)");

        isset($requestParams['name']) ? $name = $requestParams['name'] : $name = '';
        isset($requestParams['profilePic']) ? $profilePic = $requestParams['profilePic'] : $profilePic = '';
        isset($requestParams['country']) ? $country = $requestParams['country'] : $country = '';
        isset($requestParams['phone']) ? $phone = $requestParams['phone'] : $phone = '';
        isset($requestParams['dob']) ? $dob = $requestParams['dob'] : $dob = '';
        isset($requestParams['gender']) ? $gender = $requestParams['gender'] : $gender = '';

        $stmt->bind_param("ssssss", $name, $profilePic, $country, $phone, $dob, $gender);
        $result = $stmt->execute();

        if ($result) {
            // profile row created
            // now assign the profile to user
            $profileId = $this->conn->insert_id;
            $res = $this->createUserProfile($userId, $profileId);
            if ($res) {
                //$stmt->close();
                // task created successfully
                return $profileId;
            } else {
                // task failed to create
                return NULL;
            }
        } else {
            // task failed to create
            return NULL;
        }
    }

    /**
     * Fetching user profile
     * @param String $user_id
     */
    public function getProfile($user_id, $profileId) {
        // $profileId = getProfileIdByUserId($user_id);
        $stmt = $this->conn->prepare("SELECT p.id, p.name, p.profile_pic, p.country, p.phone, p.dob, p.gender from profiles p, user_profiles up WHERE p.id = ? AND up.profile_id = p.id AND up.user_id = ?");
        $stmt->bind_param("ii", $profileId, $user_id);
        if ($stmt->execute()) {
            $res = array();
            $stmt->bind_result($id, $name, $profilePic, $country, $phone, $dob, $gender);
            $stmt->fetch();
            $res["id"] = $id;
            $res["name"] = $name;
            $res["profilePic"] = $profilePic;
            $res["country"] = $country;
            $res["phone"] = $phone;
            $res["dob"] = $dob;
            $res["gender"] = $gender;
            $stmt->close();
            return $res;
        } else {
            return NULL;
        }
    }

    /**
     * Update profile
     * @param String $userId
     * @param String $profileId id of the profile
     * @param String $requestParams
     */
    public function updateProfile($userId, $profileId, $requestParams) {
        $stmt = $this->conn->prepare("UPDATE profiles p, user_profiles up set p.name = ?, p.profile_pic = ?, p.country = ?, p.phone = ?, p.dob = ?, p.gender = ?   WHERE p.id = ? AND p.id = up.profile_id AND up.user_id = ?");

        isset($requestParams['name']) ? $name = $requestParams['name'] : $name = '';
        isset($requestParams['profilePic']) ? $profilePic = $requestParams['profilePic'] : $profilePic = '';
        isset($requestParams['country']) ? $country = $requestParams['country'] : $country = '';
        isset($requestParams['phone']) ? $phone = $requestParams['phone'] : $phone = '';
        isset($requestParams['dob']) ? $dob = $requestParams['dob'] : $dob = '';
        isset($requestParams['gender']) ? $gender = $requestParams['gender'] : $gender = '';

        $stmt->bind_param("ssssssii", $name, $profilePic, $country, $phone, $dob, $gender, $profileId, $userId);
        $stmt->execute();
        $num_affected_rows = $stmt->affected_rows;
        $stmt->close();
        return $num_affected_rows > 0;
    }

    /* ------------- `user_profiles` table method ------------------ */

    /**
     * Function to assign profile to user
     * @param String $user_id id of the user
     * @param String $profile_id id of the profile
     */
    public function createUserProfile($userId, $profileId) {
        $stmt = $this->conn->prepare("INSERT INTO user_profiles(user_id, profile_id) values(?, ?)");
        $stmt->bind_param("ii", $userId, $profileId);
        $result = $stmt->execute();

        if (false === $result) {
            die('execute() failed: ' . htmlspecialchars($stmt->error));
        }
        $stmt->close();
        return $result;
    }

    /* ------------- 'categories' table methods ---------------- */

    /**
     * Add default categories
     * @param String $userId
     */
    private function addDefaultCategories($userId) {
        $stmt = $this->conn->prepare("INSERT INTO categories(name) VALUES(?)");

        foreach($this->defaultCategories as $cat) {
            $name = $cat;
            $stmt->bind_param("s", $name);
            $result = $stmt->execute();

            if ($result) {
                // category row created
                // now assign the category to user
                $categoryId = $this->conn->insert_id;
                $this->createUserCategory($userId, $categoryId);
            }
        }
        $stmt->close();
    }

    /**
     * Creating new category
     * @param String $userId
     * @param String $requestParams
     */
    public function createCategory($userId, $requestParams) {
        $stmt = $this->conn->prepare("INSERT INTO categories(name) VALUES(?)");

        isset($requestParams['name']) ? $name = $requestParams['name'] : $name = '';

        $stmt->bind_param("s", $name);
        $result = $stmt->execute();

        if ($result) {
            // category row created
            // now assign the category to user
            $categoryId = $this->conn->insert_id;
            $res = $this->createUserCategory($userId, $categoryId);
            if ($res) {
                //$stmt->close();
                // task created successfully
                return $categoryId;
            } else {
                // task failed to create
                return NULL;
            }
        } else {
            // task failed to create
            return NULL;
        }
    }

    /**
     * Fetching all user categories
     * @param String $user_id
     */
    public function getAllUserCategories($user_id) {
        $stmt = $this->conn->prepare("SELECT c.id, c.name FROM categories c, user_categories uc WHERE c.id = uc.category_id AND uc.user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $results = $this->dynamicBindResults($stmt);
        $stmt->close();
        return $results;
    }

    /**
     * Update category
     * @param String $userId
     * @param String $categoryId id of the profile
     * @param String $requestParams
     */
    public function updateCategory($userId, $categoryId, $requestParams)
    {
        $stmt = $this->conn->prepare("UPDATE categories c, user_categories uc set c.name = ? WHERE c.id = ? AND c.id = up.category_id AND up.user_id = ?");

        isset($requestParams['name']) ? $name = $requestParams['name'] : $name = '';

        $stmt->bind_param("sii", $name, $categoryId, $userId);
        $stmt->execute();
        $num_affected_rows = $stmt->affected_rows;
        $stmt->close();
        return $num_affected_rows > 0;
    }

    /**
     * Delete category
     * @param String $user_id
     * @param String $category_id
     */
    public function deleteCategory($user_id, $category_id) {
        $stmt = $this->conn->prepare("DELETE c FROM categories c, user_categories uc WHERE c.id = ? AND uc.category_id = c.id AND uc.user_id = ?");
        $stmt->bind_param("ii", $category_id, $user_id);
        $stmt->execute();
        $num_affected_rows = $stmt->affected_rows;
        $stmt->close();
        return $num_affected_rows > 0;
    }

    /* ------------- `user_categories` table method ------------------ */

    /**
     * Function to assign category to user
     * @param String $user_id id of the user
     * @param String $category_id id of the profile
     */
    public function createUserCategory($userId, $categoryId) {
        $stmt = $this->conn->prepare("INSERT INTO user_categories(user_id, category_id) values(?, ?)");
        $stmt->bind_param("ii", $userId, $categoryId);
        $result = $stmt->execute();

        if (false === $result) {
            die('execute() failed: ' . htmlspecialchars($stmt->error));
        }
        $stmt->close();
        return $result;
    }

    /* ------------- `currencies` table method ------------------ */

    /**
     * Fetching all user categories
     * @param String $user_id
     */
    public function getAllCurrencies() {
        $stmt = $this->conn->prepare("SELECT id, name, code FROM currencies");
        $stmt->execute();
        // $currencies = $stmt->get_result(); // used only with 'mysqlnd' driver
        $results = $this->dynamicBindResults($stmt);
        $stmt->close();
        return $results;
    }


    /* ------------- `expenses` table method ------------------ */

    /**
     * Creating new expense
     * @param String $userId
     * @param String $requestParams
     */
    public function createExpense($userId, $requestParams) {
        $stmt = $this->conn->prepare("INSERT INTO expenses(title, amount, notes, date, currency_id, category_id, type) VALUES(?, ?, ?, ?, ?, ?, ?)");

        isset($requestParams['title']) ? $title = $requestParams['title'] : $title = '';
        isset($requestParams['amount']) ? $amount = $requestParams['amount'] : $amount = '';
        isset($requestParams['notes']) ? $notes = $requestParams['notes'] : $notes = '';
        isset($requestParams['date']) ? $date = $requestParams['date'] : $date = '';
        isset($requestParams['currency_id']) ? $currency_id = $requestParams['currency_id'] : $currency_id = '';
        isset($requestParams['category_id']) ? $category_id = $requestParams['category_id'] : $category_id = NULL;
        isset($requestParams['type']) ? $type = $requestParams['type'] : $type = '';

        $stmt->bind_param("sissiis", $title, $amount, $notes, $date, $currency_id, $category_id, $type);
        $result = $stmt->execute();

        if ($result) {
            // expense row created
            // now assign the expense to user
            $expenseId = $this->conn->insert_id;
            $res = $this->createUserExpense($userId, $expenseId);
            if ($res) {
                // $stmt->close();
                // expense created successfully
                return $expenseId;
            } else {
                // expense failed to create
                return NULL;
            }
        } else {
            // expense failed to create
            return NULL;
        }
    }


    /**
     * Fetching single expense
     * @param String $expense_id id of the task
     */
    public function getExpense($expense_id, $user_id) {
        $stmt = $this->conn->prepare("SELECT e.id, e.title, e.amount, e.notes, e.date, e.currency_id, e.category_id, e.type from expenses e, user_expenses ue WHERE e.id = ? AND ue.expense_id = e.id AND ue.user_id = ?");
        $stmt->bind_param("ii", $expense_id, $user_id);
        if ($stmt->execute()) {
            $res = array();
            $stmt->bind_result($id, $title, $amount, $notes, $date, $currencyId, $categoryId, $type);
            $stmt->fetch();
            $res["id"] = $id;
            $res["title"] = $title;
            $res["amount"] = $amount;
            $res["notes"] = $notes;
            $res["date"] = $date;
            $res["currencyId"] = $currencyId;
            $res["categoryId"] = $categoryId;
            $res["type"] = $type;
            $stmt->close();
            return $res;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching all user expenses
     * @param String $user_id id of the user
     */
    public function getAllUserExpenses($user_id) {
        $typeGeneral = EXPENSES_GENERAL;
        $stmt = $this->conn->prepare("SELECT e.id, e.title, e.amount, e.notes, e.date, e.currency_id, e.category_id, e.type, cu.name AS currencyName, cu.code AS currencyCode, ct.name AS category
                                      FROM expenses e, currencies cu, categories ct, user_expenses ue WHERE e.type = ? AND e.id = ue.expense_id
                                      AND ue.user_id = ? AND cu.id = e.currency_id AND ct.id = e.category_id");
        $stmt->bind_param("si", $typeGeneral, $user_id);
        $stmt->execute();
        $results = $this->dynamicBindResults($stmt);
        $stmt->close();
        return $results;
    }

    /**
     * Fetching all user borrows and lends
     * @param String $user_id id of the user
     */
    public function getAllUserBorrowsAndLends($user_id) {
        $typeBorrow = EXPENSES_BORROW;
        $typeLend = EXPENSES_LEND;
        $stmt = $this->conn->prepare("SELECT e.id, e.title, e.amount, e.notes, e.date, e.currency_id, e.type, e.status, cu.name AS currencyName, cu.code AS currencyCode
                                      FROM expenses e, currencies cu, user_expenses ue WHERE e.id = ue.expense_id
                                      AND ue.user_id = ? AND cu.id = e.currency_id AND (e.type = ? OR e.type = ?)");
        $stmt->bind_param("iss", $user_id, $typeLend, $typeBorrow);
        $stmt->execute();
        $results = $this->dynamicBindResults($stmt);
        $stmt->close();
        return $results;
    }

    /**
     * Fetching all user recur Expenses
     * @param String $user_id id of the user
     */
    public function getAllUserRecurExpenses($user_id) {
        $typeRecur = EXPENSES_RECUR;
        $stmt = $this->conn->prepare("SELECT e.id, e.title, e.amount, e.notes, e.date, e.currency_id, e.category_id, e.type, cu.name AS currencyName, cu.code AS currencyCode, ct.name AS category
                                      FROM expenses e, currencies cu, categories ct, user_expenses ue WHERE e.id = ue.expense_id
                                      AND ue.user_id = ? AND cu.id = e.currency_id AND ct.id = e.category_id AND e.type = ?");
        $stmt->bind_param("is", $user_id, $typeRecur);
        $stmt->execute();
        $results = $this->dynamicBindResults($stmt);
        $stmt->close();
        return $results;
    }

    /**
     * Update expense
     * @param String $userId
     * @param String $expenseId
     * @param String $requestParams
     */
    public function updateExpense($userId, $expenseId, $requestParams) {
        $stmt = $this->conn->prepare("UPDATE expenses e, user_expenses ue set e.title = ?, e.amount = ?, e.notes = ?, e.date = ?, e.currency_id = ?, e.category_id = ?, e.status = ?
                                      WHERE e.id = ? AND e.id = ue.expense_id AND ue.user_id = ?");

        isset($requestParams['title']) ? $title = $requestParams['title'] : $title = '';
        isset($requestParams['amount']) ? $amount = $requestParams['amount'] : $amount = '';
        isset($requestParams['notes']) ? $notes = $requestParams['notes'] : $notes = '';
        isset($requestParams['date']) ? $date = $requestParams['date'] : $date = '';
        isset($requestParams['currency_id']) ? $currency_id = $requestParams['currency_id'] : $currency_id = '';
        isset($requestParams['category_id']) ? $category_id = $requestParams['category_id'] : $category_id = NULL;
        isset($requestParams['status']) ? $status = $requestParams['status'] : $status = 0;

        $stmt->bind_param("sissiiiii", $title, $amount, $notes, $date, $currency_id, $category_id, $status, $expenseId, $userId);
        $stmt->execute();
        $num_affected_rows = $stmt->affected_rows;
        $stmt->close();
        return $num_affected_rows > 0;
    }

    /**
     * Delete expense
     * @param String $expense_id
     */
    public function deleteExpense($user_id, $expense_id) {
        $stmt = $this->conn->prepare("DELETE e FROM expenses e, user_expenses ue WHERE e.id = ? AND ue.expense_id = e.id AND ue.user_id = ?");
        $stmt->bind_param("ii", $expense_id, $user_id);
        $stmt->execute();
        $num_affected_rows = $stmt->affected_rows;
        $stmt->close();
        return $num_affected_rows > 0;
    }

    /* ------------- `user_expenses` table method ------------------ */

    /**
     * Function to assign a task to user
     * @param String $user_id id
     * @param String $expense_id
     */
    public function createUserExpense($user_id, $expense_id) {
        $stmt = $this->conn->prepare("INSERT INTO user_expenses(user_id, expense_id) values(?, ?)");
        $stmt->bind_param("ii", $user_id, $expense_id);
        $result = $stmt->execute();

        if (false === $result) {
            die('execute() failed: ' . htmlspecialchars($stmt->error));
        }
        $stmt->close();
        return $result;
    }

    /* --------------------- 'Finance' Methods ----------------------- */

    /**
     * Creating or update finance
     * @param String $userId
     * @param String $requestParams
     */
    public function updateFinance($userId, $requestParams) {

        isset($requestParams['month']) ? $month = $requestParams['month'] : $month = '';
        isset($requestParams['income']) ? $income = $requestParams['income'] : $income = '';
        isset($requestParams['budget']) ? $budget = $requestParams['budget'] : $budget = '';
        isset($requestParams['savings']) ? $savings = $requestParams['savings'] : $savings = '';
        isset($requestParams['borrows']) ? $borrows = $requestParams['borrows'] : $borrows = '';
        isset($requestParams['lends']) ? $lends = $requestParams['lends'] : $lends = '';

        if($this->getFinance($requestParams['month'], $userId)['id'] == NULL) {
            $stmt = $this->conn->prepare("INSERT INTO finance(month, income, budget, savings, borrows, lends) VALUES(?, ?, ?, ?, ?, ?)");

            $stmt->bind_param("siiiii", $month, $income, $budget, $savings, $borrows, $lends);
            $result = $stmt->execute();

            if ($result) {
                $financeId = $this->conn->insert_id;
                $res = $this->createUserFinance($userId, $financeId);
                if ($res) {
                    // $stmt->close();
                    // finance created successfully
                    return $financeId;
                } else {
                    // finance failed to create
                    return NULL;
                }
            } else {
                // finance failed to create
                return NULL;
            }

        } else {
            $stmt = $this->conn->prepare("UPDATE finance f, user_finance uf set f.income = ?, f.budget = ?, f.savings = ?, f.borrows = ?, f.lends = ?
                                      WHERE f.month = ? AND f.id = uf.finance_id AND uf.user_id = ?");

            $stmt->bind_param("iiiiisi", $income, $budget, $savings, $borrows, $lends, $month, $userId);
            $stmt->execute();
            $num_affected_rows = $stmt->affected_rows;
            $stmt->close();
            return $num_affected_rows > 0;
        }


    }

    /**
     * Fetching finance for month
     * @param String $month
     * @param int $userId
     * @return String
     */
    public function getFinance($month, $userId) {
        $stmt = $this->conn->prepare("SELECT f.id, f.month, f.income, f.budget, f.savings, f.borrows, f.lends from finance f, user_finance uf WHERE f.month = ? AND uf.finance_id = f.id AND uf.user_id = ?");
        $stmt->bind_param("si", $month, $userId);
        if ($stmt->execute()) {
                $res = array();
                $stmt->bind_result($id, $month, $income, $budget, $savings, $borrows, $lends);
                $stmt->fetch();
                $res["id"] = $id;
                $res["month"] = $month;
                $res["income"] = $income;
                $res["budget"] = $budget;
                $res["savings"] = $savings;
                $res["borrows"] = $borrows;
                $res["lends"] = $lends;
                $stmt->close();
                return $res;
        } else {
            return NULL;
        }
    }

    /**
     * Function to assign a finance to user
     * @param String $userId
     * @param String $financeId
     */
    public function createUserFinance($userId, $financeId) {
        $stmt = $this->conn->prepare("INSERT INTO user_finance(user_id, finance_id) values(?, ?)");
        $stmt->bind_param("ii", $userId, $financeId);
        $result = $stmt->execute();

        if (false === $result) {
            die('execute() failed: ' . htmlspecialchars($stmt->error));
        }
        $stmt->close();
        return $result;
    }

    /* --------------------- 'Util' Methods ----------------------- */

    private function dynamicBindResults($stmt) {
        $results = array();
        $meta = $stmt->result_metadata();
        while ( $field = $meta->fetch_field() ) {
            $parameters[] = &$row[$field->name];
        }
        call_user_func_array(array($stmt, 'bind_result'), $parameters);
        while ( $stmt->fetch() ) {
            $x = array();
            foreach( $row as $key => $val ) {
                $x[$key] = $val;
            }
            $results[] = $x;
        }

        return $results;

    }

}
