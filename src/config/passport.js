// src/config/passport.js
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import db from '../models/index.js';

const passportConfig = (passport) => {
  const { User } = db;
  const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

    secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret',
  };

  passport.use(
    new JwtStrategy(options, async (jwtPayload, done) => {
      try {
        const user = await User.findByPk(jwtPayload.id);
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    })
  );
};

export default passportConfig;
