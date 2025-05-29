// models/User.js - Enhanced User model with validations
const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Username cannot be empty'
      },
      len: {
        args: [2, 50],
        msg: 'Username must be between 2 and 50 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Email address already in use'
    },
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      },
      notEmpty: {
        msg: 'Email cannot be empty'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Password cannot be empty'
      },
      len: {
        args: [6, 255],
        msg: 'Password must be at least 6 characters long'
      }
    }
  },
  birthdate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Birthdate must be a valid date'
      },
      isBefore: {
        args: new Date().toISOString().split('T')[0],
        msg: 'Birthdate cannot be in the future'
      },
      isAfter: {
        args: '1900-01-01',
        msg: 'Birthdate must be after 1900'
      }
    }
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: {
        msg: 'Age must be a whole number'
      },
      min: {
        args: 5,
        msg: 'Age must be at least 5 years'
      },
      max: {
        args: 120,
        msg: 'Age must be less than 120 years'
      }
    }
  },
  guardianEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmailOrNull(value) {
        if (value !== null && value !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            throw new Error('Guardian email must be a valid email address');
          }
        }
      }
    }
  },
  isMinor: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  // Model options
  tableName: 'users',
  timestamps: true,
  
  // Hooks for additional validation
  hooks: {
    beforeValidate: (user, options) => {
      // Auto-calculate minor status based on age
      user.isMinor = user.age < 18;
      
      // If user is minor, guardian email is required
      if (user.isMinor && (!user.guardianEmail || user.guardianEmail.trim() === '')) {
        throw new Error('Guardian email is required for users under 18');
      }
      
      // If user is not minor, clear guardian email
      if (!user.isMinor) {
        user.guardianEmail = null;
      }
    },
    
    beforeCreate: (user, options) => {
      // Validate age against birthdate
      if (user.birthdate && user.age) {
        const birthYear = new Date(user.birthdate).getFullYear();
        const currentYear = new Date().getFullYear();
        const calculatedAge = currentYear - birthYear;
        
        if (Math.abs(calculatedAge - user.age) > 1) {
          throw new Error('Age does not match the provided birthdate');
        }
      }
    }
  },
  
  // Instance methods
  instanceMethods: {
    toSafeJSON: function() {
      const { password, ...safeUser } = this.toJSON();
      return safeUser;
    }
  }
});

// Class methods
User.findByEmail = function(email) {
  return this.findOne({ where: { email } });
};

User.findMinors = function() {
  return this.findAll({ 
    where: { isMinor: true },
    attributes: { exclude: ['password'] }
  });
};

User.findAdults = function() {
  return this.findAll({ 
    where: { isMinor: false },
    attributes: { exclude: ['password'] }
  });
};

module.exports = User;