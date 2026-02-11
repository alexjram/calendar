export function getIfRewardAchieved(task: ITask) {
  const rewardWhenRaw = task.rewardWhen;
  if (rewardWhenRaw === "never") return false;
  if (rewardWhenRaw === "finished") return task.completedAt !== null;
  const rewardWhen = parseInt(rewardWhenRaw);
  if (isNaN(rewardWhen)) return false;
  if (task.type === "finite") return task.totalCount === rewardWhen;

  return (
    task.totalCount > 0 &&
    task.totalCount % rewardWhen === 0 &&
    ((task.maxRewards !== null &&
      task.maxRewards <= task.totalCount / rewardWhen) ||
      task.maxRewards === null)
  );
}
