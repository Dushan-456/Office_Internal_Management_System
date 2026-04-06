import { v4 as uuidv4 } from "uuid";

// This middleware IDENTIFIES the cart, but does NOT block access
export const identifyCart = (req, res, next) => {
  let cartToken = req.cookies.cartToken;

  if (!cartToken) {
    // If no token, create one for the guest user
    cartToken = uuidv4();
    res.cookie("cartToken", cartToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  // Attach the cart identifier to the request object for controllers to use
  req.cartId = cartToken;
  next();
};
