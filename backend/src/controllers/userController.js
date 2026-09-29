const User = require('../models/User');

// @desc    Update current user profile (fullName only; email is read-only)
// @route   PATCH /api/users/me
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { fullName } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.',
      });
    }

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be between 2 and 60 characters.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.fullName = trimmedName;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
};
