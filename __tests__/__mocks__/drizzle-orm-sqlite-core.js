// Mock for drizzle-orm/sqlite-core
const sqliteTable = jest.fn((name, columns) => ({
  name,
  columns,
}));

const createColumn = (type) => (nameOrConfig) => ({
  type,
  name: typeof nameOrConfig === 'string' ? nameOrConfig : undefined,
  mode: typeof nameOrConfig === 'object' ? nameOrConfig.mode : undefined,
  primaryKey: jest.fn().mockReturnThis(),
  autoincrement: jest.fn().mockReturnThis(),
  notNull: jest.fn().mockReturnThis(),
  default: jest.fn().mockReturnThis(),
  unique: jest.fn().mockReturnThis(),
  references: jest.fn().mockReturnThis(),
  $type: jest.fn().mockReturnThis(),
});

const integer = createColumn('integer');
const text = createColumn('text');
const real = createColumn('real');
const boolean = createColumn('boolean');

module.exports = {
  sqliteTable,
  integer,
  text,
  real,
  boolean,
};
