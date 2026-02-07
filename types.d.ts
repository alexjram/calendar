interface ITaskBase {
  title: string;
  type:
    | "daily"
    | "weekly"
    | "monthly"
    | "other-day"
    | "weekdays"
    | "weekend"
    | "finite"
    | null;
  frequency: number | null;
  reward: string | null;
  hasReward: boolean | null;
  rewardWhen: string;
  maxRewards: number | null;
}
interface ITask extends ITaskBase {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  hasCompleted: number;
  completedAt: Date | null;
  totalCount: number;
  todayCount: number;
  weekWeekdayCount: number;
  weekWeekendCount: number;
  monthCount: number;
  rewardCount: number;
}

interface IAward {
  id?: number;
  taskId: number;
  rewardNumber: number;
  rewardedAt?: Date;
  redeemedAt?: Date;
}

interface IRewardItem {
  id: number;
  taskName: string;
  reward: string | null;
  rewardedAt: Date;
  redeemedAt: Date | null;
}
