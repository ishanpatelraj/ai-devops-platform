const catchAsync = require("../utils/catchAsync");
const { getAIResponse } = require("../services/chatService");

/**
 * @route  POST /api/chat
 * @desc   Send a message to the DevOps AI chatbot
 * @access Private (requires authentication)
 */
const sendMessage = catchAsync(async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide a message to ask the AI assistant.",
    });
  }

  const result = await getAIResponse(message.trim());

  res.status(200).json({
    success: true,
    data: {
      reply: result.answer,
      context: result.context,
    },
  });
});

module.exports = { sendMessage };
