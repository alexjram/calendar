// Mock for drizzle-orm
const jestFn = jest.fn;

// Mock relations
const relations = jestFn(() => ({}));

// Mock drizzle function
const drizzle = jestFn(() => ({
  select: jestFn().mockReturnValue({
    from: jestFn().mockReturnValue({
      where: jestFn().mockReturnValue({
        orderBy: jestFn().mockResolvedValue([]),
        get: jestFn(),
        all: jestFn().mockResolvedValue([]),
      }),
      orderBy: jestFn().mockResolvedValue([]),
      all: jestFn().mockResolvedValue([]),
      get: jestFn(),
    }),
  }),
  insert: jestFn().mockReturnValue({
    values: jestFn().mockReturnValue({
      returning: jestFn().mockResolvedValue([{ id: 1 }]),
      run: jestFn().mockResolvedValue({ lastInsertRowId: 1 }),
    }),
  }),
  update: jestFn().mockReturnValue({
    set: jestFn().mockReturnValue({
      where: jestFn().mockReturnValue({
        returning: jestFn().mockResolvedValue([{ id: 1 }]),
        run: jestFn().mockResolvedValue({ changes: 1 }),
      }),
    }),
  }),
  delete: jestFn().mockReturnValue({
    where: jestFn().mockReturnValue({
      returning: jestFn().mockResolvedValue([{ id: 1 }]),
      run: jestFn().mockResolvedValue({ changes: 1 }),
    }),
  }),
}));

// Mock operators
const eq = jestFn((a, b) => ({ operator: 'eq', left: a, right: b }));
const ne = jestFn((a, b) => ({ operator: 'ne', left: a, right: b }));
const gt = jestFn((a, b) => ({ operator: 'gt', left: a, right: b }));
const gte = jestFn((a, b) => ({ operator: 'gte', left: a, right: b }));
const lt = jestFn((a, b) => ({ operator: 'lt', left: a, right: b }));
const lte = jestFn((a, b) => ({ operator: 'lte', left: a, right: b }));
const like = jestFn((a, b) => ({ operator: 'like', left: a, right: b }));
const inArray = jestFn((a, b) => ({ operator: 'in', left: a, right: b }));
const isNull = jestFn((a) => ({ operator: 'isNull', left: a }));
const isNotNull = jestFn((a) => ({ operator: 'isNotNull', left: a }));
const and = jestFn((...conditions) => ({ operator: 'and', conditions }));
const or = jestFn((...conditions) => ({ operator: 'or', conditions }));
const not = jestFn((condition) => ({ operator: 'not', condition }));

// Mock query builder helpers
const sql = jest.fn((strings, ...values) => {
  const sqlObj = {
    strings,
    values,
    as: jest.fn((alias) => ({ sql: sqlObj, alias })),
  };
  return sqlObj;
});

const desc = jestFn((column) => ({ direction: 'desc', column }));
const asc = jestFn((column) => ({ direction: 'asc', column }));

// Mock count
const count = jestFn(() => ({ fn: 'count' }));
const sum = jestFn((column) => ({ fn: 'sum', column }));
const avg = jestFn((column) => ({ fn: 'avg', column }));
const max = jestFn((column) => ({ fn: 'max', column }));
const min = jestFn((column) => ({ fn: 'min', column }));

module.exports = {
  relations,
  drizzle,
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

module.exports.default = {
  relations,
  drizzle,
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
