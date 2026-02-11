// Mock for db/schema
const createMockTable = (name) => ({
  name,
  columns: {},
});

module.exports = {
  tasks: createMockTable('tasks'),
  completions: createMockTable('completions'),
  rewards: createMockTable('rewards'),
  notifications: createMockTable('notifications'),
  configurations: createMockTable('configurations'),
  taskRelations: {},
  completionRelations: {},
  rewardRelations: {},
};
