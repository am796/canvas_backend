const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const Counter = require('./models/Counter');
  
  const users = await User.find({});
  
  for (const user of users) {
    if (!user.id) {
      user.id = await Counter.getNextSequence('userId');
      await user.save();
      console.log('Assigned id', user.id, 'to', user.username);
    } else {
      console.log('User', user.username, 'already has id', user.id);
    }
  }
  
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
