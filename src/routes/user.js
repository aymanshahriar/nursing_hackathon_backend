import passport from 'passport';
import controllers from '../controllers/index.js';

const userController = controllers.User;
const auth = passport.authenticate('jwt', {
  session: false,
});

export default (app) => {
  app.post('/api/v1/users/register', userController.create);
  app.post('/api/v1/users/login', userController.login);
  app.post('/api/v1/users/logout', userController.logout);
}