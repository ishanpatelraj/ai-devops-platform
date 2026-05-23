const userModel = require('../models/User');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlackListModel = require('../models/blacklistModel');
const catchAsync = require('../utils/catchAsync');

/** 
 * @route POST /api/auth/register
 * @description Register a new user, expects username, email, and password in the required field
 * @access Public
 */
const registerUserController = catchAsync(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please provide username, email and password"
        });
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or: [{ username }, { email }]
    });

    if (isUserAlreadyExists) {
        return res.status(400).json({
            success: false,
            message: "Account already exists with this email address or username"
        });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        username,
        email,
        password: hash
    });

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });
});

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
const loginUserController = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please provide email and password"
        });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(400).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    res.status(200).json({
        success: true,
        message: "User LoggedIn Successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });
});

/**
 * @name logoutUserController
 * @description logout a user, remove his token and blacklist that token for further use
 * @access Public
 */
const logoutUserController = catchAsync(async (req, res) => {
    const token = req.cookies.token;

    if (token) {
        await tokenBlackListModel.create({ token });
    }

    res.clearCookie("token");

    res.status(200).json({
        success: true,
        message: "User logged out successfully"
    });
});

/**
 * @name getMeController
 * @description get the current logged in user details, expects token in the request
 * @access private
 */
const getMeController = catchAsync(async (req, res) => {
    const user = await userModel.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    res.status(200).json({
        success: true,
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });
});

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
};