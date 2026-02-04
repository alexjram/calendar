// Mock for drizzle-orm

// Mock table creation
export const sqliteTable = jest.fn((name, columns) => ({
  name,
  columns,
}));

// Mock column types
export const integer = jest.fn(() => ({
  type: 'integer',
  primaryKey: jest.fn().mockReturnThis(),
  autoincrement: jest.fn().mockReturnThis(),
  notNull: jest.fn().mockReturnThis(),
  default: jest.fn().mockReturnThis(),
}));

export const text = jest.fn(() => ({
  type: 'text',
  notNull: jest.fn().mockReturnThis(),
  default: jest.fn().mockReturnThis(),
}));

export const real = jest.fn(() => ({
  type: 'real',
  notNull: jest.fn().mockReturnThis(),
}));

export const boolean = jest.fn(() => ({
  type: 'boolean',
  notNull: jest.fn().mockReturnThis(),
  default: jest.fn().mockReturnThis(),
}));

// Mock relations
export const relations = jest.fn(() => ({}));

// Mock drizzle function
export const drizzle = jest.fn(() => ({
  select: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockResolvedValue([]),
        get: jest.fn(),
        all: jest.fn().mockResolvedValue([]),
      }),
      orderBy: jest.fn().mockResolvedValue([]),
      all: jest.fn().mockResolvedValue([]),
      get: jest.fn(),
    }),
  }),
  insert: jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      run: jest.fn().mockResolvedValue({ lastInsertRowId: 1 }),
    }),
  }),
  update: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 1 }]),
        run: jest.fn().mockResolvedValue({ changes: 1 }),
      }),
    }),
  }),
  delete: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      run: jest.fn().mockResolvedValue({ changes: 1 }),
    }),
  }),
}));

// Mock operators
export const eq = jest.fn((a, b) => ({ operator: 'eq', left: a, right: b }));
export const ne = jest.fn((a, b) => ({ operator: 'ne', left: a, right: b }));
export const gt = jest.fn((a, b) => ({ operator: 'gt', left: a, right: b }));
export const gte = jest.fn((a, b) => ({ operator: 'gte', left: a, right: b }));
export const lt = jest.fn((a, b) => ({ operator: 'lt', left: a, right: b }));
export const lte = jest.fn((a, b) => ({ operator: 'lte', left: a, right: b }));
export const like = jest.fn((a, b) => ({ operator: 'like', left: a, right: b }));
export const inArray = jest.fn((a, b) => ({ operator: 'in', left: a, right: b }));
export const isNull = jest.fn((a) => ({ operator: 'isNull', left: a }));
export const isNotNull = jest.fn((a) => ({ operator: 'isNotNull', left: a }));
export const and = jest.fn((...conditions) => ({ operator: 'and', conditions }));
export const or = jest.fn((...conditions) => ({ operator: 'or', conditions }));
export const not = jest.fn((condition) => ({ operator: 'not', condition }));

// Mock query builder helpers
export const sql = jest.fn((strings, ...values) => ({
  strings,
  values,
}));

export const desc = jest.fn((column) => ({ direction: 'desc', column }));
export const asc = jest.fn((column) => ({ direction: 'asc', column }));

// Mock count
export const count = jest.fn(() => ({ fn: 'count' }));
export const sum = jest.fn((column) => ({ fn: 'sum', column }));
export const avg = jest.fn((column) => ({ fn: 'avg', column }));
export const max = jest.fn((column) => ({ fn: 'max', column }));
export const min = jest.fn((column) => ({ fn: 'min', column }));

export default {
  drizzle,
  sqliteTable,
  integer,
  text,
  real,
  boolean,
  relations,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  like,
  inArray,
  isNull,
  isNotNull,
  and,
  or,
  not,
  sql,
  desc,
  asc,
  count,
  sum,
  avg,
  max,
  min,
};
