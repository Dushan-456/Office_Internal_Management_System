import jwt from "jsonwebtoken";

//token genarate------------------------------------------------

export const generateToken = (payload) => {
   const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5m" });
   return token;
};

// genarate cookies with token------------------------------------------------

export const generateTokenWithCookies = (res, userId) => {
   const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "1d",
   });

   res.cookie("jwt", token, {
      httpOnly: true, // Prevents client-side JS from accessing the cookie (XSS protection)
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // Prevents CSRF attacks
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
   });
};

//token decode------------------------------------------------

export const decodeToken = (token) => {
   const payload = jwt.decode(token);
   return payload;
};

//token verify------------------------------------------------

export const verifyToken = (token) => {
   try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      return payload;
   } catch (error) {
      console.log(error);
      return null;
   }
};
