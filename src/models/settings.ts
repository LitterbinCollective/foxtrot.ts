import { DataTypes } from 'sequelize';

export const name = 'settings'
export const attributes = {
  serverId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  prefix: DataTypes.STRING
}