const express = require('express');
const { getAllUsers, createUser, getUser, updatedUser, deleteUser, updateMe, deleteMe, getMe, uploadUserPhoto, resizeUserPhoto } = require('./../controllers/userController');
const { signup, login, forgotPassword, resetPassword, updatePassword, protect, restrictTo, logout } = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Protect all routes after this middleware
router.use(protect);

router.patch('/update-my-password', updatePassword);
router.get('/me', getMe, getUser);
router.patch('/update-me', uploadUserPhoto, resizeUserPhoto, updateMe)
router.delete('/delete-me', deleteMe)

// Restrict all router after this middleware
router.use(restrictTo('admin'))

router
  .route('/')
  .get(getAllUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .patch(updatedUser)
  .delete(deleteUser);


module.exports = router;