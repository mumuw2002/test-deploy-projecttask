const passport = require('passport'); // เพิ่มการ import passport
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // ปรับเส้นทางให้ถูกต้อง

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          role: 'user',
          profileImage: profile.photos[0]?.value || ''
        });

        const adminEmail = process.env.ADMIN_EMAIL;
        if (profile.emails[0].value === adminEmail) {
          user.role = 'admin';
        }

        await user.save();
      } else {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (profile.emails[0].value === adminEmail) {
          user.role = 'admin';
        }
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }
));
