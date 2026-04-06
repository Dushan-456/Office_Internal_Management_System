import { body, query } from "express-validator";

//Registration Fields validate------------------------------------------------------------------------------------------------------------------------
export const RegisterValidator = () => [
  body("firstName")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Please Enter First Name"),
  body("lastName")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Please Enter Last Name"),
  body("username")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Please Enter Correct Username"),

  body("email")
    .trim()
    .normalizeEmail()
    .notEmpty()
    .withMessage("Please Enter  Email")
    .isEmail()
    .withMessage("Please Enter Correct Email"),

  body("password")
    .notEmpty()
    .withMessage("please enter password")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must include at least 8 characters, 1 lowercase, 1 uppercase, 1 number, and 1 symbol"
    ),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

//login Fields validate------------------------------------------------------------------------------------------------------------------------

export const loginValidator = () => [
  body("emailOrUsername")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Please Enter Username or Email"),
  body("password").notEmpty().withMessage("Please Enter Password"),
];

// Forgot Password Request - email Field validate------------------------------------------------------------------------------------------------------------------------

export const forgotEmailValidator = () => [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
];
// Forgot Password Request - new password Field validate------------------------------------------------------------------------------------------------------------------------

export const resetPasswordValidate = () => [
  body("newPassword")
    .notEmpty()
    .withMessage("please enter New password")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must include at least 8 characters, 1 lowercase, 1 uppercase, 1 number, and 1 symbol"
    ),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

//User Profile Fields validate------------------------------------------------------------------------------------------------------------------------

export const ProfileFieldsValidator = () => [
  body("image"),
  body("dob").trim().escape(),
  body("gender").trim().escape(),
  body("designation").trim().escape(),
  body("mobile").trim().escape(),
  body("address").trim().escape(),
];
//Category Fields validate------------------------------------------------------------------------------------------------------------------------

export const CategoryFieldsValidator = () => [
  body("name")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Category name is required"),
];

//Product Fields validate------------------------------------------------------------------------------------------------------------------------

export const productFieldsValidator = () => [
  body("title")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Title is required Please Enter Title"),
  body("price")
    .trim()
    .escape()
    .isNumeric()
    .withMessage("Please Enter Numbers")
    .notEmpty()
    .withMessage("Price is required Please Enter Price"),
  body("type")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Type is required Please Enter Type"),
  body("sku")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("SKU is required Please Enter SKU"),
  body("stock")
    .trim()
    .escape()
    .isNumeric()
    .withMessage("Please Enter Numbers")
    .notEmpty()
    .withMessage("Stock is required Please Enter Stock"),
  body("description").trim().escape(),
  body("isDigital").trim().escape(),
  body("downloadUrl").trim().escape(),
  body("categoryId").trim().escape(),
];

//shipping details Fields validate------------------------------------------------------------------------------------------------------------------------

export const shippingDetailsFieldsValidator = () => [
  body("shippingName")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("name is required"),
  body("shippingPhone")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Mobile Number is required"),
  body("shippingLine1")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Address is required"),
  body("shippingLine2").trim().escape(),
  body("shippingCity")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("City is required"),
  body("shippingPostal")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("PostalCode is required"),
];

//common body Fields validate------------------------------------------------------------------------------------------------------------------------
export const commonValidate = (...keys) => {
  const validateValues = [];
  keys.forEach((k) => {
    validateValues.push(
      body(k).trim().escape().notEmpty().withMessage("Please enter values")
    );
  });
  return validateValues;
};
//common Query  validate------------------------------------------------------------------------------------------------------------------------
export const comQueryValidate = (...keys) => {
  const validateValues = [];
  keys.forEach((k) => {
    validateValues.push(
      query(k).trim().escape().notEmpty().withMessage("Please enter values")
    );
  });
  return validateValues;
};
