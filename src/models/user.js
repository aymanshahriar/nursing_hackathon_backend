'use strict';
import { hashSync, genSaltSync, compareSync } from 'bcrypt';
import { Model, DataTypes } from 'sequelize';

const saltRounds = 10;
const salt = genSaltSync(saltRounds);

export default (sequelize) => {
  class User extends Model {
    /**
     * Define associations in this static method.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    // Instance method to validate the user's password
    validatePassword(password) {
      return compareSync(password, this.password);
    }

    // Instance method to filter out sensitive details
    filterDetails() {
      const { password, createdAt, updatedAt, ...rest } = this.get();
      return rest;
    }
  }

  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      userName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      condition: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hobbies: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      about: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('adolescent', 'peer_supporter', 'admin'),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
      timestamps: true,
      hooks: {
        beforeCreate: (user) => {
          user.password = hashSync(user.password, salt);
        },
        beforeUpdate: (user) => {
          if (user.changed('password')) {
            user.password = hashSync(user.password, salt);
          }
        },
      },
    }
  );

  return User;
};
