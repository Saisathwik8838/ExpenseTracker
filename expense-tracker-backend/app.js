const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Add this line to also parse URL-encoded data (optional, but recommended)
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}:`, req.body);
  next();
});


app.use('/api', authRoutes);

sequelize.sync().then(() => {
  console.log('Database synced');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to sync database:', err);
});
